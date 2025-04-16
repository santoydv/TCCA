'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Filter, Activity, Calendar, Truck } from 'lucide-react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Spinner from '@/components/ui/Spinner';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define type for the data
type TruckReportData = {
  utilization?: {
    truckId: string;
    registrationNumber: string;
    model: string;
    totalTrips: number;
    totalDistance: number;
    totalHours: number;
    volumeUtilization: number;
  }[];
  maintenance?: {
    truckId: string;
    registrationNumber: string;
    maintenanceCount: number;
    totalCost: number;
    lastMaintenance: string;
    upcomingMaintenance: string | null;
  }[];
  performance?: {
    truckId: string;
    registrationNumber: string;
    totalConsignments: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    onTimeRate: number;
  }[];
};

type Truck = {
  _id: string;
  registrationNumber: string;
};

export default function TruckReports() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [reportType, setReportType] = useState<string>(
    searchParams.get('reportType') || 'utilization'
  );
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<TruckReportData | null>(null);

  // Fetch trucks on mount
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const response = await fetch('/api/trucks');
        const data = await response.json();
        setTrucks(data);
      } catch (err) {
        console.error('Error fetching trucks:', err);
        setError('Failed to load truck data');
      }
    };

    fetchTrucks();
  }, []);

  // Fetch report data based on filters
  useEffect(() => {
    const fetchReportData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams();
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
        params.append('reportType', reportType);
        
        if (selectedTruck !== 'all') {
          params.append('truckId', selectedTruck);
        }

        const response = await fetch(`/api/reports/trucks?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        
        const data = await response.json();
        setReportData(data.reportData);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange, selectedTruck, reportType]);

  // Handle filter application
  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
    if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
    params.append('reportType', reportType);
    if (selectedTruck !== 'all') params.append('truckId', selectedTruck);
    
    router.push(`/reports/trucks?${params.toString()}`);
  };

  const renderUtilizationReport = () => {
    if (!reportData?.utilization) return null;
    
    // Prepare chart data for top trucks by utilization
    const topTrucks = reportData.utilization.slice(0, 10);
    const utilizationChartData = {
      labels: topTrucks.map(t => t.registrationNumber),
      datasets: [
        {
          label: 'Volume Utilization (%)',
          data: topTrucks.map(t => t.volumeUtilization * 100),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Avg. Utilization</CardTitle>
              <CardDescription>Fleet-wide average</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(reportData.utilization.reduce((acc, curr) => acc + curr.volumeUtilization, 0) / 
                  reportData.utilization.length * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Trips</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {reportData.utilization.reduce((acc, curr) => acc + curr.totalTrips, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Distance</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {reportData.utilization.reduce((acc, curr) => acc + curr.totalDistance, 0).toFixed(0)} km
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Trucks by Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <Bar 
              data={utilizationChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Utilization (%)'
                    }
                  },
                },
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Truck Utilization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Registration</th>
                    <th className="text-left py-3 px-4">Model</th>
                    <th className="text-right py-3 px-4">Trips</th>
                    <th className="text-right py-3 px-4">Distance (km)</th>
                    <th className="text-right py-3 px-4">Hours</th>
                    <th className="text-right py-3 px-4">Utilization (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.utilization.map((truck) => (
                    <tr key={truck.truckId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{truck.registrationNumber}</td>
                      <td className="py-3 px-4">{truck.model}</td>
                      <td className="py-3 px-4 text-right">{truck.totalTrips}</td>
                      <td className="py-3 px-4 text-right">{truck.totalDistance.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right">{truck.totalHours.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right font-medium">{(truck.volumeUtilization * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderMaintenanceReport = () => {
    if (!reportData?.maintenance) return null;
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Maintenance</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {reportData.maintenance.reduce((acc, curr) => acc + curr.maintenanceCount, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Cost</CardTitle>
              <CardDescription>All maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${reportData.maintenance.reduce((acc, curr) => acc + curr.totalCost, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Avg. Cost</CardTitle>
              <CardDescription>Per maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${(reportData.maintenance.reduce((acc, curr) => acc + curr.totalCost, 0) / 
                  reportData.maintenance.reduce((acc, curr) => acc + curr.maintenanceCount, 0)).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Registration</th>
                    <th className="text-right py-3 px-4">Maintenance Count</th>
                    <th className="text-right py-3 px-4">Total Cost ($)</th>
                    <th className="text-left py-3 px-4">Last Maintenance</th>
                    <th className="text-left py-3 px-4">Upcoming Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.maintenance.map((truck) => (
                    <tr key={truck.truckId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{truck.registrationNumber}</td>
                      <td className="py-3 px-4 text-right">{truck.maintenanceCount}</td>
                      <td className="py-3 px-4 text-right">${truck.totalCost.toFixed(2)}</td>
                      <td className="py-3 px-4">{new Date(truck.lastMaintenance).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {truck.upcomingMaintenance 
                          ? new Date(truck.upcomingMaintenance).toLocaleDateString() 
                          : 'No scheduled maintenance'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderPerformanceReport = () => {
    if (!reportData?.performance) return null;
    
    // Prepare chart data for delivery performance
    const performanceChartData = {
      labels: reportData.performance.slice(0, 10).map(t => t.registrationNumber),
      datasets: [
        {
          label: 'On-Time Rate (%)',
          data: reportData.performance.slice(0, 10).map(t => t.onTimeRate * 100),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    };
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Consignments</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {reportData.performance.reduce((acc, curr) => acc + curr.totalConsignments, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">On-Time Deliveries</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {reportData.performance.reduce((acc, curr) => acc + curr.onTimeDeliveries, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Avg. On-Time Rate</CardTitle>
              <CardDescription>All trucks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(reportData.performance.reduce((acc, curr) => acc + (curr.onTimeRate * curr.totalConsignments), 0) / 
                  reportData.performance.reduce((acc, curr) => acc + curr.totalConsignments, 0) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Trucks by On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <Bar 
              data={performanceChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'On-Time Rate (%)'
                    }
                  },
                },
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Truck Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Registration</th>
                    <th className="text-right py-3 px-4">Total Consignments</th>
                    <th className="text-right py-3 px-4">On-Time</th>
                    <th className="text-right py-3 px-4">Late</th>
                    <th className="text-right py-3 px-4">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.performance.map((truck) => (
                    <tr key={truck.truckId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{truck.registrationNumber}</td>
                      <td className="py-3 px-4 text-right">{truck.totalConsignments}</td>
                      <td className="py-3 px-4 text-right">{truck.onTimeDeliveries}</td>
                      <td className="py-3 px-4 text-right">{truck.lateDeliveries}</td>
                      <td className="py-3 px-4 text-right font-medium">{(truck.onTimeRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Truck Reports</h1>
            <p className="text-muted-foreground">
              Analyze truck utilization, maintenance and performance
            </p>
          </div>
        </div>
        
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Date Range</p>
              <DateRangePicker 
                dateRange={dateRange} 
                setDateRange={setDateRange} 
                className="w-full"
              />
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Truck</p>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trucks</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck._id} value={truck._id}>
                      {truck.registrationNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="utilization">
            <Activity className="mr-2 h-4 w-4" />
            Utilization
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Calendar className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Truck className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={applyFilters}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="utilization">
              {renderUtilizationReport()}
            </TabsContent>
            
            <TabsContent value="maintenance">
              {renderMaintenanceReport()}
            </TabsContent>
            
            <TabsContent value="performance">
              {renderPerformanceReport()}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
} 