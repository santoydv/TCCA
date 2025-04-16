'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { UserRole } from '@/types';

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  color?: string;
  icon?: React.ReactNode;
};

const StatCard = ({ title, value, description, color = 'bg-primary-500 text-white' }: StatCardProps) => {
  return (
    <Card className="border-l-4 border-l-primary-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <CardDescription className="text-gray-600">{description}</CardDescription>
          </div>
          <div className={`rounded-full p-2 ${color}`}>
            {/* Icon would go here */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || UserRole.STAFF;
  
  // Simulated data - in a real app, these would come from API calls
  const [stats, setStats] = useState({
    pendingConsignments: 0,
    availableTrucks: 0,
    inTransitTrucks: 0,
    avgWaitingTime: 0,
  });
  
  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setStats({
        pendingConsignments: 28,
        availableTrucks: 12,
        inTransitTrucks: 15,
        avgWaitingTime: 3.5,
      });
    }, 500);
  }, []);
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">Dashboard</h1>
        <p className="text-gray-700">Welcome back, {session?.user?.name}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Consignments"
          value={stats.pendingConsignments}
          description="Awaiting dispatch"
          color="bg-primary-600 text-white"
        />
        <StatCard
          title="Available Trucks"
          value={stats.availableTrucks}
          description="Ready for allocation"
          color="bg-secondary-500 text-white"
        />
        <StatCard
          title="Trucks in Transit"
          value={stats.inTransitTrucks}
          description="Currently on delivery"
          color="bg-primary-700 text-white"
        />
        <StatCard
          title="Avg. Waiting Time"
          value={`${stats.avgWaitingTime} days`}
          description="For consignments"
          color="bg-secondary-600 text-white"
        />
      </div>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Consignments</CardTitle>
            <CardDescription>Latest consignments received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This would be a list of consignments in a real app */}
              <p className="text-gray-500">No recent consignments found.</p>
              <Link href="/consignments">
                <Button>View All Consignments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Truck Allocations</CardTitle>
            <CardDescription>Recent truck allocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This would be a list of allocations in a real app */}
              <p className="text-gray-500">No recent allocations found.</p>
              <Link href="/trucks">
                <Button>View All Trucks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {(userRole === UserRole.MANAGER || userRole === UserRole.ADMIN) && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Overview of company performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would contain charts and more detailed analytics */}
                <p className="text-gray-500">KPI data will be displayed here.</p>
                <Link href="/reports">
                  <Button>View Detailed Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
} 