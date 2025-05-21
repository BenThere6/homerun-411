// utils/initUserLocation.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from './axiosInstance';

export const initUserLocation = async () => {
  try {
    const res = await axios.get('/api/user/profile');
    const coords = res?.data?.location?.coordinates;

    if (Array.isArray(coords) && coords.length === 2) {
      const [lon, lat] = coords;
      const location = { latitude: lat, longitude: lon };
      await AsyncStorage.setItem('userLocation', JSON.stringify(location));
      console.log('[initUserLocation] Saved to AsyncStorage:', location);
    } else {
      console.warn('[initUserLocation] Invalid coordinates');
    }
  } catch (err) {
    console.warn('[initUserLocation] Failed to fetch user profile:', err.message);
  }
};