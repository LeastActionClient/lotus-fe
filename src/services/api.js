import axios from 'axios';
import { toastError } from './toastService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const responseMessage = error.response?.data?.message || error.response?.data?.error;

    if (error.response?.status === 401 && !isLoginRequest) {
      toastError('Session expired. Please sign in again.');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (responseMessage) {
      toastError(responseMessage);
    } else if (!error.response) {
      toastError('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
