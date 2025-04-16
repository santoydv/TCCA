import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TruckAllocation, { AllocationStatus } from '@/models/TruckAllocation';
import Truck, { TruckStatus } from '@/models/Truck';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { Types } from 'mongoose';

// GET all allocations
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sourceOffice = searchParams.get('sourceOffice');
    const destinationOffice = searchParams.get('destinationOffice');
    const truck = searchParams.get('truck');
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (sourceOffice) {
      query.sourceOffice = new Types.ObjectId(sourceOffice);
    }
    
    if (destinationOffice) {
      query.destinationOffice = new Types.ObjectId(destinationOffice);
    }
    
    if (truck) {
      query.truck = new Types.ObjectId(truck);
    }
    
    const allocations = await TruckAllocation.find(query)
      .sort({ startDate: -1 })
      .populate('truck')
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('consignments');
    
    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

// POST - create a new allocation
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.truck || !data.sourceOffice || !data.destinationOffice || !data.consignments) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if truck is available
    const truck = await Truck.findById(data.truck);
    
    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      );
    }
    
    if (truck.status !== TruckStatus.AVAILABLE) {
      return NextResponse.json(
        { error: `Truck is not available, current status: ${truck.status}` },
        { status: 400 }
      );
    }
    
    // Validate consignments
    const consignmentIds = Array.isArray(data.consignments) 
      ? data.consignments.map((id: string) => new Types.ObjectId(id))
      : [new Types.ObjectId(data.consignments)];
    
    const consignments = await Consignment.find({
      _id: { $in: consignmentIds },
      sourceOffice: new Types.ObjectId(data.sourceOffice),
      destinationOffice: new Types.ObjectId(data.destinationOffice),
      status: { $in: [ConsignmentStatus.RECEIVED, ConsignmentStatus.WAITING] },
    });
    
    if (consignments.length === 0) {
      return NextResponse.json(
        { error: 'No valid consignments found for allocation' },
        { status: 400 }
      );
    }
    
    // Calculate total volume
    const totalVolume = consignments.reduce((sum, consignment) => sum + consignment.volume, 0);
    
    // Check if volume exceeds truck capacity
    if (totalVolume > truck.capacity) {
      return NextResponse.json(
        { error: `Total volume (${totalVolume}) exceeds truck capacity (${truck.capacity})` },
        { status: 400 }
      );
    }
    
    // Update truck status
    truck.status = TruckStatus.LOADING;
    await truck.save();
    
    // Create allocation
    const allocation = await TruckAllocation.create({
      truck: truck._id,
      sourceOffice: new Types.ObjectId(data.sourceOffice),
      destinationOffice: new Types.ObjectId(data.destinationOffice),
      startDate: new Date(),
      endDate: null,
      consignments: consignments.map(c => c._id),
      totalVolume,
      status: AllocationStatus.PLANNED,
      idleTime: 0,
      waitingTime: data.waitingTime || 0,
      notes: data.notes || '',
    });
    
    // Update consignments
    await Consignment.updateMany(
      { _id: { $in: consignments.map(c => c._id) } },
      { 
        status: ConsignmentStatus.WAITING,
        truck: truck._id,
      }
    );
    
    // Return populated allocation
    const populatedAllocation = await TruckAllocation.findById(allocation._id)
      .populate('truck')
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('consignments');
    
    return NextResponse.json(populatedAllocation, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
} 