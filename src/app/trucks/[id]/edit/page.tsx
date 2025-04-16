'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface Office {
  _id: string;
  name: string;
}

interface TruckData {
  _id: string;
  registrationNumber: string;
  model: string;
  capacity: number;
  manufactureYear: number;
  assignedOffice: string;
  status: string;
  maintenanceHistory: {
    date: string;
    description: string;
    cost: number;
  }[];
}

export default function EditTruckPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [truck, setTruck] = useState<TruckData | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [assignedOffice, setAssignedOffice] = useState('');
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch truck data
        const truckResponse = await fetch(`/api/trucks/${params.id}`);
        if (!truckResponse.ok) {
          throw new Error('Failed to fetch truck');
        }
        const truckData = await truckResponse.json();
        setTruck(truckData);
        
        // Set form values
        setRegistrationNumber(truckData.registrationNumber || '');
        setModel(truckData.model || '');
        setCapacity(truckData.capacity?.toString() || '');
        setManufactureYear(truckData.manufactureYear?.toString() || '');
        setAssignedOffice(truckData.assignedOffice || '');
        setStatus(truckData.status || '');
        
        // Fetch offices
        const officesResponse = await fetch('/api/offices');
        if (!officesResponse.ok) {
          throw new Error('Failed to fetch offices');
        }
        const officesData = await officesResponse.json();
        setOffices(officesData);
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/trucks/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber,
          model,
          capacity: parseFloat(capacity),
          manufactureYear: parseInt(manufactureYear),
          assignedOffice,
          status,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update truck');
      }
      
      router.push(`/trucks/${params.id}`);
    } catch (err) {
      console.error('Error updating truck:', err);
      setError('Failed to update truck. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !truck) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Truck not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/trucks')}>
            Back to Trucks
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/trucks/${params.id}`)} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Truck</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Truck {truck.registrationNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium mb-1">Registration Number</label>
                <input 
                  id="registrationNumber"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-1">Model</label>
                <input 
                  id="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity (tons)</label>
                <input 
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="manufactureYear" className="block text-sm font-medium mb-1">Manufacture Year</label>
                <input 
                  id="manufactureYear"
                  type="number"
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="assignedOffice" className="block text-sm font-medium mb-1">Assigned Office</label>
                <Select value={assignedOffice} onValueChange={setAssignedOffice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office._id} value={office._id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/trucks/${params.id}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 