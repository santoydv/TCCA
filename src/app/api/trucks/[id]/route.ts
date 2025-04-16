import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Truck from '@/models/Truck';
import { Types } from 'mongoose';

// GET truck by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid truck ID' },
        { status: 400 }
      );
    }
    
    const truck = await Truck.findById(id).populate('currentOffice');
    
    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(truck);
  } catch (error) {
    console.error('Error fetching truck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch truck' },
      { status: 500 }
    );
  }
}

// PATCH - update truck
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid truck ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const allowedUpdates = ['status', 'currentOffice', 'lastMaintenance'];
    
    const updates: any = {};
    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = key === 'currentOffice' ? new Types.ObjectId(data[key]) : data[key];
      }
    });
    
    const truck = await Truck.findByIdAndUpdate(id, updates, { new: true })
      .populate('currentOffice');
    
    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(truck);
  } catch (error) {
    console.error('Error updating truck:', error);
    return NextResponse.json(
      { error: 'Failed to update truck' },
      { status: 500 }
    );
  }
}

// DELETE truck
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid truck ID' },
        { status: 400 }
      );
    }
    
    // Check if the truck is in use in any active consignments or allocations
    // This would require additional checks with the ConsignmentService
    // For simplicity, we're not implementing that here
    
    const truck = await Truck.findByIdAndDelete(id);
    
    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Truck deleted successfully' });
  } catch (error) {
    console.error('Error deleting truck:', error);
    return NextResponse.json(
      { error: 'Failed to delete truck' },
      { status: 500 }
    );
  }
} 