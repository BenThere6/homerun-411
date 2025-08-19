import React, { useEffect, useState, useCallback } from 'react';
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

  const markAllRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      await load();
    } catch { }
  };

  const goToPost = (n) => {
    navigation.navigate('Forum', { openPostId: n?.post?._id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

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