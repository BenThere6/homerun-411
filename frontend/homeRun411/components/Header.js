import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Icon library for icons
import { useNavigation } from '@react-navigation/native'; // For navigation

export default function Header() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    <View style={styles.headerContainer}>
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

      {/* Notification Icon (Touchable) */}
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={24} color="black" style={styles.notificationIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', // Full width of the screen
    paddingHorizontal: 20, // Equal padding on left and right
    paddingTop: 25, // Small padding at the top
    paddingBottom: 6, // Consistent padding at the bottom
    backgroundColor: 'white', // Optional: Background color for the header
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1, // This allows the search bar to take up as much space as possible
    elevation: 5, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow position for iOS
    shadowOpacity: 0.2, // Shadow opacity for iOS
    shadowRadius: 3.84, // Shadow blur for iOS
    marginRight: 10, // Add spacing between search bar and notification icon
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
  notificationIcon: {
    marginLeft: 10, // Consistent spacing with the search bar
  },
});