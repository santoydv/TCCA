import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { Types } from 'mongoose';
import { hash } from 'bcrypt';

// GET user by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // For security, this endpoint should be limited to admins or the user themselves
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Only admins or the user themselves can access this endpoint
    if (session.user.role !== UserRole.ADMIN && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const user = await User.findById(id).select('-password').populate('office');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - update user
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // For security, this endpoint should be limited to admins or the user themselves
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Only admins or the user themselves can update this user
    if (session.user.role !== UserRole.ADMIN && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Non-admin users can only update name and password
    if (session.user.role !== UserRole.ADMIN) {
      const allowedUpdates = ['name', 'password'];
      Object.keys(data).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete data[key];
        }
      });
    }
    
    // Update fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.password) user.password = await hash(data.password, 10);
    if (data.role && session.user.role === UserRole.ADMIN) user.role = data.role;
    if (data.office && session.user.role === UserRole.ADMIN) user.office = new Types.ObjectId(data.office);
    
    await user.save();
    
    // Return user data without password
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json(userObj);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
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
    
    const id = context.params.id;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of the last admin user
    if (user.role === UserRole.ADMIN) {
      const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
      
      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only admin user' },
          { status: 400 }
        );
      }
    }
    
    await user.deleteOne();
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 