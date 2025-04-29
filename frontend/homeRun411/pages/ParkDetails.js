import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { BACKEND_URL } from '@env';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Platform, Linking } from 'react-native';

console.log('BACKEND_URL:', BACKEND_URL);

export default function ParkDetails({ route }) {
  const { park = {} } = route.params || {};
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  const [imageUrl, setImageUrl] = useState(park.mainImageUrl || defaultImage);
  const [isFavorited, setIsFavorited] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const recordRecentlyViewed = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token || !park._id) return;
  
          await axios.post(`${BACKEND_URL}/api/user/recently-viewed/${park._id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error('Failed to record recently viewed park:', error);
        }
      };
  
      recordRecentlyViewed();
    }, [park._id])
  );
  
  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = `${BACKEND_URL}/api/user/favorite-parks/${park._id}`;
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
          </ImageBackground>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Park Overview</Text>
            <Text style={styles.subtitle}>Name</Text>
            <Text style={styles.text}>{park.name}</Text>
            <Text style={styles.subtitle}>Location</Text>
            <Text style={styles.text}>
              {park.city || 'No city available'}, {park.state || 'No state available'}
            </Text>
            {park.address && (
              <>
                <Text style={styles.subtitle}>Address</Text>
                <Text style={styles.text}>{park.address}</Text>
              </>
            )}
            <Text style={styles.subtitle}>Number of Fields</Text>
            <Text style={styles.text}>{park.numberOfFields || 'No data available'}</Text>
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
              <Text style={styles.sectionTitle}>Restrooms</Text>
              {park.restrooms.map((restroom, idx) => (
                <View key={idx} style={{ marginBottom: 10 }}>
                  <Text style={styles.subtitle}>Restroom Location</Text>
                  <Text style={styles.text}>{restroom.location || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Running Water</Text>
                  <Text style={styles.text}>{restroom.runningWater ? 'Yes' : 'No'}</Text>

                  <Text style={styles.subtitle}>Changing Table</Text>
                  <Text style={styles.text}>
                    {typeof restroom.changingTable === 'boolean'
                      ? restroom.changingTable ? 'Yes' : 'No'
                      : restroom.changingTable || 'No data available'}
                  </Text>

                  <Text style={styles.subtitle}>Women's Stalls</Text>
                  <Text style={styles.text}>
                    {restroom.womensStalls !== null && restroom.womensStalls !== undefined
                      ? restroom.womensStalls
                      : 'No data available'}
                  </Text>

                  <Text style={styles.subtitle}>Men's Stalls/Urinals</Text>
                  <Text style={styles.text}>
                    {restroom.mensStalls !== null && restroom.mensStalls !== undefined
                      ? restroom.mensStalls
                      : 'No data available'}
                  </Text>
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
            <Text style={styles.sectionTitle}>Fields</Text>
            {park.fields?.length > 0 ? (
              park.fields.map((field, index) => (
                <View key={index} style={styles.fieldCard}>
                  <Text style={styles.subtitle}>
                    Field {index + 1}: {field.name || 'Unnamed Field'}
                  </Text>

                  <Text style={styles.subtitle}>Field Location</Text>
                  <Text style={styles.text}>{field.location || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Type</Text>
                  <Text style={styles.text}>
                    {field.fieldType
                      ? field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1).replace('-', '-B')
                      : 'No data available'}
                  </Text>

                  <Text style={styles.subtitle}>Fence Distance</Text>
                  <Text style={styles.text}>{field.fenceDistance ? `${field.fenceDistance} ft` : 'No data available'}</Text>

                  <Text style={styles.subtitle}>Fence Height</Text>
                  <Text style={styles.text}>{field.fenceHeight ? `${field.fenceHeight} ft` : 'No data available'}</Text>

                  <Text style={styles.subtitle}>Outfield Material</Text>
                  <Text style={styles.text}>{field.outfieldMaterial || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Infield Material</Text>
                  <Text style={styles.text}>{field.infieldMaterial || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Mound Type</Text>
                  <Text style={styles.text}>{field.moundType || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Field Shade Description</Text>
                  <Text style={styles.text}>{field.fieldShadeDescription || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Parking Distance</Text>
                  <Text style={styles.text}>{field.parkingDistanceToField || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Bleachers Available</Text>
                  <Text style={styles.text}>{field.bleachersAvailable ? 'Yes' : 'No'}</Text>

                  <Text style={styles.subtitle}>Bleachers Description</Text>
                  <Text style={styles.text}>{field.bleachersDescription || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Backstop Material</Text>
                  <Text style={styles.text}>{field.backstopMaterial || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Backstop Distance</Text>
                  <Text style={styles.text}>{field.backstopDistance ? `${field.backstopDistance} ft` : 'No data available'}</Text>

                  <Text style={styles.subtitle}>Dugouts Covered</Text>
                  <Text style={styles.text}>{field.dugoutsCovered ? 'Yes' : 'No'}</Text>

                  <Text style={styles.subtitle}>Dugouts Material</Text>
                  <Text style={styles.text}>{field.dugoutsMaterial || 'No data available'}</Text>

                  <Text style={styles.subtitle}>Batting Cages</Text>
                  <Text style={styles.text}>{field.battingCages ? 'Yes' : 'No'}</Text>

                  <Text style={styles.subtitle}>Warning Track</Text>
                  <Text style={styles.text}>{field.warningTrack ? 'Yes' : 'No'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.text}>No fields available</Text>
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
  container: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 8 },
  mainImage: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 16, fontWeight: '600', color: 'gray', marginTop: 5 },
  text: { fontSize: 14, color: 'black' },
  fieldCard: { padding: 10, backgroundColor: '#eef', borderRadius: 8, marginBottom: 10 },
  fixedBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 25 },
  customButton: { backgroundColor: '#007BFF', padding: 12, borderRadius: 8, alignItems: 'center' },
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
});