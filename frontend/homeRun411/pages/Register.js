import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../assets/colors';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [firstName, setFirstName] = useState('');  // Added firstName state
  const [lastName, setLastName] = useState('');  // Added lastName state
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();

  const handleRegister = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'First and last name are required.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      // Register the user
      const registerResponse = await fetch('http://10.0.0.29:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, zipCode, firstName, lastName }),  // Pass firstName and lastName
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        // Automatically log in after successful registration
        const loginResponse = await fetch('http://10.0.0.29:5001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.refreshToken) {
          // Store token and user details in AsyncStorage
          await AsyncStorage.setItem('token', loginData.refreshToken);
          await AsyncStorage.setItem('firstName', firstName);  // Save firstName
          await AsyncStorage.setItem('lastName', lastName);  // Save lastName
          
          setIsLoggedIn(true);

          // Navigate to Home
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }], // Direct to the Tabs (Home) screen
          });
        } else {
          Alert.alert('Login failed', loginData.message || 'Unable to log in after registration.');
        }
      } else {
        Alert.alert('Registration failed', registerData.message || 'Unable to register. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration and login:', error);
      Alert.alert('Error', 'An error occurred while registering. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={colors.secondaryText}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={colors.secondaryText}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.secondaryText}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Zip Code"
          placeholderTextColor={colors.secondaryText}
          value={zipCode}
          onChangeText={setZipCode}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <View style={styles.registerTextContainer}>
          <Text style={styles.text}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginPage')}>
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sixty,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: colors.primaryText,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: colors.thirty,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: colors.primaryText,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.thirty,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: colors.oppText,
    fontSize: 18,
  },
  registerTextContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  text: {
    color: colors.primaryText,
  },
  linkText: {
    color: colors.primaryText,
    textDecorationLine: 'underline',
  },
});