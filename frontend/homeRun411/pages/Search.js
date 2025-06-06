import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Fuse from 'fuse.js';
import colors from '../assets/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../utils/axiosInstance';
import ParkCard from '../components/ParkCard';
import { getCoordinatesFromZip } from '../utils/zipLookup';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const scrollRef = useRef(null);

  const [parks, setParks] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchConfirmed, setSearchConfirmed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ inCity: [], nearby: [] });
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [displayedQuery, setDisplayedQuery] = useState('');

  const stateNameToAbbreviation = {
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
    Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
    Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
    Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
    Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', "New Hampshire": 'NH',
    "New Jersey": 'NJ', "New Mexico": 'NM', "New York": 'NY', "North Carolina": 'NC',
    "North Dakota": 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
    "Rhode Island": 'RI', "South Carolina": 'SC', "South Dakota": 'SD', Tennessee: 'TN',
    Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
    "West Virginia": 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  };

  const waitForLocation = async (retries = 3, delay = 300) => {
    for (let i = 0; i < retries; i++) {
      const userLocation = await AsyncStorage.getItem('userLocation');
      if (userLocation) return JSON.parse(userLocation);
      await new Promise(res => setTimeout(res, delay));
    }
    return {};
  };

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

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const res = await axios.get('/api/park');
        const parksData = res.data;
        setParks(parksData.map(park => ({ ...park, imageError: false })));

        const favoritesRes = await axios.get('/api/user/home-parks');
        const favorites = favoritesRes.data.favorites.map(p => p._id);
        setFavoriteIds(favorites);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchParks();
  }, []);

  useEffect(() => {
    const loadRecentSearches = async () => {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    };
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (!route.params?.query) return;

    const runSearch = async () => {
      const trimmed = route.params.query?.trim();
      if (!trimmed) return;

      let locationCoords;
      const zipPattern = /^\d{5}$/;

      if (zipPattern.test(trimmed)) {
        locationCoords = await getCoordinatesFromZip(trimmed);
        if (!locationCoords) {
          console.warn('ZIP not found');
          setSearchResults({ inCity: [], nearby: [] });
          return;
        }
      } else {
        locationCoords = await waitForLocation();
      }

      await handleSearch(trimmed, true, locationCoords);
      navigation.setParams({ query: undefined });
    };

    runSearch();
  }, [route.params?.query]);

  const fuse = new Fuse(parks, {
    keys: ['name', 'city', 'state'],
    threshold: 0.3,
  });

  const updateRecentSearches = async (newQuery) => {
    if (!newQuery.trim()) return;
    const normalized = newQuery.trim().toLowerCase();
    const updated = [newQuery, ...recentSearches.filter(q => q.toLowerCase() !== normalized)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async (text, saveToRecent = true, locationCoords = null) => {
    if (!text.trim()) return;

    const trimmed = text.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    const stateAbbr = stateNameToAbbreviation[capitalized];
    let searchTerm;
    if (locationCoords?.city) {
      searchTerm = locationCoords.city;
    } else {
      searchTerm = stateAbbr || capitalized;
    }

    const coords = locationCoords || await waitForLocation();

    if (coords.latitude && coords.longitude) {
      try {
        const res = await axios.get('/api/park/searchByCityWithNearby', {
          params: {
            city: searchTerm,
            lat: coords.latitude,
            lon: coords.longitude,
          },
        });

        setSearchResults({
          inCity: res.data.cityMatches,
          nearby: res.data.nearbyParks,
        });
      } catch (err) {
        console.error('Error in location-based search:', err);
        setSearchResults({ inCity: [], nearby: [] });
      }
    } else {
      const results = fuse.search(trimmed).map(r => r.item);
      setSearchResults({ inCity: results, nearby: [] });
    }

    setSearchConfirmed(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setQuery(text);
    setDisplayedQuery(searchTerm);
    if (saveToRecent) await updateRecentSearches(text);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults({ inCity: [], nearby: [] });
    setSearchConfirmed(false);
  };

  const removeRecentSearch = async (index) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const [dividerOpacity, setDividerOpacity] = useState(1);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setDividerOpacity(offsetY > 5 ? 0 : 1);  // fades out once you scroll down
  };

  return (
    <View style={styles.fullScreen}>

      {/* Blur + Gradient OUTSIDE SafeAreaView */}
      {/* <BlurView intensity={100} tint="light" style={styles.blurBackground} />
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
        locations={[0, 0.6, 1]}
        style={styles.blurFade}
      /> */}

      <View style={[styles.searchHeader, { paddingTop: insets.top }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            blurOnSubmit={true}
            onSubmitEditing={async () => {
              const trimmed = query.trim();
              if (!trimmed) return;
              const zipPattern = /^\d{5}$/;
              let locationCoords;
              if (zipPattern.test(trimmed)) {
                locationCoords = await getCoordinatesFromZip(trimmed);
                if (!locationCoords) {
                  console.warn('ZIP not found');
                  setSearchResults({ inCity: [], nearby: [] });
                  return;
                }
              } else {
                locationCoords = await waitForLocation();
              }
              await handleSearch(trimmed, true, locationCoords);
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={{ marginLeft: 10, padding: 5 }}>
              <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color={colors.primaryText} />
          </View>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Search Bar */}



          {/* Scrollable Content Below */}
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* everything currently under the search bar */}

            {/* Render Content */}
            {searchConfirmed ? (
              <View style={styles.allParksContainer}>
                <Text style={styles.sectionTitle}>
                  Parks in {displayedQuery.charAt(0).toUpperCase() + displayedQuery.slice(1)}
                </Text>
                {(searchResults.inCity?.length || 0) > 0 ? (
                  searchResults.inCity.map((park) => (
                    <ParkCard
                      key={park._id}
                      park={park}
                      isFavorited={favoriteIds.includes(park._id)}
                      onToggleFavorite={() => toggleFavorite(park._id)}
                      distance={park.distanceInMiles}
                    />
                  ))
                ) : (
                  <Text style={styles.noDataText}>No parks found in {displayedQuery}.</Text>
                )}

                <Text style={styles.sectionTitle}>
                  Parks near {displayedQuery.charAt(0).toUpperCase() + displayedQuery.slice(1)}
                </Text>

                {(searchResults.nearby?.length || 0) > 0 ? (
                  searchResults.nearby.map((park) => (
                    <ParkCard
                      key={park._id}
                      park={park}
                      isFavorited={favoriteIds.includes(park._id)}
                      onToggleFavorite={() => toggleFavorite(park._id)}
                      distance={park.distanceInMiles}
                    />
                  ))
                ) : (
                  <Text style={styles.noDataText}>No nearby parks found.</Text>
                )}
              </View>
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <View style={styles.recentSearchesContainer}>
                      {recentSearches.map((recentSearch, index) => (
                        <View key={index} style={styles.searchItem}>
                          <TouchableOpacity
                            style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                            onPress={() => handleSearch(recentSearch, false)}
                          >
                            <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.recentSearchIcon} />
                            <Text style={styles.searchText}>{recentSearch}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeRecentSearch(index)}>
                            <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>Featured Parks</Text>
                <View style={styles.featuredParksContainer}>
                  {parks.slice(0, 3).map((park) => (
                    <ParkCard
                      key={park._id}
                      park={park}
                      isFavorited={favoriteIds.includes(park._id)}
                      onToggleFavorite={() => toggleFavorite(park._id)}
                      distance={park.distanceInMiles}
                    />
                  ))}
                </View>

                <Text style={styles.sectionTitle}>All Parks</Text>
                <View style={styles.allParksContainer}>
                  {parks.map((park) => (
                    <ParkCard
                      key={park._id}
                      park={park}
                      isFavorited={favoriteIds.includes(park._id)}
                      onToggleFavorite={() => toggleFavorite(park._id)}
                      distance={park.distanceInMiles}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sixty },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sixty,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '87%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: colors.primaryText },
  filterIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sixty,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    marginLeft: 10,
  },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginTop: 16 },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 60,
    paddingTop: 80, // adjust based on search bar height
  },  
  recentSearchesContainer: { marginBottom: 20, paddingHorizontal: 20 },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  recentSearchIcon: { marginRight: 10 },
  searchText: { fontSize: 16, color: colors.primaryText },
  sectionTitle: { paddingTop: 20, paddingBottom: 15, paddingLeft: 20, fontSize: 16, fontWeight: 'bold', color: colors.primaryText },
  allParksContainer: { paddingHorizontal: 20 },
  featuredParksContainer: { paddingHorizontal: 20 },
  stickyHeader: {
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.sixty,
  },
  blurFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // adjust to cover status + header area
    zIndex: -2,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // same height
    zIndex: -3,
  },
  safeArea: {
    backgroundColor: colors.sixty,
  },
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.sixty,
    alignItems: 'center',
    paddingBottom: 10,
  },  
});