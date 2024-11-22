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

        {/* Location */}
        {(park.city || park.state) && (
          <>
            <Text style={styles.subtitle}>Location</Text>
            <Text style={styles.text}>{`${park.city || ''}, ${park.state || ''}`}</Text>
          </>
        )}

        {/* Navigate Button */}
        {park.coordinates?.coordinates && (
          <View style={styles.buttonContainer}>
            <Button title="Navigate" onPress={openMapsApp} color="#007BFF" />
          </View>
        )}

        {/* Parking Section */}
        {park.parking?.locations?.length > 0 && (
          <>
            <Text style={styles.subtitle}>Parking</Text>
            <Text style={styles.text}>
              Locations: {park.parking.locations.join(', ')}
            </Text>
          </>
        )}

        {park.closestParkingToField && (
          <>
            <Text style={styles.subtitle}>Closest Parking to Field</Text>
            <Text style={styles.text}>{park.closestParkingToField}</Text>
          </>
        )}

        {park.concessions && typeof park.concessions === 'object' && park.concessions.available && (
          <>
            <Text style={styles.subtitle}>Concessions</Text>
            <Text style={styles.text}>Available</Text>
            {park.concessions.details && (
              <Text style={styles.text}>Details: {park.concessions.details}</Text>
            )}
            {park.concessions.paymentMethods && (
              <Text style={styles.text}>Payment Methods: {park.concessions.paymentMethods.join(', ')}</Text>
            )}
          </>
        )}

        {park.coolersAllowed !== undefined && (
          <>
            <Text style={styles.subtitle}>Coolers Allowed</Text>
            <Text style={styles.text}>{park.coolersAllowed ? 'Yes' : 'No'}</Text>
          </>
        )}

        {/* Add other park details similarly with safe checks */}
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