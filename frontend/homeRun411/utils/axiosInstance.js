// utils/axiosInstance.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@env';

// Fallback: if BACKEND_URL isn't set, keep it local in dev.
// (On device this won't work unless you use a tunnel, so prefer setting BACKEND_URL.)
const baseURL = BACKEND_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Attach token on every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (err) {
      console.warn('Error attaching token:', err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// ---- 401 auto-logout support ----
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
      } catch {}
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default api;