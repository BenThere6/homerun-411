import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import Header from '../components/Header'; // Importing the Header component

export default function Homepage() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    <View style={styles.container}>
      {/* Include the Header component */}
      <Header />

      {/* Gray line (divider) */}
      <View style={styles.divider} />

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <Text style={styles.sectionTitle}>Quick Links</Text>

        {/* Quick Links with Horizontal Scroll */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.quickLinksContainer}>

          {/* <TouchableOpacity style={[styles.linkCard, styles.firstLinkCard]}>
            <Ionicons name="chatbubbles-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Forum</Text>
            </View>
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={[styles.linkCard, styles.firstLinkCard]}>
            <Ionicons name="partly-sunny-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Weather</Text>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity style={[styles.linkCard, styles.firstLinkCard]}>
            <Ionicons name="location-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Nearby Facilities</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Etiquette')}
          >
            <Ionicons name="book-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Baseball Etiquette</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="cog-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Admin')}
          >
            <Ionicons name="construct-outline" size={30} color="tomato" />
            <View style={styles.labelContainer}>
              <Text style={styles.linkLabel}>Admin</Text>
            </View>
          </TouchableOpacity>
          
        </ScrollView>

        {/* Favorite Parks */}
        <Text style={styles.sectionTitle}>Favorite Parks</Text>

        <View style={styles.featuredParksContainer}>
          {/* Navigate to Park Details on click */}
          <TouchableOpacity
            style={styles.parkCard}
            onPress={() => navigation.navigate('ParkDetails', { parkName: 'Park 1', location: 'City, State' })}>
            <Text style={styles.parkName}>Park 1</Text>
          </TouchableOpacity>
          <Text style={styles.parkDetail}>Location: City, State</Text>
          
          <TouchableOpacity
            style={styles.parkCard}
            onPress={() => navigation.navigate('ParkDetails', { parkName: 'Park 2', location: 'City, State' })}>
            <Text style={styles.parkName}>Park 2</Text>
          </TouchableOpacity>
          <Text style={styles.parkDetail}>Location: City, State</Text>

          <TouchableOpacity
            style={styles.parkCard}
            onPress={() => navigation.navigate('ParkDetails', { parkName: 'Park 3', location: 'City, State' })}>
            <Text style={styles.parkName}>Park 3</Text>
          </TouchableOpacity>
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
    paddingBottom: 0,
  },
  
  /* Gray Line (Divider) */
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0', // Light gray color for the divider
    marginTop: 10, // Add some space around the divider
  },

  /* Quick Links */
  quickLinksContainer: {
    paddingBottom: 15, // Added padding at the bottom
    marginBottom: 0,
    paddingTop: 0,
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
  firstLinkCard: {
    marginLeft: 20, // Add margin to the left of the first quick link card
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
  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 20
  }
});