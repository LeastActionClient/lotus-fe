import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { dismissToast, subscribeToasts } from '../../services/toastService';

const typeStyles = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    accent: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-950',
    accent: 'bg-red-500',
    icon: <AlertCircle className="h-5 w-5 text-red-600" />
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-950',
    accent: 'bg-amber-500',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />
  },
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-950',
    accent: 'bg-sky-500',
    icon: <Info className="h-5 w-5 text-sky-600" />
  }
};

export function ToastViewport() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToasts(setToasts);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration === Infinity || timersRef.current.has(toast.id)) {
        return;
      }

      const timer = window.setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);

      timersRef.current.set(toast.id, timer);
    });

    const activeIds = new Set(toasts.map((toast) => toast.id));
    timersRef.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
        window.clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });
  }, [toasts]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:w-full">
      {toasts.map((toast, index) => {
        const styles = typeStyles[toast.type] || typeStyles.info;

        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm ${styles.wrapper} animate-in slide-in-from-right-4 fade-in duration-200`}
            style={{ animationDelay: `${index * 40}ms` }}
            role="status"
            aria-live="polite"
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />
            <div className="flex items-start gap-3 px-4 py-3 pl-5">
              <div className="mt-0.5 shrink-0">{styles.icon}</div>
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="text-sm font-semibold leading-5">{toast.title}</p>
                )}
                {toast.message && (
                  <p className="mt-0.5 text-sm leading-5 text-inherit/90 break-words whitespace-pre-wrap">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="ml-2 rounded-md p-1 text-inherit/70 transition-colors hover:bg-black/5 hover:text-inherit"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
