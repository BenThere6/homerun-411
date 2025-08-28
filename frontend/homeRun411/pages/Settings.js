import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';
import axios from '../utils/axiosInstance';
import { useAuth } from '../AuthContext';

function Row({ title, right, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.6 : 1} style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <View>{right}</View>
    </TouchableOpacity>
  );
}

function Group({ label, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function SettingsPage() {
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const { data } = await axios.get('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifEnabled(Boolean(data?.notifications));
      } catch (e) {
        console.error('Load settings failed', e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleNotifications = async (val) => {
    setNotifEnabled(val);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch('/api/user/settings', { notifications: val }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Save notif failed', e?.response?.data || e.message);
      Alert.alert('Error', 'Could not save notification preference.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          setIsLoggedIn(false);
          navigation.reset({ index: 0, routes: [{ name: 'LoginPage' }] });
        }
      }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.screen}>
      {/* Profile & Account */}
      <Group label="Profile & Account">
        <Row
          title="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
          right={<Text style={styles.chev}>{'>'}</Text>}
        />
      </Group>

      {/* Notifications (stub: persisted boolean only) */}
      <Group label="Notifications">
        <Row
          title="Allow Push Notifications"
          right={<Switch value={notifEnabled} onValueChange={toggleNotifications} />}
        />
        <Row title="Channels & in-app preferences" right={<Text style={styles.soon}>Coming soon</Text>} />
      </Group>

      {/* Privacy (stubs) */}
      <Group label="Privacy">
        <Row title="Profile visibility" right={<Text style={styles.soon}>Coming soon</Text>} />
        <Row title="Show favorites on profile" right={<Text style={styles.soon}>Coming soon</Text>} />
      </Group>

      {/* App */}
      <Group label="App">
        <Row title="Theme" right={<Text style={styles.soon}>Light (dark soon)</Text>} />
      </Group>

      {/* Danger / Login & Security */}
      <Group label="Login & Security">
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Group>

      {/* Spacer to ensure no gray gap */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sixty },
  scrollContainer: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  group: { marginBottom: 18 },
  groupLabel: { fontSize: 13, color: colors.secondaryText, marginBottom: 8, marginLeft: 6 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  row: {
    paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  rowTitle: { fontSize: 16, color: colors.primaryText },
  chev: { color: colors.secondaryText, fontSize: 16 },
  soon: { color: colors.secondaryText, fontStyle: 'italic' },
  logoutBtn: {
    backgroundColor: '#eee', paddingVertical: 12, margin: 14, borderRadius: 10, alignItems: 'center'
  },
  logoutText: { color: colors.primaryText, fontWeight: '600' },
});