// screens/DataDictionary.js
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DICTIONARY = [
    // ---- Park (general) ----
    {
        group: 'Park',
        items: [
            { key: 'isPetFriendly', label: 'Pet Friendly', type: 'boolean', example: 'true/false', desc: 'Whether pets are allowed at the park.' },
            { key: 'gateEntranceFee', label: 'Entrance/Gate Fee', type: 'boolean', example: 'true/false', desc: 'If a fee is required to enter during events.' },
            { key: 'playground.available', label: 'Playground Available', type: 'boolean', example: 'true/false', desc: 'Presence of a public playground.' },
            { key: 'playground.location', label: 'Playground Location', type: 'string', example: '“North of Field 2”', desc: 'Where the playground is within the complex.' },
            { key: 'battingCages.shared', label: 'Shared Batting Cages', type: 'boolean', example: 'true/false', desc: 'Whether there are cages shared by multiple fields/teams.' },
            { key: 'battingCages.description', label: 'Batting Cage Description', type: 'string', example: '“Two lanes behind LF fence at Field 1”', desc: 'Details about cages: count, access, placement.' },
            { key: 'closestParkingToField', label: 'Parking Location', type: 'string', example: '“Lot B off Elm St. closest to Field 3”', desc: 'Best parking area relative to fields.' },
            { key: 'parking.handicapSpots', label: 'Handicap Spots', type: 'number', example: '4', desc: 'Number of marked accessible parking spots.' },
            { key: 'electricalOutletsForPublicUse', label: 'Public Electrical Outlets', type: 'boolean', example: 'true/false', desc: 'Outlets available for general public use.' },
            { key: 'electricalOutletsLocation', label: 'Outlet Locations', type: 'string', example: '“Concessions patio; Coaches room”', desc: 'Where outlets can be found.' },
            { key: 'sidewalks', label: 'Sidewalks', type: 'string', example: '“Continuous from main lot to all fields”', desc: 'Sidewalk continuity/coverage/quality.' },
            { key: 'stairsDescription', label: 'Stairs', type: 'string', example: '“6 steps from lot to Fields 3–4”', desc: 'Any stairs users should know about.' },
            { key: 'hillsDescription', label: 'Hills/Grades', type: 'string', example: '“Steep hill by RF of Field 2”', desc: 'Slopes/grades that affect walking/spectating.' },
            { key: 'spectatorConditions.locationTypes', label: 'Spectator Locations', type: 'string[]', example: '["Bleachers","Grass","Outfield berm"]', desc: 'Typical places spectators gather.' },
        ],
    },

    // ---- Restrooms ----
    {
        group: 'Restrooms',
        items: [
            { key: 'restrooms[].location', label: 'Location', type: 'string', example: '“Between Fields 1 & 2”', desc: 'Where restrooms are found.' },
            { key: 'restrooms[].runningWater', label: 'Running Water', type: 'boolean', example: 'true/false', desc: 'If sinks/toilets have running water.' },
            { key: 'restrooms[].changingTable', label: 'Changing Table', type: 'boolean|string', example: 'true/false or “Women’s only”', desc: 'Presence/notes about changing tables.' },
            { key: 'restrooms[].womensStalls', label: 'Women’s Stalls', type: 'number', example: '2', desc: 'Count if known.' },
            { key: 'restrooms[].mensStalls', label: 'Men’s Stalls/Urinals', type: 'number', example: '3', desc: 'Count if known.' },
        ],
    },

    // ---- Concessions ----
    {
        group: 'Concessions',
        items: [
            { key: 'concessions.available', label: 'Concessions Available', type: 'boolean', example: 'true/false', desc: 'Whether a stand exists (hours vary).' },
            { key: 'concessions.snacks', label: 'Snacks', type: 'boolean', example: 'true/false', desc: 'Pre-packaged snacks available.' },
            { key: 'concessions.drinks', label: 'Drinks', type: 'boolean', example: 'true/false', desc: 'Beverages available.' },
            { key: 'concessions.otherFood', label: 'Other Food', type: 'string', example: '“Hot dogs; breakfast burritos”', desc: 'Prepared food, if any.' },
            { key: 'concessions.paymentMethods', label: 'Payment Methods', type: 'string[]', example: '["Cash","Card","Venmo"]', desc: 'Accepted payment types.' },
        ],
    },

    // ---- Fields (grouped like your ParkDetails) ----
    {
        group: 'Fields: Surfaces',
        items: [
            { key: 'fields[].infieldSurface', label: 'Infield Surface', type: 'enum', example: '“Dirt”, “Turf”', desc: 'Primary infield surface.' },
            { key: 'fields[].outfieldSurface', label: 'Outfield Surface', type: 'enum', example: '“Grass”, “Turf”', desc: 'Primary outfield surface.' },
        ],
    },
    {
        group: 'Fields: Dimensions',
        items: [
            { key: 'fields[].leftFieldDistance', label: 'Left Field Distance', type: 'number', example: '200 (ft)', desc: 'Approx LF fence distance.' },
            { key: 'fields[].centerFieldDistance', label: 'Center Field Distance', type: 'number', example: '225 (ft)', desc: 'Approx CF fence distance.' },
            { key: 'fields[].rightFieldDistance', label: 'Right Field Distance', type: 'number', example: '200 (ft)', desc: 'Approx RF fence distance.' },
            { key: 'fields[].fenceHeight', label: 'Fence Height', type: 'number', example: '4 (ft)', desc: 'Typical fence height if known.' },
        ],
    },
    {
        group: 'Fields: Amenities',
        items: [
            { key: 'fields[].dugoutType', label: 'Dugout Type', type: 'enum', example: '“Open”, “Covered”', desc: 'Whether dugouts have cover.' },
            { key: 'fields[].bleachersAvailable', label: 'Bleachers', type: 'boolean', example: 'true/false', desc: 'Bleachers present for spectators.' },
            { key: 'fields[].bleachersDescription', label: 'Bleachers Description', type: 'string', example: '“3 rows; shaded; backs”', desc: 'Capacity or comfort notes.' },
            { key: 'fields[].bullpens', label: 'Bullpens', type: 'boolean', example: 'true/false', desc: 'Designated warm-up areas.' },
            { key: 'fields[].foulTerritory', label: 'Foul Territory Space', type: 'string', example: '“Tight on 1B side”', desc: 'Room around sidelines/backstop.' },
            { key: 'fields[].lights', label: 'Field Lights', type: 'boolean', example: 'true/false', desc: 'Night-game capable.' },
            { key: 'fields[].scoreboard', label: 'Scoreboard', type: 'boolean', example: 'true/false', desc: 'Electronic/manual scoreboard present.' },
        ],
    },
    {
        group: 'Fields: Other',
        items: [
            { key: 'fields[].name', label: 'Field Name/Number', type: 'string|number', example: '“Field 3”', desc: 'Displayed name or number.' },
            { key: 'fields[].notes', label: 'Notes', type: 'string', example: '“Windy; shade late afternoon”', desc: 'Any extra context about a field.' },
        ],
    },
];

