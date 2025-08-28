import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../utils/axiosInstance';
import colors from '../assets/colors';

export default function EditProfile() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const { data } = await axios.get('/api/user/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFirstName(data.profile?.firstName || '');
                setLastName(data.profile?.lastName || '');
                setAvatarUrl(data.profile?.avatarUrl || '');
                setZipCode(data.zipCode || '');
            } catch (e) {
                console.error('Load profile failed', e?.response?.data || e.message);
            }
        })();
    }, []);

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow photo library access to change your avatar.');
            return;
        }

        const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.9,
        });
        if (res.canceled || res.cancelled) return;

        const asset = (res.assets && res.assets[0]) || res;
        const fileUri = asset.uri;

        try {
            setUploading(true);
            const token = await AsyncStorage.getItem('token');

            const form = new FormData();
            form.append('avatar', {
                uri: fileUri,
                name: 'avatar.jpg',
                type: 'image/jpeg',
            });

            const { data } = await axios.post('/api/user/upload-avatar', form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setAvatarUrl(data.secureUrl || data.url);
            Alert.alert('Uploaded', 'Avatar updated. Don’t forget to Save.');
        } catch (e) {
            console.error('Upload failed', e?.response?.data || e.message);
            Alert.alert('Upload failed', 'Please try a different image.');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('token');
            await axios.patch('/api/user/profile', {
                firstName, lastName, avatarUrl, zipCode
            }, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Saved', 'Profile updated.');
        } catch (e) {
            console.error('Save failed', e?.response?.data || e.message);
            Alert.alert('Save failed', e?.response?.data?.message || 'Please check your info');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <TouchableOpacity onPress={pickAvatar} disabled={uploading}>
                    <Image source={{ uri: avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.avatar} />
                    {uploading && <ActivityIndicator style={styles.spinner} />}
                </TouchableOpacity>

                <TextInput
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                />
                <TextInput
                    placeholder="ZIP code"
                    keyboardType="number-pad"
                    value={zipCode}
                    onChangeText={setZipCode}
                    style={styles.input}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                    <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 32, backgroundColor: colors.sixty },
    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', backgroundColor: '#e0e0e0', marginBottom: 16 },
    spinner: { position: 'absolute', alignSelf: 'center', top: 50 },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
        padding: 12, marginBottom: 12, color: colors.primaryText,
    },
    saveBtn: { backgroundColor: colors.thirty, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    saveText: { color: 'white', fontWeight: '600' },
});