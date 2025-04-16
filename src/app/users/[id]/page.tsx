'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Building, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/models/User';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  office?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError('Error loading user details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchUser();
    }
  }, [params.id]);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      router.push('/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };
  
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isSelfOrAdmin = isAdmin || session?.user?.id === params.id;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'User not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/users')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>User Information</CardTitle>
              {isSelfOrAdmin && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/users/${params.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {isAdmin && user._id !== session?.user?.id && (
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                {user.office && (
                  <div className="flex items-center mt-1">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <Link href={`/offices/${user.office._id}`} className="text-blue-600 hover:underline">
                      {user.office.name}
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="md:ml-auto">
                <Badge variant={user.role === UserRole.ADMIN ? "destructive" : user.role === UserRole.MANAGER ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">
                User since: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">Activity logging coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 