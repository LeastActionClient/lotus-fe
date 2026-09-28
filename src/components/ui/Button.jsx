import React from 'react';
import { cn } from './Card';
import { Spinner } from './Spinner';



export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', loading = false, loadingText, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-600 shadow-sm",
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

    const isDisabled = disabled || loading;
    const content = loading
      ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner size={16} className="text-current" />
          <span>{loadingText || children}</span>
        </span>
      )
      : children;

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
