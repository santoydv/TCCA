import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  
  // Check if the user is authenticated
  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/auth/login');
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">{children}</div>
      </main>
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Transport Company Computerization. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 