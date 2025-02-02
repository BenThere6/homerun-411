import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Platform, Linking } from 'react-native';

export default function ParkDetails({ route }) {
  const { park = {} } = route.params || {};
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  const [imageUrl, setImageUrl] = useState(park.pictures?.mainImageUrl || defaultImage);

  // useEffect(() => {
  //   console.log("Park Data in Component:", JSON.stringify(park, null, 2));
  // }, [park]);

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
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.contentContainer}>
          {/* Main Park Image */}
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
            onError={() => setImageUrl(defaultImage)}
          />

          {/* General Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Information</Text>

            <Text style={styles.subtitle}>Name</Text>
            <Text style={styles.text}>{park.name}</Text>


            <Text style={styles.subtitle}>City</Text>
            <Text style={styles.text}>
              {park.city || 'No city available'}, {park.state || 'No state available'}
            </Text>

            {park.address && (
              <>
                <Text style={styles.subtitle}>Address</Text>
                <Text style={styles.text}>{park.address}</Text>
              </>
            )}

            {/* {park.numberOfFields && (
            <> */}
            <Text style={styles.subtitle}>Number of Fields</Text>
            <Text style={styles.text}>{park.numberOfFields}</Text>
            {/* </>
          )} */}

            {/* {park.sharedBattingCages && (
            <> */}
            <Text style={styles.subtitle}>Shared Batting Cages</Text>
            <Text style={styles.text}>
              {park.battingCages?.shared != null ? (park.battingCages.shared ? 'Yes' : 'No') : 'No data available'}
            </Text>
            {/* </>
          )} */}

            {/* {park.sharedBattingCageDescription && (
            <> */}
            <Text style={styles.subtitle}>Batting Cage Description</Text>
            <Text style={styles.text}>{park.battingCages.description}</Text>
            {/* </>
          )} */}
          </View>

          {/* Additional Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Features</Text>

            {/* {park.entranceFee && (
            <> */}
            <Text style={styles.subtitle}>Entrance Fee</Text>
            <Text style={styles.text}>{park.gateEntranceFee ? 'Yes' : 'No'}</Text>
            {/* </>
          )} */}

            {/* {park.playground && (
            <> */}
            <Text style={styles.subtitle}>Playground</Text>
            <Text style={styles.text}>{park.playground.available ? 'Yes' : 'No'}</Text>
            {/* </>
          )} */}

            {/* {park.playgroundLocation && (
            <> */}
            <Text style={styles.subtitle}>Playground Location</Text>
            <Text style={styles.text}>{park.playground.location}</Text>
            {/* </>
          )} */}

            {/* {park.spectatorLocationConditions && (
            <> */}
            <Text style={styles.subtitle}>Spectator Surface Type</Text>
            <Text style={styles.text}>
              {Array.isArray(park.spectatorConditions?.locationTypes) && park.spectatorConditions.locationTypes.length > 0
                ? park.spectatorConditions.locationTypes[0].charAt(0).toUpperCase() + park.spectatorConditions.locationTypes[0].slice(1)
                : 'No data available'}
            </Text>

            {/* </>
          )} */}

            {/* {park.otherNotes && (
            <> */}
            <Text style={styles.subtitle}>Other Notes</Text>
            <Text style={styles.text}>{park.otherNotes}</Text>
            {/* </>
          )} */}
          </View>

          {/* Parking Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parking Information</Text>
            <Text style={styles.subtitle}>Parking Location</Text>
            <Text style={styles.text}>{park.parking.locations || 'No data available'}</Text>
            <Text style={styles.subtitle}>Handicap Parking Spots</Text>
            <Text style={styles.text}>{park.parking?.handicapSpots || 'No data available'}</Text>
          </View>

          {/* Park Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Park Amenities</Text>
            <Text style={styles.subtitle}>Park Shade</Text>
            <Text style={styles.text}>{park.parkShade || 'No data available'}</Text>
            <Text style={styles.subtitle}>Coolers Allowed</Text>
            <Text style={styles.text}>{park.coolersAllowed ? 'Yes' : 'No data available'}</Text>
            <Text style={styles.subtitle}>Canopies Allowed</Text>
            <Text style={styles.text}>{park.canopiesAllowed ? 'Yes' : 'No data available'}</Text>
            <Text style={styles.subtitle}>Field Lights</Text>
            <Text style={styles.text}>{park.lights ? 'Yes' : 'No data available'}</Text>
          </View>

          {/* Concessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Concessions</Text>
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
              Payment Methods:{' '}
              {Array.isArray(park.concessions?.paymentMethods) && park.concessions.paymentMethods.length > 0
                ? park.concessions.paymentMethods.join(', ')
                : 'No data available'}
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fields</Text>
            {park.fields?.length > 0 ? (
              park.fields.map((field, index) => (
                <View key={index}>
                  <Text style={styles.subtitle}>Field {index + 1}</Text>
                  <Text style={styles.text}>Name: {field.name || 'No data available'}</Text>
                  <Text style={styles.text}>Location: {field.location || 'No data available'}</Text>
                  <Text style={styles.text}>
                    Field Type: {field.fieldType
                      ? field.fieldType === 'both'
                        ? 'Baseball and Softball'
                        : field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1)
                      : 'No data available'}
                  </Text>
                  <Text style={styles.text}>
                    Fence Distance: {field.fenceDistance
                      ? `${String(field.fenceDistance).trim()} ft`
                      : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Fence Height: {field.fenceHeight != null
                    ? `${String(field.fenceHeight).trim()} ft`
                    : 'No data available'}
                  </Text>

                  <Text style={styles.text}>
                    Outfield Material: {field.outfieldMaterial
                      ? field.outfieldMaterial.charAt(0).toUpperCase() + field.outfieldMaterial.slice(1)
                      : 'No data available'}
                  </Text>
                  <Text style={styles.text}>
                    Infield Material: {field.infieldMaterial
                      ? field.infieldMaterial.charAt(0).toUpperCase() + field.infieldMaterial.slice(1)
                      : 'No data available'}
                  </Text>
                  <Text style={styles.text}>
                    Mound Type: {field.moundType
                      ? field.moundType.charAt(0).toUpperCase() + field.moundType.slice(1)
                      : 'No data available'}
                  </Text>
                  <Text style={styles.text}>Shade Description: {field.fieldShadeDescription || 'No data available'}</Text>
                  <Text style={styles.text}>Parking Distance: {field.parkingDistanceToField || 'No data available'}</Text>
                  <Text style={styles.text}>
                    Bleachers Available: {field.bleachersAvailable ? 'Yes' : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Backstop Material: {field.backstopMaterial
                    ? field.backstopMaterial.charAt(0).toUpperCase() + field.backstopMaterial.slice(1)
                    : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Backstop Distance: {field.backstopDistance != null
                    ? `${String(field.backstopDistance).trim()} ft`
                    : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Dugouts Covered: {field.dugoutsCovered != null
                    ? (field.dugoutsCovered ? 'Yes' : 'No')
                    : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Dugout Material: {field.dugoutsMaterial
                    ? field.dugoutsMaterial.charAt(0).toUpperCase() + field.dugoutsMaterial.slice(1)
                    : 'No data available'}
                  </Text>

                  <Text style={styles.text}>Batting Cages: {field.battingCages != null
                    ? (field.battingCages ? 'Yes' : 'No')
                    : 'No data available'}
                  </Text>

                  {/* <Text style={styles.text}>Scoreboard Available: {field.scoreboardAvailable != null
                  ? (field.scoreboardAvailable ? 'Yes' : 'No')
                  : 'No data available'}
                </Text>

                <Text style={styles.text}>Scoreboard Type: {field.scoreboardType || 'No data available'}</Text> */}

                  <Text style={styles.text}>Warning Track: {field.warningTrack != null
                    ? (field.warningTrack ? 'Yes' : 'No')
                    : 'No data available'}
                  </Text>

                  {/* <Text style={styles.text}>Bullpen Available: {field.bullpenAvailable != null
                  ? (field.bullpenAvailable ? 'Yes' : 'No')
                  : 'No data available'}
                </Text>

                <Text style={styles.text}>Bullpen Location: {field.bullpenLocation || 'No data available'}</Text>

                <Text style={styles.text}>Dugout Coverage Material: {field.dugoutCoverageMaterial
                  ? field.dugoutCoverageMaterial.charAt(0).toUpperCase() + field.dugoutCoverageMaterial.slice(1)
                  : 'No data available'}
                </Text> */}

                </View>
              ))
            ) : (
              <Text style={styles.text}>No fields available</Text>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity style={styles.customButton} onPress={openMapsApp}>
          <Text style={styles.buttonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  contentContainer: { padding: 20 },
  mainImage: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' },
  section: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5, color: 'gray' },
  text: { fontSize: 14, color: 'black', marginBottom: 5 },
  buttonContainer: { marginTop: 20, marginBottom: 20, alignItems: 'center' },
  customButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: 'red' },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12, // Extra bottom padding for iPhones
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },  
  scrollContainer: {
    flex: 1,
    paddingBottom: 0, // Increased padding to avoid overlap with the fixed bar
  },
});