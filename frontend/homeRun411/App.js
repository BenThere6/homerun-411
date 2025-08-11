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
import GameDayPage from './pages/GameDay';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import NewPostForm from './pages/NewPostForm';
import colors from './assets/colors';
import { AuthProvider, useAuth } from './AuthContext';
import api, { setUnauthorizedHandler } from './utils/axiosInstance';
import HomePlateIcon from './components/icons/HomePlateIcon';
import HomePlateIcon_Selected from './components/icons/HomePlateIcon_Selected';
import { initUserLocation } from './utils/initUserLocation';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tabs Navigator
function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return focused ? (
              <HomePlateIcon_Selected color={color} size={size} />
            ) : (
              <HomePlateIcon color={color} size={size} />
            );
          }

          let iconName;
          if (route.name === 'Search') {
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
      <Tab.Screen
        name="Forum"
        component={ForumPage}
        options={{
          headerShown: true,
        }}
      />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

// Main App Navigation with Stack
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    </AuthProvider>
  );
}

// Main stack of the application
function MainStack() {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    const startApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        // ✅ Validate token against the backend
        await api.get('/api/auth/profile');

        // Token is valid
        setIsLoggedIn(true);
        await initUserLocation();
      } catch (e) {
        // Token is missing/invalid/expired → force logout
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    startApp();
  }, []);

  useEffect(() => {
    // If any request gets 401, clear token and flip to Login
    setUnauthorizedHandler(async () => {
      await AsyncStorage.removeItem('token');
      setIsLoggedIn(false);
    });
  }, [setIsLoggedIn]);

  if (loading) return null;

  return (
    <Stack.Navigator key={isLoggedIn ? 'auth' : 'guest'}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen
            name="LoginPage"
            component={LoginPage}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="RegisterPage"
            component={RegisterPage}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Tabs"
            component={TabsNavigator}
            options={{ headerShown: false, title: 'Home' }}
          />
          <Stack.Screen name="ParkDetails" component={ParkDetails} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsPage}
            options={{
              title: 'Notifications',
              headerStyle: { backgroundColor: '#ffb6d9' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="Etiquette"
            component={EtiquettePage}
            options={{
              title: 'Baseball Etiquette',
              headerStyle: { backgroundColor: '#82d9a7' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="GameDay"
            component={GameDayPage}
            options={{
              title: 'Game Day Necessities',
              headerStyle: { backgroundColor: '#90cdf4' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen name="Admin" component={AdminPage} />
          <Stack.Screen name="Settings" component={SettingsPage} />
          <Stack.Screen
            name="NewPostForm"
            component={NewPostForm}
            options={{
              title: 'New Post',
              headerStyle: { backgroundColor: '#ffd699' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}