'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { TruckStatus, UserRole } from '@/types';

type Office = {
  _id: string;
  name: string;
};

export default function NewTruckPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = session?.user?.role;
  const [offices, setOffices] = useState<Office[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    registrationNumber: '',
    truckModel: '',
    capacity: '',
    manufactureYear: new Date().getFullYear().toString(),
    currentOffice: '',
    status: TruckStatus.AVAILABLE,
    maintenanceStatus: 'Ready',
    lastMaintenance: new Date().toISOString().split('T')[0],
  });

  // Check if user can manage trucks
  const canManageTrucks = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  
  // Fetch offices for dropdown
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/offices');
        if (!response.ok) {
          throw new Error('Failed to fetch offices');
        }
        const data = await response.json();
        setOffices(data);
        
        // Set default office if only one exists
        if (data.length === 1) {
          setFormData(prev => ({
            ...prev,
            currentOffice: data[0]._id
          }));
        }
      } catch (err) {
        console.error('Error fetching offices:', err);
      }
    };

    fetchOffices();
  }, []);
  
  // If not admin or manager, don't allow access
  if (!canManageTrucks) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-2">Access Denied</h1>
            <p className="text-gray-700">You don't have permission to add trucks.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (
        !formData.registrationNumber ||
        !formData.truckModel ||
        !formData.capacity ||
        !formData.manufactureYear ||
        !formData.currentOffice
      ) {
        throw new Error('Please fill in all required fields');
      }

      // Submit form
      const response = await fetch('/api/trucks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create truck');
      }

      setSuccess('Truck created successfully!');
      
      // Reset form
      setFormData({
        registrationNumber: '',
        truckModel: '',
        capacity: '',
        manufactureYear: new Date().getFullYear().toString(),
        currentOffice: '',
        status: TruckStatus.AVAILABLE,
        maintenanceStatus: 'Ready',
        lastMaintenance: new Date().toISOString().split('T')[0],
      });
      
      // Redirect after success
      setTimeout(() => {
        router.push('/trucks');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Add New Truck</h1>
        <Button variant="outline">
          <Link href="/trucks">Back to Trucks</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Truck Details</CardTitle>
          <CardDescription className="text-gray-700">
            Enter the details of the new truck
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-800 border border-red-300">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-800 border border-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="registrationNumber" className="text-sm font-medium text-black">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="truckModel" className="text-sm font-medium text-black">
                  Truck Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="truckModel"
                  name="truckModel"
                  value={formData.truckModel}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="capacity" className="text-sm font-medium text-black">
                  Capacity (cubic meters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  step="0.1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="manufactureYear" className="text-sm font-medium text-black">
                  Manufacture Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="manufactureYear"
                  name="manufactureYear"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={formData.manufactureYear}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="currentOffice" className="text-sm font-medium text-black">
                Office <span className="text-red-500">*</span>
              </label>
              <select
                id="currentOffice"
                name="currentOffice"
                value={formData.currentOffice}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                required
              >
                <option value="">Select Office</option>
                {offices.map((office) => (
                  <option key={office._id} value={office._id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-black">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                >
                  {Object.values(TruckStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="maintenanceStatus" className="text-sm font-medium text-black">
                  Maintenance Status
                </label>
                <select
                  id="maintenanceStatus"
                  name="maintenanceStatus"
                  value={formData.maintenanceStatus}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                >
                  <option value="Ready">Ready</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="lastMaintenance" className="text-sm font-medium text-black">
                Last Maintenance Date
              </label>
              <input
                type="date"
                id="lastMaintenance"
                name="lastMaintenance"
                value={formData.lastMaintenance}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2.5 text-black"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Truck'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 