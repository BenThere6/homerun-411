import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import iconMap from '../utils/weatherIconMap';

export default function WeatherWidget({ weather }) {
  if (!weather) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  const IconComponent = iconMap[weather.condition] || iconMap['Clear'];
  const { backgroundColor, textColor, iconColor } =
    getCardStyle(weather.condition, weather.description);

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.centerer}>
        <View style={styles.left}>
          <IconComponent width={50} height={50} fill={iconColor} />
          <Text style={[styles.condition, { color: textColor }]} numberOfLines={1}>
            {weather.description}
          </Text>
        </View>

        <View style={styles.right}>
          <View style={styles.tempRow}>
            <Text style={[styles.tempNumber, { color: textColor }]}>
              {Math.round(weather.temperature)}
            </Text>
            <Text style={[styles.tempUnit, { color: textColor }]}>°F</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Pastel, sky-like palette
const WEATHER_COLORS = {
  Clear: '#A7D8F5',            // bright light blue (sunny)
  'Few Clouds': '#CDE5F7',     // pale blue w/ a hint of gray
  'Partly Cloudy': '#CDE5F7',
  'Scattered Clouds': '#CDE5F7',
  Clouds: '#D3D6DC',           // soft gray (overcast)
  Rain: '#B0C4DE',             // muted stormy blue-gray
  Drizzle: '#B0C4DE',
  Thunderstorm: '#6C7A91',     // darker slate on purpose
  Snow: '#E4F0F5',             // icy pale
  Mist: '#DDE1E4',
  Fog: '#DDE1E4',
  Haze: '#DDE1E4',
  Default: '#CFCFCF',
};

// tiny helpers to decide if a bg is "light"
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const relLuminance = ({ r, g, b }) => {
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};
const isLightColor = (hex) => relLuminance(hexToRgb(hex)) > 0.6;

// normalize a few common “partly cloudy” labels
const normalizeCondition = (condition = '', description = '') => {
  const s = `${condition} ${description}`.toLowerCase();
  if (s.includes('few clouds') || s.includes('scattered clouds') || s.includes('partly')) {
    return 'Partly Cloudy';
  }
  return condition || 'Default';
};

// returns background + ideal text/icon colors
const getCardStyle = (condition, description) => {
  const key = normalizeCondition(condition, description);
  const bg = WEATHER_COLORS[key] || WEATHER_COLORS.Default;
  const light = isLightColor(bg);
  return {
    backgroundColor: bg,
    textColor: light ? '#111111' : '#FFFFFF',
    iconColor: light ? '#333333' : '#FFFFFF',
  };
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    // keep both centers for safety
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,   // symmetric vertical padding
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  centerer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 64,         // gives a stable box to vertically center within
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  temp: {
    fontSize: 45,
    textAlign: 'center'
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempNumber: {
    fontSize: 45,
    lineHeight: 45,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: -15,
  },
  tempUnit: {
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 2,
  },
  condition: {
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'gray',
  },
});