'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export default function Spinner({ 
  className, 
  size = 'md', 
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent border-solid border-2',
        sizeClasses[size],
        size === 'sm' ? 'border-2' : size === 'md' ? 'border-3' : 'border-4',
        className
      )}
      {...props}
    />
  );
} 