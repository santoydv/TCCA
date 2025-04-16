import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/models/Trip';
import Truck from '@/models/Truck';
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
    const truckId = searchParams.get('truckId');
    const reportType = searchParams.get('reportType') || 'utilization';
    
    // Build filter based on parameters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.departureDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (!dateFilter.departureDate) dateFilter.departureDate = {};
      dateFilter.departureDate.$lte = new Date(endDate);
    }
    
    if (truckId) {
      dateFilter.truck = new Types.ObjectId(truckId);
    }
    
    let reportData;
    
    if (reportType === 'utilization') {
      // Get truck trip utilization
      reportData = await Trip.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'trucks',
            localField: 'truck',
            foreignField: '_id',
            as: 'truckInfo'
          }
        },
        { $unwind: '$truckInfo' },
        {
          $lookup: {
            from: 'consignments',
            localField: 'consignments',
            foreignField: '_id',
            as: 'consignmentDetails'
          }
        },
        {
          $project: {
            truckId: '$truck',
            registrationNumber: '$truckInfo.registrationNumber',
            capacity: '$truckInfo.capacity',
            departureDate: 1,
            arrivalDate: 1,
            mileage: { $subtract: ['$endMileage', '$startMileage'] },
            consignmentCount: { $size: '$consignments' },
            consignmentVolume: { 
              $sum: '$consignmentDetails.volume'
            },
            volumeUtilization: {
              $cond: {
                if: { $gt: ['$truckInfo.capacity', 0] },
                then: {
                  $multiply: [
                    { $divide: [{ $sum: '$consignmentDetails.volume' }, '$truckInfo.capacity'] },
                    100
                  ]
                },
                else: 0
              }
            },
            fuelUsed: 1,
            tripDuration: { 
              $divide: [
                { $subtract: ['$arrivalDate', '$departureDate'] },
                3600000 // Convert ms to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: '$truckId',
            registrationNumber: { $first: '$registrationNumber' },
            capacity: { $first: '$capacity' },
            tripCount: { $sum: 1 },
            totalMileage: { $sum: '$mileage' },
            totalConsignments: { $sum: '$consignmentCount' },
            totalVolume: { $sum: '$consignmentVolume' },
            avgVolumeUtilization: { $avg: '$volumeUtilization' },
            totalFuelUsed: { $sum: '$fuelUsed' },
            totalTripHours: { $sum: '$tripDuration' },
            trips: { 
              $push: {
                departureDate: '$departureDate',
                arrivalDate: '$arrivalDate',
                mileage: '$mileage',
                consignmentCount: '$consignmentCount',
                volumeUtilization: '$volumeUtilization',
                fuelUsed: '$fuelUsed',
                tripDuration: '$tripDuration'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            truckId: '$_id',
            registrationNumber: 1,
            capacity: 1,
            tripCount: 1,
            totalMileage: 1,
            totalConsignments: 1,
            totalVolume: 1,
            avgVolumeUtilization: 1,
            totalFuelUsed: 1, 
            totalTripHours: 1,
            fuelEfficiency: {
              $cond: {
                if: { $gt: ['$totalMileage', 0] },
                then: { $divide: ['$totalFuelUsed', '$totalMileage'] },
                else: 0
              }
            },
            consignmentsPerTrip: { 
              $divide: ['$totalConsignments', '$tripCount'] 
            },
            trips: 1
          }
        },
        { $sort: { totalMileage: -1 } }
      ]);
      
      // Calculate fleet-wide statistics
      const fleetStats = await Trip.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'trucks',
            localField: 'truck',
            foreignField: '_id',
            as: 'truckInfo'
          }
        },
        { $unwind: '$truckInfo' },
        {
          $lookup: {
            from: 'consignments',
            localField: 'consignments',
            foreignField: '_id',
            as: 'consignmentDetails'
          }
        },
        {
          $project: {
            mileage: { $subtract: ['$endMileage', '$startMileage'] },
            consignmentCount: { $size: '$consignments' },
            consignmentVolume: { $sum: '$consignmentDetails.volume' },
            volumeUtilization: {
              $cond: {
                if: { $gt: ['$truckInfo.capacity', 0] },
                then: {
                  $multiply: [
                    { $divide: [{ $sum: '$consignmentDetails.volume' }, '$truckInfo.capacity'] },
                    100
                  ]
                },
                else: 0
              }
            },
            fuelUsed: 1,
            tripDuration: { 
              $divide: [
                { $subtract: ['$arrivalDate', '$departureDate'] },
                3600000 // Convert ms to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            totalMileage: { $sum: '$mileage' },
            totalConsignments: { $sum: '$consignmentCount' },
            totalVolume: { $sum: '$consignmentVolume' },
            avgVolumeUtilization: { $avg: '$volumeUtilization' },
            totalFuelUsed: { $sum: '$fuelUsed' },
            totalTripHours: { $sum: '$tripDuration' }
          }
        },
        {
          $project: {
            _id: 0,
            totalTrips: 1,
            totalMileage: 1,
            totalConsignments: 1,
            totalVolume: 1,
            avgVolumeUtilization: 1,
            totalFuelUsed: 1,
            totalTripHours: 1,
            avgMileagePerTrip: { $divide: ['$totalMileage', '$totalTrips'] },
            avgConsignmentsPerTrip: { $divide: ['$totalConsignments', '$totalTrips'] },
            overallFuelEfficiency: { $divide: ['$totalFuelUsed', '$totalMileage'] }
          }
        }
      ]);
      
      // Get inactive trucks (no trips in period)
      const allTrucks = await Truck.find({});
      const activeTrucksIds = reportData.map(truck => truck.truckId.toString());
      
      const inactiveTrucks = allTrucks
        .filter(truck => !activeTrucksIds.includes(truck._id.toString()))
        .map(truck => ({
          truckId: truck._id,
          registrationNumber: truck.registrationNumber,
          capacity: truck.capacity,
          status: truck.status,
          tripCount: 0,
          totalMileage: 0,
          totalConsignments: 0,
          totalVolume: 0,
          avgVolumeUtilization: 0
        }));
      
      // Add fleet summary and inactive trucks
      reportData = {
        fleetSummary: fleetStats.length > 0 ? fleetStats[0] : {
          totalTrips: 0,
          totalMileage: 0,
          totalConsignments: 0,
          totalVolume: 0,
          avgVolumeUtilization: 0,
          totalFuelUsed: 0,
          totalTripHours: 0
        },
        activeTrucks: reportData,
        inactiveTrucks: inactiveTrucks
      };
    } else if (reportType === 'maintenance') {
      // Maintenance and breakdown reports
      reportData = await Trip.aggregate([
        { $match: { ...dateFilter, issues: { $exists: true, $ne: [] } } },
        {
          $lookup: {
            from: 'trucks',
            localField: 'truck',
            foreignField: '_id',
            as: 'truckInfo'
          }
        },
        { $unwind: '$truckInfo' },
        {
          $unwind: {
            path: '$issues',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $group: {
            _id: {
              truckId: '$truck',
              issueType: '$issues.type'
            },
            registrationNumber: { $first: '$truckInfo.registrationNumber' },
            issueCount: { $sum: 1 },
            tripCount: { $addToSet: '$_id' },
            issues: {
              $push: {
                date: '$departureDate',
                description: '$issues.description',
                severity: '$issues.severity',
                resolved: '$issues.resolved'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            truckId: '$_id.truckId',
            registrationNumber: 1,
            issueType: '$_id.issueType',
            issueCount: 1,
            affectedTrips: { $size: '$tripCount' },
            issues: 1
          }
        },
        {
          $group: {
            _id: '$truckId',
            registrationNumber: { $first: '$registrationNumber' },
            totalIssues: { $sum: '$issueCount' },
            issuesByType: {
              $push: {
                issueType: '$issueType',
                count: '$issueCount',
                affectedTrips: '$affectedTrips',
                details: '$issues'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            truckId: '$_id',
            registrationNumber: 1,
            totalIssues: 1,
            issuesByType: 1
          }
        },
        { $sort: { totalIssues: -1 } }
      ]);
      
      // Get issue type summary across all trucks
      const issueSummary = await Trip.aggregate([
        { $match: { ...dateFilter, issues: { $exists: true, $ne: [] } } },
        { $unwind: '$issues' },
        {
          $group: {
            _id: '$issues.type',
            count: { $sum: 1 },
            unresolvedCount: {
              $sum: { 
                $cond: [{ $eq: ['$issues.resolved', false] }, 1, 0] 
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            issueType: '$_id',
            count: 1,
            unresolvedCount: 1,
            resolvedCount: { $subtract: ['$count', '$unresolvedCount'] },
            percentResolved: {
              $multiply: [
                { $divide: [
                  { $subtract: ['$count', '$unresolvedCount'] },
                  '$count'
                ]},
                100
              ]
            }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      reportData = {
        truckIssues: reportData,
        issueSummary
      };
    }
    
    return NextResponse.json({
      reportData,
      reportType,
      filters: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        truckId
      }
    });
  } catch (error) {
    console.error('Error generating truck report:', error);
    return NextResponse.json(
      { error: 'Failed to generate truck report' },
      { status: 500 }
    );
  }
} 