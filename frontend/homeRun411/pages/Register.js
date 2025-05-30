import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Icon for checkbox
import colors from '../assets/colors'; // Importing colors from your color file
import { BACKEND_URL } from '@env'; // Import the BACKEND_URL from the .env file
console.log(BACKEND_URL)

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // State for admin checkbox
  const [adminExists, setAdminExists] = useState(true); // To track if any admin exists
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();

  // Refs to control input focus
  const lastNameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const zipCodeInputRef = useRef(null);

  // Check if any admin exists
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/check-admin`); // Use BACKEND_URL here
        const data = await response.json();
        setAdminExists(data.adminExists);
      } catch (error) {
        console.error('Error checking for admin:', error);
      }
    };

    checkAdminExists();
  }, []);

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
      const registerResponse = await fetch(`${BACKEND_URL}/api/auth/register`, { // Use BACKEND_URL here
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, zipCode, firstName, lastName, role: isAdmin ? 'Admin' : 'User' }),
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, { // Use BACKEND_URL here for login
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.refreshToken) {
          await AsyncStorage.setItem('token', loginData.refreshToken);
          await AsyncStorage.setItem('firstName', firstName);
          await AsyncStorage.setItem('lastName', lastName);

          setIsLoggedIn(true);

          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
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
          returnKeyType="next"
          onSubmitEditing={() => lastNameInputRef.current.focus()} // Move to next field
          blurOnSubmit={false} // Prevents keyboard from dismissing
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={colors.secondaryText}
          value={lastName}
          onChangeText={setLastName}
          ref={lastNameInputRef}
          returnKeyType="next"
          onSubmitEditing={() => emailInputRef.current.focus()}
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.secondaryText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          ref={emailInputRef}
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current.focus()}
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          ref={passwordInputRef}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordInputRef.current.focus()}
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          ref={confirmPasswordInputRef}
          returnKeyType="next"
          onSubmitEditing={() => zipCodeInputRef.current.focus()}
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Zip Code"
          placeholderTextColor={colors.secondaryText}
          value={zipCode}
          onChangeText={setZipCode}
          ref={zipCodeInputRef}
          returnKeyType="done" // Use 'done' here to avoid showing 'Go'
        />

        {/* Show admin checkbox if no admin exists */}
        {!adminExists && (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setIsAdmin(!isAdmin)}>
              <Ionicons
                name={isAdmin ? 'checkbox' : 'square-outline'}
                size={24}
                color={colors.primaryText}
              />
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Register as Admin</Text>
          </View>
        )}

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
    backgroundColor: colors.sixty, // Primary background color
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
    borderColor: colors.thirty, // Using the secondary color
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: colors.primaryText,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.thirty, // Using the secondary color for button
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: colors.oppText, // Using the opposite text color
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: colors.primaryText,
  },
});