import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import colors from '../assets/colors'; // Importing the color variables
import { BACKEND_URL } from '@env'; // Import the backend URL from .env

export default function ForumPage({ navigation }) {
    const [forumPosts, setForumPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch posts from the backend
    const fetchPosts = async () => {
        setLoading(true); // Show loading indicator while fetching
        try {
            const response = await fetch(`${BACKEND_URL}/api/post`); // Use the backend URL from .env
            const data = await response.json();
            setForumPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false); // Stop showing the loading indicator
        }
    };

    // Fetch posts on component mount
    useEffect(() => {
        fetchPosts();
    }, []);

    // Render each post
    const renderPost = ({ item }) => (
        <TouchableOpacity style={styles.postContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.metaDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            {item.tags && item.tags.length > 0 && (
                <View style={styles.taggedParksContainer}>
                    {item.tags.map((park, index) => (
                        <Text key={index} style={styles.taggedPark}>
                            #{park}
                        </Text>
                    ))}
                </View>
            )}

            <Text style={styles.postSnippet}>{item.content}</Text>

            <View style={styles.postMeta}>
                <View style={styles.metaLeft}>
                    <Ionicons name="heart-outline" size={16} color={colors.secondaryText} />
                    <Text style={styles.metaText}>{item.likes || 0}</Text>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.secondaryText} style={styles.commentIcon} />
                    <Text style={styles.metaText}>{item.comments || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Forum Header */}
            <View style={styles.header}>
                {/* Refresh Button on the left */}
                <TouchableOpacity style={styles.refreshButton} onPress={fetchPosts}>
                    <Ionicons name="refresh-outline" size={24} color={colors.ten} />
                    <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Forum</Text>

                {/* New Post Button on the right */}
                <TouchableOpacity
                    style={styles.newPostButton}
                    onPress={() => navigation.navigate('NewPostForm')}
                >
                    <Ionicons name="add-circle-outline" size={24} color={colors.ten} />
                </TouchableOpacity>
            </View>

            {/* Show a loading indicator while fetching data */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : (
                <FlatList
                    data={forumPosts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item._id} // Use _id as the key from your backend
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.sixty, // White background (60%)
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15, // Vertical padding to center the title and button
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0', // Gray border
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, // Takes up the space in the header, ensuring center alignment
        color: colors.primaryText, // Black color for the title text
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: colors.primary,
        borderRadius: 5,
    },
    refreshText: {
        color: colors.oppText, // Opposite text color (white, probably)
        marginLeft: 5, // Spacing between icon and text
        fontSize: 16,
    },
    newPostButton: {
        position: 'absolute', 
        right: 20, // Aligns the button to the right side
    },
    listContainer: {
        padding: 10,
    },
    postContainer: {
        backgroundColor: colors.sixty, // White background for posts
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 }, // Shadow position for iOS
        shadowOpacity: 0.2, // Shadow opacity for iOS
        shadowRadius: 3.84, // Shadow blur for iOS
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Vertically align the title and date
        marginBottom: 5, // Add spacing below the title row
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1, // Make sure the title takes the available space
        color: colors.primaryText, // Black color for the post title
    },
    metaDate: {
        fontSize: 12,
        color: colors.secondaryText, // Gray color for date
    },
    taggedParksContainer: {
        flexDirection: 'row',
        marginBottom: 5, // Spacing below the tagged parks
    },
    taggedPark: {
        fontSize: 14,
        color: colors.thirty,
        marginRight: 10, // Spacing between each tag
    },
    postSnippet: {
        fontSize: 14,
        color: colors.secondaryText, // Gray for post snippet
        marginBottom: 10,
    },
    postMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    metaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: colors.secondaryText, // Gray for likes and comments
        marginLeft: 5,
    },
    commentIcon: {
        marginLeft: 10, // Add spacing between likes and comments
    },
});