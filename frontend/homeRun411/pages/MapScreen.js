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

// --- LOD + declutter helpers ---
function zoomFromDelta(longitudeDelta) {
    // Web-mercator-ish approximation; RN Maps uses deltas, so this is fine.
    return Math.log2(360 / Math.max(longitudeDelta, 1e-6));
}

function llFromCentroid(feature) {
    const c = centroid(feature);
    const [lng, lat] = c?.geometry?.coordinates || [];
    return (lat != null && lng != null) ? { lat, lng } : null;
}

function haversineMeters(a, b) {
    const toRad = d => d * Math.PI / 180, R = 6371000;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

const KIND_PRIORITY = {
    field: 100,
    parking: 90,
    parking_entrance: 85,
    entrance: 85,
    restroom: 80,
    bullpen: 70,
    batting_cage: 70,
    concession: 65,
    playground: 60,
    boundary: 50,
    distance_marker: 40,
    default: 10,
};

function kindPriority(kind) {
    return KIND_PRIORITY[kind] ?? KIND_PRIORITY.default;
}

function lodForZoom(z) {
    // tune thresholds to taste
    if (z < 15) return 'overview';     // far
    if (z < 16.5) return 'mid';        // city block
    return 'detail';                   // close
}

function labelSpacingMetersForZoom(z) {
    // farther out → larger spacing
    if (z < 14) return 250;
    if (z < 15) return 160;
    if (z < 16) return 110;
    if (z < 17) return 70;
    return 45;
}

function shouldSuppressKind(kind, z) {
    const k = String(kind || '').toLowerCase();
    // Hide generic non-baseball context by default unless very close
    if (/football|tennis/.test(k)) return z < 17.2;
    if (k === 'distance_marker') return z < 16.8; // only close
    return false;
}

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
const LabelChip = ({ text, dim = false }) => (
    <View style={{
        backgroundColor: dim ? 'rgba(17,24,39,0.55)' : 'rgba(17,24,39,0.78)',
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 6, maxWidth: 160
    }}>
        <Text style={{ color: '#fff', fontSize: 11 }} numberOfLines={1}>{text}</Text>
    </View>
);

function PointMarker({ feature, zoom, focusedId, allowedLabelIds, onPress }) {
    const { geometry: g, properties: p } = feature;
    const [lng, lat] = g.coordinates;
    const icon = iconFor(p?.kind);
    const title = p?.name || (p?.kind ? p.kind.replace(/_/g, ' ') : '');
    const isFocused = focusedId === p?.id;

    const lod = lodForZoom(zoom);
    const showLabel =
        isFocused ||
        (lod === 'detail' &&
            kindPriority(p?.kind) >= 70 &&
            allowedLabelIds.has(p?.id));

    const hideForKind = shouldSuppressKind(p?.kind, zoom) || shouldHideIconByName(p?.name);

    if (hideForKind) return null;

    return (
        <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onPress?.(p?.id)}
        >
            <View style={{ alignItems: 'center' }}>
                <RenderIcon spec={icon} size={24} />
                {showLabel && !!title && (
                    <View style={{ marginTop: 3 }}>
                        <LabelChip text={title} dim={!isFocused} />
                    </View>
                )}
            </View>
        </Marker>
    );
}

function PolygonWithLabel({ feature, color, zoom, focusedId, allowedLabelIds, onPress }) {
    const { geometry: g, properties: p } = feature;
    const coords = (g.coordinates[0] || []).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const center = centroid(feature);
    const [clng, clat] = center.geometry.coordinates;
    const title = p?.name || p?.kind;
    const isFocused = focusedId === p?.id;

    const lod = lodForZoom(zoom);
    const showLabel =
        isFocused ||
        (lod !== 'overview' && allowedLabelIds.has(p?.id));

    const fill = isFocused ? `${color}3D` : `${color}26`; // subtle

    if (shouldSuppressKind(p?.kind, zoom)) return null;

    return (
        <>
            <Polygon
                coordinates={coords}
                strokeColor={color}
                fillColor={fill}
                strokeWidth={isFocused ? 3 : 1.5}
                tappable
                onPress={() => onPress?.(p?.id)}
            />
            {showLabel && !!title && (
                <Marker coordinate={{ latitude: clat, longitude: clng }} anchor={{ x: 0.5, y: 0.5 }} onPress={() => onPress?.(p?.id)}>
                    <LabelChip text={title} dim={!isFocused} />
                </Marker>
            )}
        </>
    );
}

