'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Spinner from '@/components/ui/Spinner';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define type for the data
type ReportData = {
  summary?: {
    totalRevenue: number;
    totalConsignments: number;
    avgConsignmentValue: number;
    statusBreakdown: Record<string, { count: number; revenue: number }>;
  };
  byTruck?: {
    _id: string;
    registrationNumber: string;
    truckModel: string;
    capacity: number;
    consignments: number;
    revenue: number;
    totalVolume: number;
  }[];
  byCapacityRange?: {
    _id: string;
    consignments: number;
    revenue: number;
    avgCapacityUtilization: number;
  }[];
  withoutTruck?: {
    consignments: number;
    revenue: number;
  };
  sourceOffices?: {
    _id: string;
    officeName: string;
    consignments: number;
    revenue: number;
  }[];
  destinationOffices?: {
    _id: string;
    officeName: string;
    consignments: number;
    revenue: number;
  }[];
  routes?: {
    route: string;
    consignments: number;
    revenue: number;
    avgValue: number;
  }[];
};

type Office = {
  _id: string;
  name: string;
};

export default function RevenueReports() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [reportType, setReportType] = useState<string>(
    searchParams.get('type') || 'summary'
  );
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Fetch offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/offices');
        const data = await response.json();
        setOffices(data);
      } catch (err) {
        console.error('Error fetching offices:', err);
        setError('Failed to load office data');
      }
    };

    fetchOffices();
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
        params.append('type', reportType);
        
        if (selectedOffice !== 'all') {
          params.append('office', selectedOffice);
        }

        const response = await fetch(`/api/reports/revenue?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        
        const data = await response.json();
        setReportData(data.report);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange, selectedOffice, reportType]);

  // Handle filter application
  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
    if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
    params.append('type', reportType);
    if (selectedOffice !== 'all') params.append('office', selectedOffice);
    
    router.push(`/reports/revenue?${params.toString()}`);
  };

  const renderSummaryReport = () => {
    if (!reportData?.summary) return null;
    
    const { totalRevenue, totalConsignments, avgConsignmentValue, statusBreakdown } = reportData.summary;
    
    // Prepare chart data for status breakdown
    const statusLabels = Object.keys(statusBreakdown);
    const statusData = statusLabels.map(status => statusBreakdown[status].revenue);
    const statusCounts = statusLabels.map(status => statusBreakdown[status].count);
    
    const chartData = {
      labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: 'Revenue by Status',
          data: statusData,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Revenue</CardTitle>
              <CardDescription>All consignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Consignments</CardTitle>
              <CardDescription>Total count</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalConsignments}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Avg Value</CardTitle>
              <CardDescription>Per consignment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${avgConsignmentValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Pie 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusLabels.map(status => (
                  <div key={status} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                      <p className="text-sm text-muted-foreground">{statusBreakdown[status].count} consignments</p>
                    </div>
                    <p className="font-bold">${statusBreakdown[status].revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  const renderTruckReport = () => {
    if (!reportData?.byTruck || !reportData?.byCapacityRange) return null;
    
    // Prepare chart data for trucks
    const truckLabels = reportData.byTruck.slice(0, 10).map(t => t.registrationNumber); // Top 10 trucks
    const truckRevenues = reportData.byTruck.slice(0, 10).map(t => t.revenue);
    
    const truckChartData = {
      labels: truckLabels,
      datasets: [
        {
          label: 'Revenue by Truck',
          data: truckRevenues,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
    
    // Prepare chart data for capacity ranges
    const capacityLabels = reportData.byCapacityRange.map(c => c._id);
    const capacityRevenues = reportData.byCapacityRange.map(c => c.revenue);
    
    const capacityChartData = {
      labels: capacityLabels,
      datasets: [
        {
          label: 'Revenue by Capacity Range',
          data: capacityRevenues,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Top Truck</CardTitle>
              <CardDescription>Highest revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.byTruck.length > 0 ? (
                <>
                  <p className="text-2xl font-bold">{reportData.byTruck[0].registrationNumber}</p>
                  <p className="text-lg">${reportData.byTruck[0].revenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {reportData.byTruck[0].consignments} consignments
                  </p>
                </>
              ) : (
                <p>No truck data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Best Capacity</CardTitle>
              <CardDescription>Highest revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.byCapacityRange.length > 0 ? (
                <>
                  <p className="text-2xl font-bold">{reportData.byCapacityRange[0]._id}</p>
                  <p className="text-lg">${reportData.byCapacityRange[0].revenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {reportData.byCapacityRange[0].consignments} consignments
                  </p>
                </>
              ) : (
                <p>No capacity data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Without Trucks</CardTitle>
              <CardDescription>Unassigned consignments</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.withoutTruck ? (
                <>
                  <p className="text-2xl font-bold">${reportData.withoutTruck.revenue.toFixed(2)}</p>
                  <p className="text-lg">{reportData.withoutTruck.consignments} consignments</p>
                </>
              ) : (
                <p>No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Trucks by Revenue</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Bar 
                data={truckChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Truck Capacity</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Pie 
                data={capacityChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </CardContent>
          </Card>
        </div>
        
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
                    <th className="text-left py-3 px-4">Model</th>
                    <th className="text-left py-3 px-4">Capacity (m³)</th>
                    <th className="text-right py-3 px-4">Consignments</th>
                    <th className="text-right py-3 px-4">Total Volume (m³)</th>
                    <th className="text-right py-3 px-4">Revenue ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byTruck.map((truck) => (
                    <tr key={truck._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{truck.registrationNumber}</td>
                      <td className="py-3 px-4">{truck.truckModel}</td>
                      <td className="py-3 px-4">{truck.capacity}</td>
                      <td className="py-3 px-4 text-right">{truck.consignments}</td>
                      <td className="py-3 px-4 text-right">{truck.totalVolume.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium">${truck.revenue.toFixed(2)}</td>
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
  
  const renderOfficeReport = () => {
    if (!reportData?.sourceOffices || !reportData?.destinationOffices || !reportData?.routes) return null;
    
    // Prepare chart data for source offices
    const sourceLabels = reportData.sourceOffices.slice(0, 5).map(o => o.officeName); // Top 5
    const sourceRevenues = reportData.sourceOffices.slice(0, 5).map(o => o.revenue);
    
    const sourceChartData = {
      labels: sourceLabels,
      datasets: [
        {
          label: 'Revenue by Source Office',
          data: sourceRevenues,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    };
    
    // Prepare chart data for routes
    const routeLabels = reportData.routes.slice(0, 5).map(r => r.route); // Top 5
    const routeRevenues = reportData.routes.slice(0, 5).map(r => r.revenue);
    
    const routeChartData = {
      labels: routeLabels,
      datasets: [
        {
          label: 'Revenue by Route',
          data: routeRevenues,
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
        },
      ],
    };
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Source Offices</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Bar 
                data={sourceChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Routes</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Bar 
                data={routeChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Office Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Office</th>
                      <th className="text-right py-3 px-4">Consignments</th>
                      <th className="text-right py-3 px-4">Revenue ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sourceOffices.map((office) => (
                      <tr key={office._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{office.officeName}</td>
                        <td className="py-3 px-4 text-right">{office.consignments}</td>
                        <td className="py-3 px-4 text-right font-medium">${office.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Destination Office Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Office</th>
                      <th className="text-right py-3 px-4">Consignments</th>
                      <th className="text-right py-3 px-4">Revenue ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.destinationOffices.map((office) => (
                      <tr key={office._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{office.officeName}</td>
                        <td className="py-3 px-4 text-right">{office.consignments}</td>
                        <td className="py-3 px-4 text-right font-medium">${office.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
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
            <h1 className="text-3xl font-bold">Revenue Reports</h1>
            <p className="text-muted-foreground">
              Analyze revenue across different dimensions
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
              <p className="text-sm font-medium mb-2">Office</p>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offices</SelectItem>
                  {offices.map((office) => (
                    <SelectItem key={office._id} value={office._id}>
                      {office.name}
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
          <TabsTrigger value="summary">Summary Report</TabsTrigger>
          <TabsTrigger value="truck">Truck Report</TabsTrigger>
          <TabsTrigger value="office">Office Report</TabsTrigger>
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
            <TabsContent value="summary">
              {renderSummaryReport()}
            </TabsContent>
            
            <TabsContent value="truck">
              {renderTruckReport()}
            </TabsContent>
            
            <TabsContent value="office">
              {renderOfficeReport()}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
} 