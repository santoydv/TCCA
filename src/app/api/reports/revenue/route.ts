import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
// Import models to ensure all models are registered
import '@/models';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { UserRole } from '@/models/User';
import Truck from '@/models/Truck';
import mongoose from 'mongoose';
import { Types } from 'mongoose';

// Define types for filters
interface FilterBase {
  createdAt: {
    $gte: Date;
    $lte: Date;
  };
  $or?: Array<{
    sourceOffice: mongoose.Types.ObjectId;
  } | {
    destinationOffice: mongoose.Types.ObjectId;
  }>;
}

// Define type for status breakdown
interface StatusBreakdown {
  [key: string]: {
    count: number;
    revenue: number;
  };
}

// GET /api/reports/revenue
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check authorization (only admin and managers can access reports)
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const office = searchParams.get('office');
    const reportType = searchParams.get('type') || 'summary';
    
    // Parse dates or use defaults (last 30 days)
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Base filter
    const baseFilter: FilterBase = {
      createdAt: { $gte: startDate, $lte: endDate },
    };
    
    // Add office filter if specified
    if (office) {
      baseFilter.$or = [
        { sourceOffice: new mongoose.Types.ObjectId(office) },
        { destinationOffice: new mongoose.Types.ObjectId(office) }
      ];
    }
    
    // Office-specific filter (only for managers who aren't admins)
    if (session.user.role === UserRole.MANAGER && session.user.office) {
      baseFilter.$or = [
        { sourceOffice: new mongoose.Types.ObjectId(session.user.office) },
        { destinationOffice: new mongoose.Types.ObjectId(session.user.office) }
      ];
    }
    
    let report;
    
    // Generate report based on type
    switch (reportType) {
      case 'summary':
        report = await generateSummaryReport(baseFilter);
        break;
      case 'monthly':
        report = await generateMonthlyReport(baseFilter);
        break;
      case 'office':
        report = await generateOfficeReport(baseFilter);
        break;
      case 'truck':
        report = await generateTruckReport(baseFilter);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      report,
      type: reportType,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        office: office || 'all'
      }
    });
    
  } catch (error) {
    console.error('Error generating revenue report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Generate summary report
async function generateSummaryReport(filter: FilterBase) {
  // Total revenue
  const totalRevenue = await Consignment.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$charge' } } }
  ]);
  
  // Total consignments by status
  const consignmentsByStatus = await Consignment.aggregate([
    { $match: filter },
    { $group: { 
      _id: '$status', 
      count: { $sum: 1 },
      revenue: { $sum: '$charge' }
    }},
    { $sort: { _id: 1 } }
  ]);
  
  // Create status breakdown
  const statusBreakdown: StatusBreakdown = {};
  Object.values(ConsignmentStatus).forEach(status => {
    statusBreakdown[status] = { count: 0, revenue: 0 };
  });
  
  // Fill in actual data
  consignmentsByStatus.forEach(item => {
    statusBreakdown[item._id] = {
      count: item.count,
      revenue: item.revenue
    };
  });
  
  // Total consignments
  const totalConsignments = Object.values(statusBreakdown)
    .reduce((sum: number, item: any) => sum + item.count, 0);
    
  // Average consignment value
  const avgConsignmentValue = totalConsignments > 0
    ? (totalRevenue[0]?.total || 0) / totalConsignments
    : 0;
  
  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalConsignments,
    avgConsignmentValue,
    statusBreakdown
  };
}

