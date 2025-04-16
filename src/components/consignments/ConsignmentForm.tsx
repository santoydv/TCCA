'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

type Office = {
  _id: string;
  name: string;
};

type ConsignmentFormProps = {
  offices: Office[];
  onSubmit: (data: ConsignmentFormData) => Promise<void>;
  isLoading?: boolean;
};

export type ConsignmentFormData = {
  volume: number;
  sender: {
    name: string;
    address: string;
    contact: string;
  };
  receiver: {
    name: string;
    address: string;
    contact: string;
  };
  sourceOffice: string;
  destinationOffice: string;
};

export default function ConsignmentForm({ offices, onSubmit, isLoading = false }: ConsignmentFormProps) {
  const [formData, setFormData] = useState<ConsignmentFormData>({
    volume: 0,
    sender: {
      name: '',
      address: '',
      contact: '',
    },
    receiver: {
      name: '',
      address: '',
      contact: '',
    },
    sourceOffice: '',
    destinationOffice: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (sender.name, receiver.address, etc.)
      const [parent, child] = name.split('.');
      
      if (parent === 'sender') {
        setFormData(prev => ({
          ...prev,
          sender: {
            ...prev.sender,
            [child]: value,
          },
        }));
      } else if (parent === 'receiver') {
        setFormData(prev => ({
          ...prev,
          receiver: {
            ...prev.receiver,
            [child]: value,
          },
        }));
      }
    } else {
      // For non-nested fields like volume, sourceOffice, etc.
      setFormData(prev => ({
        ...prev,
        [name]: name === 'volume' ? parseFloat(value) : value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Consignment</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium">Consignment Details</h3>
            
            <div className="space-y-2">
              <label htmlFor="volume" className="text-sm font-medium">
                Volume (cubic meters) <span className="text-red-500">*</span>
              </label>
              <input
                id="volume"
                name="volume"
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formData.volume || ''}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="sourceOffice" className="text-sm font-medium">
                  Source Office <span className="text-red-500">*</span>
                </label>
                <select
                  id="sourceOffice"
                  name="sourceOffice"
                  required
                  value={formData.sourceOffice}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select Source Office</option>
                  {offices.map(office => (
                    <option key={office._id} value={office._id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="destinationOffice" className="text-sm font-medium">
                  Destination Office <span className="text-red-500">*</span>
                </label>
                <select
                  id="destinationOffice"
                  name="destinationOffice"
                  required
                  value={formData.destinationOffice}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select Destination Office</option>
                  {offices.map(office => (
                    <option 
                      key={office._id} 
                      value={office._id}
                      disabled={office._id === formData.sourceOffice}
                    >
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-md font-medium">Sender Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="sender.name" className="text-sm font-medium">
                Sender Name <span className="text-red-500">*</span>
              </label>
              <input
                id="sender.name"
                name="sender.name"
                type="text"
                required
                value={formData.sender.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="sender.address" className="text-sm font-medium">
                Sender Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="sender.address"
                name="sender.address"
                rows={3}
                required
                value={formData.sender.address}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="sender.contact" className="text-sm font-medium">
                Sender Contact <span className="text-red-500">*</span>
              </label>
              <input
                id="sender.contact"
                name="sender.contact"
                type="text"
                required
                value={formData.sender.contact}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-md font-medium">Receiver Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="receiver.name" className="text-sm font-medium">
                Receiver Name <span className="text-red-500">*</span>
              </label>
              <input
                id="receiver.name"
                name="receiver.name"
                type="text"
                required
                value={formData.receiver.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="receiver.address" className="text-sm font-medium">
                Receiver Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="receiver.address"
                name="receiver.address"
                rows={3}
                required
                value={formData.receiver.address}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="receiver.contact" className="text-sm font-medium">
                Receiver Contact <span className="text-red-500">*</span>
              </label>
              <input
                id="receiver.contact"
                name="receiver.contact"
                type="text"
                required
                value={formData.receiver.contact}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Submit Consignment
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 