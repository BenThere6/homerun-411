import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ParkCard({ park, isFavorited, onToggleFavorite, distance, disableFavoriteToggle = false }) {
    const navigation = useNavigation();
    const [imageError, setImageError] = useState(false);
    const defaultImage = 'https://images.unsplash.com/photo-1717886091076-56e54c2a360f?q=80&w=2967&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

    return (
        <View style={styles.parkContainer}>
            <TouchableOpacity
                style={styles.parkCard}
                onPress={() => navigation.navigate('ParkDetails', { park })}
            >
                <ImageBackground
                    source={{ uri: imageError ? defaultImage : park.mainImageUrl || defaultImage }}
                    style={styles.parkImageBackground}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                >
                    <View style={styles.parkContent}>
                        <Text style={styles.parkName}>{park.name}</Text>

                        {/* Pet Friendly Paw */}
                        {park.isPetFriendly && (
                            <Ionicons
                                name="paw"
                                size={20}
                                color="#fff"
                                style={{ position: 'absolute', top: 10, right: 10 }}
                            />
                        )}

                        {/* Favorite Star */}
                        <TouchableOpacity
                            style={styles.favoriteIcon}
                            disabled={disableFavoriteToggle}
                            onPress={onToggleFavorite}
                        >
                            <Ionicons
                                name={isFavorited ? 'star' : 'star-outline'}
                                size={24}
                                color={isFavorited ? '#FFD700' : '#fff'}
                            />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
            <Text style={styles.parkDetail}>
                {`${park.city}, ${park.state}`}
                {typeof (distance ?? park.distanceInMiles) === 'number'
                    ? ` - ${(distance ?? park.distanceInMiles).toFixed(1)} mi`
                    : ''}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    parkContainer: {},
    parkCard: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#CC0000',
    },
    parkImageBackground: { flex: 1, width: '100%', height: '100%' },
    parkContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        padding: 10,
        height: '100%',
    },
    parkName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    parkDetail: {
        fontSize: 14,
        color: colors.secondaryText,
        marginLeft: 10,
        marginBottom: 20,
    },
    favoriteIcon: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 15,
        padding: 6,
    },
});