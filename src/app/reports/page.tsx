'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, BarChart2, TrendingUp, Truck, Package } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';

export default function ReportsDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;

  // Redirect non-managers/non-admins
  React.useEffect(() => {
    if (session && userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      router.push('/dashboard');
    }
  }, [session, userRole, router]);

  const reports = [
    {
      title: 'Revenue Reports',
      description: 'Analyze revenue by time period, offices, and trucks',
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      href: '/reports/revenue',
    },
    {
      title: 'Delivery Reports',
      description: 'Track delivery performance and on-time statistics',
      icon: <Package className="h-8 w-8 text-blue-600" />,
      href: '/reports/deliveries',
    },
    {
      title: 'Truck Reports',
      description: 'Monitor truck utilization, performance and maintenance',
      icon: <Truck className="h-8 w-8 text-orange-600" />,
      href: '/reports/trucks',
    },
    {
      title: 'Overall Analytics',
      description: 'View comprehensive business analytics and trends',
      icon: <BarChart2 className="h-8 w-8 text-purple-600" />,
      href: '/reports/analytics',
    },
  ];

  // If not admin or manager, don't render the page content
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-2">Access Denied</h1>
            <p className="text-gray-700">You don't have permission to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Reports Dashboard</h1>
        <p className="text-gray-700">
          Access and generate reports to analyze business performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Link href={report.href} key={report.title}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                {report.icon}
                <div>
                  <CardTitle className="text-black">{report.title}</CardTitle>
                  <CardDescription className="text-gray-700">{report.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="flex justify-end">
                <Button variant="ghost" size="sm">
                  View Reports <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
} 