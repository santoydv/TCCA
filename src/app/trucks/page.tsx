'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TruckStatus } from '@/types';
import Link from 'next/link';

type Truck = {
  _id: string;
  registrationNumber: string;
  truckModel: string;
  capacity: number;
  office: {
    _id: string;
    name: string;
  };
  status: TruckStatus;
  maintenanceStatus: string;
  lastMaintenance: string;
};

export default function TrucksPage() {
  const { data: session } = useSession();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setIsLoading(true);
        const queryParams = statusFilter ? `?status=${statusFilter}` : '';
        const response = await fetch(`/api/trucks${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trucks');
        }
        
        const data = await response.json();
        setTrucks(data);
      } catch (err) {
        setError('Error loading trucks');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrucks();
  }, [statusFilter]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case TruckStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case TruckStatus.LOADING:
        return 'bg-blue-100 text-blue-800';
      case TruckStatus.IN_TRANSIT:
        return 'bg-purple-100 text-purple-800';
      case TruckStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      case TruckStatus.OUT_OF_SERVICE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceStatusClass = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-100 text-green-800';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scheduled Maintenance':
        return 'bg-blue-100 text-blue-800';
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
        <h1 className="text-2xl font-bold text-black">Trucks</h1>
        <div className="mt-4 flex flex-col sm:flex-row sm:mt-0 sm:space-x-4">
          <div className="mb-4 sm:mb-0">
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="">All Status</option>
              {Object.values(TruckStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <Button>
            <Link href="/trucks/new">Add New Truck</Link>
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded bg-red-100 p-4 text-red-800">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : trucks.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-lg font-medium text-black">No trucks found</p>
              <p className="text-gray-700 mt-1">
                {statusFilter ? `No trucks with status "${statusFilter}"` : 'Start by adding a new truck'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Registration</th>
                <th className="border p-3 text-left">Model</th>
                <th className="border p-3 text-left">Capacity (m³)</th>
                <th className="border p-3 text-left">Office</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Maintenance Status</th>
                <th className="border p-3 text-left">Last Maintenance</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck._id} className="hover:bg-gray-50">
                  <td className="border p-3">{truck.registrationNumber}</td>
                  <td className="border p-3">{truck.truckModel}</td>
                  <td className="border p-3">{truck.capacity}</td>
                  <td className="border p-3">{truck.office?.name || 'N/A'}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(truck.status)}`}>
                      {truck.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusClass(truck.maintenanceStatus)}`}>
                      {truck.maintenanceStatus}
                    </span>
                  </td>
                  <td className="border p-3">
                    {new Date(truck.lastMaintenance).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <Link href={`/trucks/${truck._id}`}>
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