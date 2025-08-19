import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from '../utils/axiosInstance';
import { useFocusEffect } from '@react-navigation/native';

const fmtName = (u) => {
  const f = u?.profile?.firstName || '';
  const l = u?.profile?.lastName || '';
  return (f + (l ? ' ' + l : '')).trim() || 'Someone';
};

export default function NotificationsPage({ navigation }) {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await axios.get('/api/notifications?limit=50');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // mark a single notification as read (optimistic)
  const markOneRead = async (id) => {
    // optimistic UI
    setItems(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      // preferred REST shape
      await axios.patch(`/api/notifications/${id}/read`);
    } catch {
      // fallback API (uncomment if your backend uses this shape)
      // try { await axios.patch('/api/notifications/read-one', { id }); } catch {}
    }
  };

  const markAllRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      await load();
    } catch { }
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={markAllRead} style={{ marginRight: 16 }}>
          <Text style={{ color: '#334155', fontWeight: '700' }}>Mark all read</Text>
        </TouchableOpacity>
      ),
      title: 'Notifications',
    });
  }, [navigation, markAllRead]);

  const goToPost = async (n) => {
    if (!n) return;
    // 1) mark this specific notification as read (optimistic)
    await markOneRead(n._id);

    // 2) open the post in Forum AND tell Forum how to get back here
    navigation.navigate('Forum', {
      openPostId: n?.post?._id,
      // tell Forum we should POP back to this screen (not push)
      returnTo: { name: 'Notifications', pop: true },
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.map((n) => {
          const who = fmtName(n.actor);
          const msg = n.type === 'like'
            ? `${who} liked your post`
            : `${who} commented on your post`;
          const preview = n.comment?.content ? `“${n.comment.content.slice(0, 80)}${n.comment.content.length > 80 ? '…' : ''}”` : '';
          return (
            <TouchableOpacity key={n._id} style={[styles.card, !n.read && styles.unread]} onPress={() => goToPost(n)}>
              <Image source={{ uri: n.actor?.profile?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.avatar} />
              <View style={styles.centerArea}>
                <Text style={styles.message}>
                  {msg}{n.post?.title ? `: ${n.post.title}` : ''}
                </Text>
                {!!preview && <Text style={styles.preview}>{preview}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#bbb" />
            </TouchableOpacity>
          );
        })}

        {!items.length && (
          <Text style={{ textAlign: 'center', color: '#777', marginTop: 20 }}>No notifications yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffe6f0' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  markAllText: { fontSize: 12, color: '#334155', fontWeight: '700' },
  scrollContainer: { padding: 15 },
  card: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 8, padding: 10,
    marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  unread: { borderWidth: 1, borderColor: '#c7d2fe', backgroundColor: '#eef2ff' },
  avatar: { width: 45, height: 45, borderRadius: 10, marginRight: 12 },
  centerArea: { flex: 1, justifyContent: 'center' },
  message: { fontSize: 14, color: '#111', fontWeight: '600' },
  preview: { marginTop: 4, fontSize: 12, color: '#475569' },
});