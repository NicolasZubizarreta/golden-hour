import axios from 'axios';

const fallbackApiUrl = 'http://localhost:3000/api';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = config.headers.Authorization || `Bearer ${token}`;
  }

  return config;
});

export const getApiErrorMessage = (error, fallbackMessage = 'Erreur de communication avec le serveur.') => {
  if (typeof error?.response?.data?.message === 'string' && error.response.data.message.trim()) {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

export default api;
