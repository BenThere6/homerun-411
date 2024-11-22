import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Button, Platform, Linking } from 'react-native';

export default function ParkDetails({ route }) {
  const { park = {} } = route.params || {};
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  const [imageUrl, setImageUrl] = useState(park.pictures?.mainImageUrl || defaultImage);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Main Park Image */}
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.mainImage}
          resizeMode="cover"
          onError={() => setImageUrl(defaultImage)}
        />

        {/* General Park Information */}
        <Text style={styles.subtitle}>Name</Text>
        <Text style={styles.text}>{park.name || 'No data available'}</Text>

        <Text style={styles.subtitle}>Location</Text>
        <Text style={styles.text}>
          {park.city || 'No city available'}, {park.state || 'No state available'}
        </Text>

        <Text style={styles.subtitle}>Address</Text>
        <Text style={styles.text}>{park.address || 'No data available'}</Text>

        <Text style={styles.subtitle}>Number of Fields</Text>
        <Text style={styles.text}>{park.numberOfFields || 'No data available'}</Text>

        {/* Navigate Button */}
        <View style={styles.buttonContainer}>
          <Button title="Navigate" onPress={openMapsApp} color="#007BFF" />
        </View>

        <Text style={styles.subtitle}>Google Maps</Text>
        <Text style={styles.text}>{park.googleMaps?.embedUrl || 'No data available'}</Text>

        {/* Parking Information */}
        <Text style={styles.subtitle}>Closest Parking to Field</Text>
        <Text style={styles.text}>{park.closestParkingToField || 'No data available'}</Text>

        <Text style={styles.subtitle}>Parking Locations</Text>
        <Text style={styles.text}>
          {Array.isArray(park.parking?.locations) && park.parking.locations.length > 0
            ? park.parking.locations.join(', ')
            : 'No data available'}
        </Text>

        <Text style={styles.subtitle}>Handicap Parking Spots</Text>
        <Text style={styles.text}>{park.parking?.handicapSpots || 'No data available'}</Text>

        {/* Park Amenities */}
        <Text style={styles.subtitle}>Park Shade</Text>
        <Text style={styles.text}>{park.parkShade || 'No data available'}</Text>

        <Text style={styles.subtitle}>Restrooms</Text>
        {park.restrooms?.length > 0
          ? park.restrooms.map((restroom, index) => (
              <View key={index}>
                <Text style={styles.text}>Location: {restroom.location || 'No data available'}</Text>
                <Text style={styles.text}>
                  Running Water: {restroom.runningWater ? 'Yes' : 'No data available'}
                </Text>
                <Text style={styles.text}>
                  Changing Table: {restroom.changingTable || 'No data available'}
                </Text>
                <Text style={styles.text}>
                  Number of Stalls: {restroom.numStalls || 'No data available'}
                </Text>
              </View>
            ))
          : <Text style={styles.text}>No data available</Text>}

        <Text style={styles.subtitle}>Concessions</Text>
        <Text style={styles.text}>
          {park.concessions?.available ? 'Available' : 'Not available'}
        </Text>
        <Text style={styles.text}>
          Snacks: {park.concessions?.snacks ? 'Yes' : 'No data available'}
        </Text>
        <Text style={styles.text}>
          Drinks: {park.concessions?.drinks ? 'Yes' : 'No data available'}
        </Text>
        <Text style={styles.text}>
          Payment Methods: {Array.isArray(park.concessions?.paymentMethods) && park.concessions.paymentMethods.length > 0
            ? park.concessions.paymentMethods.join(', ')
            : 'No data available'}
        </Text>

        <Text style={styles.subtitle}>Coolers Allowed</Text>
        <Text style={styles.text}>{park.coolersAllowed ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Canopies Allowed</Text>
        <Text style={styles.text}>{park.canopiesAllowed ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Surface Material</Text>
        <Text style={styles.text}>{park.surfaceMaterial || 'No data available'}</Text>

        <Text style={styles.subtitle}>Lights</Text>
        <Text style={styles.text}>{park.lights ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Fence Distance</Text>
        <Text style={styles.text}>
          {park.fenceDistance ? `${park.fenceDistance} ft` : 'No data available'}
        </Text>

        <Text style={styles.subtitle}>Power Access</Text>
        <Text style={styles.text}>
          Available: {park.powerAccess?.available ? 'Yes' : 'No data available'}
        </Text>
        <Text style={styles.text}>
          Locations: {Array.isArray(park.powerAccess?.locations) && park.powerAccess.locations.length > 0
            ? park.powerAccess.locations.join(', ')
            : 'No data available'}
        </Text>

        <Text style={styles.subtitle}>Sidewalks</Text>
        <Text style={styles.text}>{park.sidewalks ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Gravel Paths</Text>
        <Text style={styles.text}>{park.gravelPaths ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Stairs</Text>
        <Text style={styles.text}>{park.stairs ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Hills</Text>
        <Text style={styles.text}>{park.hills ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Gate Entrance Fee</Text>
        <Text style={styles.text}>{park.gateEntranceFee ? 'Yes' : 'No data available'}</Text>

        <Text style={styles.subtitle}>Playground</Text>
        <Text style={styles.text}>
          {park.playground?.available ? 'Available' : 'No data available'}
        </Text>
        <Text style={styles.text}>
          Location: {park.playground?.location || 'No data available'}
        </Text>

        <Text style={styles.subtitle}>Spectator Conditions</Text>
        <Text style={styles.text}>
          {Array.isArray(park.spectatorConditions?.locationTypes) && park.spectatorConditions.locationTypes.length > 0
            ? park.spectatorConditions.locationTypes.join(', ')
            : 'No data available'}
        </Text>

        {/* Fields */}
        {park.fields?.length > 0 ? (
          park.fields.map((field, index) => (
            <View key={index}>
              <Text style={styles.subtitle}>Field {index + 1}</Text>
              <Text style={styles.text}>Name: {field.name || 'No data available'}</Text>
              <Text style={styles.text}>Location: {field.location || 'No data available'}</Text>
              <Text style={styles.text}>Fence Distance: {field.fenceDistance || 'No data available'}</Text>
              <Text style={styles.text}>Type: {field.fieldType || 'No data available'}</Text>
              <Text style={styles.text}>Outfield Material: {field.outfieldMaterial || 'No data available'}</Text>
              <Text style={styles.text}>Infield Material: {field.infieldMaterial || 'No data available'}</Text>
              <Text style={styles.text}>Mound Type: {field.moundType || 'No data available'}</Text>
              <Text style={styles.text}>Shade Description: {field.fieldShadeDescription || 'No data available'}</Text>
              <Text style={styles.text}>Parking Distance: {field.parkingDistanceToField || 'No data available'}</Text>
              <Text style={styles.text}>Bleachers Available: {field.bleachersAvailable ? 'Yes' : 'No data available'}</Text>
              <Text style={styles.text}>Bleachers Description: {field.bleachersDescription || 'No data available'}</Text>
              <Text style={styles.text}>Backstop Material: {field.backstopMaterial || 'No data available'}</Text>
              <Text style={styles.text}>Backstop Distance: {field.backstopDistance || 'No data available'}</Text>
              <Text style={styles.text}>Dugouts Covered: {field.dugoutsCovered ? 'Yes' : 'No data available'}</Text>
              <Text style={styles.text}>Dugouts Material: {field.dugoutsMaterial || 'No data available'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.text}>No fields available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  contentContainer: { padding: 20 },
  mainImage: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10, color: 'gray' },
  text: { fontSize: 16, color: 'black', marginBottom: 10 },
  buttonContainer: { marginTop: 20, marginBottom: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: 'red' },
});