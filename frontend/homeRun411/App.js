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
import NewPostForm from './pages/NewPostForm'; // Import the NewPostForm component
import colors from './assets/colors';
import { AuthProvider, useAuth } from './AuthContext'; // Import the AuthProvider and useAuth hook
import HomePlateIcon from './components/icons/HomePlateIcon';
import HomePlateIcon_Selected from './components/icons/HomePlateIcon_Selected';

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
      <Tab.Screen name="Forum" component={ForumPage} />
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
  const { isLoggedIn, setIsLoggedIn } = useAuth(); // Access the auth state from the context
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
    <Stack.Navigator>
      {!isLoggedIn ? (
        <>
          <Stack.Screen
            name="LoginPage"
            component={LoginPage}
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
          <Stack.Screen
            name="Tabs"
            component={TabsNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParkDetails"
            component={ParkDetails}
            options={({ route }) => ({
              title: route.params.park.name,
              headerBackTitle: 'Back',
            })}
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
          {/* Add the NewPostForm screen */}
          <Stack.Screen
            name="NewPostForm"
            component={NewPostForm}
            options={{
              title: 'Create a New Post',
              headerBackTitle: 'Back',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}