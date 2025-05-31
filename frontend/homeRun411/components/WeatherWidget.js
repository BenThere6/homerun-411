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

  return (
    <View style={[styles.card, getBackgroundStyle(weather.condition)]}>
      <View style={styles.left}>
        <IconComponent width={50} height={50} fill="#fff" />
      </View>
      <View style={styles.right}>
        <Text style={styles.temp}>{Math.round(weather.temperature)}°F</Text>
        <Text style={styles.condition}>{weather.description}</Text>
      </View>
    </View>
  );
}

const getBackgroundStyle = (condition) => {
  switch (condition) {
    case 'Clear':
      return { backgroundColor: '#f9c74f' };
    case 'Rain':
    case 'Drizzle':
    case 'Thunderstorm':
      return { backgroundColor: '#577590' };
    case 'Clouds':
      return { backgroundColor: '#90be6d' };
    default:
      return { backgroundColor: '#adb5bd' };
  }
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  left: {
    marginRight: 15,
  },
  right: {
    flex: 1,
  },
  temp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  condition: {
    fontSize: 14,
    color: '#fff',
    textTransform: 'capitalize',
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