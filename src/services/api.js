import axios from 'axios';
import { toastError } from './toastService';

// Long-running school operations like bulk import and bulk fee assignment can
// legitimately take longer than the default 30s, especially in production.
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_CACHE_TTL_MS = 20000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 300;

const responseCache = new Map();
const pendingRequests = new Map();
let cacheGeneration = 0;

const stableSerialize = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return '[FormData]';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${key}:${stableSerialize(value[key])}`).join(',')}}`;
  }

  return String(value);
};

const getRequestToken = () => sessionStorage.getItem('token') || '';

const buildRequestKey = (config, token = '') => {
  const method = (config.method || 'get').toLowerCase();
  const url = `${config.baseURL || ''}${config.url || ''}`;
  const params = stableSerialize(config.params || {});
  const data = stableSerialize(config.data || {});

  return `${token}::${method}::${url}::${params}::${data}`;
};

const isRetryableRequest = (config) => {
  const method = (config.method || 'get').toLowerCase();
  return ['get', 'head', 'options'].includes(method);
};

const isCacheableRequest = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const responseType = config.responseType || 'json';
  return method === 'get' && config.cache !== false && responseType === 'json';
};

const getCacheTTL = (config) => {
  const ttl = Number(config.cacheTTL);
  return Number.isFinite(ttl) && ttl >= 0 ? ttl : DEFAULT_CACHE_TTL_MS;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const cloneResponse = (response) => {
  const data = typeof structuredClone === 'function'
    ? structuredClone(response.data)
    : response.data;

  return {
    ...response,
    data
  };
};

const clearApiCache = () => {
  cacheGeneration += 1;
  responseCache.clear();
  pendingRequests.clear();
};

const pruneExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: DEFAULT_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = getRequestToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.debug('[API request]', config.method?.toUpperCase() || 'GET', config.url);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug('[API response]', response.config.method?.toUpperCase() || 'GET', response.config.url, response.status);
    }

    return response;
  },
  async (error) => {
    const config = error.config || {};

    if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
      return Promise.reject(error);
    }

    const isLoginRequest = config?.url?.includes('/auth/login');
    const responseMessage = error.response?.data?.message || error.response?.data?.error;
    const shouldRetry = isRetryableRequest(config) && config.__retryCount < MAX_RETRIES && (error.response?.status >= 500 || !error.response);

    if (shouldRetry) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      await sleep(RETRY_DELAY_MS);
      return api.request(config);
    }

    if (error.response?.status === 401 && !isLoginRequest) {
      clearApiCache();
      toastError('Session expired. Please sign in again.');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (!config.skipToast) {
      if (responseMessage) {
        toastError(responseMessage);
      } else if (!error.response) {
        toastError('Network error. Please check your connection.');
      }
    }

    return Promise.reject(error);
  }
);

const originalRequest = api.request.bind(api);

const requestWithPolicy = async (config = {}) => {
  const normalizedConfig = { ...config };
  const method = (normalizedConfig.method || 'get').toLowerCase();
  normalizedConfig.method = method;
  normalizedConfig.__retryCount = normalizedConfig.__retryCount || 0;
  const requestGeneration = cacheGeneration;

  const cacheable = isCacheableRequest(normalizedConfig);
  const token = getRequestToken();
  const requestKey = cacheable ? buildRequestKey(normalizedConfig, token) : null;

  if (cacheable) {
    pruneExpiredCache();

    const cachedEntry = responseCache.get(requestKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return Promise.resolve(cloneResponse(cachedEntry.response));
    }

    const pending = pendingRequests.get(requestKey);
    if (pending) {
      return pending;
    }
  }

  const requestPromise = originalRequest(normalizedConfig)
    .then((response) => {
      if (cacheable && requestGeneration === cacheGeneration) {
        responseCache.set(requestKey, {
          response: cloneResponse(response),
          expiresAt: Date.now() + getCacheTTL(normalizedConfig)
        });
      } else if (!['get', 'head', 'options'].includes(method)) {
        clearApiCache();
      }

      return response;
    })
    .finally(() => {
      if (cacheable && requestKey && requestGeneration === cacheGeneration) {
        pendingRequests.delete(requestKey);
      }
    });

  if (cacheable && requestKey) {
    pendingRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
};

api.request = requestWithPolicy;
api.get = (url, config = {}) => requestWithPolicy({ ...config, method: 'get', url });
api.post = (url, data, config = {}) => requestWithPolicy({ ...config, method: 'post', url, data });
api.put = (url, data, config = {}) => requestWithPolicy({ ...config, method: 'put', url, data });
api.patch = (url, data, config = {}) => requestWithPolicy({ ...config, method: 'patch', url, data });
api.delete = (url, config = {}) => requestWithPolicy({ ...config, method: 'delete', url });
api.clearCache = clearApiCache;
api.invalidateCache = (matcher) => {
  if (!matcher) {
    clearApiCache();
    return;
  }

  for (const key of responseCache.keys()) {
    const shouldDelete =
      (typeof matcher === 'string' && key.includes(matcher)) ||
      (matcher instanceof RegExp && matcher.test(key)) ||
      (typeof matcher === 'function' && matcher(key));

    if (shouldDelete) {
      responseCache.delete(key);
    }
  }
};

export default api;
