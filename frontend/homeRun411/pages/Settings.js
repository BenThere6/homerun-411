import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [privacyEnabled, setPrivacyEnabled] = React.useState(false);
  const [darkTheme, setDarkTheme] = React.useState(false);

  return (
    <View style={styles.container}>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
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
    color: 'black',
  },
  logoutButton: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 40,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
  },
});