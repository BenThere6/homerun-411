import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation

export default function SearchPage() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    // Wrap everything inside TouchableWithoutFeedback to detect taps outside the TextInput
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="gray"
            style={styles.input}
            blurOnSubmit={true} // Closes the keyboard when submitted
          />
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color="black" />
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* Recent Searches */}
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentSearchesContainer}>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color="gray" style={styles.recentSearchIcon} />
              <Text style={styles.searchText}>Park 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color="gray" style={styles.recentSearchIcon} />
              <Text style={styles.searchText}>Park 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchItem}>
              <Ionicons name="search" size={20} color="gray" style={styles.recentSearchIcon} />
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
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 20, // Add margin for spacing from the top and sides
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
    color: 'black',
  },
  filterIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
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
    color: 'black',
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 20,
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
    paddingLeft: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
});