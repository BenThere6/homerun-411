// components/SpecList.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// One row: Title, primary value (common), and optional gray subtext
export function SpecRow({ title, value, subtext, subItems }) {
    return (
        <View style={styles.row}>
            <View style={styles.rowHeaderWrap}>
                <Text style={styles.rowHeader}>{title}</Text>
            </View>
            {value != null &&
                String(value).trim() !== '' &&
                String(value).trim().toLowerCase() !== 'varies by field' ? (
                <Text style={styles.value}>{value}</Text>
            ) : null}

            {/* NEW: multi-line subtext */}
            {Array.isArray(subItems) && subItems.length > 0 ? (
                <View style={styles.sublist}>
                    {subItems.map((line, idx) => (
                        <Text key={idx} style={styles.subtext}>{line}</Text>
                    ))}
                </View>
            ) : (subtext ? <Text style={styles.subtext}>{subtext}</Text> : null)}
        </View>
    );
}

// Section wrapper with optional collapsing
// NOTE: This renders as an "inset" section (no card styling).
// We expect you to wrap the whole Fields area in your existing white card.
export function SpecSection({ heading, children, collapsible = false, defaultExpanded = true }) {
    const [open, setOpen] = useState(defaultExpanded);

    const toggle = () => {
        if (!collapsible) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(o => !o);
    };

    return (
        <View style={styles.section}>
            <TouchableOpacity
                activeOpacity={collapsible ? 0.7 : 1}
                onPress={toggle}
                style={styles.sectionHeader}
            >
                <Text style={styles.sectionHeading}>{heading}</Text>
                {collapsible ? (
                    <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#111111"
                    />
                ) : null}
            </TouchableOpacity>

            {(!collapsible || open) ? (
                <View style={styles.sectionBody}>
                    {children}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111111', // black heading
    },
    // Inset body (no card). The outer page/card supplies the white card.
    sectionBody: {
        paddingTop: 2,
    },

    row: {
        marginBottom: 10,
    },
    rowHeaderWrap: {
        marginBottom: 2,
    },
    rowHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827', // near-black
    },
    value: {
        fontSize: 14,
        color: '#111827',
    },
    subtext: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280', // gray-500
    },
    sublist: {
        marginTop: 2,
    },
});