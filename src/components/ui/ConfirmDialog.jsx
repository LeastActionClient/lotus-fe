import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from './Card';

const ConfirmContext = createContext(null);

const defaultOptions = {
  title: 'Confirm action',
  description: 'Are you sure you want to continue?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  tone: 'danger',
  list: []
};

const toneStyles = {
  danger: {
    iconWrap: 'bg-red-100 text-red-700',
    header: 'border-red-100',
    title: 'text-gray-900',
    description: 'text-gray-600'
  },
  warning: {
    iconWrap: 'bg-amber-100 text-amber-700',
    header: 'border-amber-100',
    title: 'text-gray-900',
    description: 'text-gray-600'
  },
  primary: {
    iconWrap: 'bg-blue-100 text-blue-700',
    header: 'border-blue-100',
    title: 'text-gray-900',
    description: 'text-gray-600'
  }
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }
  return context.confirm;
};

function ConfirmDialog({ isOpen, options, onConfirm, onCancel }) {
  const theme = toneStyles[options.tone] || toneStyles.danger;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className={cn('flex items-start gap-4 border-b px-5 py-4', theme.header)}>
          <div className={cn('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full', theme.iconWrap)}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <h2 id="confirm-dialog-title" className={cn('text-lg font-semibold', theme.title)}>
              {options.title}
            </h2>
            <p id="confirm-dialog-description" className={cn('mt-1 text-sm leading-6', theme.description)}>
              {options.description}
            </p>
            {Array.isArray(options.list) && options.list.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {options.list.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {options.cancelText}
          </Button>
          <Button
            type="button"
            variant={options.tone === 'primary' ? 'primary' : 'danger'}
            onClick={onConfirm}
          >
            {options.confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    options: defaultOptions
  });
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }

    setState((current) => ({
      ...current,
      isOpen: false
    }));
  }, []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        options: {
          ...defaultOptions,
          ...options
        }
      });
    });
  }, []);

  useEffect(() => () => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={state.isOpen}
        options={state.options}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}
