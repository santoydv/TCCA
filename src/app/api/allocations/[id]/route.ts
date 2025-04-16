import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TruckAllocation, { AllocationStatus } from '@/models/TruckAllocation';
import Truck, { TruckStatus } from '@/models/Truck';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { Types } from 'mongoose';

// Define necessary types for the populated documents
interface PopulatedConsignment {
  _id: Types.ObjectId;
  status: ConsignmentStatus;
}

interface PopulatedTruck {
  _id: Types.ObjectId;
  status: TruckStatus;
}

// GET allocation by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid allocation ID' },
        { status: 400 }
      ); 
    }
    
    const allocation = await TruckAllocation.findById(id)
      .populate('truck')
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('consignments');
    
    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error fetching allocation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocation' },
      { status: 500 }
    );
  }
}

// PATCH - update allocation status (dispatch, complete, etc.)
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid allocation ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const allocation = await TruckAllocation.findById(id)
      .populate<{ truck: PopulatedTruck, consignments: PopulatedConsignment[] }>('truck consignments');
    
    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }
    
    // Special handling for status transitions
    if (data.status) {
      // Dispatch truck (PLANNED -> IN_PROGRESS)
      if (data.status === AllocationStatus.IN_PROGRESS && allocation.status === AllocationStatus.PLANNED) {
        // Update truck status
        await Truck.findByIdAndUpdate(allocation.truck._id, {
          status: TruckStatus.IN_TRANSIT
        });
        
        // Get consignment IDs and handle TypeScript typing
        const consignmentIds = allocation.consignments.map((c: PopulatedConsignment) => c._id);
        
        // Update all consignments
        await Consignment.updateMany(
          { _id: { $in: consignmentIds } },
          { 
            status: ConsignmentStatus.IN_TRANSIT,
            dispatchDate: new Date()
          }
        );
        
        allocation.status = AllocationStatus.IN_PROGRESS;
      }
      
      // Complete delivery (IN_PROGRESS -> COMPLETED)
      else if (data.status === AllocationStatus.COMPLETED && allocation.status === AllocationStatus.IN_PROGRESS) {
        // Update truck status and location
        await Truck.findByIdAndUpdate(allocation.truck._id, {
          status: TruckStatus.AVAILABLE,
          currentOffice: allocation.destinationOffice
        });
        
        // Get consignment IDs and handle TypeScript typing
        const consignmentIds = allocation.consignments.map((c: PopulatedConsignment) => c._id);
        
        // Update all consignments
        await Consignment.updateMany(
          { _id: { $in: consignmentIds } },
          { 
            status: ConsignmentStatus.DELIVERED,
            deliveryDate: new Date()
          }
        );
        
        allocation.status = AllocationStatus.COMPLETED;
        allocation.endDate = new Date();
      }
      
      // Cancel allocation (PLANNED -> CANCELLED)
      else if (data.status === AllocationStatus.CANCELLED && allocation.status === AllocationStatus.PLANNED) {
        // Update truck status
        await Truck.findByIdAndUpdate(allocation.truck._id, {
          status: TruckStatus.AVAILABLE
        });
        
        // Get consignment IDs and handle TypeScript typing
        const consignmentIds = allocation.consignments.map((c: PopulatedConsignment) => c._id);
        
        // Update all consignments to revert them back to RECEIVED
        await Consignment.updateMany(
          { _id: { $in: consignmentIds } },
          { 
            status: ConsignmentStatus.RECEIVED,
            truck: null
          }
        );
        
        allocation.status = AllocationStatus.CANCELLED;
      }
      else {
        return NextResponse.json(
          { error: `Invalid status transition from ${allocation.status} to ${data.status}` },
          { status: 400 }
        );
      }
    }
    
    // Update other fields
    if (data.notes !== undefined) allocation.notes = data.notes;
    if (data.idleTime !== undefined) allocation.idleTime = data.idleTime;
    if (data.waitingTime !== undefined) allocation.waitingTime = data.waitingTime;
    
    await allocation.save();
    
    // Return updated allocation with populated references
    const updatedAllocation = await TruckAllocation.findById(id)
      .populate('truck')
      .populate('sourceOffice')
      .populate('destinationOffice')
      .populate('consignments');
    
    return NextResponse.json(updatedAllocation);
  } catch (error) {
    console.error('Error updating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update allocation' },
      { status: 500 }
    );
  }
}

// DELETE allocation (only allowed for PLANNED allocations)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid allocation ID' },
        { status: 400 }
      );
    }
    
    const allocation = await TruckAllocation.findById(id);
    
    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }
    
    // Only planned allocations can be deleted
    if (allocation.status !== AllocationStatus.PLANNED) {
      return NextResponse.json(
        { error: 'Only planned allocations can be deleted' },
        { status: 400 }
      );
    }
    
    // Update truck status
    await Truck.findByIdAndUpdate(allocation.truck, {
      status: TruckStatus.AVAILABLE
    });
    
    // Update consignments
    await Consignment.updateMany(
      { _id: { $in: allocation.consignments } },
      { 
        status: ConsignmentStatus.RECEIVED,
        truck: null
      }
    );
    
    // Delete the allocation
    await allocation.deleteOne();
    
    return NextResponse.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    return NextResponse.json(
      { error: 'Failed to delete allocation' },
      { status: 500 }
    );
  }
} 