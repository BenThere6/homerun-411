// utils/getWeather.js
import axios from 'axios';
import { OPENWEATHER_API_KEY } from '@env';

export async function getWeather(lat, lon) {
  try {
    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial'
      }
    });

    const data = res.data;
    return {
      temperature: data.main.temp,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon, // include this
    };
  } catch (err) {
    console.error('Weather fetch failed:', err.message);
    return null;
  }
}