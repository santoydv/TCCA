import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
// Import models to ensure all models are registered
import '@/models';
import Office from '@/models/Office';

// GET all offices
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    
    const query: any = {};
    
    if (city) {
      query.city = city;
    }
    
    if (state) {
      query.state = state;
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
    if (!data.name || !data.address || !data.city || !data.state || !data.zipCode || !data.phone || !data.email) {
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
    
    // Create the office
    const office = await Office.create({
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
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