function LineWithDistance({ feature, color, zoom, focusedId, allowedLabelIds, onPress }) {
    const { geometry: g, properties: p } = feature;
    const coords = g.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

    const line = turfLine(g.coordinates);
    const miles = length(line, { units: 'miles' });
    const mid = along(line, miles / 2, { units: 'miles' });
    const [mlng, mlat] = mid.geometry.coordinates;

    let feet = p?.fenceFeet;
    if (feet == null) feet = Math.round(length(line, { units: 'feet' }));

    const isFocused = focusedId === p?.id;
    const lod = lodForZoom(zoom);
    const showLabel =
        isFocused ||
        (zoom >= 16.6 && allowedLabelIds.has(p?.id));


    if (shouldSuppressKind(p?.kind, zoom)) return null;

    return (
        <>
            <Polyline
                coordinates={coords}
                strokeColor={color}
                strokeWidth={isFocused ? 4 : 2}
                onPress={() => onPress?.(p?.id)}
            />
            {showLabel && (
                <Marker coordinate={{ latitude: mlat, longitude: mlng }} anchor={{ x: 0.5, y: 1 }} onPress={() => onPress?.(p?.id)}>
                    <LabelChip text={`${feet} ft`} dim={!isFocused} />
                </Marker>
            )}
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
    const [region, setRegion] = useState(null);
    const [zoom, setZoom] = useState(16);
    const [focusedId, setFocusedId] = useState(null);

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

    // Smoothly zoom by a factor (e.g., 0.6 in, 1.4 out)
    const zoomBy = (factor) => {
        const init = {
            latitude: center?.lat || 40,
            longitude: center?.lng || -111,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
        const cur = region || init;

        // Clamp deltas to reasonable bounds
        const MIN_DELTA = 0.0008; // tighter -> closer
        const MAX_DELTA = 0.3;    // looser -> farther

        const nextLatDelta = Math.min(MAX_DELTA, Math.max(MIN_DELTA, cur.latitudeDelta * factor));
        const nextLngDelta = Math.min(MAX_DELTA, Math.max(MIN_DELTA, cur.longitudeDelta * factor));

        mapRef.current?.animateToRegion(
            {
                latitude: cur.latitude,
                longitude: cur.longitude,
                latitudeDelta: nextLatDelta,
                longitudeDelta: nextLngDelta,
            },
            180
        );
    };

    const zoomIn = () => zoomBy(0.6);  // ~+40%
    const zoomOut = () => zoomBy(1.4); // ~-40%  

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

    // Build a set of feature ids that are allowed to show labels this frame
    const allowedLabelIds = new Set();
    {
        const spacing = labelSpacingMetersForZoom(zoom);
        const placed = [];
        const feats = (mapFeatures?.features || [])
            .filter(f => !shouldSuppressKind(f.properties?.kind, zoom))
            .sort((a, b) => kindPriority(b.properties?.kind) - kindPriority(a.properties?.kind)); // high first

        for (const f of feats) {
            const c = llFromCentroid(f);
            if (!c) continue;
            const conflict = placed.some(p => haversineMeters(p, c) < spacing);
            if (!conflict) {
                allowedLabelIds.add(f.properties?.id);
                placed.push(c);
            }
        }
    }

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
                onRegionChangeComplete={(r) => {
                    setRegion(r);
                    setZoom(zoomFromDelta(r.longitudeDelta || 0.02));
                }}
                onMapReady={() => fitToEverything()}
            >
                {/* Park features */}
                {showPark && (mapFeatures?.features || []).map((f, i) => {
                    const { geometry: g, properties: p } = f || {};
                    const key = p?.id || i;
                    const color = KIND_COLORS[p?.kind] || '#334155';
                    const common = { zoom, focusedId, allowedLabelIds, onPress: setFocusedId };

                    if (g?.type === 'Point') return <PointMarker key={key} feature={f} {...common} />;
                    if (g?.type === 'Polygon') return <PolygonWithLabel key={key} feature={f} color={color} {...common} />;
                    if (g?.type === 'LineString') return <LineWithDistance key={key} feature={f} color={color} {...common} />;
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

            {focusedId && (
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        padding: 8,
                        backgroundColor: 'white',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                    }}
                    onPress={() => setFocusedId(null)}
                >
                    <Ionicons name="close" size={18} />
                </TouchableOpacity>
            )}

            {/* Zoom controls */}
            <View style={[styles.zoomControls, { bottom: showNearby ? 72 : 12 }]}>
                <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
                    <Ionicons name="add" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
                    <Ionicons name="remove" size={20} />
                </TouchableOpacity>
            </View>

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
    zoomControls: {
        position: 'absolute',
        right: 12,
        // bottom is set dynamically above
        alignItems: 'center',
        gap: 8,
    },
    zoomBtn: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 2,              // Android shadow
        shadowColor: '#000',       // iOS shadow
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
});