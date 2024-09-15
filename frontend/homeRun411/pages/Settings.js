import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // To allow users to select a profile picture
import colors from '../assets/colors'; // Importing the color variables

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  // Profile Information State
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('user@example.com');
  const [profileImage, setProfileImage] = useState(null); // For profile picture

  // Function to open image picker
  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!pickerResult.cancelled) {
        setProfileImage(pickerResult.uri);
      }
    } else {
      alert('Permission to access the gallery is required!');
    }
  };

  const handleSaveProfile = () => {
    // Logic to save the profile updates (username, email, profile image)
    console.log('Profile Updated:', { username, email, profileImage });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          {/* <Text style={styles.sectionTitle}>Profile Information</Text> */}

          {/* Profile Picture */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfilePic}>
                  <Text style={styles.defaultProfilePicText}>Add Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Username */}
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveProfileButton} onPress={handleSaveProfile}>
            <Text style={styles.saveProfileButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Notifications</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled} 
          />
        </View>

        {/* Privacy Settings */}
        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Privacy Settings</Text>
          <Switch 
            value={privacyEnabled} 
            onValueChange={setPrivacyEnabled} 
          />
        </View>

        {/* App Theme */}
        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Dark Theme</Text>
          <Switch 
            value={darkTheme} 
            onValueChange={setDarkTheme} 
          />
        </View>

        {/* Location Preferences */}
        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Location Preferences</Text>
        </View>

        {/* Clear Search History */}
        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsText}>Clear Search History</Text>
        </TouchableOpacity>

        {/* Data & Privacy */}
        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsText}>Data & Privacy</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.sixty, // Primary background color
  },
  scrollContainer: {
    paddingBottom: 30, // Added padding at the bottom to allow full scroll
  },

  /* Profile Section */
  profileContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primaryText, // Primary text color
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfilePicText: {
    color: colors.secondaryText, // Secondary text color
    fontSize: 12,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.secondaryText, // Secondary text color for border
    borderRadius: 5,
    marginBottom: 10,
    color: colors.primaryText, // Primary text color
  },
  saveProfileButton: {
    backgroundColor: colors.thirty, // Tertiary color for save button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveProfileButtonText: {
    color: colors.sixty, // White color for button text
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Settings Items */
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsText: {
    fontSize: 16,
    color: colors.primaryText, // Primary text color
  },

  /* Logout Button */
  logoutButton: {
    backgroundColor: '#e0e0e0', // Lighter background color
    padding: 10, // Less padding for a subtler button
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20, // Reduced margin to lessen the emphasis
  },
  logoutButtonText: {
    color: colors.primaryText, // Primary text color
    fontSize: 14, // Smaller font size for less prominence
  },
});