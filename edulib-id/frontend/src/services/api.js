import axios from 'axios';

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return 'http://localhost:3001/api/v1';

  const { protocol, hostname } = window.location;
  if (protocol === 'https:') return '/api/v1';
  return `${protocol}//${hostname}:3001/api/v1`;
}

const baseURL = resolveApiBaseUrl();
export const USE_BACKEND = import.meta.env.VITE_USE_BACKEND !== 'false';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    error.message = message;
    console.error('[api]', error.config?.method?.toUpperCase(), error.config?.url, '-', message);
    return Promise.reject(error);
  }
);
