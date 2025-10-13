import axios from 'axios';
import Constants from 'expo-constants';
const EXTRA = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const POSITIONSTACK_API_KEY = EXTRA.POSITIONSTACK_API_KEY;

export async function getCoordinatesFromZip(zip) {
  try {
    const response = await axios.get('http://api.positionstack.com/v1/forward', {
      params: {
        access_key: POSITIONSTACK_API_KEY,
        query: zip,
        limit: 1,
        country: 'US'
      }
    });

    const data = response.data.data[0];
    if (!data || !data.latitude || !data.longitude) return null;

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.locality,
      state: data.region_code,
    };
  } catch (error) {
    console.error('ZIP lookup error:', error.message);
    return null;
  }
}