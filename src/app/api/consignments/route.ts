import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { createConsignment, checkAndAllocateTruck } from '@/lib/services/consignment-service';
import { Types } from 'mongoose';

// GET all consignments
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sourceOffice = searchParams.get('sourceOffice');
    const destinationOffice = searchParams.get('destinationOffice');
    
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
    
    const consignments = await Consignment.find(query)
      .sort({ receivedDate: -1 })
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('truck');
    
    return NextResponse.json(consignments);
  } catch (error) {
    console.error('Error fetching consignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consignments' },
      { status: 500 }
    );
  }
}

// POST - create a new consignment
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.volume || !data.sender || !data.receiver || !data.sourceOffice || !data.destinationOffice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the consignment
    const consignment = await createConsignment({
      volume: Number(data.volume),
      sender: {
        name: data.sender.name,
        address: data.sender.address,
        contact: data.sender.contact,
      },
      receiver: {
        name: data.receiver.name,
        address: data.receiver.address,
        contact: data.receiver.contact,
      },
      sourceOffice: new Types.ObjectId(data.sourceOffice),
      destinationOffice: new Types.ObjectId(data.destinationOffice),
      receivedDate: new Date(),
    });
    
    return NextResponse.json(consignment, { status: 201 });
  } catch (error) {
    console.error('Error creating consignment:', error);
    return NextResponse.json(
      { error: 'Failed to create consignment' },
      { status: 500 }
    );
  }
} 