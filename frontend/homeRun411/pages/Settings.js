import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // To allow users to select a profile picture
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage to manage token
import { useNavigation } from '@react-navigation/native'; // Navigation hook for logout redirect
import colors from '../assets/colors'; // Importing the color variables

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const navigation = useNavigation(); // Access navigation

  // Profile Information State
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('user@example.com');
  const [profileImage, setProfileImage] = useState(null); // For profile picture

  // Load settings and profile data on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const storedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      const storedPrivacy = await AsyncStorage.getItem('privacyEnabled');
      const storedDarkTheme = await AsyncStorage.getItem('darkTheme');
      const storedUsername = await AsyncStorage.getItem('username');
      const storedEmail = await AsyncStorage.getItem('email');
      const storedProfileImage = await AsyncStorage.getItem('profileImage');

      if (storedNotifications !== null) setNotificationsEnabled(JSON.parse(storedNotifications));
      if (storedPrivacy !== null) setPrivacyEnabled(JSON.parse(storedPrivacy));
      if (storedDarkTheme !== null) setDarkTheme(JSON.parse(storedDarkTheme));
      if (storedUsername) setUsername(storedUsername);
      if (storedEmail) setEmail(storedEmail);
      if (storedProfileImage) setProfileImage(storedProfileImage);
    };

    loadSettings();
  }, []);

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
        await AsyncStorage.setItem('profileImage', pickerResult.uri);
      }
    } else {
      alert('Permission to access the gallery is required!');
    }
  };

  // Save profile info to AsyncStorage
  const handleSaveProfile = async () => {
    await AsyncStorage.setItem('username', username);
    await AsyncStorage.setItem('email', email);
    Alert.alert('Profile Saved', 'Your profile information has been updated.');
  };

  // Save settings to AsyncStorage
  const handleSaveSettings = async () => {
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    await AsyncStorage.setItem('privacyEnabled', JSON.stringify(privacyEnabled));
    await AsyncStorage.setItem('darkTheme', JSON.stringify(darkTheme));
  };

  // Logout functionality with confirmation
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('token'); // Clear token from AsyncStorage

            // Reset the navigation stack and navigate to the LoginPage
            navigation.reset({
              index: 0,
              routes: [{ name: 'LoginPage' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Persist settings on toggle
  useEffect(() => {
    handleSaveSettings();
  }, [notificationsEnabled, privacyEnabled, darkTheme]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    backgroundColor: colors.sixty,
  },
  scrollContainer: {
    paddingBottom: 30,
  },

  /* Profile Section */
  profileContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primaryText,
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
    color: colors.secondaryText,
    fontSize: 12,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    borderRadius: 5,
    marginBottom: 10,
    color: colors.primaryText,
  },
  saveProfileButton: {
    backgroundColor: colors.thirty,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveProfileButtonText: {
    color: colors.sixty,
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
    color: colors.primaryText,
  },

  /* Logout Button */
  logoutButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: colors.primaryText,
    fontSize: 14,
  },
});