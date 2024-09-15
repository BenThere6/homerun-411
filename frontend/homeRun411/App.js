import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import stack navigator
import { Ionicons } from '@expo/vector-icons';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import ForumPage from './pages/Forum';
import ProfilePage from './pages/Profile';
import ParkDetails from './pages/ParkDetails';
import NotificationsPage from './pages/Notifications';
import EtiquettePage from './pages/Etiquette';
import AdminPage from './pages/Admin';
import SettingsPage from './pages/Settings';
import colors from './assets/colors'; // Import colors

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator(); // Create stack navigator

// Bottom Tabs Navigator
function Tabs() {
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
            iconName = focused ? 'person' : 'person-outline'; // Profile icon
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.thirty, // Blue for active state (30%)
        tabBarInactiveTintColor: 'gray', // Gray for inactive state
        tabBarStyle: { backgroundColor: colors.sixty }, // White background (60%)
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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.sixty, // White header background (60%)
          },
          headerTintColor: colors.thirty, // Blue text for header (30%)
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.thirty, // Blue for title (30%)
          },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}