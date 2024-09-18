import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; 
import colors from '../assets/colors';
import { useAuth } from '../AuthContext'; // Import the useAuth hook

export default function SettingsPage() {
  const { setIsLoggedIn } = useAuth(); // Access setIsLoggedIn from context
  const navigation = useNavigation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('user@example.com');
  const [profileImage, setProfileImage] = useState(null);

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

  const handleSaveProfile = async () => {
    await AsyncStorage.setItem('username', username);
    await AsyncStorage.setItem('email', email);
    Alert.alert('Profile Saved', 'Your profile information has been updated.');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              setIsLoggedIn(false); // Log the user out
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginPage' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
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
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
          <TouchableOpacity style={styles.saveProfileButton} onPress={handleSaveProfile}>
            <Text style={styles.saveProfileButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>

        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Privacy Settings</Text>
          <Switch value={privacyEnabled} onValueChange={setPrivacyEnabled} />
        </View>

        <View style={styles.settingsItem}>
          <Text style={styles.settingsText}>Dark Theme</Text>
          <Switch value={darkTheme} onValueChange={setDarkTheme} />
        </View>

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
  profileContainer: {
    marginBottom: 30,
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
