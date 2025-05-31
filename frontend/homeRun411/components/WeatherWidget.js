// components/WeatherWidget.js
import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';

export default function WeatherWidget({ weather }) {
  if (!weather) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#888" />
        <Text style={styles.loadingText}>Fetching weather...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }}
        style={styles.icon}
      />
      <Text style={styles.main}>
        {weather.condition} — {Math.round(weather.temperature)}°F
      </Text>
      <Text style={styles.desc}>
        {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { width: 60, height: 60, marginBottom: 5 },
  main: { fontSize: 16, fontWeight: '600', color: '#333' },
  desc: { fontSize: 14, color: 'gray' },
  loadingText: { fontSize: 14, color: 'gray', marginTop: 4 },
});