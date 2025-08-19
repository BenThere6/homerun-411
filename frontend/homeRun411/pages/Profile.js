import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, FlatList, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from '../utils/axiosInstance';
import ParkCard from '../components/ParkCard';
import colors from '../assets/colors';

export default function ProfilePage() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({});
  const [createdAt, setCreatedAt] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [activity, setActivity] = useState({ posts: [], comments: [], likes: [] });
  const [favoriteParks, setFavoriteParks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(res.data.profile);
    setCreatedAt(res.data.createdAt); // ✅
  };

  const fetchActivity = async () => {
    console.log('📡 Fetching activity...');
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
      headers: { Authorization: `Bearer ${token}` }
    });
    setFavoriteParks(res.data.favorites || []);
  };

  useEffect(() => {
    fetchProfile();
    fetchActivity();
    fetchFavorites();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFavorites(),
      fetchActivity()
    ]);
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      const token = await AsyncStorage.getItem('token');
      setProfileImage(result.uri);
      await axios.patch('/api/user/profile', { avatarUrl: result.uri }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={50}
          />
        }
      >
        <View style={styles.card}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{ uri: profileImage || profile.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
          {createdAt && (
            <Text style={styles.dateText}>
              Member Since: {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={18} color={colors.primaryText} />
          <Text style={styles.manageButtonText}>Manage Account</Text>
        </TouchableOpacity>

        {/* Favorite Parks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Parks</Text>
          {favoriteParks.length > 0 ? (
            <FlatList
              data={favoriteParks}
              horizontal
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={{ width: 250, marginRight: 12 }}>
                  <ParkCard
                    park={item}
                    isFavorited={true}
                    disableFavoriteToggle={true} // 👈 This tells ParkCard to make the star non-interactive
                    onPress={() => navigation.navigate('ParkDetails', { park: item })}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 10 }}
            />
          ) : (
            <Text style={styles.emptyText}>No favorite parks yet.</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {/* Posts */}
          {activity.posts.length > 0 && (
            <>
              <Text style={styles.activityType}>Posts</Text>
              {activity.posts.map(post => (
                <TouchableOpacity
                  key={`post-${post._id}`}
                  onPress={() => navigation.navigate('Forum', { openPostId: post._id })}
                >
                  <View style={styles.activityCard}>
                    <Text style={styles.activityText}>{post.title}</Text>
                    <Text style={styles.activityDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Comments */}
          {activity.comments.length > 0 && (
            <>
              <Text style={styles.activityType}>Comments</Text>
              {activity.comments.map(comment => (
                <View key={`comment-${comment._id}`} style={styles.activityCard}>
                  <Text style={styles.activityText}>{comment.content}</Text>
                  <Text style={styles.activityDate}>
                    on "{comment.referencedPost?.title || 'a post'}" — {new Date(comment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Likes */}
          {activity.likes.length > 0 && (
            <>
              <Text style={styles.activityType}>Liked Posts</Text>
              {activity.likes.map(post => (
                <View key={`like-${post._id}`} style={styles.activityCard}>
                  <Text style={styles.activityText}>{post.title}</Text>
                  <Text style={styles.activityDate}>{new Date(post.updatedAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </>
          )}

          {/* Fallback if nothing */}
          {activity.posts.length === 0 &&
            activity.comments.length === 0 &&
            activity.likes.length === 0 && (
              <Text style={styles.emptyText}>No recent activity yet.</Text>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.sixty },
  scrollContainer: { paddingBottom: 30 },
  card: {
    backgroundColor: colors.lightBlue,
    margin: 16,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  profileImage: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#e0e0e0', marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.primaryText },
  dateText: { fontSize: 14, color: colors.secondaryText, marginTop: 6 },
  manageButton: {
    marginTop: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  manageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  emptyText: {
    color: colors.secondaryText,
    fontStyle: 'italic',
    fontSize: 14,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  activityCard: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
    borderRadius: 6,
    marginBottom: 6,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primaryText,
  },
  activityDate: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 14,
    marginBottom: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
});