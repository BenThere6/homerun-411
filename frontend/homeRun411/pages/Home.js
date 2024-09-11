import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header'; // Importing the Header component

export default function Homepage() {
  return (
    <View style={styles.container}>
      {/* Include the Header component */}
      <Header />
      
      {/* Additional content for the homepage */}
      <View style={styles.contentContainer}>
        <Text style={styles.text}>Welcome to the Homepage</Text>
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