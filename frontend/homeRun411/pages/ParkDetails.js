import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';

export default function ParkDetails({ route }) {
  const { park } = route.params;

  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; // URL for the default image

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Main Park Image */}
        <ImageBackground
          source={{ uri: park.pictures && park.pictures.mainImageUrl ? park.pictures.mainImageUrl : defaultImage }}
          style={styles.mainImage}
          resizeMode="cover"
        >
        </ImageBackground>

        {/* Location */}
        {(park.city || park.state) && (
          <>
            <Text style={styles.subtitle}>Location</Text>
            <Text style={styles.text}>{`${park.city || ''}, ${park.state || ''}`}</Text>
          </>
        )}

        {/* Coordinates */}
        {park.coordinates && park.coordinates.coordinates && (
          <>
            <Text style={styles.subtitle}>Coordinates</Text>
            <Text style={styles.text}>{park.coordinates.coordinates.join(', ')}</Text>
          </>
        )}

        {/* Field Type */}
        {park.fieldTypes && (
          <>
            <Text style={styles.subtitle}>Field Types</Text>
            <Text style={styles.text}>{park.fieldTypes}</Text>
          </>
        )}

        {/* Amenities */}
        {(park.closestParkingToField || park.bleachers !== undefined || park.handicapAccess || park.concessions || park.coolersAllowed !== undefined || park.canopiesAllowed !== undefined) && (
          <>
            <Text style={styles.subtitle}>Amenities</Text>
            {park.closestParkingToField && <Text style={styles.text}>Closest Parking to Field: {park.closestParkingToField}</Text>}
            {park.bleachers !== undefined && <Text style={styles.text}>Bleachers: {park.bleachers ? 'Available' : 'Not Available'}</Text>}
            {park.handicapAccess && (
              <>
                <Text style={styles.text}>Handicap Access: {park.handicapAccess.hasAccess ? 'Yes' : 'No'}</Text>
                {park.handicapAccess.details && <Text style={styles.text}>Details: {park.handicapAccess.details}</Text>}
              </>
            )}
            {park.concessions && (
              <>
                <Text style={styles.text}>Concessions: {park.concessions.available ? 'Available' : 'Not Available'}</Text>
                {park.concessions.details && <Text style={styles.text}>Details: {park.concessions.details}</Text>}
              </>
            )}
            {park.coolersAllowed !== undefined && <Text style={styles.text}>Coolers Allowed: {park.coolersAllowed ? 'Yes' : 'No'}</Text>}
            {park.canopiesAllowed !== undefined && <Text style={styles.text}>Canopies Allowed: {park.canopiesAllowed ? 'Yes' : 'No'}</Text>}
          </>
        )}

        {/* Park Surface and Features */}
        {(park.surfaceMaterial || park.lights !== undefined || park.restrooms || park.fenceDistance || park.powerWaterAccess !== undefined || park.cellReception !== undefined) && (
          <>
            <Text style={styles.subtitle}>Park Features</Text>
            {park.surfaceMaterial && <Text style={styles.text}>Surface Material: {park.surfaceMaterial}</Text>}
            {park.lights !== undefined && <Text style={styles.text}>Lights: {park.lights ? 'Yes' : 'No'}</Text>}
            {park.restrooms && <Text style={styles.text}>Restrooms: {park.restrooms}</Text>}
            {park.fenceDistance && <Text style={styles.text}>Fence Distance: {park.fenceDistance} ft</Text>}
            {park.powerWaterAccess !== undefined && <Text style={styles.text}>Power and Water Access: {park.powerWaterAccess ? 'Yes' : 'No'}</Text>}
            {park.cellReception !== undefined && <Text style={styles.text}>Cell Reception: {park.cellReception ? 'Good' : 'Poor'}</Text>}
          </>
        )}

        {/* Shaded Areas and Playground */}
        {park.shadedAreas && park.shadedAreas.available !== undefined && (
          <>
            <Text style={styles.subtitle}>Shaded Areas</Text>
            <Text style={styles.text}>{park.shadedAreas.available ? 'Available' : 'Not Available'}</Text>
          </>
        )}

        {park.playground && park.playground.available !== undefined && (
          <>
            <Text style={styles.subtitle}>Playground</Text>
            <Text style={styles.text}>{park.playground.available ? 'Available' : 'Not Available'}</Text>
            {park.playground.closeToParking !== undefined && <Text style={styles.text}>Close to Parking: {park.playground.closeToParking ? 'Yes' : 'No'}</Text>}
          </>
        )}

        {/* Mound Type */}
        {park.moundType && (
          <>
            <Text style={styles.subtitle}>Mound Type</Text>
            <Text style={styles.text}>{park.moundType}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    padding: 20,
  },
  mainImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleOverlay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: 'gray',
  },
  text: {
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
});