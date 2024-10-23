import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For accessing the token and user ID
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';

export default function NewPostForm() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigation = useNavigation();

    const handleSubmit = async () => {
        if (!title || !content) {
            Alert.alert('Error', 'Please fill in both the title and content.');
            return;
        }

        try {
            // Retrieve token and userId from AsyncStorage
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            if (!token || !userId) {
                Alert.alert('Error', 'You are not authorized. Please log in again.');
                navigation.navigate('LoginPage');
                return;
            }

            // Make the POST request with the user ID as author
            const response = await fetch(`${BACKEND_URL}/api/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Attach the token in the Authorization header
                },
                body: JSON.stringify({
                    title,
                    content,
                    author: userId, // Add the author field directly from AsyncStorage
                }),
            });

            const responseText = await response.text();
            console.log('Response Status:', response.status);
            console.log('Response Text (raw):', responseText);

            if (response.ok) {
                Alert.alert('Success', 'Your post has been created.');
                navigation.goBack(); // Navigate back to the forum page or wherever appropriate
            } else {
                const errorData = await JSON.parse(responseText);
                Alert.alert('Error', errorData.message || 'Failed to create post.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'An error occurred while creating the post. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Create a New Post</Text>

            <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor={colors.secondaryText}
                value={title}
                onChangeText={setTitle}
            />

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Content"
                placeholderTextColor={colors.secondaryText}
                value={content}
                onChangeText={setContent}
                multiline
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.sixty,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        color: colors.primaryText,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: colors.thirty,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: colors.primaryText,
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: colors.thirty,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: colors.oppText,
        fontSize: 18,
    },
});