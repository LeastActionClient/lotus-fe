import React from 'react';
import { cn } from './Card';
import { Loader } from 'lucide-react';

export const Spinner = ({ className, size = 24 }) => (
  <Loader className={cn('animate-spin text-orange-600', className)} size={size} />
);

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Spinner size={36} />
    <p className="text-gray-500 text-sm">{text}</p>
  </div>
);
