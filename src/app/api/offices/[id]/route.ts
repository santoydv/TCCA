import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Office, { OfficeType } from '@/models/Office';
import { Types } from 'mongoose';

// GET office by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid office ID' },
        { status: 400 }
      );
    }
    
    const office = await Office.findById(id);
    
    if (!office) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(office);
  } catch (error) {
    console.error('Error fetching office:', error);
    return NextResponse.json(
      { error: 'Failed to fetch office' },
      { status: 500 }
    );
  }
}

// PATCH - update office
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid office ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const office = await Office.findById(id);
    
    if (!office) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }
    
    // If trying to change a head office to branch office, ensure there's another head office
    if (office.type === OfficeType.HEAD_OFFICE && data.type === OfficeType.BRANCH_OFFICE) {
      const otherHeadOffice = await Office.findOne({ 
        type: OfficeType.HEAD_OFFICE,
        _id: { $ne: office._id }
      });
      
      if (!otherHeadOffice) {
        return NextResponse.json(
          { error: 'Cannot change the only head office to a branch office. Create another head office first.' },
          { status: 400 }
        );
      }
    }
    
    // Update fields
    if (data.name) office.name = data.name;
    if (data.type) office.type = data.type;
    if (data.phoneNumber) office.phoneNumber = data.phoneNumber;
    if (data.email) office.email = data.email;
    
    if (data.address) {
      if (data.address.street) office.address.street = data.address.street;
      if (data.address.city) office.address.city = data.address.city;
      if (data.address.state) office.address.state = data.address.state;
      if (data.address.country) office.address.country = data.address.country;
      if (data.address.postalCode) office.address.postalCode = data.address.postalCode;
    }
    
    await office.save();
    
    return NextResponse.json(office);
  } catch (error) {
    console.error('Error updating office:', error);
    return NextResponse.json(
      { error: 'Failed to update office' },
      { status: 500 }
    );
  }
}

// DELETE office
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid office ID' },
        { status: 400 }
      );
    }
    
    const office = await Office.findById(id);
    
    if (!office) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }
    
    // Don't allow deletion of head office if it's the only one
    if (office.type === OfficeType.HEAD_OFFICE) {
      const headOfficeCount = await Office.countDocuments({ type: OfficeType.HEAD_OFFICE });
      
      if (headOfficeCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only head office' },
          { status: 400 }
        );
      }
    }
    
    // Check for trucks, consignments, and employees associated with this office
    // This would require additional checks with the related services
    // For simplicity, we're not implementing that here
    
    await office.deleteOne();
    
    return NextResponse.json({ success: true, message: 'Office deleted successfully' });
  } catch (error) {
    console.error('Error deleting office:', error);
    return NextResponse.json(
      { error: 'Failed to delete office' },
      { status: 500 }
    );
  }
} 