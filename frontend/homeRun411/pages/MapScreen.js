// screens/MapScreen.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import axios from '../utils/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import centroid from '@turf/centroid';
import length from '@turf/length';
import along from '@turf/along';
import { lineString as turfLine } from '@turf/helpers';

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

// Which icon to use per kind, and which library it comes from
const KIND_ICONS = {
    field: { lib: 'ion', name: 'baseball-outline', color: '#ef4444' },
    parking: { lib: 'ion', name: 'car-outline', color: '#2563eb' },
    parking_entrance: { lib: 'mci', name: 'door-open', color: '#f59e0b' }, // ⟵ explicit
    handicap_parking: { lib: 'mci', name: 'human-wheelchair', color: '#2563eb' },
    restroom: { lib: 'mci', name: 'toilet', color: '#16a34a' },
    concession: { lib: 'ion', name: 'fast-food-outline', color: '#b45309' },
    entrance: { lib: 'mci', name: 'door-open', color: '#f59e0b' },
    default: { lib: 'ion', name: 'location-outline', color: '#334155' },
};

function RenderIcon({ spec, size = 28 }) {
    const { lib, name, color } = spec || {};
    if (lib === 'mci') {
        return <MaterialCommunityIcons name={name} size={size} color={color} />;
    }
    // default to Ionicons
    return <Ionicons name={name} size={size} color={color} />;
}

function shouldHideIconByName(name = '') {
    return /football|tennis/i.test(String(name));
}

// Always-visible label chip  
const LabelChip = ({ text }) => (
    <View style={{
        backgroundColor: 'rgba(0,0,0,0.72)',
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 6, maxWidth: 180
    }}>
        <Text style={{ color: '#fff', fontSize: 12 }} numberOfLines={1}>{text}</Text>
    </View>
);

function PointMarker({ feature }) {
    const { geometry: g, properties: p } = feature;
    const [lng, lat] = g.coordinates;
    const icon = iconFor(p?.kind);
    const title = p?.name || (p?.kind ? p.kind.replace(/_/g, ' ') : '');

    return (
        <Marker coordinate={{ latitude: lat, longitude: lng }} anchor={{ x: 0.5, y: 1 }}>
            <View style={{ alignItems: 'center' }}>
                {!shouldHideIconByName(p?.name) && <RenderIcon spec={icon} size={28} />}
                {!!title && (
                    <View style={{ marginTop: 4 }}>
                        <LabelChip text={title} />
                    </View>
                )}
            </View>
        </Marker>
    );
}

function PolygonWithLabel({ feature, color }) {
    const { geometry: g, properties: p } = feature;
    const coords = (g.coordinates[0] || []).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const center = centroid(feature);
    const [clng, clat] = center.geometry.coordinates;
    const title = p?.name || p?.kind;

    return (
        <>
            <Polygon
                coordinates={coords}
                strokeColor={color}
                fillColor={`${color}33`}
                strokeWidth={2}
            />
            {!!title && (
                <Marker coordinate={{ latitude: clat, longitude: clng }} anchor={{ x: 0.5, y: 0.5 }}>
                    <LabelChip text={title} />
                </Marker>
            )}
        </>
    );
}

function LineWithDistance({ feature, color }) {
    const { geometry: g, properties: p } = feature;
    const coords = g.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

    // Prefer precomputed value if present, otherwise compute
    let feet = p?.fenceFeet;
    if (feet == null) {
        const line = turfLine(g.coordinates);
        feet = Math.round(length(line, { units: 'feet' }));
    }

    // Midpoint for the label
    const line = turfLine(g.coordinates);
    const miles = length(line, { units: 'miles' });
    const mid = along(line, miles / 2, { units: 'miles' });
    const [mlng, mlat] = mid.geometry.coordinates;

    return (
        <>
            <Polyline coordinates={coords} strokeColor={color} strokeWidth={3} />
            <Marker coordinate={{ latitude: mlat, longitude: mlng }} anchor={{ x: 0.5, y: 1 }}>
                <LabelChip text={`${feet} ft`} />
            </Marker>
        </>
    );
}

function iconFor(kind = '') {
    const k = String(kind).toLowerCase();

    // exact matches first
    if (KIND_ICONS[k]) return KIND_ICONS[k];

    // special cases / fallbacks
    if (k === 'parking_entrance' || /(^|_)entrance($|_)/.test(k)) return KIND_ICONS.entrance;
    if (k.includes('handicap')) return KIND_ICONS.handicap_parking;
    if (k.includes('restroom') || k.includes('toilet')) return KIND_ICONS.restroom;
    if (k.includes('concession') || k.includes('snack')) return KIND_ICONS.concession;
    if (k.includes('parking')) return KIND_ICONS.parking;
    if (k.includes('field') || k.includes('diamond') || k.includes('softball') || k.includes('baseball') || k.includes('football')) return KIND_ICONS.field;

    return KIND_ICONS.default;
}

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

        // Park features (collect coordinates for fit)
        if (showPark) {
            (mapFeatures?.features || []).forEach(f => {
                const g = f?.geometry;
                if (!g) return;
                if (g.type === 'Point') {
                    const [lng, lat] = g.coordinates || [];
                    if (lat != null && lng != null) points.push({ latitude: lat, longitude: lng });
                } else if (g.type === 'LineString') {
                    (g.coordinates || []).forEach(([lng, lat]) => {
                        if (lat != null && lng != null) points.push({ latitude: lat, longitude: lng });
                    });
                } else if (g.type === 'Polygon') {
                    ((g.coordinates?.[0]) || []).forEach(([lng, lat]) => {
                        if (lat != null && lng != null) points.push({ latitude: lat, longitude: lng });
                    });
                }
            });
        }

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
                {showPark && (mapFeatures?.features || []).map((f, i) => {
                    const { geometry: g, properties: p } = f || {};
                    const key = p?.id || i;
                    const color = KIND_COLORS[p?.kind] || '#334155';

                    if (g?.type === 'Point') return <PointMarker key={key} feature={f} />;
                    if (g?.type === 'Polygon') return <PolygonWithLabel key={key} feature={f} color={color} />;
                    if (g?.type === 'LineString') return <LineWithDistance key={key} feature={f} color={color} />;
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