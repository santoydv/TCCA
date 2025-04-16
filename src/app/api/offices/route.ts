import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
// Import models to ensure all models are registered
import '@/models';
import Office from '@/models/Office';

// GET all offices
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const offices = await Office.find({});
    
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
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'address', 'city', 'country', 'postalCode', 'phoneNumber', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `The field '${field}' is required` },
          { status: 400 }
        );
      }
    }
    
    const newOffice = {
      name: body.name,
      address: body.address,
      city: body.city,
      country: body.country,
      postalCode: body.postalCode,
      phoneNumber: body.phoneNumber,
      email: body.email,
      isHeadOffice: body.isHeadOffice || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await connectToDatabase();
    
    // If this is a head office and isHeadOffice is true, update all other offices
    if (newOffice.isHeadOffice) {
      await Office.updateMany(
        { isHeadOffice: true },
        { $set: { isHeadOffice: false } }
      );
    }
    
    const result = await Office.create(newOffice);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating office:', error);
    return NextResponse.json(
      { error: 'Failed to create office' },
      { status: 500 }
    );
  }
} 