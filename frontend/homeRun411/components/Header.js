// components/Header.js
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../assets/colors';

export default function Header() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.headerBg, { paddingTop: insets.top }]}
    >
      <StatusBar style="light" />
      <View style={styles.headerRow}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.brandNavy} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(0,0,0,0.45)"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            blurOnSubmit
            onSubmitEditing={() => {
              const trimmed = query.trim();
              if (trimmed) {
                navigation.navigate('Search', { query: trimmed });
                setQuery('');
              }
            }}
          />
          <View style={styles.filterIconContainer}>
            <Ionicons name="options-outline" size={20} color={colors.brandNavy} />
          </View>
        </View>

        {/* Notifications */}
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellHit}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: colors.brandNavy },
  filterIconContainer: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    marginLeft: 10,
  },
  bellHit: {
    marginLeft: 6,
    padding: 6, // larger touch target, no background
  },
});