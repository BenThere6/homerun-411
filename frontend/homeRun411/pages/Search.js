import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { getWithCache } from '../utils/fetchWithCache';
import ParkCard from '../components/ParkCard';
import { getCoordinatesFromZip } from '../utils/zipLookup';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const scrollRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(96); // default avoids overlap

  const [parks, setParks] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchConfirmed, setSearchConfirmed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ inCity: [], nearby: [] });
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [searchKind, setSearchKind] = useState('text'); // 'zip' | 'city' | 'state' | 'park' | 'text'

  // --- State helpers ---
  const STATE_MAP = {
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
    Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
    Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
    Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
    Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
    'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
    'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
    'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN',
    Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
    'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  };

  function resolveState(input) {
    const t = String(input || '').trim();
    if (!t) return null;
    // If it's already 2 letters, treat as abbr
    if (/^[A-Za-z]{2}$/.test(t)) {
      const abbr = t.toUpperCase();
      // find full name for display
      const name = Object.keys(STATE_MAP).find(k => STATE_MAP[k] === abbr) || abbr;
      return { abbr, name };
    }
    // Try full name (case-insensitive)
    const name = Object.keys(STATE_MAP).find(k => k.toLowerCase() === t.toLowerCase());
    if (name) return { abbr: STATE_MAP[name], name };
    return null;
  }

  // --- query classification helpers ---
  const normalize = (s) => (s || '').toLowerCase().trim();
  const looksLikeZip = (s) => /^\d{5}$/.test(String(s).trim());

  /** Try to parse "City, ST" or "City, StateName" */
  const parseCityState = (text, abbrMap) => {
    const t = String(text || '').trim();
    if (!t) return null;
    const m = t.match(/^(.+?)[,\s]+([A-Za-z]{2}|[A-Za-z .'\-]+)$/);
    if (!m) return null;
    const city = m[1].trim();
    const st = m[2].trim();
    const abbr = st.length === 2 ? st.toUpperCase() : (abbrMap ? abbrMap[st] : null);
    return { city, state: abbr };
  };

  /** Rough centroid from a list of parks with GeoJSON Point coords */
  const getCityCenterFromParks = (parksInCity) => {
    const pts = parksInCity
      .map(p => p?.coordinates?.coordinates)
      .filter(a => Array.isArray(a) && a.length === 2)
      .map(([lng, lat]) => ({ lat, lon: lng }));
    if (!pts.length) return null;
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
    return { latitude: lat, longitude: lon };
  };

  // High-confidence park-name matcher (tighter threshold)
  const parkNameFuse = useMemo(
    () => new Fuse(parks, { keys: ['name'], threshold: 0.25, includeScore: true }),
    [parks]
  );

  /** Return a strong park match or null */
  const bestParkByName = (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) return null;
    const res = parkNameFuse.search(trimmed, { limit: 3 });
    if (!res.length) return null;
    const top = res[0];
    // "Strong" = good Fuse score OR substring match ignoring case/punct
    const strong =
      top.score <= 0.15 ||
      normalize(top.item.name).includes(normalize(trimmed));
    return strong ? top.item : null;
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
        const parksData = await getWithCache('parks:all', '/api/park');
        setParks(parksData.map(park => ({ ...park, imageError: false })));

        const favData = await getWithCache('user:favorites', '/api/user/home-parks');
        const favorites = (favData?.favorites ?? []).map(p => p._id);
        setFavoriteIds(favorites);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchParks();
  }, []);

  useEffect(() => {
    const id = route.params?.removeParkId;
    if (!id) return;

    // Remove from master list
    setParks(prev => prev.filter(p => p._id !== id));

    // Remove from current search results (both sections)
    setSearchResults(prev => ({
      inCity: (prev?.inCity || []).filter(p => p._id !== id),
      nearby: (prev?.nearby || []).filter(p => p._id !== id),
    }));

    // Also clear from favorites if present
    setFavoriteIds(prev => prev.filter(pid => pid !== id));

    // clear the param so it doesn't run again on re-render
    navigation.setParams({ removeParkId: undefined });
  }, [route.params?.removeParkId]);

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

    // 1) ZIP?
    if (looksLikeZip(trimmed)) {
      const loc = locationCoords || await getCoordinatesFromZip(trimmed);
      if (!loc) {
        console.warn('ZIP not found');
        setSearchResults({ inCity: [], nearby: [] });
        return;
      }
      try {
        const res = await axios.get('/api/park/searchByCityWithNearby', {
          params: {
            city: loc.city || capitalized,     // use city if zip->city lookup returned it
            lat: loc.latitude,
            lon: loc.longitude,
          },
        });
        setSearchResults({ inCity: res.data.cityMatches, nearby: res.data.nearbyParks });
        setDisplayedQuery(loc.city || trimmed);
        setSearchKind('zip');
      } catch (err) {
        console.error('Error in ZIP search:', err);
        setSearchResults({ inCity: [], nearby: [] });
      }
      setSearchConfirmed(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setQuery(text);
      if (saveToRecent) await updateRecentSearches(text);
      return;
    }

    // 2) Park name?
    const parkMatch = bestParkByName(trimmed);
    if (parkMatch) {
      // Use the park's coordinates for the NEARBY section
      const coordsArr = parkMatch?.coordinates?.coordinates; // [lng, lat]
      const lng = Array.isArray(coordsArr) ? coordsArr[0] : null;
      const lat = Array.isArray(coordsArr) ? coordsArr[1] : null;

      try {
        let nearby = [];
        if (lat != null && lng != null) {
          const res = await axios.get('/api/park/searchByCityWithNearby', {
            params: { city: parkMatch.city, lat, lon: lng },
          });
          // avoid duplicating the same park in nearby
          nearby = (res.data.nearbyParks || []).filter(p => p._id !== parkMatch._id);
          setSearchResults({ inCity: [parkMatch], nearby });
        } else {
          // Fallback: no coords on the park — show just the match locally
          setSearchResults({ inCity: [parkMatch], nearby: [] });
        }
        setDisplayedQuery(parkMatch.name);
        setSearchKind('park');
      } catch (err) {
        console.error('Error in park-name search:', err);
        setSearchResults({ inCity: [parkMatch], nearby: [] });
        setDisplayedQuery(parkMatch.name);
        setSearchKind('park');
      }
      setSearchConfirmed(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setQuery(text);
      if (saveToRecent) await updateRecentSearches(text);
      return;
    }

    // 3) City, ST (or "City, StateName")?
    const parsed = parseCityState(trimmed, STATE_MAP);
    if (parsed) {
      // Try to center the nearby search near where our dataset places that city
      const parksInCity = parks.filter(
        p =>
          normalize(p.city) === normalize(parsed.city) &&
          (!parsed.state || (String(p.state || '').toUpperCase() === parsed.state))
      );
      const centerFromData = getCityCenterFromParks(parksInCity);
      const loc = centerFromData || locationCoords || await waitForLocation();

      try {
        const res = await axios.get('/api/park/searchByCityWithNearby', {
          params: {
            city: parsed.city,
            lat: loc?.latitude,
            lon: loc?.longitude,
          },
        });
        setSearchResults({ inCity: res.data.cityMatches, nearby: res.data.nearbyParks });
      } catch (err) {
        console.error('Error in city,state search:', err);
        setSearchResults({ inCity: [], nearby: [] });
      }
      setDisplayedQuery(`${parsed.city}${parsed.state ? `, ${parsed.state}` : ''}`);
      setSearchKind('city');
      setSearchConfirmed(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setQuery(text);
      if (saveToRecent) await updateRecentSearches(text);
      return;
    }

    // 4) Standalone state search (full name or 2-letter code)
    const stateInfo = resolveState(trimmed);
    if (stateInfo) {
      // Client-side filter (we already have all parks)
      const inState = parks.filter(
        p => String(p?.state || '').toUpperCase() === stateInfo.abbr
      );

      // Optional: sort by distance if available; otherwise by city then name
      const sorted = [...inState].sort((a, b) => {
        const da = a.distanceInMiles ?? Infinity;
        const db = b.distanceInMiles ?? Infinity;
        if (da !== db) return da - db;
        const ac = (a.city || '').localeCompare(b.city || '');
        if (ac !== 0) return ac;
        return (a.name || '').localeCompare(b.name || '');
      });

      setSearchResults({ inCity: sorted, nearby: [] });
      setDisplayedQuery(stateInfo.name);   // show "Arizona" instead of "AZ"
      setSearchKind('state');
      setSearchConfirmed(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setQuery(text);
      if (saveToRecent) await updateRecentSearches(text);
      return;
    }

    // 5) Fallback: general fuzzy (name/city/state)
    const results = fuse.search(trimmed).map(r => r.item);
    setSearchResults({ inCity: results, nearby: [] });
    setDisplayedQuery(trimmed);
    setSearchKind('text');
    setSearchConfirmed(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setQuery(text);
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

      <View
        style={[styles.searchHeader, { paddingTop: insets.top }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
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
            contentContainerStyle={[styles.scrollContainer, { paddingTop: headerHeight + 8 }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* everything currently under the search bar */}

            {/* Render Content */}
            {searchConfirmed ? (
              <View style={styles.allParksContainer}>
                <Text style={styles.sectionTitle}>
                  {searchKind === 'park' ? 'Park' : `Parks in ${displayedQuery}`}
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
                  Parks near {displayedQuery}
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
                            onPress={() => { setQuery(recentSearch); handleSearch(recentSearch, false); }}
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