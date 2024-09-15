import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import colors from '../assets/colors'; // Importing the color variables

export default function ForumPage() {
    // Example data for forum posts
    const forumPosts = [
        {
            id: '1',
            title: 'Best Baseball Parks in Utah',
            content: 'Share your favorite parks and what makes them great...',
            comments: 12,
            likes: 25,
            date: 'Sept 10, 2024',
            taggedParks: ['Park 1', 'Park 2'], // Tagged parks for this post
        },
        {
            id: '2',
            title: 'Concessions at Park 1',
            content: 'Does anyone know if Park 1 takes cash at their concessions?',
            comments: 8,
            likes: 15,
            date: 'Sept 9, 2024',
            taggedParks: ['Park 1'], // Single tagged park
        },
        {
            id: '3',
            title: 'Best Playgrounds for Kids',
            content: 'What parks have the best playgrounds for kids to enjoy?',
            comments: 6,
            likes: 10,
            date: 'Sept 5, 2024',
            taggedParks: [], // No tagged parks
        },
        {
            id: '4',
            title: 'New Baseball Park Opening',
            content: 'There’s a new baseball park opening in our city soon!',
            comments: 15,
            likes: 30,
            date: 'Sept 1, 2024',
            taggedParks: ['Park 3'], // Tagged park
        },
        {
            id: '5',
            title: 'Night Games at Park 4',
            content: 'Who wants to join for a night game at Park 4?',
            comments: 4,
            likes: 8,
            date: 'Aug 28, 2024',
            taggedParks: ['Park 4'], // Tagged park
        },
    ];

    // Render each forum post
    const renderPost = ({ item }) => (
        <TouchableOpacity style={styles.postContainer}>
            {/* Title and Date Row */}
            <View style={styles.titleRow}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.metaDate}>{item.date}</Text>
            </View>

            {/* Display Tagged Parks if they exist */}
            {item.taggedParks && item.taggedParks.length > 0 && (
                <View style={styles.taggedParksContainer}>
                    {item.taggedParks.map((park, index) => (
                        <Text key={index} style={styles.taggedPark}>
                            #{park}
                        </Text>
                    ))}
                </View>
            )}

            {/* Post Snippet */}
            <Text style={styles.postSnippet}>{item.content}</Text>

            {/* Post Meta Info */}
            <View style={styles.postMeta}>
                {/* Likes and Comments Icons */}
                <View style={styles.metaLeft}>
                    <Ionicons name="heart-outline" size={16} color={colors.secondaryText} />
                    <Text style={styles.metaText}>{item.likes}</Text>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.secondaryText} style={styles.commentIcon} />
                    <Text style={styles.metaText}>{item.comments}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Forum Header */}
            <View style={styles.header}>
                {/* Filter Icon on the left */}
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter-outline" size={24} color={colors.ten} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Forum</Text>

                {/* New Post Button on the right */}
                <TouchableOpacity style={styles.newPostButton}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.ten} />
                </TouchableOpacity>
            </View>

            {/* Forum Post List */}
            <FlatList
                data={forumPosts} // Render all posts in the FlatList
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.sixty, // White background (60%)
    },
    container: {
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
    filterButton: {
        position: 'absolute',
        left: 20, // Aligns the button to the left side
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