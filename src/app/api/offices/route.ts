import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Office, { OfficeType } from '@/models/Office';

// GET all offices
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    const offices = await Office.find(query).sort({ name: 1 });
    
    return NextResponse.json(offices);
  } catch (error) {
    console.error('Error fetching offices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offices' },
      { status: 500 }
    );
  }
}

// POST - create a new office
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.type || !data.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if office with the same name already exists
    const existingOffice = await Office.findOne({ name: data.name });
    
    if (existingOffice) {
      return NextResponse.json(
        { error: 'Office with this name already exists' },
        { status: 400 }
      );
    }
    
    // If this is set to be a head office, check if one already exists
    if (data.type === OfficeType.HEAD_OFFICE) {
      const existingHeadOffice = await Office.findOne({ type: OfficeType.HEAD_OFFICE });
      
      if (existingHeadOffice) {
        return NextResponse.json(
          { error: 'A head office already exists. There can be only one head office.' },
          { status: 400 }
        );
      }
    }
    
    // Create the office
    const office = await Office.create({
      name: data.name,
      type: data.type,
      address: {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        country: data.address.country,
        postalCode: data.address.postalCode,
      },
      phoneNumber: data.phoneNumber,
      email: data.email,
    });
    
    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    console.error('Error creating office:', error);
    return NextResponse.json(
      { error: 'Failed to create office' },
      { status: 500 }
    );
  }
} 