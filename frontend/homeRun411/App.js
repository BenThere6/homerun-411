import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Homepage from './pages/Homepage'; // Your homepage
import SearchPage from './pages/Search'; // Placeholder for other pages
import ForumPage from './pages/Forum'; // Placeholder for other pages
import FavoritesPage from './pages/Favorites'; // Placeholder for other pages

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
          headerShown: false, // This will hide the top bar
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