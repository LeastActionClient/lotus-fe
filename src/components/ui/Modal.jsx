import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './Card';



export function Modal({isOpen, onClose, title, children, className }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={cn("bg-white  rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200  animate-in fade-in zoom-in-95 duration-200", className)}
        role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
          <h2 className="text-lg font-semibold text-gray-900 ">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 :bg-gray-800  transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
