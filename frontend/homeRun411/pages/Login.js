import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication'; // Import biometric auth library
import colors from '../assets/colors';
import { useAuth } from '../AuthContext'; // Import the useAuth hook
import { BACKEND_URL } from '@env'; // Import the BACKEND_URL from .env

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth(); // Use the setIsLoggedIn from AuthContext

  const passwordInputRef = useRef(null); // Ref for the password input

  // Biometric authentication on component mount
  useEffect(() => {
    const tryBiometricLogin = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return;

      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (biometricTypes.length === 0) return;

      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate with Biometrics',
        });

        if (result.success) {
          setIsLoggedIn(true);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
          });
        }
      }
    };

    tryBiometricLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.refreshToken) {
        await AsyncStorage.setItem('token', data.refreshToken);
        setIsLoggedIn(true);

        // Ask the user to enable biometric authentication for future logins
        Alert.alert(
          'Biometric Authentication',
          'Would you like to enable biometric authentication for future logins?',
          [
            {
              text: 'Yes',
              onPress: async () => {
                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Set up biometrics',
                });
                if (result.success) {
                  console.log('Biometric setup completed successfully');
                }
              },
            },
            { text: 'No', style: 'cancel' },
          ]
        );

        // Reset navigation to the Tabs screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Tabs' }],
        });
      } else {
        Alert.alert('Login failed', data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Login Error', 'An error occurred while logging in. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.secondaryText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.registerTextContainer}>
          <Text style={styles.text}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterPage')}>
            <Text style={styles.linkText}>Register</Text>
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