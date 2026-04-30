import axios from 'axios';
import { offlineService } from '../services/offlineService';

// Auth en puerto 8081, Agro en puerto 8082 (Tomcat embebido)
const AUTH_BASE = 'http://localhost:8081/api';
const AGRO_BASE = 'http://localhost:8082/api';

const api = axios.create({
  timeout: 15000,
});

// Interceptor: agregar JWT a cada request
api.interceptors.request.use((config) => {
  // Asignar el base URL correcto según el endpoint
  if (config.url.startsWith('/auth') || config.url.startsWith('auth')) {
    config.baseURL = AUTH_BASE;
  } else {
    config.baseURL = AGRO_BASE;
  }

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
