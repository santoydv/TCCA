import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { UserRole } from '@/models/User';
import { Types } from 'mongoose';

// GET consignment report data
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
    const office = searchParams.get('office');
    const groupBy = searchParams.get('groupBy') || 'status';
    
    // Date range filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.receivedDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (!dateFilter.receivedDate) dateFilter.receivedDate = {};
      dateFilter.receivedDate.$lte = new Date(endDate);
    }
    
    // Office filter
    if (office) {
      if (groupBy === 'source') {
        dateFilter.sourceOffice = new Types.ObjectId(office);
      } else if (groupBy === 'destination') {
        dateFilter.destinationOffice = new Types.ObjectId(office);
      } else {
        // If grouping by status, allow filtering by either source or destination
        dateFilter.$or = [
          { sourceOffice: new Types.ObjectId(office) },
          { destinationOffice: new Types.ObjectId(office) }
        ];
      }
    }
    
    // Get the report data based on groupBy parameter
    let reportData;
    
    if (groupBy === 'status') {
      // Group by status
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalVolume: { $sum: '$volume' },
            totalCharge: { $sum: '$charge' }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            totalVolume: 1,
            totalCharge: 1,
            _id: 0
          }
        }
      ]);
      
      // Format the results as a map with status as key
      const formattedData: Record<string, any> = {};
      
      // Initialize with all statuses, even if no data
      Object.values(ConsignmentStatus).forEach(status => {
        formattedData[status] = {
          count: 0,
          totalVolume: 0,
          totalCharge: 0
        };
      });
      
      // Fill in the actual data
      reportData.forEach((item: any) => {
        formattedData[item.status] = item;
      });
      
      reportData = formattedData;
    } else if (groupBy === 'source' || groupBy === 'destination') {
      // Group by source or destination office
      const groupField = groupBy === 'source' ? '$sourceOffice' : '$destinationOffice';
      
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupField,
            count: { $sum: 1 },
            totalVolume: { $sum: '$volume' },
            totalCharge: { $sum: '$charge' },
            delivered: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.DELIVERED] }, 1, 0]
              }
            },
            inTransit: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.IN_TRANSIT] }, 1, 0]
              }
            },
            waiting: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.WAITING] }, 1, 0]
              }
            },
            received: {
              $sum: {
                $cond: [{ $eq: ['$status', ConsignmentStatus.RECEIVED] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'offices',
            localField: '_id',
            foreignField: '_id',
            as: 'office'
          }
        },
        { $unwind: '$office' },
        {
          $project: {
            officeName: '$office.name',
            count: 1,
            totalVolume: 1,
            totalCharge: 1,
            delivered: 1,
            inTransit: 1,
            waiting: 1,
            received: 1,
            _id: 0
          }
        }
      ]);
    } else if (groupBy === 'monthly') {
      // Group by month
      reportData = await Consignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              month: { $month: '$receivedDate' },
              year: { $year: '$receivedDate' }
            },
            count: { $sum: 1 },
            totalVolume: { $sum: '$volume' },
            totalCharge: { $sum: '$charge' }
          }
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
            count: 1,
            totalVolume: 1,
            totalCharge: 1,
            _id: 0
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);
    }
    
    return NextResponse.json({
      reportData,
      groupBy,
      filters: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        office
      }
    });
  } catch (error) {
    console.error('Error generating consignment report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 