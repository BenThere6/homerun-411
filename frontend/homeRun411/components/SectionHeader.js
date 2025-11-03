// components/SectionHeader.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../assets/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function SectionHeader({ title }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />
      <LinearGradient colors={colors.sectionPillGradient} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.pill}>
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(42,45,116,0.12)',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(42,45,116,0.12)',
    marginHorizontal: 10,
  },
  text: {
    color: colors.brandNavy,
    fontWeight: '700',
    fontSize: 14,
  },
});
