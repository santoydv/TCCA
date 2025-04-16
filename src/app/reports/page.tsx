'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, BarChart2, TrendingUp, Truck, Package } from 'lucide-react';

export default function ReportsDashboard() {
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

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports Dashboard</h1>
        <p className="text-muted-foreground">
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
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
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
    </div>
  );
} 