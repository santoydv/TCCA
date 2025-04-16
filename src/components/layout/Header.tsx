import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { Button } from '../ui/Button';

type NavItem = {
  label: string;
  href: string;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Consignments', href: '/consignments' },
  { label: 'Trucks', href: '/trucks' },
  { 
    label: 'Offices', 
    href: '/offices',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  { 
    label: 'Reports', 
    href: '/reports',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  { 
    label: 'Users', 
    href: '/users',
    roles: [UserRole.ADMIN],
  },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <header className="bg-white border-b border-primary-200 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-black flex items-center">
              <svg 
                className="h-8 w-8 mr-2 text-primary-700" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
                />
              </svg>
              <span>Transport Co.</span>
            </Link>
            <nav className="ml-10 hidden space-x-1 md:flex">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-primary-700 text-black font-bold'
                        : 'text-black hover:bg-primary-200 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-700 text-black flex items-center justify-center font-bold text-sm mr-2">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-bold text-black hidden sm:inline-block">
                    {session.user?.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="border-primary-700 text-black hover:bg-primary-100"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button variant="default" className="bg-primary-700 hover:bg-primary-800 text-black">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 