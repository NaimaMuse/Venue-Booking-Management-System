import axios from 'axios';

import { API_BASE, getToken } from './auth';

/**
 * Shared Axios client for all frontend ↔ backend communication.
 */
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set multipart boundaries for file uploads
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export const getApiError = (error, fallback = 'Request failed') => {
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      if (import.meta.env.PROD) {
        return 'Cannot reach the API. Set VITE_API_URL on the frontend service to your Railway backend URL, then redeploy.';
      }
      return 'Cannot reach the API. Make sure the backend is running on port 5000, then refresh.';
    }
    return error.message || fallback;
  }

  return error.response?.data?.message || error.message || fallback;
};

export default api;
