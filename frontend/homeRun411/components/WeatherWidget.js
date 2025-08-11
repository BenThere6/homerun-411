// components/WeatherWidget.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import iconMap from '../utils/weatherIconMap';

const CARD_HEIGHT = 112;

export default function WeatherWidget({ weather, locationLabel }) {
  const [cardSize, setCardSize] = useState({ w: 0, h: CARD_HEIGHT });

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

  const label =
    (weather?.city || weather?.name || weather?.locationName || locationLabel || '').trim();

  // sizes scale with the card height
  const h = Math.max(cardSize.h || CARD_HEIGHT, 80);
  const tempSize = Math.round(h * 0.58);   // big number
  const unitSize = Math.round(tempSize * 0.34); // °F
  const iconSize = Math.round(h * 0.58);
  const gap = Math.round(h * 0.12);

  return (
    <View
      style={[styles.card, { backgroundColor }]}
      onLayout={(e) => setCardSize(e.nativeEvent.layout)}
    >
      <View style={styles.centerRow}>
        <IconComponent width={iconSize} height={iconSize} fill={iconColor} />
        <View style={{ marginLeft: gap }}>
          <Text
            allowFontScaling={false}
            style={[styles.tempNumber, { color: textColor, fontSize: tempSize, lineHeight: tempSize }]}
          >
            {Math.round(weather.temperature)}
            <Text
              allowFontScaling={false}
              style={[styles.tempUnit, { color: textColor, fontSize: unitSize, lineHeight: unitSize }]}
            >
              °F
            </Text>
          </Text>
        </View>
      </View>

      {!!label && (
        <View style={styles.labelPill}>
          <Text allowFontScaling={false} style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

/* --- colors & helpers (unchanged) --- */
const WEATHER_COLORS = {
  Clear: '#A7D8F5',
  'Few Clouds': '#CDE5F7',
  'Partly Cloudy': '#CDE5F7',
  'Scattered Clouds': '#CDE5F7',
  Clouds: '#D3D6DC',
  Rain: '#B0C4DE',
  Drizzle: '#B0C4DE',
  Thunderstorm: '#6C7A91',
  Snow: '#E4F0F5',
  Mist: '#DDE1E4',
  Fog: '#DDE1E4',
  Haze: '#DDE1E4',
  Default: '#CFCFCF',
};
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
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
const normalizeCondition = (condition = '', description = '') => {
  const s = `${condition} ${description}`.toLowerCase();
  if (s.includes('few clouds') || s.includes('scattered clouds') || s.includes('partly')) {
    return 'Partly Cloudy';
  }
  return condition || 'Default';
};
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

/* --- styles --- */
const styles = StyleSheet.create({
  card: {
    position: 'relative',
    height: CARD_HEIGHT,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',     // vertical center
    justifyContent: 'center', // horizontal center
  },
  tempNumber: {
    fontWeight: '400',
    includeFontPadding: false,     // Android: tighter baseline
    textAlignVertical: 'center',   // Android
  },
  tempUnit: {
    fontWeight: '400',
    includeFontPadding: false,
  },

  labelPill: {
    position: 'absolute',
    left: 12,
    bottom: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  labelText: { color: 'gray', fontSize: 12, fontWeight: '600' },

  loadingCard: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: 'gray' },
});