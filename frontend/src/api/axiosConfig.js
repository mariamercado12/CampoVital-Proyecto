import axios from 'axios';
import { offlineService } from '../services/offlineService';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Interceptor: agregar JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: manejar errores y cache
api.interceptors.response.use(
  (response) => {
    // Cachear automáticamente todas las respuestas GET exitosas
    if (response.config.method === 'get') {
      offlineService.cacheData(response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrosmart_token');
      localStorage.removeItem('agrosmart_user');
      window.location.href = '/login';
    }
    // Fallback offline para GET (Network Error o timeout)
    if ((!error.response || error.code === 'ERR_NETWORK') && error.config.method === 'get') {
      const cached = offlineService.getCachedData(error.config.url);
      if (cached) {
        return Promise.resolve({ data: cached, status: 200, fromCache: true });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
