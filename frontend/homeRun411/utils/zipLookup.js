import axios from 'axios';
import { POSITIONSTACK_API_KEY } from '@env';

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