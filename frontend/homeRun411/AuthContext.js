// AuthContext.js
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './utils/axiosInstance';

const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: () => { },
  user: null,
  setUser: () => { },
  isAdmin: false,
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const roleVersionRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Flexible admin check (top-admin or adminLevel==0 or role=='admin')
  const isAdmin = !!user && (
    Number(user?.adminLevel) === 0 ||
    user?.role === 'top-admin' ||
    user?.role === 'admin'
  );

  const refreshProfile = useCallback(async () => {
    try {
      const { data, headers } = await api.get('/api/user/profile', { headers: { 'Cache-Control': 'no-store' } });
      setUser(prev => {
        // Only hit storage if version changed
        if (!prev || prev.roleVersion !== data.roleVersion) {
          AsyncStorage.setItem('user', JSON.stringify(data)).catch(() => { });
        }
        return data;
      });
      roleVersionRef.current = String(data.roleVersion ?? '');
      if (!isLoggedIn) setIsLoggedIn(true); // in case we bootstrapped from token
    } catch (e) {
      // ignore; 401 paths handled by axios interceptor in your setup
    }
  }, [isLoggedIn]);

  // Bootstrap from storage, then refresh from server
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));
      } catch { }
      await refreshProfile();
    })();
  }, [refreshProfile]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshProfile();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, setUser, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};