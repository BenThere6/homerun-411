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
import RecVsTravelBallPage from './pages/RecVsTravelBall';
import PitcherGloveGuidePage from './pages/PitcherGloveGuide';
import YouthBatGuidePage from './pages/YouthBatGuide';
import EtiquettePage from './pages/Etiquette';
import AdminPage from './pages/AdminDashboard';
import GameDayPage from './pages/GameDay';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import NewPostForm from './pages/NewPostForm';
import MapScreen from './pages/MapScreen';
import EditProfile from './pages/EditProfile';
import colors from './assets/colors';
import { AuthProvider, useAuth } from './AuthContext';
import api, { setUnauthorizedHandler } from './utils/axiosInstance';
import OfflineNotice from './components/OfflineNotice';
import HomePlateIcon from './components/icons/HomePlateIcon';
import HomePlateIcon_Selected from './components/icons/HomePlateIcon_Selected';
import { initUserLocation } from './utils/initUserLocation';
import { connectSocket } from './utils/socket';
import { TouchableOpacity, StyleSheet } from 'react-native';
import DataDictionary from './pages/DataDictionary';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tabs Navigator
function TabsNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      key={`tabs-${isAdmin ? 'admin' : 'user'}`}
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
          if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Forum') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Admin') iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // NEW: dark gradient footer
        tabBarBackground: () => (
          <LinearGradient
            colors={colors.footerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ),
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: false,
        tabBarLabelStyle: { display: 'none' },
        safeAreaInsets: { bottom: 8 },

        // shape & elevation
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 12,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
        },

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
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: 'Profile',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.sixty },
          headerTintColor: colors.primaryText,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Manage Account"
              accessibilityRole="button"
              style={{ marginRight: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.primaryText} />
            </TouchableOpacity>
          ),
        })}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminPage}
          options={{
            headerShown: true,
            headerTitle: 'Admin',
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Main App Navigation with Stack
export default function App() {
  useEffect(() => { connectSocket(); }, []);
  return (
    <AuthProvider>
      <>
        <OfflineNotice />
        <NavigationContainer>
          <MainStack />
        </NavigationContainer>
      </>
    </AuthProvider>
  );
}

// Main stack of the application
function MainStack() {
  const { isLoggedIn, setIsLoggedIn, setUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        // ✅ Validate token and get profile (authoritative user endpoint)
        const { data: profile } = await api.get('/api/user/profile');

        setIsLoggedIn(true);
        setUser(profile);
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
      setUser(null);
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
            name="DataDictionary"
            component={DataDictionary}
            options={{ title: 'Data Dictionary' }}
          />
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
          {/* 👇 NEW SCREEN HERE */}
          <Stack.Screen
            name="RecVsTravelBall"
            component={RecVsTravelBallPage}
            options={{
              title: 'Rec vs Travel Ball',
              headerStyle: { backgroundColor: '#ffe9a9' }, // soft gold to match app vibe
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="PitcherGloveGuide"
            component={PitcherGloveGuidePage}
            options={{
              title: "Pitcher's Glove Guide",
              headerStyle: { backgroundColor: '#e9d4ff' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="YouthBatGuide"
            component={YouthBatGuidePage}
            options={{
              title: 'Youth Bat Buying Guide',
              headerStyle: { backgroundColor: '#c6f6ff' },
              headerTintColor: 'black',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminPage}
            options={{ title: 'Admin', headerTitleAlign: 'center' }}
          />
          <Stack.Screen name="Settings" component={SettingsPage} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfile}
            options={{ title: 'Edit Profile' }}
          />
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
          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{ title: 'Map View' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}