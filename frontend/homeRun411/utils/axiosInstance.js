// utils/axiosInstance.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@env'; // Keep this if @env is correctly configured

// Fallback if BACKEND_URL is undefined
const baseURL = BACKEND_URL || 'http://localhost:5001';

const instance = axios.create({
  baseURL,
  timeout: 10000,
});

// Add a request interceptor to attach token
instance.interceptors.request.use(
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
  error => Promise.reject(error)
);

export default instance;