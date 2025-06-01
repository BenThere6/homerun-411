import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const etiquetteItems = [
  {
    id: 1,
    icon: 'megaphone-outline',
    title: 'Cheering Respectfully',
    description: 'Support your team without taunting players or officials.',
  },
  {
    id: 2,
    icon: 'trash-outline',
    title: 'Clean Up After Yourself',
    description: 'Leave no trash behind—keep parks and bleachers clean.',
  },
  {
    id: 3,
    icon: 'volume-mute-outline',
    title: 'Limit Noise During Play',
    description: 'Avoid loud conversations or noise during active plays.',
  },
  {
    id: 4,
    icon: 'person-remove-outline',
    title: 'Respect Personal Space',
    description: 'Give players, officials, and spectators appropriate space.',
  },
  {
    id: 5,
    icon: 'stop-circle-outline',
    title: 'No Coaching from the Stands',
    description: 'Avoid shouting instructions at players or umpires.',
  },
  {
    id: 6,
    icon: 'time-outline',
    title: 'Be Punctual',
    description: 'Arrive on time for games and practices.',
  },
  {
    id: 7,
    icon: 'walk-outline',
    title: 'Stay Off the Field',
    description: 'Do not enter the field unless invited by an official.',
  },
];

export default function EtiquettePage() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {etiquetteItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <Ionicons name={item.icon} size={24} color="#4d774e" style={styles.icon} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6ffe9', // light green background
  },
  scrollContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2f4f4f',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#555',
  },
});