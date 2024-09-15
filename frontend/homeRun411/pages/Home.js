import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import Header from '../components/Header'; // Importing the Header component
import colors from '../assets/colors'; // Importing the color variables

// Mock quickLinks data (you can replace this with your actual data)
const quickLinks = [
  { id: '1', icon: 'location', label: 'Nearby Facilities', screen: 'Nearby' },
  { id: '2', icon: 'book', label: 'Baseball Etiquette', screen: 'Etiquette' },
  { id: '3', icon: 'cog', label: 'Settings', screen: 'Settings' },
  { id: '4', icon: 'construct', label: 'Admin', screen: 'Admin' },
];

export default function Homepage() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    <SafeAreaView style={styles.container}>
      {/* Include the Header component */}
      <Header />

      {/* Gray line (divider) */}
      <View style={styles.divider} />

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Welcome Message */}
        <Text style={styles.welcomeMessage}>Welcome back, User!</Text>

        <Text style={styles.sectionTitle}>Quick Links</Text>

        {/* Quick Links with Horizontal Scroll */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.quickLinksContainer}>
          {quickLinks.map((link, index) => (
            <TouchableOpacity
              key={link.id}
              style={[
                styles.linkCard,
                index === 0 && styles.firstLinkCard, // Apply margin to the first card
                index === quickLinks.length - 1 && styles.lastLinkCard, // Apply margin to the last card
              ]}
              onPress={() => navigation.navigate(link.screen)}
            >
              <Ionicons name={link.icon} size={30} color={colors.ten} />
              <View style={styles.labelContainer}>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Container */
  container: {
    flex: 1,
    backgroundColor: colors.sixty, // Primary background color (60%)
  },
  scrollContainer: {
    paddingBottom: 20, // Add some padding at the bottom for better spacing
  },

  /* Welcome Message */
  welcomeMessage: {
    fontSize: 22, // Increase font size for emphasis
    fontWeight: 'bold',
    color: colors.primaryText,
    padding: 20, 
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },

  /* Quick Links */
  quickLinksContainer: {
    paddingBottom: 15,
    marginBottom: 0,
    paddingTop: 10,
    paddingLeft: 20, // Added padding on the left for symmetry
  },
  linkCard: {
    width: 90, // Square cards
    height: 90, // Square cards
    backgroundColor: '#f5f5f5', // Light background for cards
    borderRadius: 15, // More rounded corners
    justifyContent: 'space-between', // Space between icon and text
    alignItems: 'center',
    paddingVertical: 10, // Add padding to make the card less cramped
    marginRight: 15,
    elevation: 3, // Subtle shadow for depth
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  firstLinkCard: {
    marginLeft: 0, // Align the first card with the container
  },
  lastLinkCard: {
    marginRight: 40, // Add padding to the last card on the right
  },
  iconContainer: {
    flex: 1, // Top half for the icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1, // Bottom half for the text
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5, // Padding to give the text room to wrap
    width: '100%', // Ensure label takes full width of the card
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '500', // Make the label a bit bolder
    color: colors.primaryText,
    textAlign: 'center',
    flexWrap: 'wrap', // Allow text to wrap
    lineHeight: 14, // Add line height for better readability
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  parkCard: {
    width: '100%',
    height: 180, // Adjust height for better proportions
    backgroundColor: colors.sixty,
    borderRadius: 15, // Rounded corners for a modern look
    justifyContent: 'flex-end',
    padding: 10,
    marginBottom: 20, // Add more spacing between park cards
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  parkDetail: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 10,
    marginBottom: 20,
  },

  /* Section Title */
  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 20,
    color: colors.primaryText,
    fontSize: 18, // Slightly bigger for section titles
    fontWeight: 'bold',
  },
});