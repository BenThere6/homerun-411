import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header'; // Importing the Header component
import axios from '../utils/axiosInstance';
import colors from '../assets/colors'; // Importing the color variables
import ParkCard from '../components/ParkCard';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getWeather } from '../utils/getWeather';
import WeatherWidget from '../components/WeatherWidget';

const quickLinks = [
  { id: '1', icon: 'location', label: 'Nearby Facilities', screen: 'Facilities' },
  { id: '2', icon: 'book', label: 'Baseball Etiquette', screen: 'Etiquette' },
  { id: '3', icon: 'cog', label: 'Settings', screen: 'Settings' },
];

export default function Homepage() {
  const [firstName, setFirstName] = useState(''); // State to store first name
  const [role, setRole] = useState('User'); // State to store role (default is 'User')
  const [favoriteParks, setFavoriteParks] = useState([]);
  const [nearbyParks, setNearbyParks] = useState([]);
  const [recentlyViewedParks, setRecentlyViewedParks] = useState([]);
  const navigation = useNavigation(); // Hook for navigation
  const [expandFavorites, setExpandFavorites] = useState(true);
  const [expandNearby, setExpandNearby] = useState(true);
  const [expandRecentlyViewed, setExpandRecentlyViewed] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [weather, setWeather] = useState(null);
  const [cityName, setCityName] = useState(null);

  useEffect(() => {
    const fetchHomeWeather = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      const data = await getWeather(loc.coords.latitude, loc.coords.longitude);
      if (data) setWeather(data);
    };

    fetchHomeWeather();
  }, []);

  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserCoords({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });

      const data = await getWeather(loc.coords.latitude, loc.coords.longitude);
      if (data) setWeather(data);

      const geocode = await Location.reverseGeocodeAsync(loc.coords);
      if (geocode && geocode[0]?.city) {
        setCityName(geocode[0].city);
      }
    };

    fetchLocation();
  }, []);

  const toggleFavorite = async (parkId) => {
    try {
      const isFavorited = favoriteIds.includes(parkId);
      const endpoint = `/api/user/favorite-parks/${parkId}`;

      if (isFavorited) {
        await axios.delete(endpoint);
        setFavoriteIds(prev => prev.filter(id => id !== parkId));
      } else {
        await axios.post(endpoint);
        setFavoriteIds(prev => [...prev, parkId]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
    }
  };

  // Load first name and role from AsyncStorage when the component mounts
  useFocusEffect(
    React.useCallback(() => {
      const loadHomeParks = async () => {
        try {
          let url = '/api/user/home-parks';
          if (userCoords) {
            url += `?lat=${userCoords.lat}&lon=${userCoords.lon}`;
          }

          const res = await axios.get(url);
          setFavoriteParks(res.data.favorites || []);
          setNearbyParks(res.data.nearby || []);
          setRecentlyViewedParks(res.data.recent || []);
          const favorites = res.data.favorites.map(p => p._id);
          setFavoriteIds(favorites);

          const sections = [
            { name: 'favorites', data: res.data.favorites },
            { name: 'nearby', data: res.data.nearby },
            { name: 'recent', data: res.data.recent },
          ];

          const firstWithData = sections.find(section => section.data.length > 0)?.name;

          setExpandFavorites(firstWithData === 'favorites');
          setExpandNearby(firstWithData === 'nearby');
          setExpandRecentlyViewed(firstWithData === 'recent');

        } catch (error) {
          console.error('Error fetching home parks:', error);
        }
      };

      loadHomeParks();
    }, [userCoords])
  );

  // Conditionally add the admin link if the user is an admin
  const updatedQuickLinks = role === 'Admin'
    ? [...quickLinks, { id: '4', icon: 'construct', label: 'Admin', screen: 'Admin' }]
    : quickLinks;

  return (
    <SafeAreaView style={styles.container}>
      {/* Include the Header component */}
      <Header />

      {/* Gray line (divider) */}
      <View style={styles.divider} />

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Welcome Message */}
        <Text style={styles.welcomeMessage}>
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome back!'}
        </Text>

        <WeatherWidget weather={weather} />

        <Text style={styles.sectionTitle}>Quick Links</Text>

        {/* Quick Links with Horizontal Scroll */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.quickLinksContainer}>
          {updatedQuickLinks.map((link, index) => (
            <TouchableOpacity
              key={link.id}
              style={[
                styles.linkCard,
                index === 0 && styles.firstLinkCard, // Apply margin to the first card
                index === updatedQuickLinks.length - 1 && styles.lastLinkCard, // Apply margin to the last card
              ]}
              onPress={() => navigation.navigate(link.screen)}
            >
              <Ionicons name={link.icon} size={30} color={colors.ten} />
              <View style={styles.labelContainer}>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {favoriteParks.length > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity onPress={() => setExpandFavorites(prev => !prev)}>
              <Text style={styles.sectionTitle}>
                Favorite Parks {expandFavorites ? '▼' : '▲'}
              </Text>
            </TouchableOpacity>
            {expandFavorites && favoriteParks.map(park => (
              <ParkCard
                key={park._id}
                park={park}
                isFavorited={favoriteIds.includes(park._id)}
                onToggleFavorite={() => toggleFavorite(park._id)}
              />
            ))}
          </View>
        )}

        {nearbyParks.length > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity onPress={() => setExpandNearby(prev => !prev)}>
              <Text style={styles.sectionTitle}>
                Parks near {cityName || 'you'} {expandNearby ? '▼' : '▲'}
              </Text>
            </TouchableOpacity>
            {expandNearby && nearbyParks.map(park => (
              <ParkCard
                key={park._id}
                park={park}
                isFavorited={favoriteIds.includes(park._id)}
                onToggleFavorite={() => toggleFavorite(park._id)}
              />
            ))}
          </View>
        )}

        {recentlyViewedParks.length > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity onPress={() => setExpandRecentlyViewed(prev => !prev)}>
              <Text style={styles.sectionTitle}>
                Recently Viewed Parks {expandRecentlyViewed ? '▼' : '▲'}
              </Text>
            </TouchableOpacity>
            {expandRecentlyViewed && recentlyViewedParks.map(park => (
              <ParkCard
                key={park._id}
                park={park}
                isFavorited={favoriteIds.includes(park._id)}
                onToggleFavorite={() => toggleFavorite(park._id)}
              />
            ))}
          </View>
        )}

        {favoriteParks.length === 0 && nearbyParks.length === 0 && recentlyViewedParks.length === 0 && (
          <Text style={styles.noDataText}>No parks to show right now. Start exploring!</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Container */
  container: {
    flex: 1,
    backgroundColor: colors.sixty,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  /* Welcome Message */
  welcomeMessage: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryText,
    padding: 20,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },

  /* Quick Links */
  quickLinksContainer: {
    paddingBottom: 15,
    paddingTop: 10,
    paddingLeft: 20,
  },
  linkCard: {
    width: 90,
    height: 90,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  firstLinkCard: {
    marginLeft: 0,
  },
  lastLinkCard: {
    marginRight: 40,
  },
  labelContainer: {
    paddingHorizontal: 5,
    width: '100%',
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryText,
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 14,
  },

  /* Featured Parks */
  featuredParksContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  parkCard: {
    width: '100%',
    height: 180,
    backgroundColor: colors.sixty,
    borderRadius: 15,
    justifyContent: 'flex-end',
    padding: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  parkDetail: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 10,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.secondaryText,
    padding: 20,
    fontSize: 16,
  },

  /* Section Title */
  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 20,
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});