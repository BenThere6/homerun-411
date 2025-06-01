import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const notifications = [
  {
    id: 1,
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '08:39 AM',
  },
  {
    id: 2,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '07:00 AM',
  },
  {
    id: 3,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '03:39 AM',
  },
  {
    id: 4,
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '02:30 AM',
  },
  {
    id: 5,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '01:00 AM',
  },
];

export default function NotificationsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {notifications.map((note) => (
          <View key={note.id} style={styles.card}>
            <Image source={{ uri: note.avatar }} style={styles.avatar} />

            <View style={styles.centerArea}>
              <Text style={styles.message}>{note.message}</Text>
            </View>

            <View style={styles.rightColumn}>
              <Ionicons name="close" size={16} color="#aaa" />
              <Text style={styles.time}>{note.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffe6f0',
  },
  scrollContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 10,
    marginRight: 12,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    color: '#333',
  },
  rightColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 10,
    height: 45,
  },
  time: {
    fontSize: 12,
    color: '#aaa',
  },
});