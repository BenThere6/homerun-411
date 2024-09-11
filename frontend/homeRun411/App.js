import React from 'react';
import { View, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for the search and notification icons

export default function Homepage() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Header with Search Bar and Notification Icon */}
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
            {/* Filter Icon in a Circle */}
            <View style={styles.filterIconContainer}>
              <Ionicons name="options-outline" size={20} color="black" />
            </View>
          </View>

          {/* Notification Icon */}
          <Ionicons name="notifications-outline" size={24} color="black" style={styles.notificationIcon} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 50, // Adjusts space for the search bar
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', // Set the search bar to white
    borderRadius: 30, // Rounded edges
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
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
    width: 30, // Circle around the filter icon
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
    marginLeft: 20, // Adds some space between the search bar and the notification icon
  },
});