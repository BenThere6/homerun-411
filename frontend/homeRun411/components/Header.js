import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Icon library for icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import colors from '../assets/colors'; // Importing the color variables
import { useState } from 'react';

export default function Header() {
  const navigation = useNavigation(); // Hook for navigation

  const [query, setQuery] = useState('');

  return (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search"
          placeholderTextColor={colors.secondaryText}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          blurOnSubmit={true}
          onSubmitEditing={() => {
            const trimmed = query.trim();
            if (trimmed) {
              navigation.navigate('Search', { query: trimmed });
              setQuery(''); // Clear after navigation
            }
          }}
        />
        <View style={styles.filterIconContainer}>
          <Ionicons name="options-outline" size={20} color={colors.primaryText} />
        </View>
      </View>

      {/* Notification Icon (Touchable) */}
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={24} color={colors.primaryText} style={styles.notificationIcon} />
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
    paddingTop: 5, // Small padding at the top
    paddingBottom: 6, // Consistent padding at the bottom
    backgroundColor: colors.sixty, // Background color (white) from color variables
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sixty, // White background for search bar
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
    color: colors.primaryText, // Black color for input text
  },
  filterIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sixty, // White background for filter icon
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