import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import zipcodes from 'zipcodes'; // You may need to `npm install zipcodes`
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import SectionHeader from '../components/SectionHeader';

const quickLinks = [
  { id: '2', icon: 'book', label: 'Baseball Etiquette', screen: 'Etiquette' },
  { id: '3', icon: 'briefcase', label: 'Game Day Necessities', screen: 'GameDay' },
  { id: '4', icon: 'cog', label: 'Settings', screen: 'Settings' },
];

export default function Homepage() {
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
  const [weatherLabel, setWeatherLabel] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const { user, isAdmin } = useAuth();
  const greetingName = (user?.firstName || user?.name || '').split(' ')[0];

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = loc.coords;

          // coords for nearby parks query
          setUserCoords({ lat: latitude, lon: longitude });

          // weather
          const w = await getWeather(latitude, longitude);
          if (w) setWeather(w);

          // city/state label
          const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
          const city = place?.city || place?.district || '';
          const region = place?.region || place?.regionCode || place?.subregion || place?.administrativeArea || '';

          if (city) setCityName(city.charAt(0).toUpperCase() + city.slice(1).toLowerCase());

          const composed = [city, region].filter(Boolean).join(', ');
          setWeatherLabel(composed ? `${composed} • Current` : 'Current location');
          return;
        }

        // Permission denied → try saved ZIP fallback (if you store it)
        const savedZip = (await AsyncStorage.getItem('zipCode')) || '';
        const info = savedZip.trim() && zipcodes.lookup(savedZip.trim());
        if (info?.city) {
          setWeatherLabel(`${info.city}, ${info.state} • ZIP`);
        } else {
          setWeatherLabel('Your area');
        }
      } catch (e) {
        console.log('Location/weather error', e);
      }
    };

    fetchLocationAndWeather();
  }, []);

  // Optimistic toggle that keeps Favorites section in sync immediately
  const toggleFavorite = async (park) => {
    const parkId = park._id;
    const isFavorited = favoriteIds.includes(parkId);
    const endpoint = `/api/user/favorite-parks/${parkId}`;

    // --- OPTIMISTIC UPDATE ---
    if (isFavorited) {
      // user is un-favoriting
      setFavoriteIds(prev => prev.filter(id => id !== parkId));
      setFavoriteParks(prev => prev.filter(p => p._id !== parkId));
    } else {
      // user is favoriting
      setFavoriteIds(prev => [...prev, parkId]);
      setFavoriteParks(prev => {
        const exists = prev.some(p => p._id === parkId);
        return exists ? prev : [park, ...prev]; // put new favorite at top
      });
      setExpandFavorites(true); // make sure the section is open/visible
    }

    // --- SERVER CALL ---
    try {
      if (isFavorited) {
        await axios.delete(endpoint);
      } else {
        await axios.post(endpoint);
      }
    } catch (err) {
      // --- REVERT ON FAILURE ---
      if (isFavorited) {
        // we tried to un-fav but failed → put it back
        setFavoriteIds(prev => [...prev, parkId]);
        setFavoriteParks(prev => {
          const exists = prev.some(p => p._id === parkId);
          return exists ? prev : [park, ...prev];
        });
      } else {
        // we tried to fav but failed → remove it
        setFavoriteIds(prev => prev.filter(id => id !== parkId));
        setFavoriteParks(prev => prev.filter(p => p._id !== parkId));
      }
      console.error('Failed to toggle favorite:', err?.message || err);
    }
  };

  // Load first name and role from AsyncStorage when the component mounts
  useFocusEffect(
    React.useCallback(() => {
      const loadHomeParks = async () => {
        try {
          // Skip the very first call until we either have GPS or you decide to fetch without it.
          if (!userCoords) return;

          const url = `/api/user/home-parks?lat=${userCoords.lat}&lon=${userCoords.lon}`;
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
  const updatedQuickLinks = isAdmin
    ? [...quickLinks, { id: 'admin', icon: 'construct', label: 'Admin', screen: 'Admin' }]
    : quickLinks;

  return (
    <SafeAreaView style={styles.container} edges={[]}>

      {/* Include the Header component */}
      <Header />

      {/* Scrollable content */}
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scroll}>

          {/* Welcome Message */}
          {/* <View style={styles.welcomeWrap}>
            <Text style={styles.welcomeMessage}>
              {greetingName ? `Welcome back, ${greetingName}!` : 'Welcome back!'}
            </Text>
          </View> */}

          {/* <WeatherWidget weather={weather} locationLabel={weatherLabel} /> */}

          {/* Quick Links with Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickLinksContainer}>
            {updatedQuickLinks.map((link, index) => (
              <TouchableOpacity
                key={link.id}
                activeOpacity={0.85}
                style={[
                  styles.linkCard,
                  index === 0 && styles.firstLinkCard,
                  index === updatedQuickLinks.length - 1 && styles.lastLinkCard,
                ]}
                onPress={() => navigation.navigate(link.screen)}
              >
                <LinearGradient
                  colors={colors.quickLinkGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.linkCardBg}
                >
                  {/* soft glossy highlight */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gloss}
                  />

                  {/* translucent icon pill */}
                  <View style={styles.iconPill}>
                    <Ionicons name={link.icon} size={26} color="#fff" />
                  </View>

                  <View style={styles.labelContainer}>
                    <Text numberOfLines={2} style={styles.linkLabelColored}>{link.label}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {favoriteParks.length > 0 && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => setExpandFavorites(prev => !prev)}>
                <SectionHeader title={`Favorite Parks ${expandFavorites ? '▼' : '▲'}`} />
              </TouchableOpacity>
              {expandFavorites && favoriteParks.map(park => (
                <ParkCard
                  key={park._id}
                  park={park}
                  isFavorited={favoriteIds.includes(park._id)}
                  onToggleFavorite={() => toggleFavorite(park)}
                />
              ))}
            </View>
          )}

          {nearbyParks.length > 0 && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => setExpandNearby(prev => !prev)}>
                <SectionHeader title={`Parks near ${cityName || 'you'} ${expandNearby ? '▼' : '▲'}`} />
              </TouchableOpacity>
              {expandNearby && nearbyParks.map(park => (
                <ParkCard
                  key={park._id}
                  park={park}
                  isFavorited={favoriteIds.includes(park._id)}
                  onToggleFavorite={() => toggleFavorite(park)}
                />
              ))}
            </View>
          )}

          {recentlyViewedParks.length > 0 && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => setExpandRecentlyViewed(prev => !prev)}>
                <SectionHeader title={`Recently Viewed Parks ${expandRecentlyViewed ? '▼' : '▲'}`} />
              </TouchableOpacity>
              {expandRecentlyViewed && recentlyViewedParks.map(park => (
                <ParkCard
                  key={park._id}
                  park={park}
                  isFavorited={favoriteIds.includes(park._id)}
                  onToggleFavorite={() => toggleFavorite(park)}
                />
              ))}
            </View>
          )}

          {favoriteParks.length === 0 && nearbyParks.length === 0 && recentlyViewedParks.length === 0 && (
            <Text style={styles.noDataText}>No parks to show right now. Start exploring!</Text>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Container */
  container: {
    flex: 1,
    backgroundColor: colors.sixty,
  },
  homeTopSafe: {
    backgroundColor: colors.brandNavyDark,
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  scroll: {
    backgroundColor: colors.sixty,
  },
  body: {
    flex: 1,
    backgroundColor: colors.sixty,
  },

  /* Welcome Message */
  welcomeWrap: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeMessage: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.thirty,      // brand navy for a cohesive look
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: 10,
  },

  /* Quick Links */
  quickLinksContainer: {
    paddingBottom: 15,
    paddingTop: 16,
    paddingLeft: 20,
  },
  linkCard: {
    width: 110,   // wider for 2-line labels
    height: 100,
    marginRight: 15, // shadows/border now live on linkCardBg
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
    minHeight: 32,              // enough for two lines of text
    justifyContent: 'center',   // vertically center text
    alignItems: 'center',       // horizontally center text
    paddingTop: 5,
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

  linkCardBg: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',

    borderWidth: 2,
    borderColor: colors.brandGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38, // was 45
  },

  iconPill: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.thirty,   // brand navy
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    shadowOpacity: 0.10,
    borderRadius: 18,
  },

  linkLabelColored: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.thirty,
    textAlign: 'center',
    lineHeight: 15,
  },
});