import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import AsyncStorage from '@react-native-async-storage/async-storage'; // To store and retrieve first name
import Header from '../components/Header'; // Importing the Header component
import colors from '../assets/colors'; // Importing the color variables

// Mock quickLinks data (you can replace this with your actual data)
const quickLinks = [
  { id: '1', icon: 'location', label: 'Nearby Facilities', screen: 'Facilities' },
  { id: '2', icon: 'book', label: 'Baseball Etiquette', screen: 'Etiquette' },
  { id: '3', icon: 'cog', label: 'Settings', screen: 'Settings' },
  { id: '4', icon: 'construct', label: 'Admin', screen: 'Admin' },
];

export default function Homepage() {
  const [firstName, setFirstName] = useState(''); // State to store first name
  const navigation = useNavigation(); // Hook for navigation

  // Load first name from AsyncStorage when the component mounts
  useEffect(() => {
    const loadFirstName = async () => {
      const storedFirstName = await AsyncStorage.getItem('firstName');
      if (storedFirstName) {
        setFirstName(storedFirstName); // Set the first name
      }
    };
    loadFirstName();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Include the Header component */}
      <Header />

      {/* Gray line (divider) */}
      <View style={styles.divider} />

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Welcome Message */}
        <Text style={styles.welcomeMessage}>
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome back!'}
        </Text>

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
    backgroundColor: colors.sixty,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  /* Welcome Message */
  welcomeMessage: {
    fontSize: 22,
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
    paddingTop: 10,
    paddingLeft: 20,
  },
  linkCard: {
    width: 90,
    height: 90,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  firstLinkCard: {
    marginLeft: 0,
  },
  lastLinkCard: {
    marginRight: 40,
  },
  labelContainer: {
    paddingHorizontal: 5,
    width: '100%',
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryText,
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 14,
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  parkCard: {
    width: '100%',
    height: 180,
    backgroundColor: colors.sixty,
    borderRadius: 15,
    justifyContent: 'flex-end',
    padding: 10,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
});