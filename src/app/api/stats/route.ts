import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
// Import models to ensure all models are registered
import '@/models';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import Truck, { TruckStatus } from '@/models/Truck';
import TruckAllocation, { AllocationStatus } from '@/models/TruckAllocation';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Count pending consignments
    const pendingConsignments = await Consignment.countDocuments({
      status: { $in: [ConsignmentStatus.RECEIVED, ConsignmentStatus.WAITING] }
    });
    
    // Count available trucks
    const availableTrucks = await Truck.countDocuments({
      status: TruckStatus.AVAILABLE
    });
    
    // Count trucks in transit
    const inTransitTrucks = await Truck.countDocuments({
      status: TruckStatus.IN_TRANSIT
    });
    
    // Calculate average waiting time for consignments
    const consignments = await Consignment.find({
      status: { $in: [ConsignmentStatus.DELIVERED, ConsignmentStatus.IN_TRANSIT] },
      receivedDate: { $exists: true },
      dispatchDate: { $exists: true }
    });
    
    let totalWaitingTime = 0;
    for (const consignment of consignments) {
      if (consignment.receivedDate && consignment.dispatchDate) {
        const waitingTime = Math.floor(
          (consignment.dispatchDate.getTime() - consignment.receivedDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        totalWaitingTime += waitingTime;
      }
    }
    
    const avgWaitingTime = consignments.length > 0 
      ? (totalWaitingTime / consignments.length).toFixed(1) 
      : 0;
    
    // Get recent consignments
    const recentConsignments = await Consignment.find()
      .sort({ receivedDate: -1 })
      .limit(5)
      .populate('sourceOffice')
      .populate('destinationOffice');
    
    // Get recent truck allocations
    const recentAllocations = await TruckAllocation.find()
      .sort({ startDate: -1 })
      .limit(5)
      .populate('truck')
      .populate('sourceOffice')
      .populate('destinationOffice');
    
    return NextResponse.json({
      stats: {
        pendingConsignments,
        availableTrucks,
        inTransitTrucks,
        avgWaitingTime,
      },
      recentConsignments,
      recentAllocations
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 