// Generate monthly report
async function generateMonthlyReport(filter: FilterBase) {
  const monthlyData = await Consignment.aggregate([
    { $match: filter },
    { 
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // Transform into a more readable format
  return monthlyData.map(item => ({
    year: item._id.year,
    month: item._id.month,
    consignments: item.consignments,
    revenue: item.revenue,
    avgValue: item.revenue / item.consignments
  }));
}

// Generate office report
async function generateOfficeReport(filter: FilterBase) {
  // Get revenue by source office
  const sourceOfficeData = await Consignment.aggregate([
    { $match: filter },
    { 
      $group: {
        _id: '$sourceOffice',
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' }
      }
    },
    { 
      $lookup: {
        from: 'offices',
        localField: '_id',
        foreignField: '_id',
        as: 'officeDetails'
      }
    },
    { $unwind: '$officeDetails' },
    { 
      $project: {
        _id: 1,
        officeName: '$officeDetails.name',
        consignments: 1,
        revenue: 1
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  // Get revenue by destination office
  const destOfficeData = await Consignment.aggregate([
    { $match: filter },
    { 
      $group: {
        _id: '$destinationOffice',
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' }
      }
    },
    { 
      $lookup: {
        from: 'offices',
        localField: '_id',
        foreignField: '_id',
        as: 'officeDetails'
      }
    },
    { $unwind: '$officeDetails' },
    { 
      $project: {
        _id: 1,
        officeName: '$officeDetails.name',
        consignments: 1,
        revenue: 1
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  // Get route performance (source to destination)
  const routePerformance = await Consignment.aggregate([
    { $match: filter },
    { 
      $group: {
        _id: { 
          source: '$sourceOffice',
          destination: '$destinationOffice'
        },
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' }
      }
    },
    { 
      $lookup: {
        from: 'offices',
        localField: '_id.source',
        foreignField: '_id',
        as: 'sourceDetails'
      }
    },
    { 
      $lookup: {
        from: 'offices',
        localField: '_id.destination',
        foreignField: '_id',
        as: 'destDetails'
      }
    },
    { $unwind: '$sourceDetails' },
    { $unwind: '$destDetails' },
    { 
      $project: {
        route: { 
          $concat: [
            '$sourceDetails.name', 
            ' → ', 
            '$destDetails.name'
          ]
        },
        consignments: 1,
        revenue: 1,
        avgValue: { $divide: ['$revenue', '$consignments'] }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  return {
    sourceOffices: sourceOfficeData,
    destinationOffices: destOfficeData,
    routes: routePerformance
  };
}

// Generate truck report
async function generateTruckReport(filter: FilterBase) {
  // Get consignments with truck information
  const consignmentsWithTrucks = await Consignment.aggregate([
    { $match: { ...filter, truck: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: 'trucks',
        localField: 'truck',
        foreignField: '_id',
        as: 'truckDetails'
      }
    },
    { $unwind: '$truckDetails' },
    {
      $group: {
        _id: '$truck',
        registrationNumber: { $first: '$truckDetails.registrationNumber' },
        truckModel: { $first: '$truckDetails.truckModel' },
        capacity: { $first: '$truckDetails.capacity' },
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' },
        totalVolume: { $sum: '$volume' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Group by capacity ranges
  const capacityRanges = await Consignment.aggregate([
    { $match: { ...filter, truck: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: 'trucks',
        localField: 'truck',
        foreignField: '_id',
        as: 'truckDetails'
      }
    },
    { $unwind: '$truckDetails' },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lte: ['$truckDetails.capacity', 20] }, then: 'Small (≤20m³)' },
              { case: { $lte: ['$truckDetails.capacity', 40] }, then: 'Medium (21-40m³)' },
              { case: { $lte: ['$truckDetails.capacity', 60] }, then: 'Large (41-60m³)' },
            ],
            default: 'Extra Large (>60m³)'
          }
        },
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' },
        avgCapacityUtilization: { 
          $avg: { $divide: ['$volume', '$truckDetails.capacity'] } 
        }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Get revenue for consignments without assigned trucks
  const noTruckData = await Consignment.aggregate([
    { $match: { ...filter, truck: { $exists: false } } },
    {
      $group: {
        _id: null,
        consignments: { $sum: 1 },
        revenue: { $sum: '$charge' }
      }
    }
  ]);

  return {
    byTruck: consignmentsWithTrucks,
    byCapacityRange: capacityRanges,
    withoutTruck: noTruckData[0] || { consignments: 0, revenue: 0 }
  };
}