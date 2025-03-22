import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback, SafeAreaView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import Fuse from 'fuse.js'; // Import Fuse.js for fuzzy search
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';

export default function SearchPage() {
  const navigation = useNavigation();
  const [parks, setParks] = useState([]); // State to store the fetched parks
  const [query, setQuery] = useState(''); // State to store the search query
  const [searchResults, setSearchResults] = useState([]); // State to store search results
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; // Default image URL

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/park`);
        const data = await response.json();
        setParks(data.map(park => ({ ...park, imageError: false })));
      } catch (error) {
        console.error('Error fetching parks:', error);
      }
    };
    fetchParks();
  }, []);

  // Configure Fuse.js for fuzzy searching
  const fuse = new Fuse(parks, {
    keys: ['name', 'city', 'state'], // Specify searchable fields
    threshold: 0.3, // Adjust for leniency (0 = exact match, 1 = very lenient)
  });

  // Handle search input
  const handleSearch = (text) => {
    setQuery(text);
    if (text) {
      const results = fuse.search(text).map(result => result.item); // Map to get items only
      setSearchResults(results);
    } else {
      setSearchResults([]); // Clear results when query is empty
    }
  };

  // Display recent searches or search results based on query
  const displayParks = query ? searchResults : parks;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            onChangeText={handleSearch}
            value={query}
            blurOnSubmit={true}
          />
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color={colors.primaryText} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Render search results or default sections */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {query === '' ? (
            <>
              {/* Recent Searches Section */}
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.recentSearchesContainer}>
                {['Park 1', 'Park 2', 'Park 3'].map((recentSearch, index) => (
                  <TouchableOpacity key={index} style={styles.searchItem} onPress={() => handleSearch(recentSearch)}>
                    <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.recentSearchIcon} />
                    <Text style={styles.searchText}>{recentSearch}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Featured Parks Section */}
              <Text style={styles.sectionTitle}>Featured Parks</Text>
              <View style={styles.featuredParksContainer}>
                {parks.slice(0, 3).map((park, index) => (
                  <ParkCard key={park._id} park={park} index={index} />
                ))}
              </View>

              {/* All Parks Section */}
              <Text style={styles.sectionTitle}>All Parks</Text>
            </>
          ) : (
            <Text style={styles.sectionTitle}>Search Results</Text>
          )}

          <View style={styles.allParksContainer}>
            {displayParks.length > 0 ? (
              displayParks.map((park, index) => <ParkCard key={park._id} park={park} index={index} />)
            ) : (
              <Text>No parks available</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// ParkCard component for displaying individual parks
function ParkCard({ park, index }) {
  const navigation = useNavigation();
  const [imageError, setImageError] = useState(park.imageError);
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <View style={styles.parkContainer}>
      <TouchableOpacity
        style={styles.parkCard}
        onPress={() => navigation.navigate('ParkDetails', { park })}
      >
        <ImageBackground
          source={{ uri: imageError ? defaultImage : park.mainImageUrl || defaultImage }}
          style={styles.parkImageBackground}
          resizeMode="cover"
          onError={handleImageError}
        >
          <View style={styles.parkContent}>
            <Text style={styles.parkName}>{park.name}</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
      <Text style={styles.parkDetail}>{`${park.city}, ${park.state}`}</Text>
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
    marginLeft: 20,
    marginRight: 20,
    marginTop: 5,
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
  scrollContainer: { paddingBottom: 20 },
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
  parkContainer: { /* your styles here */ },
  parkCard: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  parkImageBackground: { flex: 1, width: '100%', height: '100%' },
  parkContent: { backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end', padding: 10, height: '100%' },
  parkName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  parkDetail: { fontSize: 14, color: colors.secondaryText, marginLeft: 10, marginBottom: 20 },
  allParksContainer: { marginBottom: 20, paddingHorizontal: 20 },
  featuredParksContainer: { marginBottom: 0, paddingHorizontal: 20 },
});