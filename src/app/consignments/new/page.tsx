'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type Office = {
  _id: string;
  name: string;
};

export default function NewConsignmentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offices, setOffices] = useState<Office[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    sourceOffice: '',
    destinationOffice: '',
    volume: '',
    sender: {
      name: '',
      contact: '',
    },
    receiver: {
      name: '',
      contact: '',
    },
  });

  useEffect(() => {
    // Fetch offices for dropdown
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
            sourceOffice: data[0]._id
          }));
        }
      } catch (err) {
        console.error('Error fetching offices:', err);
      }
    };

    fetchOffices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (
        !formData.sourceOffice ||
        !formData.destinationOffice ||
        !formData.volume ||
        !formData.sender.name ||
        !formData.sender.contact ||
        !formData.receiver.name ||
        !formData.receiver.contact
      ) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.sourceOffice === formData.destinationOffice) {
        throw new Error('Source and destination offices cannot be the same');
      }

      // Submit form
      const response = await fetch('/api/consignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create consignment');
      }

      const data = await response.json();
      setSuccess('Consignment created successfully! Tracking number: ' + data.trackingNumber);
      
      // Reset form
      setFormData({
        sourceOffice: '',
        destinationOffice: '',
        volume: '',
        sender: {
          name: '',
          contact: '',
        },
        receiver: {
          name: '',
          contact: '',
        },
      });
      
      // Redirect after success
      setTimeout(() => {
        router.push('/consignments');
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
        <h1 className="text-2xl font-bold text-black">Create New Consignment</h1>
        <Button variant="outline">
          <Link href="/consignments">Back to Consignments</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Consignment Details</CardTitle>
          <CardDescription className="text-gray-700">
            Enter the details of the new consignment
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
                <label htmlFor="sourceOffice" className="text-sm font-medium text-black">
                  Source Office <span className="text-red-500">*</span>
                </label>
                <select
                  id="sourceOffice"
                  name="sourceOffice"
                  value={formData.sourceOffice}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                >
                  <option value="">Select Source Office</option>
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="destinationOffice" className="text-sm font-medium text-black">
                  Destination Office <span className="text-red-500">*</span>
                </label>
                <select
                  id="destinationOffice"
                  name="destinationOffice"
                  value={formData.destinationOffice}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                  required
                >
                  <option value="">Select Destination Office</option>
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="volume" className="text-sm font-medium text-black">
                Volume (cubic meters) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="volume"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
                className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-black mb-4">Sender Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="sender.name" className="text-sm font-medium text-black">
                    Sender Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sender.name"
                    name="sender.name"
                    value={formData.sender.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="sender.contact" className="text-sm font-medium text-black">
                    Sender Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sender.contact"
                    name="sender.contact"
                    value={formData.sender.contact}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-black mb-4">Receiver Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="receiver.name" className="text-sm font-medium text-black">
                    Receiver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="receiver.name"
                    name="receiver.name"
                    value={formData.receiver.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="receiver.contact" className="text-sm font-medium text-black">
                    Receiver Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="receiver.contact"
                    name="receiver.contact"
                    value={formData.receiver.contact}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2.5 text-black"
                    required
                  />
                </div>
              </div>
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
                  'Create Consignment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 