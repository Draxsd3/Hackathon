import axios from 'axios';

/**
 * Cliente HTTP para o backend Express.
 *
 * No MVP nao e usado diretamente pelas paginas - todos os services rodam
 * sobre `utils/storage.js` (localStorage). Quando for hora de migrar,
 * basta alterar os services para usar este cliente.
 */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
export const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error('[api]', error.config?.method?.toUpperCase(), error.config?.url, '-', message);
    return Promise.reject(error);
  }
);
