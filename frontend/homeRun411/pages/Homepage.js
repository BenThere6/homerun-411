// Homepage.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Homepage() {  // Make sure to export it as default
  return (
    <View style={styles.container}>
      <Text>Welcome to the Homepage!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'center',
  },
});