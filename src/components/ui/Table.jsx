import React from 'react';
import { cn } from './Card';

export function Table({ className, ...props}) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props}) {
  return <thead className={cn("[&_tr]:border-b border-gray-200 ", className)} {...props} />;
}

export function TableBody({ className, ...props}) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props}) {
  return (
    <tr
      className={cn(
        "border-b border-gray-200  transition-colors hover:bg-gray-100/50 :bg-gray-800/50 data-[state=selected]:bg-gray-100 [state=selected]:bg-gray-800",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props}) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-gray-500  [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props}) {
  return (
    <td
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}
