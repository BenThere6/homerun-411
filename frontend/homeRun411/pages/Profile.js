// pages/Profile.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from '../utils/axiosInstance';
import ParkCard from '../components/ParkCard';
import colors from '../assets/colors';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilePage() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState({});
  const [createdAt, setCreatedAt] = useState('');
  const [activity, setActivity] = useState({ posts: [], comments: [], likes: [] });
  const [favoriteParks, setFavoriteParks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ---------- Data ----------
  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProfile(res.data.profile);
    setCreatedAt(res.data.createdAt);
  };

  const fetchActivity = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/api/user/activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { posts = [], comments = [], likes = [] } = res.data || {};
      setActivity({ posts, comments, likes });
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      console.error('❌ Error fetching activity:', status, msg);
    }
  };

  const fetchFavorites = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('/api/user/home-parks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFavoriteParks(res.data.favorites || []);
  };

  const handlePickAvatar = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to update your picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      form.append('avatar', {
        uri: asset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });

      const uploadRes = await axios.post('/api/user/upload-avatar', form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // assume backend returns { profile: { ... } }
      if (uploadRes?.data?.profile) {
        setProfile((prev) => ({ ...prev, ...uploadRes.data.profile }));
      } else {
        // fallback: refetch full profile
        fetchProfile();
      }
    } catch (err) {
      console.error('avatar upload failed', err?.response?.data || err.message);
      Alert.alert('Upload failed', 'Could not update your photo right now.');
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchActivity();
    fetchFavorites();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchFavorites(), fetchActivity()]);
    setRefreshing(false);
  };

  // ---------- Derived ----------
  const memberSince = useMemo(() => {
    if (!createdAt) return '';
    try {
      return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  }, [createdAt]);

  // ---------- Render ----------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} progressViewOffset={70} />
        }
      >
        {/* Hero Header */}
        <View style={styles.heroCard}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.75}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{
                  uri: profile.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                }}
                style={styles.avatar}
              />
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera-outline" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>
            {(profile.firstName || '').trim()} {(profile.lastName || '').trim()}
          </Text>
          {!!memberSince && <Text style={styles.memberSince}>Member Since: {memberSince}</Text>}
        </View>

        {/* Favorites */}
        <Section title="Favorite Parks">
          {favoriteParks.length > 0 ? (
            <FlatList
              data={favoriteParks}
              horizontal
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={{ width: 260, marginRight: 12 }}>
                  <ParkCard
                    park={item}
                    isFavorited={true}
                    disableFavoriteToggle={true}
                    onPress={() => navigation.navigate('ParkDetails', { park: item })}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 0, paddingRight: 0 }}
            />
          ) : (
            <EmptyState
              icon="star-outline"
              title="No favorites yet"
              subtitle="Tap the star on a park to save it here."
            />
          )}
        </Section>

        {/* Recent Activity */}
        <Section title="Recent Activity">
          {activity.posts.length === 0 &&
            activity.comments.length === 0 &&
            activity.likes.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No recent activity"
              subtitle="Your posts, comments, and likes will show up here."
            />
          ) : (
            <View style={styles.activityBlock}>
              {/* Posts */}
              {activity.posts.length > 0 && (
                <>
                  <SectionSubheader label="Posts" />
                  {activity.posts.map((post) => (
                    <ActivityRow
                      key={`post-${post._id}`}
                      leftIcon="document-text-outline"
                      title={post.title}
                      date={post.createdAt}
                      onPress={() => navigation.navigate('Forum', { openPostId: post._id })}
                    />
                  ))}
                </>
              )}

              {/* Comments */}
              {activity.comments.length > 0 && (
                <>
                  <SectionSubheader label="Comments" />
                  {activity.comments.map((c) => (
                    <ActivityRow
                      key={`comment-${c._id}`}
                      leftIcon="chatbubble-ellipses-outline"
                      title={c.content}
                      date={c.createdAt}
                      onPress={
                        c.referencedPost?._id
                          ? () => navigation.navigate('Forum', { openPostId: c.referencedPost._id })
                          : undefined
                      }
                      meta={c.referencedPost?.title ? `on “${c.referencedPost.title}”` : undefined}
                    />
                  ))}
                </>
              )}

              {/* Likes */}
              {activity.likes.length > 0 && (
                <>
                  <SectionSubheader label="Liked Posts" />
                  {activity.likes.map((p) => (
                    <ActivityRow
                      key={`like-${p._id}`}
                      leftIcon="heart-outline"
                      title={p.title}
                      date={p.updatedAt}
                      onPress={() => navigation.navigate('Forum', { openPostId: p._id })}
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </Section>

        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={16} color="#fff" />
          <Text style={styles.manageBtnText}>Manage Account</Text>
        </TouchableOpacity>

        {/* Bottom spacer */}
        <View style={{ height: 28 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------ Small presentational helpers (in-file) ------------- */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SectionSubheader({ label }) {
  return <Text style={styles.sectionSubheader}>{label}</Text>;
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon} size={24} color={colors.secondaryText} style={{ marginBottom: 6 }} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

function ActivityRow({ leftIcon, title, date, onPress, meta }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      style={styles.activityRow}
    >
      <View style={styles.activityLeft}>
        <View style={styles.activityIconWrap}>
          <Ionicons name={leftIcon} size={16} color={colors.secondaryText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.activityTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            {!!meta && <Text style={styles.activityMeta}>{meta}</Text>}
            <Text style={styles.activityDate}>{fmtDate(date)}</Text>
          </View>
        </View>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />}
    </TouchableOpacity>
  );
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}

/* ----------------------------- Styles ---------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightBlue },
  screen: { flex: 1, backgroundColor: colors.lightBlue },
  scrollContainer: { paddingBottom: 24 },

  /* Hero */
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#e6eef7',
    marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: '700', color: colors.primaryText },
  memberSince: { fontSize: 13, color: colors.secondaryText, marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#b5bdc7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  stat: { width: 120, paddingVertical: 10, alignItems: 'center' },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: '#b5bdc7' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.primaryText },
  statLabel: { fontSize: 12, color: colors.secondaryText },

  /* Sections */
  section: { marginTop: 10, paddingHorizontal: 16, paddingTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  emptyTitle: { color: colors.primaryText, fontWeight: '600' },
  emptySubtitle: { color: colors.secondaryText, marginTop: 4, textAlign: 'center' },

  /* Activity */
  activityBlock: { paddingHorizontal: 8, paddingBottom: 6 },
  sectionSubheader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  activityLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 10 },
  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3f6fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityTitle: { fontSize: 15, fontWeight: '500', color: colors.primaryText },
  activityMeta: { fontSize: 12, color: colors.secondaryText },
  activityDate: { fontSize: 12, color: colors.secondaryText },

  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 6,
  },
  manageBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#ff944d',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  manageBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});