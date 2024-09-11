import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';  // Icon library for Expo
import Homepage from './pages/Homepage';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder components for the other pages
function SearchPage() {
  return (
    <View style={styles.container}>
      <Text>Search Page</Text>
    </View>
  );
}

function ForumPage() {
  return (
    <View style={styles.container}>
      <Text>Forum Page</Text>
    </View>
  );
}

function FavoritesPage() {
  return (
    <View style={styles.container}>
      <Text>Favorites Page</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Forum') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: [{ display: 'flex' }],
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Homepage} />
        <Tab.Screen name="Search" component={SearchPage} />
        <Tab.Screen name="Forum" component={ForumPage} />
        <Tab.Screen name="Favorites" component={FavoritesPage} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
});