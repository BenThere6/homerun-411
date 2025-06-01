// pages/GameDay.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const necessities = [
  { id: 1, icon: 'water', title: 'Water Bottles', description: 'Stay hydrated during the entire game.' },
  { id: 2, icon: 'restaurant', title: 'Snacks', description: 'Bring some quick energy boosters for breaks.' },
  { id: 3, icon: 'sunny', title: 'Sunscreen', description: 'Protect your skin from harmful UV rays.' },
  { id: 4, icon: 'shirt', title: 'Extra Clothes', description: 'Pack backups in case of spills or weather changes.' },
  { id: 5, icon: 'umbrella', title: 'Shade or Umbrella', description: 'Stay cool during hot or rainy days.' },
  { id: 6, icon: 'medkit', title: 'First Aid Kit', description: 'Be ready for minor injuries or blisters.' },
  { id: 7, icon: 'camera', title: 'Camera/Phone', description: 'Capture memories or stay connected.' },
];

export default function GameDayPage() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {necessities.map((item) => (
          <View key={item.id} style={styles.card}>
            <Ionicons name={item.icon} size={24} color="#2b6cb0" style={styles.icon} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f3ff', // soft blue
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});