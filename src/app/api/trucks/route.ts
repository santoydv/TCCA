import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Truck, { TruckStatus } from '@/models/Truck';
import { Types } from 'mongoose';

// GET all trucks
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const office = searchParams.get('office');
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (office) {
      query.currentOffice = new Types.ObjectId(office);
    }
    
    const trucks = await Truck.find(query)
      .sort({ registrationNumber: 1 })
      .populate('currentOffice');
    
    return NextResponse.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trucks' },
      { status: 500 }
    );
  }
}

// POST - create a new truck
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.registrationNumber || !data.truckModel || !data.capacity || !data.manufactureYear || !data.currentOffice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if truck with the same registration number already exists
    const existingTruck = await Truck.findOne({ registrationNumber: data.registrationNumber });
    
    if (existingTruck) {
      return NextResponse.json(
        { error: 'Truck with this registration number already exists' },
        { status: 400 }
      );
    }
    
    // Create the truck
    const truck = await Truck.create({
      registrationNumber: data.registrationNumber,
      truckModel: data.truckModel,
      capacity: Number(data.capacity),
      manufactureYear: Number(data.manufactureYear),
      currentOffice: new Types.ObjectId(data.currentOffice),
      status: data.status || TruckStatus.AVAILABLE,
      lastMaintenance: data.lastMaintenance || new Date(),
    });
    
    return NextResponse.json(truck, { status: 201 });
  } catch (error) {
    console.error('Error creating truck:', error);
    return NextResponse.json(
      { error: 'Failed to create truck' },
      { status: 500 }
    );
  }
} 