'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConsignmentStatus } from '@/types';
import Link from 'next/link';

type Consignment = {
  _id: string;
  trackingNumber: string;
  sourceOffice: {
    _id: string;
    name: string;
  };
  destinationOffice: {
    _id: string;
    name: string;
  };
  volume: number;
  charge: number;
  status: string;
  receivedDate: string;
  sender: {
    name: string;
    contact: string;
  };
  receiver: {
    name: string;
    contact: string;
  };
};

export default function ConsignmentsPage() {
  const { data: session } = useSession();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchConsignments = async () => {
      try {
        setIsLoading(true);
        const queryParams = statusFilter ? `?status=${statusFilter}` : '';
        const response = await fetch(`/api/consignments${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch consignments');
        }
        
        const data = await response.json();
        setConsignments(data);
      } catch (err) {
        setError('Error loading consignments');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsignments();
  }, [statusFilter]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case ConsignmentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ConsignmentStatus.RECEIVED:
        return 'bg-blue-100 text-blue-800';
      case ConsignmentStatus.IN_TRANSIT:
        return 'bg-purple-100 text-purple-800';
      case ConsignmentStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case ConsignmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-black">Consignments</h1>
        <div className="mt-4 flex flex-col sm:flex-row sm:mt-0 sm:space-x-4">
          <div className="mb-4 sm:mb-0">
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="">All Status</option>
              {Object.values(ConsignmentStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <Button>
            <Link href="/consignments/new">Create New Consignment</Link>
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded bg-red-100 p-4 text-red-800">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : consignments.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-lg font-medium text-black">No consignments found</p>
              <p className="text-gray-700 mt-1">
                {statusFilter ? `No consignments with status "${statusFilter}"` : 'Start by creating a new consignment'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Tracking #</th>
                <th className="border p-3 text-left">From</th>
                <th className="border p-3 text-left">To</th>
                <th className="border p-3 text-left">Volume (m³)</th>
                <th className="border p-3 text-left">Sender</th>
                <th className="border p-3 text-left">Receiver</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Received Date</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consignments.map((consignment) => (
                <tr key={consignment._id} className="hover:bg-gray-50">
                  <td className="border p-3">{consignment.trackingNumber}</td>
                  <td className="border p-3">{consignment.sourceOffice?.name || 'N/A'}</td>
                  <td className="border p-3">{consignment.destinationOffice?.name || 'N/A'}</td>
                  <td className="border p-3">{consignment.volume}</td>
                  <td className="border p-3">{consignment.sender.name}</td>
                  <td className="border p-3">{consignment.receiver.name}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(consignment.status)}`}>
                      {consignment.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    {new Date(consignment.receivedDate).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <Link href={`/consignments/${consignment._id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
} 