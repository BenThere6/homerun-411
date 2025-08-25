// components/DebugValues.jsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { discoverAttributeKeys, buildSummaries } from '../utils/fieldSummaries';

export default function DebugValues({ fields, opts }) {
    const [open, setOpen] = useState(false);

    const keys = useMemo(() => discoverAttributeKeys(fields || []), [fields]);
    const summaries = useMemo(() => buildSummaries(fields || [], opts), [fields, opts]);

    return (
        <View style={styles.card}>
            <TouchableOpacity
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(o => !o); }}
                style={styles.header}
            >
                <Text style={styles.title}>Field Summary Debug</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#111" />
            </TouchableOpacity>

            {open ? (
                <View>
                    <Text style={styles.label}>Discovered keys ({keys.length}):</Text>
                    <Text style={styles.code}>{keys.join(', ')}</Text>

                    <Text style={[styles.label, { marginTop: 10 }]}>Summaries (raw):</Text>
                    <Text style={styles.code}>{JSON.stringify(summaries, null, 2)}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 15, fontWeight: '700', color: '#111' },
    label: { fontSize: 12, fontWeight: '700', color: '#111', marginTop: 6 },
    code: {
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        fontSize: 11,
        color: '#111',
        backgroundColor: '#f8fafc',
        padding: 8,
        marginTop: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
});