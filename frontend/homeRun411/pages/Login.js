import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../assets/colors';
import { useAuth } from '../AuthContext';
import { BACKEND_URL } from '@env';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();
  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    setError('');
    const e = (email || '').trim().toLowerCase();
    const p = (password || '').trim();

    if (!e || !p) {
      setError('Please enter both email and password.');
      return;
    }
    // Optional basic email format check
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Safety: make sure BACKEND_URL is defined
    if (!BACKEND_URL) {
      setError('App is misconfigured (BACKEND_URL is missing).');
      return;
    }

    setLoading(true);
    try {
      // Add a fetch timeout so we don’t “hang forever”
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000); // 10s

      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
        signal: controller.signal,
      }).catch((err) => {
        // e.g. network errors show up here
        throw err;
      });
      clearTimeout(timer);

      // If the server didn’t respond at all
      if (!res) {
        throw new Error('No response from server');
      }

      let data = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
        data = {};
      }

      if (res.ok && data.refreshToken) {
        await AsyncStorage.setItem('token', data.refreshToken);
        setIsLoggedIn(true);
        // Optional: navigate immediately if your AuthContext doesn’t auto-swap stacks
        // navigation.reset({ index: 0, routes: [{ name: 'Homepage' }] });
      } else {
        const msg = data?.message || `Login failed (status ${res.status}).`;
        setError(msg);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Network timeout. Check your connection or server URL.');
      } else {
        setError(`Login error: ${err.message}`);
      }
    } finally {
      setLoading(false);
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
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          blurOnSubmit={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          returnKeyType="go"
          ref={passwordInputRef}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={colors.oppText} />
              <Text style={styles.buttonText}>Logging in…</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
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
  title: { fontSize: 24, color: colors.primaryText, marginBottom: 20 },
  input: {
    width: '100%',
    height: 50,
    borderColor: colors.thirty,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
    color: colors.primaryText,
  },
  errorText: {
    width: '100%',
    color: '#d9534f',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.thirty,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.oppText, fontSize: 18 },
  registerTextContainer: { flexDirection: 'row', marginTop: 20 },
  text: { color: colors.primaryText },
  linkText: { color: colors.primaryText, textDecorationLine: 'underline' },
});