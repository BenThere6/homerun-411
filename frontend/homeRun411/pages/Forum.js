import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

export default function ForumPage({ navigation }) {
    const [forumPosts, setForumPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedPosts, setExpandedPosts] = useState([]);
    const [sortOption, setSortOption] = useState('date');

    const fetchPosts = async () => {
        try {
            if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }

            const response = await fetch(`${BACKEND_URL}/api/post`);
            const data = await response.json();

            let sortedData = [...data];
            if (sortOption === 'mostReplies') {
                sortedData.sort((a, b) => (b.comments || 0) - (a.comments || 0));
            } else {
                sortedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setForumPosts(sortedData); // ✅ this is correct
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Forum',
            headerStyle: {
                backgroundColor: '#ffd699',
            },
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    const renderPost = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.topRow}>
                {item.author?.profile?.avatarUrl ? (
                    <Image
                        source={{ uri: item.author.profile.avatarUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                        style={styles.avatar}
                    />
                )}
                <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.authorName}>
                            {item.author?.profile?.firstName
                                ? `${item.author.profile.firstName} ${item.author.profile.lastName || ''}`
                                : 'Anonymous'}
                        </Text>
                        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
            </View>

            {item.tags?.length > 0 && (
                <View style={styles.tagContainer}>
                    {item.tags.map((tag, idx) => (
                        <Text key={idx} style={styles.tag}>#{tag}</Text>
                    ))}
                </View>
            )}

            <Text style={styles.cardContent}>
                {expandedPosts.includes(item._id)
                    ? item.content
                    : item.content.slice(0, 160) + (item.content.length > 160 ? '...' : '')}
            </Text>

            {item.content.length > 160 && (
                <TouchableOpacity onPress={() => {
                    setExpandedPosts(prev =>
                        prev.includes(item._id)
                            ? prev.filter(id => id !== item._id)
                            : [...prev, item._id]
                    );
                }}>
                    <Text style={styles.readMoreText}>
                        {expandedPosts.includes(item._id) ? 'Show Less ▲' : 'Read More ▼'}
                    </Text>
                </TouchableOpacity>
            )}

            {item.referencedPark && (
                <View style={styles.parkTagBox}>
                    <Text style={styles.parkTagLabel}>🏞️ {item.referencedPark.name}</Text>
                    <Text style={styles.parkTagLocation}>
                        {item.referencedPark.city}, {item.referencedPark.state}
                    </Text>
                </View>
            )}

            <View style={styles.cardMeta}>
                <Ionicons name="heart-outline" size={16} color="#999" />
                <Text style={styles.metaText}>{item.likes || 0}</Text>
                <Ionicons name="chatbubble-outline" size={16} color="#999" style={{ marginLeft: 10 }} />
                <Text style={styles.metaText}>{item.comments || 0}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={forumPosts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchPosts();
                            }}
                            progressViewOffset={60}
                        />
                    }
                    ListHeaderComponent={() => (
                        <View style={styles.sortBar}>
                            <TouchableOpacity
                                onPress={() => {
                                    setSortOption('date');
                                    fetchPosts();
                                }}
                                style={[
                                    styles.sortOption,
                                    sortOption === 'date' && styles.selectedSortOption,
                                ]}
                            >
                                <Text style={sortOption === 'date' ? styles.selectedSortText : styles.sortText}>
                                    🕒 Newest
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setSortOption('mostReplies');
                                    fetchPosts();
                                }}
                                style={[
                                    styles.sortOption,
                                    sortOption === 'mostReplies' && styles.selectedSortOption,
                                ]}
                            >
                                <Text style={sortOption === 'mostReplies' ? styles.selectedSortText : styles.sortText}>
                                    💬 Most Relevant
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NewPostForm')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffaf0', // Soft orange
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginRight: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginTop: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        marginBottom: 4,
    },
    tag: {
        color: colors.thirty,
        marginRight: 8,
        fontSize: 13,
    },
    cardContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#f28b02',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    parkTagBox: {
        backgroundColor: '#fffaf0',
        borderLeftWidth: 4,
        borderLeftColor: '#f28b02',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
    },
    parkTagLabel: {
        fontWeight: '600',
        color: '#333',
        fontSize: 14,
    },
    parkTagLocation: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    readMoreText: {
        fontSize: 13,
        color: '#f28b02',
        fontWeight: '600',
        marginBottom: 6,
    },
    sortOption: {
        marginHorizontal: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#fff3e0',
        fontSize: 13,
        fontWeight: '600',
        color: '#f28b02',
    },
    selectedSort: {
        backgroundColor: '#f28b02',
        color: 'white',
    },
    sortBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fffaf0',
    },
    sortOption: {
        backgroundColor: '#fff3e0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    selectedSortOption: {
        backgroundColor: '#f28b02',
    },
    sortText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f28b02',
    },
    selectedSortText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
});