// components/WeatherWidget.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../assets/colors';
import iconMap from '../utils/weatherIconMap';

const CARD_HEIGHT = 112;
const CHIP_H = 24;      // smaller chip
const CHIP_GAP = 8;     // gap above chip
const RESERVED = CHIP_H + CHIP_GAP; // space reserved at card bottom for chip

export default function WeatherWidget({ weather }) {
  const [cardSize, setCardSize] = useState({ w: 0, h: CARD_HEIGHT });

  if (!weather) {
    return (
      <View style={[styles.cardBase, styles.loadingCard]}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  const IconComponent = iconMap[weather.condition] || iconMap['Clear'];
  const { bg, textColor, iconColor } = getCardStyle(weather.condition, weather.description);

  const h = Math.max(cardSize.h || CARD_HEIGHT, 96);
  const iconSize = Math.min(56, Math.round(h * 0.48));
  const tempSize = Math.round(h * 0.56);
  const unitSize = Math.round(tempSize * 0.34);

  const gradientColors = ['#FFFFFF', bg, 'rgba(42,45,116,0.05)'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardBase}
      onLayout={(e) => setCardSize(e.nativeEvent.layout)}
    >
      {/* soft top sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.50)', 'rgba(255,255,255,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
      />

      {/* Absolute center region (excludes bottom chip area) */}
      <View style={[styles.centerRegion, { bottom: RESERVED }]}>
        <View style={styles.row}>
          {/* icon */}
          <View style={[styles.iconWrap, { width: iconSize, height: iconSize }]}>
            <View style={styles.iconHalo} />
            <View style={styles.iconPill}>
              <IconComponent width={Math.round(iconSize * 0.9)} height={Math.round(iconSize * 0.9)} fill={iconColor} />
            </View>
          </View>

          {/* temp vertically centered in a box matching icon height */}
          <View style={{ height: iconSize, justifyContent: 'center' }}>
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
      </View>

      {/* bottom-center chip (doesn't affect centering) */}
      <View style={[styles.labelPill, { height: CHIP_H }]}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.labelText}>
          Weather at this park
        </Text>
      </View>
    </LinearGradient>
  );
}

/* helpers (unchanged) */
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
  return { bg, textColor: light ? colors.thirty : '#FFFFFF', iconColor: '#FFFFFF' };
};

/* styles */
const styles = StyleSheet.create({
  cardBase: {
    position: 'relative',
    height: CARD_HEIGHT,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(42,45,116,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 36 },

  // absolute area we center within
  centerRegion: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 6,
    // bottom set dynamically to RESERVED
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
  },

  iconWrap: { position: 'relative', borderRadius: 999, overflow: 'visible' },
  iconHalo: {
    position: 'absolute', top: 6, left: 6, right: 6, bottom: 6,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)',
  },
  iconPill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.thirty,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 3,
  },

  tempNumber: { fontWeight: '400', includeFontPadding: false, textAlignVertical: 'center' },
  tempUnit: { fontWeight: '400', includeFontPadding: false },

  // compact chip
  labelPill: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(42,45,116,0.12)',
    maxWidth: '90%',
  },
  labelText: { color: colors.thirty, fontSize: 12, fontWeight: '700' },

  loadingCard: {
    height: CARD_HEIGHT,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 14, color: 'gray' },
});