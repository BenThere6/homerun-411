import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import Header from '../components/Header'; // Importing the Header component

export default function Homepage() {
  return (
    <View style={styles.container}>
      {/* Include the Header component */}
      <Header />

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Quick Links with Horizontal Scroll */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.quickLinksContainer}>
          <TouchableOpacity style={styles.linkCard}>
            <Ionicons name="chatbubbles-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Forum</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard}>
            <Ionicons name="partly-sunny-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Weather</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard}>
            <Ionicons name="location-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Nearby Facilities</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard}>
            <Ionicons name="book-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Etiquette</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard}>
            <Ionicons name="settings-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Admin</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Featured Parks */}
        <View style={styles.featuredParksContainer}>
          <View style={styles.parkCard}>
            <Text style={styles.parkName}>Park 1</Text>
          </View>
          <Text style={styles.parkDetail}>Location: City, State</Text>
          
          <View style={styles.parkCard}>
            <Text style={styles.parkName}>Park 2</Text>
          </View>
          <Text style={styles.parkDetail}>Location: City, State</Text>

          <View style={styles.parkCard}>
            <Text style={styles.parkName}>Park 3</Text>
          </View>
          <Text style={styles.parkDetail}>Location: City, State</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  
  /* Quick Links */
  quickLinksContainer: {
    paddingTop: 15, // Added padding at the top
    paddingBottom: 15, // Added padding at the bottom
    marginVertical: 20,
  },
  linkCard: {
    width: 80, // Square card
    height: 80,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Space between cards in horizontal scroll
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  labelContainer: {
    height: 30, // Fixed height for label container
    justifyContent: 'center', // Center the label vertically
  },
  linkLabel: {
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
    lineHeight: 15, // Line height for better spacing in multi-line text
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 20,
    paddingHorizontal: 20, // Add padding to both sides of the featured parks section
  },
  parkCard: {
    width: '100%', // Full width of parent
    height: 200, // Adjust height as needed
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'flex-end', // Name at the bottom left
    padding: 10,
    marginBottom: 10,
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  parkDetail: {
    fontSize: 14,
    color: 'gray',
    marginLeft: 10,
    marginBottom: 20,
  },
});