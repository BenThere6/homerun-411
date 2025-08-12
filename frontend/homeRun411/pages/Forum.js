import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
    ActivityIndicator, Image, RefreshControl, ScrollView, TextInput, Modal,
    Platform, LayoutAnimation, UIManager, useWindowDimensions, Keyboard,
    KeyboardAvoidingView, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import axios from '../utils/axiosInstance';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatFullDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

export default function ForumPage({ navigation }) {
    const { height: screenH } = useWindowDimensions();
    const SHEET_MAX = Math.round(screenH * 0.85);
    const [sheetH, setSheetH] = useState(null);
    const [dockH, setDockH] = useState(0); // measured bottom dock heigh
    const [forumPosts, setForumPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [hasLiked, setHasLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [adminLevel, setAdminLevel] = useState(2); // 0,1 admin; 2 non-admin
    const [userId, setUserId] = useState(null);

    const insets = useSafeAreaInsets();

    const fetchPosts = async () => {
        try {
            if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
            const response = await fetch(`${BACKEND_URL}/api/post`);
            const data = await response.json();
            const sortedData = [...data].sort((a, b) => {
                const ap = a.pinned ? 1 : 0;
                const bp = b.pinned ? 1 : 0;
                if (ap !== bp) return bp - ap;
                const apAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
                const bpAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
                if (apAt !== bpAt) return bpAt - apAt;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setForumPosts(sortedData);
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

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const decoded = jwtDecode(token);
                setAdminLevel(decoded?.adminLevel ?? 2);
                setUserId(decoded?.id ?? null);
            } catch { }
        })();
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Forum',
            headerStyle: { backgroundColor: '#ffd699' },
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            const routeParams = navigation.getState()?.routes?.find((r) => r.name === 'Forum')?.params;
            if (routeParams?.openPostId && forumPosts.length > 0) {
                const match = forumPosts.find((p) => p._id === routeParams.openPostId);
                if (match) setSelectedPost(match);
                navigation.setParams && navigation.setParams({ openPostId: null });
            }
        }, [forumPosts])
    );

    useEffect(() => {
        const load = async () => {
            if (!selectedPost?._id) return;
            try {
                const { data: cmts } = await axios.get(`/api/post/${selectedPost._id}/comments`);
                setComments(cmts || []);
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const { data } = await axios.get(`/api/post/${selectedPost._id}/liked`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setHasLiked(!!data?.liked);
                    setLikesCount(data?.likesCount ?? (selectedPost.likes?.length || 0));
                } else {
                    setHasLiked(false);
                    setLikesCount(selectedPost.likes?.length || 0);
                }
            } catch (e) {
                setComments([]);
                setHasLiked(false);
                setLikesCount(selectedPost.likes?.length || 0);
            }
        };
        load();
        setCommentText('');
    }, [selectedPost]);

    useEffect(() => {
        if (selectedPost) {
            setSheetH(null);
            setDockH(0);
        }
    }, [selectedPost]);

    const toggleLike = async () => {
        if (!selectedPost?._id) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const { data } = await axios.post(
                `/api/post/${selectedPost._id}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHasLiked(data.liked);
            setLikesCount(data.likesCount);
            setForumPosts((prev) =>
                prev.map((p) =>
                    p._id === selectedPost._id ? { ...p, likes: Array(data.likesCount).fill('x') } : p
                )
            );
        } catch (e) { }
    };

    const submitComment = async () => {
        if (!selectedPost?._id || !commentText.trim()) return;
        try {
            setSubmitting(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const { data } = await axios.post(
                `/api/post/${selectedPost._id}/comments`,
                { content: commentText.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments((prev) => [...prev, data]);
            setCommentText('');
        } catch (e) {
        } finally {
            setSubmitting(false);
        }
    };

    // --- PIN logic (permissions + visuals) ---
    const isPinned = !!selectedPost?.pinned;

    const pinnedById = selectedPost?.pinnedBy
        ? (typeof selectedPost.pinnedBy === 'object'
            ? String(selectedPost.pinnedBy._id)
            : String(selectedPost.pinnedBy))
        : null;

    const isAdminAny = (adminLevel === 0 || adminLevel === 1);

    // actions
    const canPin = isAdminAny && !isPinned;
    const canUnpin = isPinned && (
        adminLevel === 0 ||
        (adminLevel === 1 && pinnedById === String(userId))
    );

    // UI tint + disabled state for the chip next to Like/Comment
    const pinTint = (() => {
        if (isPinned && (adminLevel === 0 || pinnedById === String(userId))) return '#e74c3c'; // red
        if (isPinned) return '#aaa'; // gray (pinned by someone else; lvl1 cannot unpin)
        return '#666';               // normal
    })();
    const pinDisabled = isPinned && adminLevel === 1 && pinnedById !== String(userId);

    const onTogglePin = async () => {
        if (!(canPin || canUnpin)) return;
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const action = canUnpin ? 'unpin' : 'pin';
            const { data } = await axios.post(
                `/api/post/${selectedPost._id}/${action}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const nowPinned = data?.pinned ?? (action === 'pin');
            const updated = {
                ...selectedPost,
                pinned: nowPinned,
                pinnedAt: nowPinned ? (data?.pinnedAt || new Date().toISOString()) : null,
                pinnedBy: nowPinned ? (data?.pinnedBy ?? userId) : null,
            };

            setSelectedPost(updated);

            // Update list & resort so it jumps to the top immediately
            setForumPosts(prev =>
                [...prev.map(p =>
                    p._id === updated._id
                        ? { ...p, pinned: updated.pinned, pinnedAt: updated.pinnedAt, pinnedBy: updated.pinnedBy }
                        : p
                )].sort((a, b) => {
                    const ap = a.pinned ? 1 : 0;
                    const bp = b.pinned ? 1 : 0;
                    if (ap !== bp) return bp - ap;
                    const apAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
                    const bpAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
                    if (apAt !== bpAt) return bpAt - apAt;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                })
            );
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || 'Pin action failed.';
            Alert.alert('Pin', msg);
            console.log('Pin/unpin failed:', msg);
        }
    };

    const goToRealParkDetails = (park) => {
        navigation.navigate('ParkDetails', {
            parkId: park?._id ?? park?.id ?? null,
            id: park?._id ?? park?.id ?? null,
            park,
        });
    };

    const renderPost = ({ item }) => (
        <TouchableOpacity onPress={() => setSelectedPost(item)}>
            <View style={styles.card}>
                <View style={styles.topRow}>
                    {item.author?.profile?.avatarUrl ? (
                        <Image source={{ uri: item.author.profile.avatarUrl }} style={styles.avatar} />
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
                                    ? `${item.author.profile.firstName}${item.author.profile.lastName ? ' ' + item.author.profile.lastName : ''
                                    }`
                                    : 'Anonymous'}
                            </Text>
                            <Text style={styles.cardDate}>{formatFullDate(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.pinned && (
                            <View style={styles.pinnedBadge}>
                                <Ionicons name="pin" size={12} color="#b45309" />
                                <Text style={styles.pinnedText}>Pinned</Text>
                            </View>
                        )}
                    </View>
                </View>

                {item.tags?.length > 0 && (
                    <View style={styles.tagContainer}>
                        {item.tags.map((tag, idx) => (
                            <Text key={idx} style={styles.tag}>
                                #{tag}
                            </Text>
                        ))}
                    </View>
                )}

                <Text style={styles.cardContent}>
                    {item.content.length > 160 ? item.content.slice(0, 160) + '...' : item.content}
                </Text>

                {item.referencedPark && (
                    <TouchableOpacity
                        onPress={() => goToRealParkDetails(item.referencedPark)}
                        style={styles.parkChip}
                        activeOpacity={0.7}
                    >
                        <View style={styles.parkChipLeft}>
                            <Ionicons name="location-outline" size={16} color="#f28b02" />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text numberOfLines={1} style={styles.parkChipName}>
                                    {item.referencedPark.name}
                                </Text>
                                <Text numberOfLines={1} style={styles.parkChipSub}>
                                    {item.referencedPark.city}, {item.referencedPark.state}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#bbb" />
                    </TouchableOpacity>
                )}

                <View style={styles.cardMeta}>
                    <Ionicons name="heart-outline" size={16} color="#999" />
                    <Text style={styles.metaText}>{item.likesCount}</Text>
                    <Ionicons name="chatbubble-outline" size={16} color="#999" style={{ marginLeft: 10 }} />
                    <Text style={styles.metaText}>{item.commentsCount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.thirty} style={{ marginTop: 40 }} />
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
                />
            )}

            {selectedPost && (
                <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedPost(null)}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0} // tweak (44/64) if needed for header/safe area
                            style={{ width: '95%', alignSelf: 'center' }}
                        >
                            <View style={[styles.modalSheet, { maxHeight: SHEET_MAX, height: sheetH ?? undefined }]}>
                                {/* BODY (scrolls) */}
                                <ScrollView
                                    style={styles.modalScroll}
                                    contentContainerStyle={{ padding: 20, paddingBottom: (dockH || 140) + insets.bottom }}
                                    keyboardShouldPersistTaps="handled"
                                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                                    showsVerticalScrollIndicator={false}
                                    onContentSizeChange={(_, h) => {
                                        const desired = Math.min(SHEET_MAX, Math.max(300, h));
                                        setSheetH(desired);
                                    }}
                                >
                                    <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                                    <Text style={styles.modalAuthor}>
                                        by {selectedPost.author?.profile?.firstName || 'Anonymous'}
                                    </Text>

                                    <Text style={styles.modalText}>{selectedPost.content}</Text>

                                    {selectedPost.referencedPark && (
                                        <TouchableOpacity
                                            onPress={() => goToRealParkDetails(selectedPost.referencedPark)}
                                            style={[styles.parkChip, { marginTop: 16 }]}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.parkChipLeft}>
                                                <Ionicons name="location-outline" size={16} color="#f28b02" />
                                                <View style={{ marginLeft: 8, flex: 1 }}>
                                                    <Text numberOfLines={1} style={styles.parkChipName}>
                                                        {selectedPost.referencedPark.name}
                                                    </Text>
                                                    <Text numberOfLines={1} style={styles.parkChipSub}>
                                                        {selectedPost.referencedPark.city}, {selectedPost.referencedPark.state}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color="#bbb" />
                                        </TouchableOpacity>
                                    )}

                                    {/* Like + comments + pin row */}
                                    <View style={styles.modalMetaRow}>
                                        {/* Like */}
                                        <TouchableOpacity onPress={toggleLike} style={styles.metaBtn}>
                                            <Ionicons
                                                name={hasLiked ? 'heart' : 'heart-outline'}
                                                size={20}
                                                color={hasLiked ? '#e74c3c' : '#666'}
                                            />
                                            <Text style={styles.metaBtnText}>{likesCount}</Text>
                                        </TouchableOpacity>

                                        {/* Comments */}
                                        <View style={[styles.metaBtn, { marginLeft: 16 }]}>
                                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                                            <Text style={styles.metaBtnText}>{comments.length}</Text>
                                        </View>

                                        {/* Pin */}
                                        {isAdminAny && (
                                            <TouchableOpacity
                                                onPress={onTogglePin}
                                                disabled={pinDisabled}
                                                style={[styles.metaBtn, { marginLeft: 16 }, pinDisabled && styles.metaBtnDisabled]}
                                                accessibilityLabel={isPinned ? 'Unpin post' : 'Pin post'}
                                            >
                                                <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={20} color={pinTint} />
                                                <Text style={[styles.metaBtnText, { color: pinTint }]}>
                                                    {isPinned ? 'Pinned' : 'Pin'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>

                                {/* STICKY (INSIDE MODAL) DOCK */}
                                <View
                                    style={[styles.bottomDock, { paddingBottom: 12 + insets.bottom }]}
                                    onLayout={(e) => setDockH(e.nativeEvent.layout.height)}
                                >
                                    <View style={styles.commentBar}>
                                        <TextInput
                                            value={commentText}
                                            onChangeText={setCommentText}
                                            placeholder="Write a comment…"
                                            style={styles.commentInput}
                                            multiline
                                        />

                                        <TouchableOpacity disabled={submitting} onPress={submitComment} style={styles.commentSend}>
                                            <Ionicons name="send" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>

                    </View>
                </Modal>
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewPostForm')}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fffaf0' },
    listContent: { padding: 16 },
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
    topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: { width: 44, height: 44, borderRadius: 10, marginRight: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    authorName: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 },
    cardDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 10,
        textAlign: 'right',
        maxWidth: 150,
        lineHeight: 14,
        flexShrink: 1,
    },
    cardTitle: { fontSize: 15, fontWeight: '500', color: '#333', marginTop: 2 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 4 },
    tag: { color: colors.thirty, marginRight: 8, fontSize: 13 },
    cardContent: { fontSize: 14, color: '#666', marginBottom: 8 },
    cardMeta: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, color: '#999', marginLeft: 4 },
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
    parkTagLabel: { fontWeight: '600', color: '#333', fontSize: 14 },
    parkTagLocation: { color: '#888', fontSize: 12, marginTop: 2 },
    selectedSort: { backgroundColor: '#f28b02', color: 'white' },
    sortOption: { backgroundColor: '#fff3e0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalAuthor: { fontSize: 14, color: '#777', marginTop: 4 },
    modalText: { fontSize: 15, color: '#444', marginTop: 12 },
    modalScroll: {},
    modalMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    metaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    metaBtnDisabled: { opacity: 0.5 },
    metaBtnText: { marginLeft: 6, color: '#333', fontWeight: '600' },
    commentRow: { marginTop: 10, backgroundColor: '#fafafa', borderRadius: 8, padding: 10 },
    commentAuthor: { fontWeight: '700', color: '#333', marginBottom: 4 },
    commentText: { color: '#444', lineHeight: 20 },
    commentInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
    },
    commentSend: {
        marginLeft: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#f28b02',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'gray',
        marginTop: 20,
        marginBottom: 0,
        alignSelf: 'stretch',
        borderRadius: 1,
    },
    parkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff8ee',
        borderRadius: 10,
        marginTop: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ffe0bf',
    },
    parkChipLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    parkChipName: { fontWeight: '700', color: '#333', fontSize: 14 },
    parkChipSub: { color: '#8a8a8a', fontSize: 12, marginTop: 2 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',  // keep sheet centered
        alignItems: 'center',
        paddingHorizontal: 10,
        // bottom space comes from inline paddingBottom: keyboardOffset
    },
    modalSheet: {
        width: '95%',
        maxHeight: '80%',
        minHeight: 300,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',   // <-- comment this out if keyboard animation clips
        alignSelf: 'center',
    },
    modalFooter: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    closeButton: {
        alignSelf: 'center',
        backgroundColor: '#f28b02',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: -30,
    },
    closeButtonText: { color: '#fff', fontWeight: '600' },
    bottomDock: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    commentBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 10,
    },
    pinnedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#fff7ed',
        borderColor: '#fed7aa',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
    },
    pinnedText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#b45309',
        fontWeight: '600',
    },
});