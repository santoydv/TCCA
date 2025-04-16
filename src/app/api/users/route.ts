import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { Types } from 'mongoose';
import { hash } from 'bcrypt';

// GET all users
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // For security, this endpoint should be limited to admins
    const session = await getServerSession();
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const office = searchParams.get('office');
    
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (office) {
      query.office = new Types.ObjectId(office);
    }
    
    const users = await User.find(query)
      .select('-password') // Exclude password from results
      .sort({ name: 1 })
      .populate('office');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - create a new user
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // For security, this endpoint should be limited to admins
    const session = await getServerSession();
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role || !data.office) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(data.password, 10);
    
    // Create the user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      office: new Types.ObjectId(data.office),
    });
    
    // Return user data without password
    const { password, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 