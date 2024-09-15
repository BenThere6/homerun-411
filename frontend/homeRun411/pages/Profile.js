import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For the settings gear icon
import { useNavigation } from '@react-navigation/native'; // For navigation

export default function ProfilePage() {
  const navigation = useNavigation(); // Hook for navigation

  return (
    <View style={styles.pageContainer}>
      {/* Settings Gear Icon */}
      <TouchableOpacity 
        style={styles.settingsIcon} 
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={24} color="black" />
      </TouchableOpacity>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.headerContainer}>
          {/* Placeholder Image */}
          <Image 
            source={{ uri: 'https://via.placeholder.com/120' }} // Placeholder image for now
            style={styles.profileImage} 
          />
          <Text style={styles.username}>Username</Text>
          <Text style={styles.email}>user@example.com</Text>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Account Created: January 1, 2021</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statisticsContainer}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsRow}>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Parks Visited</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>

          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityTable}>
            <View style={styles.activityRow}>
              <Text style={styles.activityEvent}>Commented on Park 1</Text>
              <Text style={styles.activityDate}>Sept 10, 2024</Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.activityEvent}>Liked a post in Park 2</Text>
              <Text style={styles.activityDate}>Sept 9, 2024</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative', // Important for absolute positioning of the icon
  },
  scrollView: {
    paddingHorizontal: 20, // Ensure padding for the ScrollView
  },
  scrollContainer: {
    paddingBottom: 10,
    width: '100%',
  },
  settingsIcon: {
    position: 'absolute',
    top: 40, // Adjust the position as per your app's layout
    right: 20, // Aligns to the top-right
    zIndex: 10, // Make sure the icon stays above the ScrollView
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 50, // Move the profile section down a bit
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Round image
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  editProfileText: {
    fontSize: 16,
    color: 'tomato',
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'gray',
  },

  /* Statistics Section */
  statisticsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15, // Add spacing between rows
  },
  statBox: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: '45%',
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  statLabel: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },

  /* Activity Section */
  activityContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activityTable: {
    width: '100%',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityEvent: {
    fontSize: 16,
    color: 'black',
    flex: 2, // Takes more space
  },
  activityDate: {
    fontSize: 10,
    color: 'gray',
    flex: 1, // Takes less space
    textAlign: 'right', // Aligns the date to the right
  },
});