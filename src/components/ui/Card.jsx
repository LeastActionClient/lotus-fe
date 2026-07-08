import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Card({ className, children, ...props}) {
  return (
    <div className={cn("bg-white  rounded-xl border border-gray-200  shadow-sm overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props}) {
  return (
    <div className={cn("px-6 py-5 border-b border-gray-200  flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props}) {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900  leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props}) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}
