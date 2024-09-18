import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import ForumPage from './pages/Forum';
import ProfilePage from './pages/Profile';
import ParkDetails from './pages/ParkDetails';
import NotificationsPage from './pages/Notifications';
import EtiquettePage from './pages/Etiquette';
import AdminPage from './pages/Admin';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import colors from './assets/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tabs Navigator
function TabsNavigator() {
  return (
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
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.thirty,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: { backgroundColor: colors.sixty },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={SearchPage} />
      <Tab.Screen name="Forum" component={ForumPage} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

// Main App Navigation with Stack
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to check if token exists
  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setLoading(false);
  };

  // Check for token when app mounts
  useEffect(() => {
    checkToken();
  }, []);

  if (loading) {
    return null; // You can add a spinner or loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isLoggedIn ? (
          <>
            <Stack.Screen
              name="LoginPage"
              // Remove inline function, pass `checkToken` as a prop using `initialParams`
              component={LoginPage} 
              initialParams={{ onLogin: checkToken }} // Pass function through params
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterPage"
              component={RegisterPage}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="ParkDetails"
              component={ParkDetails}
              options={{
                title: 'Park Details',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsPage}
              options={{
                title: 'Notifications',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Etiquette"
              component={EtiquettePage}
              options={{
                title: 'Baseball Etiquette',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminPage}
              options={{
                title: 'Admin',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsPage}
              options={{
                title: 'Settings',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}