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

export const toastError = (message, options = {}) => {
  let displayMessage = message;

  if (typeof displayMessage !== 'string') {
    if (displayMessage && displayMessage.message) {
      displayMessage = displayMessage.message;
    } else {
      displayMessage = 'An unexpected server error occurred. Please try again.';
    }
  }

  const technicalKeywords = [
    'axioserror', 'typeerror', 'mongoerror', 'mongoservererror', 'e11000', 
    'duplicate key', 'cannot read properties', 'undefined', 'null', 
    'internal server error', 'network error', 'stack', 'syntaxerror', 
    'validation failed', 'validationerror', 'cast to objectid', 'cast error',
    'mongodb', 'mongoose', 'server responded with status'
  ];

  const lowerMsg = String(displayMessage).toLowerCase();
  const hasTechnicalKeyword = technicalKeywords.some(keyword => lowerMsg.includes(keyword));

  if (hasTechnicalKeyword) {
    displayMessage = 'Something went wrong on the server. Please check your inputs and try again.';
  }

  return pushToast({ type: 'error', message: displayMessage, ...options });
};

export const toastInfo = (message, options = {}) => pushToast({ type: 'info', message, ...options });
export const toastWarning = (message, options = {}) => pushToast({ type: 'warning', message, ...options });
