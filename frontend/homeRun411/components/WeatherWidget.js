// components/WeatherWidget.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import iconMap from '../utils/weatherIconMap';

const TEMP_SIZE = 64;
const UNIT_OFFSET = Math.round(TEMP_SIZE * 0.18);
const CARD_HEIGHT = 112;
const TEMP_NUDGE = Math.round(TEMP_SIZE * 0.06); // ~4px @ 64

export default function WeatherWidget({ weather, locationLabel }) {
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

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.centerer}>
        <View style={styles.iconWrap}>
          <IconComponent width={TEMP_SIZE} height={TEMP_SIZE} fill={iconColor} />
        </View>

        <View>
          <View style={styles.tempRow}>
            <Text
              style={[
                styles.tempNumber,
                {
                  color: textColor,
                  fontSize: TEMP_SIZE,
                  lineHeight: TEMP_SIZE,
                  transform: [{ translateY: -TEMP_NUDGE }],
                },
              ]}
            >
              {Math.round(weather.temperature)}
            </Text>
            <Text
              style={[
                styles.tempUnit,
                {
                  color: textColor,
                  marginTop: UNIT_OFFSET - TEMP_NUDGE,
                  alignSelf: 'flex-start',
                },
              ]}
            >
              °F
            </Text>
          </View>
        </View>
      </View>

      {!!label && (
        <View style={styles.labelPill}>
          <Text style={styles.labelText} numberOfLines={1}>{label}</Text>
        </View>
      )}
    </View>
  );
}

/* --- colors & helpers unchanged --- */
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
    overflow: 'hidden',   // keeps the label pill glow tidy
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  centerer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,           // a bit tighter spacing
  },
  iconWrap: { justifyContent: 'center' },

  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempNumber: {
    fontWeight: '400',
    marginBottom: -18,
  },
  tempUnit: {
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 2,
  },

  // location pill overlay (doesn't change height)
  labelPill: {
    position: 'absolute',
    left: 12,
    bottom: 3,
    // backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  labelText: {
    color: 'gray',
    fontSize: 12,
    fontWeight: '600',
  },
  left: { justifyContent: 'center' },
  right: { justifyContent: 'center' },
  loadingCard: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 14, color: 'gray' },
  labelRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
});