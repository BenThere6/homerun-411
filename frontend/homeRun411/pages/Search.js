import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import colors from '../assets/colors'; // Importing the color variables

export default function SearchPage() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    // Wrap everything inside TouchableWithoutFeedback to detect taps outside the TextInput
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* SafeAreaView for safe top padding on devices with notches */}
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.secondaryText} // Use secondaryText for placeholder
            style={styles.input}
            blurOnSubmit={true} // Closes the keyboard when submitted
          />
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color={colors.primaryText} />
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* Recent Searches */}
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentSearchesContainer}>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.recentSearchIcon} />
              <Text style={styles.searchText}>Park 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.recentSearchIcon} />
              <Text style={styles.searchText}>Park 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.recentSearchIcon} />
              <Text style={styles.searchText}>Park 3</Text>
            </TouchableOpacity>
          </View>

          {/* Featured Parks */}
          <Text style={styles.sectionTitle}>Featured Parks</Text>
          <View style={styles.featuredParksContainer}>
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sixty, // Primary background color (white)
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sixty, // White background
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 5,
    elevation: 5, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow position for iOS
    shadowOpacity: 0.2, // Shadow opacity for iOS
    shadowRadius: 3.84, // Shadow blur for iOS
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.primaryText, // Primary text color (black)
  },
  filterIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sixty, // White background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    marginLeft: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  /* Recent Searches */
  recentSearchesContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  recentSearchIcon: {
    marginRight: 10,
  },
  searchText: {
    fontSize: 16,
    color: colors.primaryText, // Primary text color (black)
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 0,
    paddingHorizontal: 20, // Add padding to both sides of the featured parks section
  },
  parkCard: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'flex-end',
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText, // Black text for park name
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  parkDetail: {
    fontSize: 14,
    color: colors.secondaryText, // Gray text for park details
    marginLeft: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText, // Black color for section titles
  },
});
