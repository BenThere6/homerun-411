import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FavoritesPage() {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.text}>This is the Notifications Page</Text>
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
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});