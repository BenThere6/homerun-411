import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback, SafeAreaView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // For navigation
import Fuse from 'fuse.js'; // Import Fuse.js for fuzzy search
import colors from '../assets/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import ParkCard from '../components/ParkCard';
import { BACKEND_URL } from '@env';

export default function SearchPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const [parks, setParks] = useState([]); // State to store the fetched parks
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchConfirmed, setSearchConfirmed] = useState(false);
  const [query, setQuery] = useState(''); // State to store the search query
  const [searchResults, setSearchResults] = useState([]); // State to store search results
  const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; // Default image URL

  const [favoriteIds, setFavoriteIds] = useState([]);

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
    "West Virginia": 'WV', Wisconsin: 'WI', Wyoming: 'WY'
  };

  const toggleFavorite = async (parkId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const isFavorited = favoriteIds.includes(parkId);
      const endpoint = `${BACKEND_URL}/api/user/favorite-parks/${parkId}`;

      if (isFavorited) {
        await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        setFavoriteIds(prev => prev.filter(id => id !== parkId));
      } else {
        await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
        setFavoriteIds(prev => [...prev, parkId]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
    }
  };

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/park`);
        const parksData = await response.json();
        setParks(parksData.map(park => ({ ...park, imageError: false })));

        // Fetch user's favorites
        const res = await axios.get(`${BACKEND_URL}/api/user/home-parks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const favorites = res.data.favorites.map(p => p._id);
        setFavoriteIds(favorites);
      } catch (error) {
        console.error('Error fetching parks or favorites:', error);
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
    if (route.params?.query) {
      handleSearch(route.params.query);
      navigation.setParams({ query: undefined }); // one-time use
    }
  }, [route.params?.query]);

  const scrollRef = useRef(null);

  // Configure Fuse.js for fuzzy searching
  const fuse = new Fuse(parks, {
    keys: ['name', 'city', 'state'], // Specify searchable fields
    threshold: 0.3, // Adjust for leniency (0 = exact match, 1 = very lenient)
  });

  // Handle search input
  const updateRecentSearches = async (newQuery) => {
    if (!newQuery.trim()) return;

    const normalized = newQuery.trim().toLowerCase();
    const updated = [newQuery, ...recentSearches.filter(q => q.toLowerCase() !== normalized)].slice(0, 5);

    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async (text, saveToRecent = true) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    const normalizedQuery = stateNameToAbbreviation[capitalized] || trimmed;
    const results = fuse.search(normalizedQuery).map(result => result.item);
    setSearchResults(results);
    setSearchConfirmed(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setQuery(text);

    if (saveToRecent) {
      await updateRecentSearches(text);
    }

  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSearchConfirmed(false);
  };

  const removeRecentSearch = async (index) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Display recent searches or search results based on query
  const displayParks = searchConfirmed ? searchResults : parks;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.primaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            autoFocus={true}
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            onChangeText={(text) => {
              setQuery(text);
              setSearchResults([]);
            }}
            onSubmitEditing={() => handleSearch(query)} // Confirms search only on enter
            value={query}
            returnKeyType="search"
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

        <View style={styles.divider} />

        {/* Render search results or default sections */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          ref={scrollRef}
        >
          {!searchConfirmed ? (
            <>
              {/* Recent Searches Section */}
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
              {/* Featured Parks Section */}
              <Text style={styles.sectionTitle}>Featured Parks</Text>
              <View style={styles.featuredParksContainer}>
                {parks.slice(0, 3).map((park, index) => (
                  <ParkCard
                    key={park._id}
                    park={park}
                    isFavorited={favoriteIds.includes(park._id)}
                    onToggleFavorite={() => toggleFavorite(park._id)}
                  />
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
              displayParks.map((park, index) => <ParkCard
                key={park._id}
                park={park}
                isFavorited={favoriteIds.includes(park._id)}
                onToggleFavorite={() => toggleFavorite(park._id)}
              />
              )
            ) : (
              <Text>No parks found matching your search.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  allParksContainer: { marginBottom: 20, paddingHorizontal: 20 },
  featuredParksContainer: { marginBottom: 0, paddingHorizontal: 20 },
});