export default function DataDictionary() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState({}); // { [group]: boolean }
    const [fade] = useState(new Animated.Value(0));

    // Fade in on mount
    React.useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, [fade]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return DICTIONARY;
        return DICTIONARY.map(section => ({
            ...section,
            items: section.items.filter(it =>
                it.label.toLowerCase().includes(q) ||
                it.key.toLowerCase().includes(q) ||
                (it.desc || '').toLowerCase().includes(q)
            )
        })).filter(section => section.items.length > 0);
    }, [query]);

    return (
        <Animated.View style={[styles.container, { opacity: fade }]}>
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color="#64748b" />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search everything we track (e.g., bleachers, outlets, LF distance)"
                    returnKeyType="search"
                    style={styles.searchInput}
                />
                {query ? (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                ) : null}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                {filtered.map(sec => {
                    const isOpen = !!open[sec.group];
                    return (
                        <View key={sec.group} style={styles.card}>
                            <TouchableOpacity
                                onPress={() => setOpen(prev => ({ ...prev, [sec.group]: !isOpen }))}
                                style={styles.cardHeader}
                                accessibilityRole="button"
                                accessibilityLabel={`Toggle ${sec.group}`}
                            >
                                <Text style={styles.cardTitle}>{sec.group}</Text>
                                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
                            </TouchableOpacity>

                            {isOpen && (
                                <View style={styles.cardBody}>
                                    {sec.items.map(item => (
                                        <View key={`${sec.group}:${item.key}`} style={styles.row}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.label}>{item.label}</Text>
                                                <Text style={styles.keyText}>{item.key}</Text>
                                                {!!item.desc && <Text style={styles.desc}>{item.desc}</Text>}
                                                <View style={styles.metaRow}>
                                                    <View style={styles.pill}><Text style={styles.pillText}>{item.type}</Text></View>
                                                    {!!item.example && (
                                                        <View style={[styles.pill, { marginLeft: 6 }]}>
                                                            <Ionicons name="bulb-outline" size={12} color="#0f172a" />
                                                            <Text style={[styles.pillText, { marginLeft: 4 }]}>
                                                                {String(item.example)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7f7', padding: 12 },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
    },
    searchInput: { marginLeft: 8, flex: 1, fontSize: 14, color: '#0f172a' },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    cardBody: { paddingHorizontal: 12, paddingBottom: 12 },

    row: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
        marginTop: 10,
    },
    label: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    keyText: { fontSize: 12, color: '#64748b', marginTop: 2 },
    desc: { fontSize: 12, color: '#374151', marginTop: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pillText: { fontSize: 11, color: '#0f172a', fontWeight: '600' },
});
