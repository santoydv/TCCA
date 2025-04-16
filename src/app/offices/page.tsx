'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types';
import Link from 'next/link';

type Office = {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
};

export default function OfficesPage() {
  const { data: session } = useSession();
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = session?.user?.role;

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/offices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch offices');
        }
        
        const data = await response.json();
        setOffices(data);
      } catch (err) {
        setError('Error loading offices');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffices();
  }, []);

  const canManageOffices = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-black">Offices</h1>
        {canManageOffices && (
          <div className="mt-4 sm:mt-0">
            <Button>
              <Link href="/offices/new">Add New Office</Link>
            </Button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded bg-red-100 p-4 text-red-800">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : offices.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-lg font-medium text-black">No offices found</p>
              <p className="text-gray-700 mt-1">
                {canManageOffices
                  ? 'Start by adding a new office'
                  : 'No offices have been added yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <Card key={office._id} className="overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-black mb-2">{office.name}</h3>
                <div className="text-gray-700 mb-4">
                  <p>{office.address}</p>
                  <p>{office.city}, {office.state} {office.zipCode}</p>
                </div>
                <div className="text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Phone:</span> {office.phone}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {office.email}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/offices/${office._id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
} 