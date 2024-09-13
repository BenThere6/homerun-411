import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header'; // Importing the header component

export default function SearchPage() {
  return (
    <View style={styles.container}>
      {/* Reusable Header */}
      {/* <Header /> */}
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.text}>This is the Park Details Page</Text>
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