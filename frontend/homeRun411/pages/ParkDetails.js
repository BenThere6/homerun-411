import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../utils/axiosInstance';
import { buildSummaries } from '../utils/fieldSummaries';
import { SpecRow, SpecSection } from '../components/SpecList';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Platform, Linking, TextInput, Animated, Alert, ActionSheetIOS } from 'react-native';
import useInPageSearch from '../utils/useInPageSearch';
import { getWeather } from '../utils/getWeather';
import WeatherWidget from '../components/WeatherWidget';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator } from 'react-native';

export default function ParkDetails({ route, navigation }) {
  // Pull in whatever was passed, but manage our own park state
  const incomingPark = (route.params && route.params.park) || {};
  const incomingId = route.params?.parkId || route.params?.id || incomingPark?._id || null;

  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  // Our source of truth for the park on this screen
  const [park, setPark] = useState(incomingPark);

  // Be tolerant to either pictures.mainImageUrl or mainImageUrl
  const initialImg = incomingPark?.pictures?.mainImageUrl || incomingPark?.mainImageUrl || defaultImage;
  const [imageUrl, setImageUrl] = useState(initialImg);

  const [isFavorited, setIsFavorited] = useState(false);
  const [weather, setWeather] = useState(null);
  const [copied, setCopied] = useState(false);
  const [postsPreview, setPostsPreview] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isTopAdmin, setIsTopAdmin] = useState(false);

  const scrollRef = useRef(null);

  const [showFields, setShowFields] = useState(true);
  const [showRestrooms, setShowRestrooms] = useState(true);

  // NEW: controlled open state for Field sub-sections (Surfaces/Dimensions/Amenities/Other)
  const [openGroup, setOpenGroup] = useState({});

  const ASK_TIP_KEY = 'seenAskAboutParkTooltip';
  const TOOLTIP_EXPIRY_DAYS = 30;
  const [showAskTip, setShowAskTip] = useState(false);
  const TIP_BG = 'rgba(54, 65, 82, 0.8)';

  const copyAddress = async () => {
    const line1 = park.address || '';
    const line2 = [park.city, park.state].filter(Boolean).join(', ');
    const text = [line1, line2].filter(Boolean).join('\n');
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // hide after 2s
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ASK_TIP_KEY);
        const now = Date.now();
        let shouldShow = true;

        if (stored) {
          const lastShown = parseInt(stored, 10);
          if (!isNaN(lastShown)) {
            const diffDays = (now - lastShown) / (1000 * 60 * 60 * 24);
            if (diffDays < TOOLTIP_EXPIRY_DAYS) shouldShow = false;
          }
        }

        if (shouldShow) {
          setShowAskTip(true);
          setTimeout(async () => {
            setShowAskTip(false);
            await AsyncStorage.setItem(ASK_TIP_KEY, String(now));
          }, 8000);
        }
      } catch { }
    })();
  }, []);

  // run when we know the park id
  useEffect(() => {
    const fetchRelated = async () => {
      if (!park?._id) return;
      try {
        setLoadingPosts(true);

        const { data } = await axios.get('/api/post', {
          params: { referencedPark: park._id, sort: 'desc' } // server may ignore; we’ll filter locally
        });

        const raw = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        const filtered = raw.filter(p => {
          const rp = p?.referencedPark;
          const id = typeof rp === 'string' ? rp : (rp?._id || rp?.id);
          return id === park._id;
        });

        // optional: cap the preview shown in the card
        const PREVIEW_LIMIT = 5;
        setPostsPreview(filtered.slice(0, PREVIEW_LIMIT));
        setPostsCount(filtered.length);

      } catch (e) {
        console.log('Failed to load park-related posts', e?.response?.data || e.message);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchRelated();
  }, [park?._id]);

  useLayoutEffect(() => {
    if (park?.name) {
      navigation.setOptions({
        title: park.name,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#111111' },
        headerTintColor: '#111111',
        headerRight: undefined,
      });
    }
  }, [navigation, park?.name]);

  // If we only received a skinny park from Forum, fetch the full record by id.
  useEffect(() => {
    const loadFullParkIfNeeded = async () => {
      if (!incomingId) return;

      // Heuristic: if we already have some richer fields, skip the fetch
      const hasDetails =
        (park?.fields && park.fields.length > 0) ||
        (park?.restrooms && park.restrooms.length > 0) ||
        park?.coordinates ||
        park?.battingCages ||
        park?.concessions;

      if (hasDetails) return;

      try {
        const { data } = await axios.get(`/api/park/${incomingId}`);
        setPark(data);

        const newImg = data?.pictures?.mainImageUrl || data?.mainImageUrl || defaultImage;
        setImageUrl(newImg);

        // Also refresh weather now that we have solid coords
        const lat = data?.coordinates?.coordinates?.[1];
        const lon = data?.coordinates?.coordinates?.[0];
        if (lat && lon) {
          const w = await getWeather(lat, lon);
          if (w) setWeather(w);
        }
      } catch (err) {
        console.log('Failed to load full park', err?.response?.data || err.message);
      }
    };

    loadFullParkIfNeeded();
    // Only re-run if the id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingId]);

  // console.log('FIELDS RAW', park.fields?.map(f => ({
  //   name: f.name,
  //   bleachersAvailable: f.bleachersAvailable,
  //   bleachersDescription: f.bleachersDescription
  // })));

  // 2) ADD: compute summaries (auto-discovers every attribute)
  const summaries = useMemo(() => {
    const fields = park?.fields || [];
    return fields.length ? buildSummaries(fields) : [];
  }, [park?.fields]);

  // Group for render convenience
  const grouped = useMemo(() => {
    const by = new Map();
    for (const s of summaries) {
      if (!by.has(s.group)) by.set(s.group, []);
      by.get(s.group).push(s);
    }
    return by;
  }, [summaries]);

  // Build expanders so search opens the right Field sub-section before scrolling
  const searchExpanders = useMemo(() => {
    const ex = {
      // keep restrooms auto-expander
      restrooms: () => setShowRestrooms(true),
    };
    // for each field row, map its key to an opener for its parent group
    ['Surfaces', 'Dimensions', 'Amenities', 'Other'].forEach(g => {
      const list = grouped.get(g);
      if (!list) return;
      for (const s of list) {
        const key = `fields_${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        ex[key] = () => setOpenGroup(prev => (prev[g] ? prev : { ...prev, [g]: true }));
      }
    });
    return ex;
  }, [grouped, setShowRestrooms]);

  // hook centralizing search/highlight/scroll logic (now with dynamic expanders)
  const {
    query, setQuery,
    onLayoutFor,
    flashOpacity,
    handleSubmit,
    chipPress,
    scrollToSection,
    resolveKeyForQuery,
    addAliases,
    clearAliases,
  } = useInPageSearch({
    scrollRef,
    expanders: searchExpanders,
  });

  // Register searchable aliases for subsections & field rows
  useEffect(() => {
    const entries = [];

    // Additional Park Details: targeted subsections
    entries.push(
      { term: 'batting cage', keys: ['details_battingCagesDescription'] },
      { term: 'batting cages', keys: ['details_battingCagesDescription'] },
      { term: 'cage', keys: ['details_battingCagesDescription'] },

      { term: 'sidewalk', keys: ['details_sidewalks'] },
      { term: 'sidewalks', keys: ['details_sidewalks'] },

      { term: 'stairs', keys: ['details_stairsDescription'] },
      { term: 'stair', keys: ['details_stairsDescription'] },

      { term: 'hill', keys: ['details_hillsDescription'] },
      { term: 'hills', keys: ['details_hillsDescription'] },

      { term: 'spectator', keys: ['details_spectatorConditions'] },
      { term: 'spectator location', keys: ['details_spectatorConditions'] },
      { term: 'spectator conditions', keys: ['details_spectatorConditions'] },

      { term: 'electrical outlet', keys: ['details_electricalOutletsForPublicUse'] },
      { term: 'electrical outlets', keys: ['details_electricalOutletsForPublicUse'] },
      { term: 'outlets', keys: ['details_electricalOutletsForPublicUse'] },
      { term: 'outlet location', keys: ['details_electricalOutletsLocation'] },
      { term: 'electrical outlets location', keys: ['details_electricalOutletsLocation'] }
    );

    // Field rows: make each row searchable by its title (and a slug)
    for (const s of summaries) {
      const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const k = `fields_${slug}`;
      entries.push({ term: s.title.toLowerCase(), keys: [k] });

      // simple plurals/synonyms for common cases
      if (s.title.toLowerCase().includes('cage')) {
        entries.push({ term: 'batting cage', keys: [k] });
        entries.push({ term: 'batting cages', keys: [k] });
        entries.push({ term: 'cage', keys: [k] });
      }
    }

    clearAliases();
    addAliases(entries);
  }, [summaries, addAliases, clearAliases]);

  useEffect(() => {
    const key = resolveKeyForQuery(route.params?.jumpTo);
    if (key) {
      const t = setTimeout(() => scrollToSection(key), 450);
      return () => clearTimeout(t);
    }
  }, [route.params?.jumpTo, resolveKeyForQuery, scrollToSection]);

  useFocusEffect(
    React.useCallback(() => {
      const recordRecentlyViewed = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token || !park._id) return;

          await axios.post(`/api/user/recently-viewed/${park._id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error('Failed to record recently viewed park:', error);
        }
      };

      recordRecentlyViewed();
    }, [park._id])
  );

  // Run once we have a real park id (works whether it came from params or the fetch above)
  useEffect(() => {
    const run = async () => {
      // 1) check admin level & log
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const { data } = await axios.get('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const top = Number(data?.adminLevel) === 0 || data?.isTopAdmin === true;
          setIsTopAdmin(top);
          console.log('🔐 profile:', { email: data?.email, adminLevel: data?.adminLevel, isTopAdmin: top });
        } else {
          console.log('🔐 no token found; not logged in');
        }
      } catch (e) {
        console.log('🔐 profile fetch failed', e?.response?.data || e.message);
      }

      // 2) keep existing work
      await checkIfFavorited();

      const lat = park?.coordinates?.coordinates?.[1];
      const lon = park?.coordinates?.coordinates?.[0];
      if (lat && lon) {
        const w = await getWeather(lat, lon);
        if (w) setWeather(w);
      }
    };

    if (park?._id) run();
  }, [park?._id]);

  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = `/api/user/favorite-parks/${park._id}`;
      if (isFavorited) {
        await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !park._id) return;

      const res = await axios.get('/api/user/home-parks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const favoriteIds = (res.data?.favorites ?? []).map(p => p._id);

      setIsFavorited(favoriteIds.includes(park._id));
    } catch (err) {
      console.error('Failed to check favorite status:', err.message);
    }
  };

  // --- Admin-only: more menu + delete flow ---
  const openMoreMenu = () => {
    if (!isTopAdmin) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Park'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) confirmDelete();
        }
      );
    } else {
      // Android/others: go straight to confirm dialog
      confirmDelete();
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this park?',
      'This action cannot be undone. All park data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deletePark },
      ],
      { cancelable: true }
    );
  };

  const deletePark = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !park?._id) return;

      await axios.delete(`/api/park/${park._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Park deleted', 'The park has been deleted.');
      navigation.navigate({
        name: 'Search', // <-- use your actual route name for this screen
        params: { removeParkId: park._id, bump: Date.now() },
        merge: true,
      });
    } catch (e) {
      Alert.alert('Failed to delete', e?.response?.data?.message || e.message || 'Unknown error');
    }
  };

  const openPost = (post) => {
    if (!post?._id) return;
    navigation.navigate('Tabs', {
      screen: 'Forum',
      params: {
        openPostId: post._id,
        bump: Date.now(),
        // so Forum can put a back button that returns here:
        returnTo: { name: 'ParkDetails', params: { parkId: park._id, id: park._id, park } },
      },
    });
  };

  const openMapsApp = () => {
    const lat = park.coordinates?.coordinates?.[1];
    const lon = park.coordinates?.coordinates?.[0];
    const label = park.name || 'Park';

    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lon}(${label})`,
      android: `geo:0,0?q=${lat},${lon}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening maps', err));
    } else {
      console.error('Coordinates not available for park.');
    }
  };

  if (!park || !park.name) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Park details are unavailable.</Text>
      </View>
    );
  }

  const concessionsMainImage = park.images?.find(
    (img) => img.label?.toLowerCase() === 'concessions' && img.isCategoryMain
  );

  const toggleSection = (section) => {
    if (section === 'fields') setShowFields(!showFields);
    if (section === 'restrooms') setShowRestrooms(!showRestrooms);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          {/* Main Park Image */}
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
            onError={() => setImageUrl(defaultImage)}
          >
            {/* Add favorite star */}
            <TouchableOpacity
              style={styles.favoriteIcon}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorited ? 'star' : 'star-outline'}
                size={24}
                color={isFavorited ? '#FFD700' : '#fff'}
              />
            </TouchableOpacity>

            {/* Admin "More" (3 dots) */}
            {isTopAdmin && (
              <TouchableOpacity
                style={styles.moreIcon}
                onPress={openMoreMenu}
                accessibilityRole="button"
                accessibilityLabel="More options"
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Address pill */}
            {(park.address || park.city || park.state) && (
              <>
                <TouchableOpacity style={styles.addressPill} activeOpacity={0.85} onPress={copyAddress}>
                  {!!park.address && <Text style={styles.addressLine}>{park.address}</Text>}
                  <Text style={styles.addressSub}>
                    {park.city}{park.city && park.state ? ', ' : ''}{park.state}
                  </Text>
                </TouchableOpacity>

                {copied && (
                  <View style={styles.copyToast}>
                    <Text style={styles.copyToastText}>Address copied!</Text>
                  </View>
                )}
              </>
            )}

          </ImageBackground>

          {/* In-page search */}
          <View style={{ marginTop: 10, marginBottom: 8 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="Search this page (e.g., parking, concessions, restrooms)"
              returnKeyType="search"
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1, borderColor: '#e5e7eb',
                fontSize: 14,
              }}
            />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {['Concessions', 'Parking', 'Restrooms', 'Fields'].map((label, idx) => {
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => chipPress(label)}
                    style={{
                      flex: 1,
                      backgroundColor: '#f1f5f9',
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      borderRadius: 14,
                      paddingVertical: 8,
                      alignItems: 'center',
                      marginRight: idx < 3 ? 8 : 0, // edges hug left/right, even spacing
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Jump to ${label}`}
                  >
                    <Text style={{ fontSize: 12, color: '#0f172a' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <WeatherWidget
            weather={weather}
            locationLabel={`${[park.city, park.state].filter(Boolean).join(', ')} • Park`.trim()}
          />

          {/* === Action Bar (Ask + Map + Directions) === */}
          <View style={styles.actionBar}>
            {/* Ask */}
            <TouchableOpacity
              style={styles.actionRow}
              accessibilityRole="button"
              accessibilityLabel="Ask Other Users About This Park"
              onPress={() => {
                navigation.navigate('NewPostForm', {
                  prefill: {
                    park: { _id: park._id, name: park.name, city: park.city, state: park.state },
                    contentPlaceholder: 'Ask a question about this park…',
                  },
                });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="help-circle-outline" size={20} color="#0f172a" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.actionTitle}>Ask Other Users About This Park</Text>
                <Text style={styles.actionSub}>Start a post in the forum</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>

            {/* Map View */}
            <TouchableOpacity
              style={styles.actionRow}
              accessibilityRole="button"
              accessibilityLabel="Map View"
              onPress={() => navigation.navigate('MapScreen', { parkId: park._id })}
              activeOpacity={0.9}
            >
              <Ionicons name="map-outline" size={20} color="#7c2d12" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.actionTitle}>Map View</Text>
                <Text style={styles.actionSub}>See in-park & nearby amenities</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>

            {/* Get Directions */}
            <TouchableOpacity
              style={[styles.actionRow, styles.actionRowLast]}
              accessibilityRole="button"
              accessibilityLabel="Get Directions"
              onPress={openMapsApp}
              activeOpacity={0.9}
            >
              <Ionicons name="navigate-outline" size={20} color="#1d4ed8" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.actionTitle}>Get Directions</Text>
                <Text style={styles.actionSub}>Open in your maps app</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Community Q&A (park-related posts) */}
          <View
            onLayout={onLayoutFor('qa')}
            style={styles.qaCard}
          >
            <View style={styles.qaHeader}>
              <Text style={styles.qaTitle}>Park Q&A</Text>
              {loadingPosts ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.qaCount}>{postsCount} post{postsCount === 1 ? '' : 's'}</Text>
              )}
            </View>

            {(!loadingPosts && postsPreview.length === 0) ? (
              <Text style={styles.qaEmpty}>
                No posts about this park yet. Be the first to ask!
              </Text>
            ) : (
              postsPreview.map(p => (
                <View key={p._id} style={styles.qaItem}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#51607A" />
                  <Text
                    numberOfLines={2}
                    style={styles.qaItemLink}
                    accessibilityRole="link"
                    onPress={() => openPost(p)}
                  >
                    {p.title || '(no subject)'}
                  </Text>
                </View>
              ))
            )}

            <Text
              style={styles.qaViewAllLink}
              accessibilityRole="link"
              onPress={() => {
                navigation.navigate('Tabs', {
                  screen: 'Forum',
                  params: {
                    filter: { type: 'park', referencedPark: park._id, parkName: park.name },
                    bump: Date.now(),
                    returnTo: { name: 'ParkDetails', params: { parkId: park._id, id: park._id, park } },
                  },
                });
              }}
            >
              View All Posts
            </Text>
          </View>

          {/* Amenities & Features */}
          <Animated.View
            onLayout={onLayoutFor('amenities')}
            style={[styles.section, { position: 'relative' }]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: '#fde68a', opacity: flashOpacity('amenities'), borderRadius: 12
              }}
            />
            <Text style={styles.sectionTitle}>Amenities & Features</Text>
            <Text style={styles.subtitle}>Pet Friendly</Text>
            <Text style={styles.text}>{park.isPetFriendly ? 'Yes' : 'No'}</Text>
            <Text style={styles.subtitle}>Entrance Fee</Text>
            <Text style={styles.text}>{park.gateEntranceFee ? 'Yes' : 'No'}</Text>
            <Text style={styles.subtitle}>Playground</Text>
            <Text style={styles.text}>{park.playground?.available ? 'Yes' : 'No'}</Text>
            <Text style={styles.subtitle}>Playground Location</Text>
            <Text style={styles.text}>{park.playground?.location || 'No data available'}</Text>
            <Text style={styles.subtitle}>Shared Batting Cages</Text>
            <Text style={styles.text}>{park.battingCages?.shared ? 'Yes' : 'No'}</Text>
          </Animated.View>

          {/* Additional Park Details */}
          <Animated.View
            onLayout={onLayoutFor('details')}
            style={[styles.section, { position: 'relative' }]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: '#fde68a', opacity: flashOpacity('details'), borderRadius: 12
              }}
            />
            <Text style={styles.sectionTitle}>Additional Park Details</Text>
            <Animated.View
              onLayout={onLayoutFor('details_battingCagesDescription', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_battingCagesDescription'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Shared Batting Cage Description</Text>
              <Text style={styles.text}>{park.battingCages?.description || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_parkingLocation', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_parkingLocation'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Parking Location</Text>
              <Text style={styles.text}>{park.closestParkingToField || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_handicapSpots', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_handicapSpots'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Number of Handicap Spots</Text>
              <Text style={styles.text}>{park.parking?.handicapSpots || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_electricalOutletsForPublicUse', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_electricalOutletsForPublicUse'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Electrical Outlets for Public Use</Text>
              <Text style={styles.text}>{park.electricalOutletsForPublicUse ? 'Yes' : 'No'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_electricalOutletsLocation', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_electricalOutletsLocation'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Location of Electrical Outlets</Text>
              <Text style={styles.text}>{park.electricalOutletsLocation || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_sidewalks', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_sidewalks'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Sidewalks</Text>
              <Text style={styles.text}>{park.sidewalks || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_stairsDescription', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_stairsDescription'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Stairs Description</Text>
              <Text style={styles.text}>{park.stairsDescription || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_hillsDescription', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_hillsDescription'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Hills Description</Text>
              <Text style={styles.text}>{park.hillsDescription || 'No data available'}</Text>
            </Animated.View>

            <Animated.View
              onLayout={onLayoutFor('details_spectatorConditions', { offsetKey: 'details' })}
              style={{ position: 'relative', borderRadius: 8 }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  backgroundColor: '#fde68a', opacity: flashOpacity('details_spectatorConditions'), borderRadius: 8
                }}
              />
              <Text style={styles.subtitle}>Spectator Location Conditions</Text>
              <Text style={styles.text}>
                {park.spectatorConditions?.locationTypes?.length > 0
                  ? park.spectatorConditions.locationTypes.join(', ')
                  : 'No data available'}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Restrooms */}
          <Animated.View
            onLayout={onLayoutFor('restrooms')}
            style={[styles.section, { position: 'relative' }]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: '#fde68a', opacity: flashOpacity('restrooms'), borderRadius: 12
              }}
            />
            <TouchableOpacity onPress={() => toggleSection('restrooms')}>
              <Text style={styles.sectionTitle}>🚻 Restrooms {showRestrooms ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showRestrooms && (
              park.restrooms?.length > 0 ? (
                park.restrooms.map((restroom, idx) => (
                  <View key={idx} style={{ marginBottom: 10 }}>
                    <Text style={styles.subtitle}>📍 Location</Text>
                    <Text style={styles.text}>{restroom.location || 'No data available'}</Text>

                    <Text style={styles.subtitle}>🚿 Running Water</Text>
                    <Text style={styles.text}>{restroom.runningWater ? 'Yes' : 'No'}</Text>

                    <Text style={styles.subtitle}>🧷 Changing Table</Text>
                    <Text style={styles.text}>
                      {typeof restroom.changingTable === 'boolean'
                        ? restroom.changingTable ? 'Yes' : 'No'
                        : restroom.changingTable || 'No data available'}
                    </Text>

                    <Text style={styles.subtitle}>🚺 Women's Stalls</Text>
                    <Text style={styles.text}>{restroom.womensStalls ?? 'No data available'}</Text>

                    <Text style={styles.subtitle}>🚹 Men's Stalls/Urinals</Text>
                    <Text style={styles.text}>{restroom.mensStalls ?? 'No data available'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.text}>No restroom information yet.</Text>
              )
            )}
          </Animated.View>

          {/* Concessions */}
          <Animated.View
            onLayout={onLayoutFor('concessions')}
            style={[styles.section, { position: 'relative' }]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: '#fde68a', opacity: flashOpacity('concessions'), borderRadius: 12
              }}
            />
            {concessionsMainImage && (
              <ImageBackground
                source={{ uri: concessionsMainImage.url }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.sectionTitle}>Concessions</Text>
            <Text style={styles.subtitle}>Available</Text>
            <Text style={styles.text}>{park.concessions?.available ? 'Yes' : 'No'}</Text>

            {park.concessions?.available === true && (
              <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
                <Text style={styles.noteText}>
                  Please note: The presence of a concessions facility doesn’t guarantee service during all events. Operating hours vary by schedule and staffing.
                </Text>
              </View>
            )}

            <Text style={styles.subtitle}>Snacks</Text>
            <Text style={styles.text}>{park.concessions?.snacks ? 'Yes' : 'No'}</Text>

            <Text style={styles.subtitle}>Drinks</Text>
            <Text style={styles.text}>{park.concessions?.drinks ? 'Yes' : 'No'}</Text>

            <Text style={styles.subtitle}>Other Food Description</Text>
            <Text style={styles.text}>{park.concessions?.otherFood || 'No data available'}</Text>

            <Text style={styles.subtitle}>Payment Methods</Text>
            <Text style={styles.text}>
              {park.concessions?.paymentMethods?.length > 0
                ? park.concessions.paymentMethods.join(', ')
                : 'No data available'}
            </Text>
          </Animated.View>

          {/* Fields */}
          {/* === Field Details (single white card, labeled) === */}
          <Animated.View
            onLayout={onLayoutFor('fields')}
            style={[styles.section, { position: 'relative' }]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: '#fde68a', opacity: flashOpacity('fields'), borderRadius: 12
              }}
            />
            <Text style={styles.sectionTitle}>Field Details</Text>

            {['Surfaces', 'Dimensions', 'Amenities', 'Other'].map((g, i, arr) => {
              const list = grouped.get(g);
              if (!list || list.length === 0) return null;
              return (
                <React.Fragment key={g}>
                  <SpecSection
                    heading={g}
                    collapsible
                    defaultExpanded={!!openGroup[g]}
                    key={`spec-${g}-${openGroup[g] ? 'open' : 'closed'}`}
                  >
                    {(() => {
                      // For 'Dimensions', sort to: Left → Center → Right (others keep their relative order)
                      const order = { 'Left Field Distance': 1, 'Center Field Distance': 2, 'Right Field Distance': 3 };
                      const items =
                        g === 'Dimensions'
                          ? [...list].sort((a, b) => {
                            const ra = order[a.title] ?? 50;
                            const rb = order[b.title] ?? 50;
                            // keep stable-ish order for non-L/C/R by secondary title sort
                            return ra - rb || a.title.localeCompare(b.title);
                          })
                          : list;

                      return items.map((s) => {
                        // build subItems (prefix pure-numeric field names with "Field ")
                        const prettyName = (n) =>
                          (typeof n === 'number' || /^\s*\d+\s*$/.test(String(n)))
                            ? `Field ${String(n).trim()}`
                            : n;

                        let subItems = null;
                        if (s.tieAllDifferent) {
                          subItems = s.exceptions?.map(e => `${prettyName(e.fieldName)}: ${e.display}`);
                        } else if (s.exceptions?.length) {
                          subItems = s.exceptions.map(e => `${prettyName(e.fieldName)}: ${e.display}`);
                        }
                        // only add " ft" for the Dimensions group
                        const isDimensions = g === 'Dimensions';

                        // helper to append " ft" if the token is purely numeric (int or decimal)
                        const addFt = (val) => {
                          if (val == null) return val;
                          const str = String(val).trim();
                          return /^\d+(\.\d+)?$/.test(str) ? `${str} ft` : str;
                        };

                        return (
                          <Animated.View
                            key={s.key}
                            onLayout={onLayoutFor(`fields_${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, { offsetKey: 'fields' })}
                            style={{ position: 'relative', borderRadius: 6 }}
                          >
                            <Animated.View
                              pointerEvents="none"
                              style={{
                                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                backgroundColor: '#fde68a',
                                opacity: flashOpacity(`fields_${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
                                borderRadius: 6
                              }}
                            />
                            <SpecRow
                              title={s.title}
                              value={isDimensions ? addFt(s.commonValueDisplay) : s.commonValueDisplay}
                              subItems={
                                isDimensions
                                  ? subItems?.map(line => {
                                    const [field, raw] = line.split(':').map(x => x.trim());
                                    return /^\d+(\.\d+)?$/.test(raw) ? `${field}: ${raw} ft` : line;
                                  })
                                  : subItems
                              }
                            />
                          </Animated.View>
                        );
                      });
                    })()}
                  </SpecSection>

                  {/* divider between subheadings */}
                  {i < arr.length - 1 ? <View style={styles.fieldsDivider} /> : null}
                </React.Fragment>
              );
            })}
          </Animated.View>

        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 8 },
  mainImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#111111' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginTop: 6 },
  text: { fontSize: 14, color: '#444444', marginBottom: 4 },
  fixedBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 25 },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#ffffff', // white card
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldCard: {
    padding: 12,
    backgroundColor: '#fafafa', // light gray card
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  customButton: {
    backgroundColor: '#7BAAF7',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  categoryImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  favoriteIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    padding: 6,
    zIndex: 2,
  },
  moreIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 6,
    zIndex: 2,
  },
  centeredSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredText: {
    fontSize: 16,
    fontWeight: '600', // or 'bold' for even more pop
    color: '#1b5e20',  // deeper green for visual contrast
    // marginBottom: 4,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b5e20',
    textAlign: 'center',
    marginBottom: 2,
  },
  fieldsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4e684e',
    textAlign: 'center',
    marginTop: 2,
  },
  weatherSection: {
    // backgroundColor: '#fff3cd',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20, // same as .section
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewColumn: {
    flex: 0.35, // around 35% width
    justifyContent: 'center',
  },
  weatherWrapper: {
    flex: 0.65, // remaining 65%
    alignItems: 'flex-end',
  },
  addressPill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addressLine: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
  },
  addressSub: {
    color: '#555555',
    fontSize: 12,
    marginTop: 1,
  },
  weatherStandalone: {
    marginTop: 12,
    marginHorizontal: -10,
    marginBottom: 15,
  },
  copyToast: {
    position: 'absolute',
    left: 10,
    bottom: 58,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyToastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc', // subtle card background
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noteText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  qaCard: {
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  qaTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  qaCount: { fontSize: 12, color: '#64748b' },
  qaEmpty: { fontSize: 13, color: '#475569', marginBottom: 8 },
  qaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  qaItemText: { fontSize: 13, color: '#111827', flex: 1 },
  qaButton: {
    marginTop: 8,
    backgroundColor: '#7BAAF7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  qaButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  actionBar: {
    marginTop: 10,
    marginBottom: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb', // unified background (light gray)
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  qaItemLink: {
    fontSize: 13,
    color: '#0f172a',
    textDecorationLine: 'underline',
    flex: 1,
  },
  qaViewAllLink: {
    marginTop: 8,
    fontSize: 13,
    color: '#1d4ed8',
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
  },
  fieldsDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
});