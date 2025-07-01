import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, FlatList
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

  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(res.data.profile);
    setCreatedAt(res.data.createdAt); // ✅
  };

  const fetchActivity = async () => {
    const res = await axios.get('/api/user/activity');
    setActivity({
      posts: res.data.posts || [],
      comments: res.data.comments || [],
      likes: res.data.likes || [],
    });
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                  <ParkCard park={item} isFavorited={true} />
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
                <View key={`post-${post._id}`} style={styles.activityCard}>
                  <Text style={styles.activityText}>{post.title}</Text>
                  <Text style={styles.activityDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                </View>
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
                    on "{comment.post?.title || 'a post'}" — {new Date(comment.createdAt).toLocaleDateString()}
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
                  <Text style={styles.activityText}>❤️ {post.title}</Text>
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
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'lightgray',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 10,
  },
  manageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.black,
    fontWeight: '400',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
});