import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ParkDetails({ route }) {
  // Get the park details passed from the SearchPage
  const { park } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.text}>Park Name: {park.name}</Text>
        <Text style={styles.text}>Location: {park.city}, {park.state}</Text>
        <Text style={styles.text}>Coordinates: {park.coordinates.coordinates.join(', ')}</Text>
        {/* Add more park details here as needed */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
});