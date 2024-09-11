import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for the search and filter icons

export default function Homepage() {
  return (
    // Wrap the whole screen in TouchableWithoutFeedback and use Keyboard.dismiss
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Search Bar Container */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="gray"
            style={styles.input}
            // You can also add an explicit "blurOnSubmit" to dismiss the keyboard when the search input is submitted.
            blurOnSubmit={true}
          />
          <Ionicons name="options-outline" size={20} color="black" style={styles.filterIcon} />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white', // Light gray background like in the image
    borderRadius: 30, // Rounded edges like the image
    width: '90%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 3, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: 1 }, // Shadow position for iOS
    shadowOpacity: 0.2, // Shadow opacity for iOS
    shadowRadius: 1.41, // Shadow blur for iOS
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  filterIcon: {
    marginLeft: 10,
  },
});