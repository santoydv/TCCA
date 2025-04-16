'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface OfficeData {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  isHeadOffice: boolean;
}

export default function EditOfficePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [office, setOffice] = useState<OfficeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch office data
        const officeResponse = await fetch(`/api/offices/${params.id}`);
        if (!officeResponse.ok) {
          throw new Error('Failed to fetch office');
        }
        const officeData = await officeResponse.json();
        setOffice(officeData);
        
        // Set form values
        setName(officeData.name || '');
        setAddress(officeData.address || '');
        setCity(officeData.city || '');
        setCountry(officeData.country || '');
        setPostalCode(officeData.postalCode || '');
        setPhoneNumber(officeData.phoneNumber || '');
        setEmail(officeData.email || '');
        setIsHeadOffice(officeData.isHeadOffice || false);
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
      
      const response = await fetch(`/api/offices/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          address,
          city,
          country,
          postalCode,
          phoneNumber,
          email,
          isHeadOffice
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update office');
      }
      
      router.push(`/offices/${params.id}`);
    } catch (err) {
      console.error('Error updating office:', err);
      setError('Failed to update office. Please try again.');
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
  
  if (error || !office) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Office not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/offices')}>
            Back to Offices
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/offices/${params.id}`)} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Office</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Office {office.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                <input 
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number</label>
                <input 
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
                <input 
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                <input 
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">Country</label>
                <input 
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Postal Code</label>
                <input 
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  id="isHeadOffice"
                  type="checkbox"
                  checked={isHeadOffice}
                  onChange={(e) => setIsHeadOffice(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="isHeadOffice" className="ml-2 block text-sm font-medium">Head Office</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/offices/${params.id}`)}
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