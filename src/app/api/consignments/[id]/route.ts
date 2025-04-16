import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
// Import models to ensure all models are registered
import '@/models';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { Types } from 'mongoose';

// GET consignment by ID
export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid consignment ID' },
        { status: 400 }
      );
    }
    
    const consignment = await Consignment.findById(id)
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('truck');
    
    if (!consignment) {
      return NextResponse.json(
        { error: 'Consignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(consignment);
  } catch (error) {
    console.error('Error fetching consignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consignment' },
      { status: 500 }
    );
  }
}

// PATCH - update consignment
export async function PATCH(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid consignment ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const allowedUpdates = ['status', 'truck', 'dispatchDate', 'deliveryDate'];
    
    // Define the updates object with proper TypeScript interface
    interface Updates {
      status?: ConsignmentStatus;
      truck?: string;
      dispatchDate?: Date;
      deliveryDate?: Date;
      [key: string]: any;
    }
    
    const updates: Updates = {};
    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = data[key];
      }
    });
    
    // Update with additional validation
    if (updates.status === ConsignmentStatus.IN_TRANSIT && !updates.dispatchDate) {
      updates.dispatchDate = new Date();
    }
    
    if (updates.status === ConsignmentStatus.DELIVERED && !updates.deliveryDate) {
      updates.deliveryDate = new Date();
    }
    
    const consignment = await Consignment.findByIdAndUpdate(id, updates, { new: true })
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('truck');
    
    if (!consignment) {
      return NextResponse.json(
        { error: 'Consignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(consignment);
  } catch (error) {
    console.error('Error updating consignment:', error);
    return NextResponse.json(
      { error: 'Failed to update consignment' },
      { status: 500 }
    );
  }
}

// DELETE consignment
export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid consignment ID' },
        { status: 400 }
      );
    }
    
    const consignment = await Consignment.findById(id);
    
    if (!consignment) {
      return NextResponse.json(
        { error: 'Consignment not found' },
        { status: 404 }
      );
    }
    
    // Only allow deletion of consignments that haven't been dispatched yet
    if (consignment.status !== ConsignmentStatus.RECEIVED && consignment.status !== ConsignmentStatus.WAITING) {
      return NextResponse.json(
        { error: 'Cannot delete consignments that have been dispatched or delivered' },
        { status: 400 }
      );
    }
    
    await consignment.deleteOne();
    
    return NextResponse.json({ success: true, message: 'Consignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting consignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete consignment' },
      { status: 500 }
    );
  }
} 