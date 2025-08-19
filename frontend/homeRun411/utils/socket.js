// utils/socket.js
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@env';

let socket;

export const connectSocket = async () => {
  if (socket?.connected) return socket;
  const token = await AsyncStorage.getItem('token'); // you’re already storing it under 'token'
  socket = io(BACKEND_URL, {
    transports: ['websocket'],
    auth: token ? { token: `Bearer ${token}` } : {},
  });
  return socket;
};

export const getSocket = () => socket;