import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
// Import models to ensure all models are registered
import '@/models';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { UserRole } from '@/models/User';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only managers and admins can access reports
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sourceOffice = searchParams.get('sourceOffice');
    const destinationOffice = searchParams.get('destinationOffice');
    const reportType = searchParams.get('reportType') || 'performance';
    
    // Build filter based on parameters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (!dateFilter.createdAt) dateFilter.createdAt = {};
      dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    if (sourceOffice) {
      dateFilter.sourceOffice = new Types.ObjectId(sourceOffice);
    }
    
    if (destinationOffice) {
      dateFilter.destinationOffice = new Types.ObjectId(destinationOffice);
    }
    
    let reportData;
    
    if (reportType === 'performance') {
      // Delivery performance metrics
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'offices',
            localField: 'sourceOffice',
            foreignField: '_id',
            as: 'sourceOfficeInfo'
          }
        },
        {
          $lookup: {
            from: 'offices',
            localField: 'destinationOffice',
            foreignField: '_id',
            as: 'destinationOfficeInfo'
          }
        },
        { $unwind: '$sourceOfficeInfo' },
        { $unwind: '$destinationOfficeInfo' },
        {
          $addFields: {
            deliveryTimeInHours: {
              $cond: [
                { $eq: ['$status', ConsignmentStatus.DELIVERED] },
                {
                  $divide: [
                    { $subtract: ['$deliveredAt', '$createdAt'] },
                    3600000 // Convert ms to hours
                  ]
                },
                null
              ]
            },
            isLate: {
              $cond: [
                { $eq: ['$status', ConsignmentStatus.DELIVERED] },
                {
                  $gt: [
                    { $subtract: ['$deliveredAt', '$createdAt'] },
                    { $multiply: ['$expectedDeliveryTime', 3600000] }
                  ]
                },
                null
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              source: '$sourceOffice',
              destination: '$destinationOffice'
            },
            sourceOfficeName: { $first: '$sourceOfficeInfo.name' },
            destinationOfficeName: { $first: '$destinationOfficeInfo.name' },
            totalConsignments: { $sum: 1 },
            deliveredConsignments: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.DELIVERED] }, 1, 0]
              }
            },
            totalVolume: { $sum: '$volume' },
            avgDeliveryTime: { $avg: '$deliveryTimeInHours' },
            onTimeDeliveries: {
              $sum: {
                $cond: [
                  { $eq: ['$isLate', false] },
                  1,
                  0
                ]
              }
            },
            lateDeliveries: {
              $sum: {
                $cond: [
                  { $eq: ['$isLate', true] },
                  1,
                  0
                ]
              }
            },
            maxDeliveryTime: { $max: '$deliveryTimeInHours' },
            minDeliveryTime: { $min: '$deliveryTimeInHours' }
          }
        },
        {
          $project: {
            _id: 0,
            sourceOffice: '$_id.source',
            destinationOffice: '$_id.destination',
            sourceOfficeName: 1,
            destinationOfficeName: 1,
            route: { 
              $concat: ['$sourceOfficeName', ' to ', '$destinationOfficeName'] 
            },
            totalConsignments: 1,
            deliveredConsignments: 1,
            pendingConsignments: { 
              $subtract: ['$totalConsignments', '$deliveredConsignments'] 
            },
            totalVolume: 1,
            avgDeliveryTime: 1,
            maxDeliveryTime: 1,
            minDeliveryTime: 1,
            onTimeDeliveryRate: {
              $cond: [
                { $eq: ['$deliveredConsignments', 0] },
                0,
                {
                  $multiply: [
                    { $divide: ['$onTimeDeliveries', '$deliveredConsignments'] },
                    100
                  ]
                }
              ]
            }
          }
        },
        { $sort: { totalConsignments: -1 } }
      ]);
    } else if (reportType === 'monthly') {
      // Monthly delivery performance
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $addFields: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            deliveryTimeInHours: {
              $cond: [
                { $eq: ['$status', ConsignmentStatus.DELIVERED] },
                {
                  $divide: [
                    { $subtract: ['$deliveredAt', '$createdAt'] },
                    3600000 // Convert ms to hours
                  ]
                },
                null
              ]
            },
            isLate: {
              $cond: [
                { $eq: ['$status', ConsignmentStatus.DELIVERED] },
                {
                  $gt: [
                    { $subtract: ['$deliveredAt', '$createdAt'] },
                    { $multiply: ['$expectedDeliveryTime', 3600000] }
                  ]
                },
                null
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month'
            },
            totalConsignments: { $sum: 1 },
            deliveredConsignments: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.DELIVERED] }, 1, 0]
              }
            },
            totalVolume: { $sum: '$volume' },
            avgDeliveryTime: { $avg: '$deliveryTimeInHours' },
            onTimeDeliveries: {
              $sum: {
                $cond: [
                  { $eq: ['$isLate', false] },
                  1,
                  0
                ]
              }
            },
            lateDeliveries: {
              $sum: {
                $cond: [
                  { $eq: ['$isLate', true] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            period: { 
              $concat: [
                { $toString: '$_id.year' }, 
                '-', 
                { $toString: '$_id.month' }
              ] 
            },
            totalConsignments: 1,
            deliveredConsignments: 1,
            pendingRate: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$totalConsignments', '$deliveredConsignments'] },
                    '$totalConsignments'
                  ]
                },
                100
              ]
            },
            totalVolume: 1,
            avgDeliveryTime: 1,
            onTimeDeliveryRate: {
              $cond: [
                { $eq: ['$deliveredConsignments', 0] },
                0,
                {
                  $multiply: [
                    { $divide: ['$onTimeDeliveries', '$deliveredConsignments'] },
                    100
                  ]
                }
              ]
            }
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);
    } else if (reportType === 'status') {
      // Status breakdown
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalVolume: { $sum: '$volume' },
            avgVolume: { $avg: '$volume' }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            totalVolume: 1,
            avgVolume: 1,
            _id: 0
          }
        }
      ]);
      
      // Format the results as a map with status as key
      const formattedData: Record<string, any> = {};
      
      // Initialize with all statuses, even if no data
      Object.values(ConsignmentStatus).forEach(status => {
        formattedData[status] = {
          status,
          count: 0,
          totalVolume: 0,
          avgVolume: 0
        };
      });
      
      // Fill in the actual data
      reportData.forEach((item: any) => {
        formattedData[item.status] = item;
      });
      
      // Also get total numbers
      const totals = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalConsignments: { $sum: 1 },
            totalVolume: { $sum: '$volume' },
            avgDeliveryTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', ConsignmentStatus.DELIVERED] },
                  {
                    $divide: [
                      { $subtract: ['$deliveredAt', '$createdAt'] },
                      3600000 // Convert ms to hours
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ]);
      
      reportData = {
        byStatus: formattedData,
        summary: totals.length > 0 ? totals[0] : {
          totalConsignments: 0,
          totalVolume: 0,
          avgDeliveryTime: 0
        }
      };
    }
    
    return NextResponse.json({
      reportData,
      reportType,
      filters: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        sourceOffice,
        destinationOffice
      }
    });
  } catch (error) {
    console.error('Error generating delivery report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 