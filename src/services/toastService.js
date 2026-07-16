let toastId = 0;
const listeners = new Set();
const toasts = [];

const emit = () => {
  listeners.forEach((listener) => {
    listener([...toasts]);
  });
};

export const subscribeToasts = (listener) => {
  listeners.add(listener);
  listener([...toasts]);

  return () => {
    listeners.delete(listener);
  };
};

export const dismissToast = (id) => {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    emit();
  }
};

export const clearToasts = () => {
  toasts.length = 0;
  emit();
};

export const pushToast = ({ type = 'info', title = '', message = '', duration = 4000 } = {}) => {
  const id = `toast-${Date.now()}-${++toastId}`;
  toasts.unshift({
    id,
    type,
    title,
    message,
    duration: Number.isFinite(Number(duration)) ? Number(duration) : 4000
  });
  emit();
  return id;
};

export const toastSuccess = (message, options = {}) => pushToast({ type: 'success', message, ...options });
export const toastError = (message, options = {}) => pushToast({ type: 'error', message, ...options });
export const toastInfo = (message, options = {}) => pushToast({ type: 'info', message, ...options });
export const toastWarning = (message, options = {}) => pushToast({ type: 'warning', message, ...options });
