import React, { InputHTMLAttributes } from 'react';
import { cn } from './Card';



export const Input = React.forwardRef(
  ({ className, type, onWheel, ...props }, ref) => {
    const handleWheel = (e) => {
      if (type === 'number') {
        e.target.blur();
      }
      if (onWheel) {
        onWheel(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:cursor-not-allowed disabled:opacity-50    :text-gray-500",
          className
        )}
        ref={ref}
        onWheel={handleWheel}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
