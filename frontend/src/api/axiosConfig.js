import axios from 'axios';

const fallbackApiUrl = 'http://localhost:3000/api';
const axiosStatusMessagePattern = /^Request failed with status code \d+$/i;

const statusMessages = {
  400: 'La requête envoyée est invalide.',
  401: 'Vous devez être connecté pour effectuer cette action.',
  403: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  404: 'La ressource demandée est introuvable.',
  409: "Cette action est en conflit avec l'état actuel des données.",
  413: 'Le fichier envoyé est trop volumineux.',
  422: 'Certaines informations saisies sont invalides.',
  429: 'Trop de tentatives. Réessayez un peu plus tard.',
  500: "Une erreur serveur est survenue. Réessayez plus tard.",
  502: 'Le serveur est temporairement indisponible.',
  503: 'Le service est temporairement indisponible.',
  504: 'Le serveur met trop de temps à répondre.',
};

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

  if (error?.code === 'ERR_NETWORK' || (!error?.response && error?.request)) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion ou réessayez.';
  }

  if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
    return fallbackMessage;
  }

  const status = error?.response?.status;

  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  if (
    typeof error?.message === 'string'
    && error.message.trim()
    && !axiosStatusMessagePattern.test(error.message.trim())
  ) {
    return error.message;
  }

  return fallbackMessage;
};

export default api;

