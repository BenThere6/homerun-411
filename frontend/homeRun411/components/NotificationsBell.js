import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from '../utils/axiosInstance';
import { connectSocket } from '../utils/socket';

export default function NotificationsBell({ navigation }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await axios.get('/api/notifications/unread-count');
        if (mounted) setCount(data?.count || 0);
      } catch {}
    };

    load();

    (async () => {
      const s = await connectSocket();
      s?.on?.('notification:new', () => {
        setCount((c) => c + 1);
      });
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={{ paddingRight: 12 }}
    >
      <View>
        <Ionicons name="notifications-outline" size={22} color="#333" />
        {!!count && (
          <View
            style={{
              position: 'absolute',
              top: -6, right: -2,
              minWidth: 16, height: 16, borderRadius: 8,
              backgroundColor: '#ef4444',
              paddingHorizontal: 3,
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}