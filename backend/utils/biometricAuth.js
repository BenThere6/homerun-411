import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authenticateWithBiometrics = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      console.error('Biometric authentication is not available on this device.');
      return false;
    }

    const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (biometricTypes.length === 0) {
      console.error('No supported biometric authentication types available.');
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your account',
    });

    if (result.success) {
      console.log('Biometric authentication successful');
      const token = await AsyncStorage.getItem('accessToken');
      return token ? true : false;
    } else {
      console.error('Biometric authentication failed');
      return false;
    }
  } catch (error) {
    console.error('Error during biometric authentication:', error);
    return false;
  }
};