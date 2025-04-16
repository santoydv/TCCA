import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import authOptions from './auth-options';
import { UserRole } from '@/types';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function hasRole(role: UserRole | UserRole[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
}

export function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const isAuthed = await isAuthenticated();
    
    if (!isAuthed) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(req);
  };
}

export function withRole(handler: Function, role: UserRole | UserRole[]) {
  return async (req: NextRequest) => {
    const hasRequiredRole = await hasRole(role);
    
    if (!hasRequiredRole) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    return handler(req);
  };
}

export function canAccessManager(userRole: UserRole) {
  return [UserRole.ADMIN, UserRole.MANAGER].includes(userRole);
}

export function canAccessAdmin(userRole: UserRole) {
  return userRole === UserRole.ADMIN;
} 