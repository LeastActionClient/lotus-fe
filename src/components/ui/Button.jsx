import React, { ButtonHTMLAttributes } from 'react';
import { cn } from './Card';



export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-orange-600 text-white hover:bg-orange-600 shadow-sm",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200   :bg-gray-700",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-100   :bg-gray-800",
      ghost: "hover:bg-gray-100 :bg-gray-800 text-gray-700 ",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
