import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../assets/colors';
import axios from '../utils/axiosInstance';

function Row({ title, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <View>{right}</View>
    </View>
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.screen}>
      <Group label="Notifications">
        <Row
          title="Allow Push Notifications"
          right={<Switch value={notifEnabled} onValueChange={toggleNotifications} />}
        />
      </Group>
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
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: { fontSize: 16, color: colors.primaryText },
});