import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../utils/axiosInstance';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Platform, Linking } from 'react-native';
import { getWeather } from '../utils/getWeather';
import WeatherWidget from '../components/WeatherWidget';
import { useLayoutEffect } from 'react';
import * as Clipboard from 'expo-clipboard';

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

  const copyAddress = async () => {
    const line1 = park.address || '';
    const line2 = [park.city, park.state].filter(Boolean).join(', ');
    const text = [line1, line2].filter(Boolean).join('\n');
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // hide after 2s
  };

  useLayoutEffect(() => {
    if (park.name) {
      navigation.setOptions({
        title: park.name,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          color: '#111111',
        },
        headerTintColor: '#111111',
      });
    }
  }, [navigation, park.name]);

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

  const [showFields, setShowFields] = useState(true);
  const [showRestrooms, setShowRestrooms] = useState(true);

  const toggleSection = (section) => {
    if (section === 'fields') setShowFields(!showFields);
    if (section === 'restrooms') setShowRestrooms(!showRestrooms);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 60 }}>
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

          {/* Weather – full-width, no parent white card */}
          <View style={styles.weatherStandalone}>
            <WeatherWidget weather={weather} />
          </View>

          {/* Amenities & Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities & Features</Text>
            <Text style={styles.subtitle}>Entrance Fee</Text>
            <Text style={styles.text}>{park.gateEntranceFee ? 'Yes' : 'No'}</Text>
            <Text style={styles.subtitle}>Playground</Text>
            <Text style={styles.text}>{park.playground?.available ? 'Yes' : 'No'}</Text>
            <Text style={styles.subtitle}>Playground Location</Text>
            <Text style={styles.text}>{park.playground?.location || 'No data available'}</Text>
            <Text style={styles.subtitle}>Shared Batting Cages</Text>
            <Text style={styles.text}>{park.battingCages?.shared ? 'Yes' : 'No'}</Text>
          </View>

          {/* Additional Park Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Park Details</Text>
            <Text style={styles.subtitle}>Shared Batting Cage Description</Text>
            <Text style={styles.text}>{park.battingCages?.description || 'No data available'}</Text>

            <Text style={styles.subtitle}>Parking Location</Text>
            <Text style={styles.text}>{park.closestParkingToField || 'No data available'}</Text>

            <Text style={styles.subtitle}>Number of Handicap Spots</Text>
            <Text style={styles.text}>{park.parking?.handicapSpots || 'No data available'}</Text>

            <Text style={styles.subtitle}>Electrical Outlets for Public Use</Text>
            <Text style={styles.text}>{park.electricalOutletsForPublicUse ? 'Yes' : 'No'}</Text>

            <Text style={styles.subtitle}>Location of Electrical Outlets</Text>
            <Text style={styles.text}>{park.electricalOutletsLocation || 'No data available'}</Text>

            <Text style={styles.subtitle}>Sidewalks</Text>
            <Text style={styles.text}>{park.sidewalks || 'No data available'}</Text>

            <Text style={styles.subtitle}>Stairs Description</Text>
            <Text style={styles.text}>{park.stairsDescription || 'No data available'}</Text>

            <Text style={styles.subtitle}>Hills Description</Text>
            <Text style={styles.text}>{park.hillsDescription || 'No data available'}</Text>

            <Text style={styles.subtitle}>Spectator Location Conditions</Text>
            <Text style={styles.text}>
              {park.spectatorConditions?.locationTypes?.length > 0
                ? park.spectatorConditions.locationTypes.join(', ')
                : 'No data available'}
            </Text>
          </View>

          {/* Restrooms */}
          {park.restrooms?.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection('restrooms')}>
                <Text style={styles.sectionTitle}>🚻 Restrooms {showRestrooms ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showRestrooms && park.restrooms.map((restroom, idx) => (
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
              ))}
            </View>
          )}

          {/* Concessions */}
          <View style={styles.section}>
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
          </View>


          {/* Fields */}

          <View style={styles.section}>
            <TouchableOpacity onPress={() => toggleSection('fields')}>
              <Text style={styles.sectionTitle}>⚾ Fields {showFields ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showFields && (
              <>
                {(() => {
                  // ✅ Safely handle missing/undefined fields
                  const grouped = (park.fields ?? []).reduce((acc, field) => {
                    const name = field?.name || 'Unnamed Field';
                    (acc[name] = acc[name] || []).push(field);
                    return acc;
                  }, {});

                  const groups = Object.entries(grouped);

                  if (groups.length === 0) {
                    return <Text style={styles.text}>No field data</Text>;
                  }

                  return groups.map(([name, fields]) => (
                    <View key={name} style={styles.fieldCard}>
                      <Text style={styles.subtitle}>{name}</Text>
                      {fields.map((field, idx) => (
                        <View key={idx} style={{ marginBottom: 10 }}>
                          <Text style={styles.subtitle}>📍 Location</Text>
                          <Text style={styles.text}>{field?.location || 'No data available'}</Text>

                          <Text style={styles.subtitle}>📏 Fence Distance</Text>
                          <Text style={styles.text}>
                            {field?.fenceDistance ? `${field.fenceDistance} ft` : 'No data available'}
                          </Text>

                          <Text style={styles.subtitle}>🧱 Fence Height</Text>
                          <Text style={styles.text}>
                            {field?.fenceHeight ? `${field.fenceHeight} ft` : 'No data available'}
                          </Text>

                          <Text style={styles.subtitle}>🌱 Outfield</Text>
                          <Text style={styles.text}>{field?.outfieldMaterial || 'No data available'}</Text>

                          <Text style={styles.subtitle}>🏔 Infield</Text>
                          <Text style={styles.text}>{field?.infieldMaterial || 'No data available'}</Text>

                          <Text style={styles.subtitle}>🧱 Backstop</Text>
                          <Text style={styles.text}>{field?.backstopMaterial || 'No data available'}</Text>
                        </View>
                      ))}
                    </View>
                  ));
                })()}
              </>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Navigation Button */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity style={styles.customButton} onPress={openMapsApp}>
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>
      </View>
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
});