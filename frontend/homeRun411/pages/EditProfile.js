// pages/EditProfile.js
import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';
import axios from '../utils/axiosInstance';
import { useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
    const navigation = useNavigation();
    const { user, setUser } = useAuth();

    // Handle both shapes: user or user.profile
    const currentProfile = useMemo(
        () => (user && user.profile ? user.profile : user) || {},
        [user]
    );

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        setFirstName(currentProfile.firstName || '');
        setLastName(currentProfile.lastName || '');
        setAvatarUrl(currentProfile.avatarUrl || '');

        // email + zipCode live on the *root* user object, not profile:
        setEmail(user?.email || '');
        setZipCode(user?.zipCode || '');
    }, [currentProfile, user]);

    const handlePickAvatar = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'We need access to your photos to update your picture.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker?.MediaType
                    ? [ImagePicker.MediaType.Image]
                    : ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setUploadingAvatar(true);

            const form = new FormData();
            const mime =
                asset.mimeType || (asset.uri?.toLowerCase().endsWith('.heic') ? 'image/heic' : 'image/jpeg');
            const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

            form.append('avatar', {
                uri: asset.uri,
                name: asset.fileName || `avatar.${ext}`,
                type: mime,
            });

            const uploadRes = await axios.post('/api/user/upload-avatar', form, {
                headers: {
                    // auth header is injected by axiosInstance
                    // DO NOT set Content-Type; Axios will add the correct boundary.
                },
            });

            const newProfile = uploadRes?.data?.profile;

            if (newProfile) {
                setAvatarUrl(newProfile.avatarUrl || avatarUrl);

                // keep AuthContext in sync
                setUser((prev) => {
                    if (!prev) return prev;
                    if (prev.profile) {
                        return { ...prev, profile: { ...prev.profile, ...newProfile } };
                    }
                    return { ...prev, ...newProfile };
                });
            }
        } catch (err) {
            console.error('avatar upload failed', err?.response?.data || err?.message);
            Alert.alert(
                'Upload failed',
                String(err?.response?.data?.message || err?.message || 'Unknown error')
            );
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedZip = zipCode.trim();

        if (!trimmedFirst) {
            Alert.alert('Missing info', 'Please enter at least a first name.');
            return;
        }

        if (!trimmedEmail) {
            Alert.alert('Missing info', 'Please enter an email address.');
            return;
        }

        // simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }

        try {
            setSaving(true);

            // 🔧 Make sure your backend update route checks for unique email and
            // returns 409 or a clear message when the email is taken.
            await axios.put('/api/user/profile', {
                firstName: trimmedFirst,
                lastName: trimmedLast,
                email: trimmedEmail,
                zipCode: trimmedZip,
            });

            if (trimmedZip) {
                await AsyncStorage.setItem('zipCode', trimmedZip);
            }

            // Keep AuthContext in sync
            setUser((prev) => {
                if (!prev) return prev;

                const merge = (profilePart) => ({
                    ...profilePart,
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    email: trimmedEmail,
                    zipCode: trimmedZip,
                });

                if (prev.profile) {
                    return {
                        ...prev,
                        profile: merge(prev.profile),
                    };
                }

                return merge(prev);
            });

            navigation.goBack();
        } catch (err) {
            const status = err?.response?.status;
            const serverMsg = err?.response?.data?.message || '';

            if (
                status === 409 ||
                (serverMsg.toLowerCase().includes('email') &&
                    serverMsg.toLowerCase().includes('already'))
            ) {
                Alert.alert(
                    'Email already in use',
                    'That email address is already associated with another account. Please use a different email.'
                );
            } else {
                console.error('Failed to update profile', err?.response?.data || err?.message);
                Alert.alert(
                    'Update failed',
                    String(serverMsg || err?.message || 'Something went wrong.')
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.sixty }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Edit Profile</Text>
                    <Text style={styles.subtitle}>
                        Update how your name and contact info appear in the app.
                    </Text>

                    {/* Avatar */}
                    <TouchableOpacity
                        onPress={handlePickAvatar}
                        activeOpacity={0.75}
                        style={styles.avatarWrap}
                    >
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={{
                                    uri: avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                                }}
                                style={styles.avatar}
                            />
                            {uploadingAvatar && (
                                <View style={styles.avatarOverlay}>
                                    <ActivityIndicator />
                                </View>
                            )}
                        </View>
                        <Text style={styles.changePhoto}>Change photo</Text>
                    </TouchableOpacity>

                    {/* First Name */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First name"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last name"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* ZIP Code */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.label}>ZIP Code</Text>
                        <TextInput
                            value={zipCode}
                            onChangeText={setZipCode}
                            placeholder="ZIP code"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            keyboardType="number-pad"
                            maxLength={5}
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => navigation.goBack()}
                            disabled={saving}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.saveText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.sixty,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: colors.sixty,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.quickLinkBorder,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.thirty,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: colors.secondaryText,
        marginBottom: 16,
    },
    fieldBlock: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.secondaryText,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.quickLinkBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: colors.primaryText,
        backgroundColor: '#f9fafb',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 18,
        gap: 10,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    cancelText: {
        color: colors.secondaryText,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: colors.brandNavy,
        minWidth: 130,
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    avatarWrap: {
        alignItems: 'center',
        marginBottom: 18,
    },

    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.brandBlueSoft || '#e6eef7',
    },

    avatarOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(255,255,255,0.45)',
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },

    changePhoto: {
        marginTop: 6,
        fontSize: 13,
        color: colors.secondaryText,
    },
});