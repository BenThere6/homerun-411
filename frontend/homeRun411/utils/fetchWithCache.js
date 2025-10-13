import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './axiosInstance';

export async function getWithCache(key, url, config) {
    try {
        const res = await api.get(url, config);
        await AsyncStorage.setItem(key, JSON.stringify(res.data));
        return res.data;
    } catch (e) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) return JSON.parse(cached);
        throw e;
    }
}