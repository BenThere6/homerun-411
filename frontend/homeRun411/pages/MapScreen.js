// screens/MapScreen.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import axios from '../utils/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

const KIND_COLORS = {
    parking: '#2563eb',
    parking_entrance: '#2563eb',
    handicap_parking: '#2563eb',
    restroom: '#16a34a',
    concession: '#b45309',
    playground: '#9333ea',
    batting_cage: '#0ea5e9',
    bullpen: '#ea580c',
    distance_marker: '#334155',
    boundary: '#111827',
    field: '#ef4444',
};

export default function MapScreen({ route, navigation }) {
    const { parkId } = route.params || {};
    const mapRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [bundle, setBundle] = useState(null);
    const [showPark, setShowPark] = useState(true);
    const [showNearby, setShowNearby] = useState(true);
    const [activeCats, setActiveCats] = useState([]); // nearby category filter

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/park/${parkId}/map`);
                if (!mounted) return;
                setBundle(data);

                // fit once
                requestAnimationFrame(() => {
                    fitToEverything(data);
                });
            } catch (e) {
                console.log('map load failed', e?.response?.data || e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => (mounted = false);
    }, [parkId]);

    const fitToEverything = (data = bundle) => {
        if (!mapRef.current || !data) return;
        const { center, mapFeatures, nearbyAmenities } = data;

        const points = [];

        // center as fallback
        if (center?.lat && center?.lng) {
            points.push({ latitude: center.lat, longitude: center.lng });
        }

        // park features
        (mapFeatures?.features || []).forEach(f => {
            const g = f.geometry;
            if (!g) return;
            if (g.type === 'Point') {
                points.push({ latitude: g.coordinates[1], longitude: g.coordinates[0] });
            } else if (g.type === 'LineString') {
                g.coordinates.forEach(([lng, lat]) => points.push({ latitude: lat, longitude: lng }));
            } else if (g.type === 'Polygon') {
                (g.coordinates[0] || []).forEach(([lng, lat]) => points.push({ latitude: lat, longitude: lng }));
            }
        });

        // nearby
        (nearbyAmenities || []).forEach(n => {
            if (n.location?.lat && n.location?.lng) {
                points.push({ latitude: n.location.lat, longitude: n.location.lng });
            }
        });

        if (points.length > 0) {
            mapRef.current.fitToCoordinates(points, {
                edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                animated: true,
            });
        }
    };

    const nearbyCats = useMemo(() => {
        const set = new Set();
        (bundle?.nearbyAmenities || []).forEach(n => (n.categories || []).forEach(c => set.add(c)));
        // pick a few common categories first
        const arr = Array.from(set);
        arr.sort();
        return arr;
    }, [bundle?.nearbyAmenities]);

    const filteredNearby = useMemo(() => {
        let list = bundle?.nearbyAmenities || [];
        if (!showNearby) return [];
        if (activeCats.length === 0) return list;
        return list.filter(n => n.categories?.some(c => activeCats.includes(c)));
    }, [bundle, showNearby, activeCats]);

    if (loading || !bundle) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading map…</Text>
            </View>
        );
    }

    const { center, mapFeatures } = bundle;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: center?.lat || 40,
                    longitude: center?.lng || -111,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                onMapReady={() => fitToEverything()}
            >
                {/* Park features */}
                {showPark && (mapFeatures?.features || []).map(f => {
                    const { geometry: g, properties: p } = f;
                    const color = KIND_COLORS[p?.kind] || '#334155';

                    if (g?.type === 'Point') {
                        const [lng, lat] = g.coordinates;
                        return (
                            <Marker
                                key={p.id}
                                coordinate={{ latitude: lat, longitude: lng }}
                                title={p.name}
                                description={p.kind}
                                pinColor={color}
                            />
                        );
                    }

                    if (g?.type === 'LineString') {
                        const coords = g.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
                        return (
                            <Polyline
                                key={p.id}
                                coordinates={coords}
                                strokeColor={color}
                                strokeWidth={4}
                            />
                        );
                    }

                    if (g?.type === 'Polygon') {
                        const coords = (g.coordinates[0] || []).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
                        return (
                            <Polygon
                                key={p.id}
                                coordinates={coords}
                                strokeColor={color}
                                fillColor={`${color}33`}
                                strokeWidth={2}
                            />
                        );
                    }
                    return null;
                })}

                {/* Nearby amenities */}
                {filteredNearby.map(n => (
                    <Marker
                        key={n.placeId}
                        coordinate={{ latitude: n.location.lat, longitude: n.location.lng }}
                        title={n.name}
                        description={(n.categories || []).slice(0, 3).join(', ')}
                    >
                        <Ionicons name="location-sharp" size={20} color="#1d4ed8" />
                    </Marker>
                ))}
            </MapView>

            {/* Top chips */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={[styles.chip, showPark ? styles.chipOn : null]}
                    onPress={() => setShowPark(s => !s)}
                >
                    <Ionicons name="pricetag-outline" size={14} />
                    <Text style={styles.chipText}>Park features</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, showNearby ? styles.chipOn : null]}
                    onPress={() => setShowNearby(s => !s)}
                >
                    <Ionicons name="restaurant-outline" size={14} />
                    <Text style={styles.chipText}>Nearby</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip} onPress={() => fitToEverything()}>
                    <Ionicons name="scan-outline" size={14} />
                    <Text style={styles.chipText}>Fit</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom category scroller (nearby) */}
            {showNearby && (
                <View style={styles.bottomBar}>
                    <FlatList
                        horizontal
                        data={nearbyCats}
                        keyExtractor={(c) => c}
                        contentContainerStyle={{ paddingHorizontal: 8 }}
                        renderItem={({ item: c }) => {
                            const on = activeCats.includes(c);
                            return (
                                <TouchableOpacity
                                    style={[styles.catPill, on && styles.catPillOn]}
                                    onPress={() => {
                                        setActiveCats(prev => on ? prev.filter(x => x !== c) : [...prev, c]);
                                    }}
                                >
                                    <Text style={[styles.catText, on && styles.catTextOn]}>
                                        {c.replace(/_/g, ' ')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBar: {
        position: 'absolute', top: 12, left: 12, right: 12,
        flexDirection: 'row', gap: 8,
        justifyContent: 'flex-start',
    },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 6, paddingHorizontal: 10,
        backgroundColor: 'white', borderRadius: 20,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    chipOn: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
    chipText: { fontSize: 12, fontWeight: '600' },

    bottomBar: {
        position: 'absolute', bottom: 12, left: 0, right: 0,
    },
    catPill: {
        marginHorizontal: 6,
        backgroundColor: 'white', borderRadius: 18,
        borderWidth: 1, borderColor: '#e5e7eb',
        paddingVertical: 6, paddingHorizontal: 12,
    },
    catPillOn: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
    catText: { fontSize: 12, color: '#111827' },
    catTextOn: { color: '#075985', fontWeight: '700' },
});