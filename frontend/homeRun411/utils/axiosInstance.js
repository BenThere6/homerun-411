// utils/axiosInstance.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Works in dev (Expo Go) and prod (TestFlight)
const EXTRA =
  Constants.expoConfig?.extra ||
  Constants.manifest?.extra || // legacy fallback
  {};

const baseURL = EXTRA.BACKEND_URL;

if (!baseURL) {
  console.warn('BACKEND_URL is missing from app config extra. Check app.config.js and EAS Variables.');
}

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