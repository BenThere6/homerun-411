import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback, SafeAreaView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import colors from '../assets/colors'; // Importing the color variables

export default function SearchPage() {
  const navigation = useNavigation(); // Hook for navigation
  const [parks, setParks] = useState([]); // State to store the fetched parks

  // Fetch parks from the backend API
  useEffect(() => {
    const fetchParks = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/park');
        const data = await response.json();
        setParks(data); // Store the fetched parks in the state
      } catch (error) {
        console.error('Error fetching parks:', error);
      }
    };

    fetchParks(); // Call the function to fetch parks
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            blurOnSubmit={true}
          />
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color={colors.primaryText} />
          </View>
        </View>

        {/* Divider (gray bar) */}
        <View style={styles.divider} /> 

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Recent Searches Section */}
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

          {/* Featured Parks Section */}
          <Text style={styles.sectionTitle}>Featured Parks</Text>
          <View style={styles.featuredParksContainer}>
            {parks.slice(0, 3).map((park) => (
              <View key={park._id} style={styles.parkContainer}>
                <TouchableOpacity
                  style={styles.parkCard}
                  onPress={() => navigation.navigate('ParkDetails', { park })}
                >
                  <ImageBackground
                    source={{ uri: park.pictures?.mainImageUrl ? park.pictures.mainImageUrl : 'https://via.placeholder.com/300' }}
                    style={styles.parkImageBackground}
                    resizeMode="cover"
                    onError={() => console.log(`Failed to load image for ${park.name}`)}
                  >
                    <View style={styles.parkContent}>
                      <Text style={styles.parkName}>{park.name}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
                <Text style={styles.parkDetail}>{`${park.city}, ${park.state}`}</Text>
              </View>
            ))}
          </View>

          {/* All Parks Section */}
          <Text style={styles.sectionTitle}>All Parks</Text>
          <View style={styles.allParksContainer}>
            {parks.length > 0 ? (
              parks.map((park) => (
                <View key={park._id} style={styles.parkContainer}>
                  <TouchableOpacity
                    style={styles.parkCard}
                    onPress={() => navigation.navigate('ParkDetails', { park })}
                  >
                    <ImageBackground
                      source={{ uri: park.pictures?.mainImageUrl ? park.pictures.mainImageUrl : 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
                      style={styles.parkImageBackground}
                      resizeMode="cover"
                      onError={() => console.log(`Failed to load image for ${park.name}`)}
                    >
                      <View style={styles.parkContent}>
                        <Text style={styles.parkName}>{park.name}</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                  <Text style={styles.parkDetail}>{`${park.city}, ${park.state}`}</Text>
                </View>
              ))
            ) : (
              <Text>No parks available</Text>
            )}
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

  /* Divider (Gray Bar) */
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 16,
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
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    overflow: 'hidden', // Ensure the image and content stay inside the card
  },
  parkImageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  parkContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Transparent black overlay for better text readability
    justifyContent: 'flex-end',
    padding: 10,
    height: '100%',
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // White text for park name
  },
  parkDetail: {
    fontSize: 14,
    color: colors.secondaryText, // Gray text for park details
    marginLeft: 10,
    marginBottom: 20,
  },

  /* All Parks */
  allParksContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  /* Section Title */
  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText, // Black color for section titles
  },
});