import React from 'react';
import { View, Text } from 'react-native';
import useOnline from '../hooks/useOnline';

export default function OfflineNotice() {
    const online = useOnline();
    if (online) return null;
    return (
        <View style={{ backgroundColor: '#FFE8A1', padding: 8, alignItems: 'center' }}>
            <Text style={{ color: '#4A3B00' }}>You’re offline. Some features are unavailable.</Text>
        </View>
    );
}