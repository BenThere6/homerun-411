import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
    ActivityIndicator, Image, RefreshControl, ScrollView, TextInput, Modal,
    Platform, LayoutAnimation, UIManager, useWindowDimensions, Keyboard,
    KeyboardAvoidingView, Alert, Pressable, Animated, Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';
import { useFocusEffect, useRoute } from '@react-navigation/native';
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
    const route = useRoute();
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
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [filterSheetVisible, setFilterSheetVisible] = useState(false); // controls Modal visibility

    const backdropA = useRef(new Animated.Value(0)).current; // 0..1
    const sheetA = useRef(new Animated.Value(0)).current;    // 0..1
    const SLIDE_DISTANCE = screenH; // large enough to start fully off-screen

    // applied (used for fetching)
    const [appliedFilter, setAppliedFilter] = useState(null);        // { type:'park', referencedPark, parkName }
    const [appliedSortBy, setAppliedSortBy] = useState('newest');    // 'newest' | 'liked' | 'comments'
    const [appliedOnlyPinned, setAppliedOnlyPinned] = useState(false);

    // pending (edited in the modal, only applied on "Apply")
    const [pendingFilter, setPendingFilter] = useState(null);
    const [pendingSortBy, setPendingSortBy] = useState('newest');
    const [pendingOnlyPinned, setPendingOnlyPinned] = useState(false);

    const appliedFiltersCount =
        appliedFilter?.type === 'parks'
            ? (appliedFilter.parkIds?.length || 0)
            : (appliedFilter?.type === 'park' ? 1 : 0);

    // --- Park multi-select (inside filter) ---
    const [parkQuery, setParkQuery] = useState('');
    const [parkResults, setParkResults] = useState([]);
    const [pendingParkIds, setPendingParkIds] = useState([]);   // array of park _ids
    const [pendingParkObjs, setPendingParkObjs] = useState([]); // array of { _id, name, city, state }
    const [parkLoading, setParkLoading] = useState(false);
    // remember which path/param worked so we don't probe every time
    const parkSearchCfg = useRef({ path: null, key: null });

    const insets = useSafeAreaInsets();

    const fetchPosts = async () => {
        try {
            if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }

            const qs = new URLSearchParams();

            if (appliedFilter?.type === 'park' && appliedFilter?.referencedPark) {
                // legacy single-park; still supported
                qs.append('referencedPark', appliedFilter.referencedPark);
            }
            if (appliedFilter?.type === 'parks' && Array.isArray(appliedFilter.parkIds) && appliedFilter.parkIds.length) {
                appliedFilter.parkIds.forEach(id => qs.append('referencedPark', id));
            }
            if (appliedOnlyPinned) qs.set('pinned', 'true');
            qs.set('sort', appliedSortBy);

            const url = `${BACKEND_URL}/api/post${qs.toString() ? `?${qs}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            let list = Array.isArray(data) ? data : (data?.items ?? []);
            if (!Array.isArray(list)) list = [];

            const keepIds =
                appliedFilter?.type === 'park' && appliedFilter?.referencedPark
                    ? new Set([String(appliedFilter.referencedPark)])
                    : (appliedFilter?.type === 'parks' && appliedFilter.parkIds?.length
                        ? new Set(appliedFilter.parkIds.map(String))
                        : null);

            if (keepIds) {
                list = list.filter(p => {
                    const rp = p?.referencedPark;
                    const id = typeof rp === 'string' ? rp : (rp?._id || rp?.id);
                    return keepIds.has(String(id));
                });
            }

            if (appliedOnlyPinned) list = list.filter(p => !!p.pinned);

            const byDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
            const likeCount = (p) =>
                typeof p.likesCount === 'number' ? p.likesCount : (p.likes?.length ?? 0);
            const commentCount = (p) =>
                typeof p.commentsCount === 'number' ? p.commentsCount : (p.comments?.length ?? 0);

            // Always sort client-side (after any filtering)
            list.sort((a, b) => {
                // Pinned first, most recently pinned first
                const ap = a.pinned ? 1 : 0, bp = b.pinned ? 1 : 0;
                if (ap !== bp) return bp - ap;
                const apAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
                const bpAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
                if (apAt !== bpAt) return bpAt - apAt;

                // Then chosen sort
                switch (appliedSortBy) {
                    case 'liked':
                        return likeCount(b) - likeCount(a) || byDate(a, b);
                    case 'comments':
                        return commentCount(b) - commentCount(a) || byDate(a, b);
                    default: // 'newest'
                        return byDate(a, b);
                }
            });

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setForumPosts(list);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilter, appliedSortBy, appliedOnlyPinned]);

    useEffect(() => {
        const incoming = route?.params?.filter;
        if (!incoming) return;

        // normalize to multi-park structure
        const normalized =
            incoming.type === 'park'
                ? { type: 'parks', parkIds: [incoming.referencedPark], parks: [{ _id: incoming.referencedPark, name: incoming.parkName }] }
                : incoming;

        const isDifferent =
            !appliedFilter ||
            appliedFilter.type !== normalized.type ||
            JSON.stringify((appliedFilter.parkIds || []).map(String)) !== JSON.stringify((normalized.parkIds || []).map(String));

        if (isDifferent) {
            setAppliedFilter(normalized);
            setPendingFilter(normalized);
        }

        navigation.setParams && navigation.setParams({ filter: undefined });
    }, [route?.params?.filter, navigation, appliedFilter]);

    useEffect(() => {
        if (filterSheetOpen) {
            setFilterSheetVisible(true);
            Animated.parallel([
                Animated.timing(backdropA, { toValue: 1, duration: 160, useNativeDriver: true }),
                Animated.timing(sheetA, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (filterSheetVisible) {
            Animated.parallel([
                Animated.timing(sheetA, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(backdropA, { toValue: 0, duration: 160, useNativeDriver: true }),
            ]).start(() => setFilterSheetVisible(false));
        }
    }, [filterSheetOpen, filterSheetVisible, backdropA, sheetA]);

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

    // normalize strings: remove accents, collapse punctuation/whitespace, lowercase
    const norm = (s) =>
        (s ?? '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip diacritics
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')     // non-alnum -> space
            .trim();

    const parkMatches = (park, query) => {
        const hay = norm([park.name, park.city, park.state].filter(Boolean).join(' '));
        const tokens = norm(query).split(' ').filter(Boolean);
        // require every token in the query to appear somewhere in name/city/state
        return tokens.every(t => hay.includes(t));
    };

    // Debounced park search with endpoint/param fallbacks
    useEffect(() => {
        let cancelled = false;
        if (!filterSheetVisible) return;

        const raw = parkQuery.trim();
        if (!raw) { setParkResults([]); return; }

        const t = setTimeout(async () => {
            setParkLoading(true);

            const combos = parkSearchCfg.current.path
                ? [[parkSearchCfg.current.path, parkSearchCfg.current.key]]
                : [
                    ['/api/parks/search', 'q'],
                    ['/api/parks', 'q'],
                    ['/api/parks', 'search'],
                    ['/api/park/search', 'q'],
                    ['/api/park', 'q'],
                ];

            let found = [];

            for (const [path, key] of combos) {
                try {
                    const { data } = await axios.get(path, { params: { [key]: raw, limit: 50 } });
                    const items = Array.isArray(data) ? data : (data?.items || data?.results || data?.parks || []);
                    const filtered = items.filter(p => parkMatches(p, raw));

                    if (filtered.length) {
                        found = filtered;
                        parkSearchCfg.current = { path, key }; // cache the combo that yielded matches
                        break;
                    }
                } catch { /* try the next combo */ }
            }

            // Last-resort: fetch all then filter locally (in case no server endpoint supports search)
            if (!found.length) {
                try {
                    const { data } = await axios.get('/api/parks', { params: { limit: 200 } });
                    const items = Array.isArray(data) ? data : (data?.items || data?.results || data?.parks || []);
                    found = items.filter(p => parkMatches(p, raw));
                    if (found.length) parkSearchCfg.current = { path: '/api/parks', key: null };
                } catch { /* ignore */ }
            }

            if (!cancelled) {
                setParkResults(found);
                setParkLoading(false);
            }
        }, 250);

        return () => { cancelled = true; clearTimeout(t); };
    }, [parkQuery, filterSheetVisible]);

    // Toggle selection in pending arrays
    const togglePendingPark = (park) => {
        const id = String(park._id || park.id || park);
        setPendingParkIds(prev => prev.some(p => String(p) === id) ? prev.filter(p => String(p) !== id) : [...prev, id]);
        setPendingParkObjs(prev => prev.some(p => String(p._id || p.id || p) === id)
            ? prev.filter(p => String(p._id || p.id || p) !== id)
            : [...prev, park]);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Forum',
            headerStyle: { backgroundColor: '#ffd699' },
            headerTitleAlign: 'center',
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => {
                        setPendingFilter(appliedFilter);
                        setPendingSortBy(appliedSortBy);

                        // Seed multi-select from the currently applied filter
                        if (appliedFilter?.type === 'parks') {
                            setPendingParkIds(appliedFilter.parkIds || []);
                            setPendingParkObjs(appliedFilter.parks || []);
                        } else if (appliedFilter?.type === 'park') {
                            // normalize old single-park to multi
                            setPendingParkIds([appliedFilter.referencedPark]);
                            setPendingParkObjs([{ _id: appliedFilter.referencedPark, name: appliedFilter.parkName }]);
                        } else {
                            setPendingParkIds([]);
                            setPendingParkObjs([]);
                        }

                        setFilterSheetOpen(true);
                    }}
                    style={{ paddingRight: 12 }}
                >
                    <View>
                        <Ionicons name="filter-outline" size={22} color="#333" />
                        {!!appliedFiltersCount && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -2,
                                    minWidth: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: '#ef4444',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 3,
                                }}
                            >
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                    {appliedFiltersCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            ),
        });
    }, [navigation, appliedFiltersCount, appliedFilter, appliedSortBy, appliedOnlyPinned]);

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

    useEffect(() => {
        if (!filterSheetVisible) {
            setParkQuery('');
            setParkResults([]);
        }
    }, [filterSheetVisible]);

    // keep forum list and selectedPost counts in sync
    const syncCountsToList = React.useCallback((nextLikes, nextComments) => {
        const id = selectedPost?._id;
        if (!id) return;

        setForumPosts(prev =>
            prev.map(p =>
                p._id === id
                    ? {
                        ...p,
                        ...(typeof nextLikes === 'number' ? { likesCount: nextLikes } : null),
                        ...(typeof nextComments === 'number' ? { commentsCount: nextComments } : null),
                    }
                    : p
            )
        );

        // keep selectedPost mirror updated too
        setSelectedPost(prev =>
            prev && prev._id === id
                ? {
                    ...prev,
                    ...(typeof nextLikes === 'number' ? { likesCount: nextLikes } : null),
                    ...(typeof nextComments === 'number' ? { commentsCount: nextComments } : null),
                }
                : prev
        );
    }, [selectedPost?._id]);

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

            // NEW: push the count to the list + selectedPost
            syncCountsToList(data.likesCount, undefined);
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

            setComments(prev => {
                const next = [...prev, data];
                // keep list + selectedPost counts in sync
                syncCountsToList(undefined, next.length);
                return next;
            });
            setCommentText('');
        } catch (e) {
            // you can Alert here if you want
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

    const closeModal = () => {
        syncCountsToList(likesCount, comments.length);
        setSelectedPost(null);
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
                    {(item.content || '').length > 160
                        ? (item.content || '').slice(0, 160) + '…'
                        : (item.content || '')}
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
                    ListHeaderComponent={null}
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
                <Modal visible transparent animationType="fade" onRequestClose={closeModal}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0} // tweak (44/64) if needed for header/safe area
                            style={{ width: '95%', alignSelf: 'center' }}
                        >
                            <View style={[styles.modalSheet, { maxHeight: SHEET_MAX, height: sheetH ?? undefined }]}>
                                {/* BODY (scrolls) */}
                                <ScrollView
                                    style={{ maxHeight: 220, marginTop: 8 }}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {parkResults.map(p => {
                                        const id = String(p._id || p.id);
                                        const selected = pendingParkIds.some(x => String(x) === id);
                                        return (
                                            <Pressable key={id} onPress={() => togglePendingPark(p)} style={styles.rowItem}>
                                                <Ionicons
                                                    name={selected ? 'checkbox' : 'square-outline'}
                                                    size={20}
                                                    color={selected ? '#f28b02' : '#64748b'}
                                                />
                                                <View style={{ marginLeft: 10, flex: 1 }}>
                                                    <Text style={styles.rowTitle} numberOfLines={1}>{p.name}</Text>
                                                    {(p.city || p.state) ? (
                                                        <Text style={styles.rowSub} numberOfLines={1}>
                                                            {p.city}{p.city && p.state ? ', ' : ''}{p.state}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </Pressable>
                                        );
                                    })}

                                    {parkLoading && <Text style={[styles.hintMuted, { marginTop: 8 }]}>Searching…</Text>}
                                    {parkLoading ? (
                                        <View style={styles.loadingRow}>
                                            <ActivityIndicator />
                                        </View>
                                    ) : parkQuery && parkResults.length === 0 ? (
                                        <Text style={[styles.hintMuted, { marginTop: 8 }]}>No parks found</Text>
                                    ) : null}
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

                                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>

                    </View>
                </Modal>
            )}

            {/* FILTER SHEET (slides) */}
            <Modal
                visible={filterSheetVisible}            // <- use the visibility state driven by the animation
                transparent
                animationType="none"                    // <- disable Modal's fade
                onRequestClose={() => setFilterSheetOpen(false)}
            >
                {/* Backdrop fades in/out */}
                <Animated.View style={[styles.filterBackdrop, { opacity: backdropA }]}>
                    {/* Tap outside to close */}
                    <Pressable style={{ flex: 1 }} onPress={() => setFilterSheetOpen(false)} />

                    {/* Bottom sheet slides up/down */}
                    <Animated.View
                        style={[
                            styles.filterSheet,
                            {
                                transform: [
                                    {
                                        translateY: sheetA.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [SLIDE_DISTANCE, 0], // from off-screen -> on-screen
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        {/* X button */}
                        <Pressable
                            onPress={() => setFilterSheetOpen(false)}
                            style={styles.filterCloseX}
                            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                            <Ionicons name="close" size={20} color="#334155" />
                        </Pressable>

                        <Text style={[styles.filterTitle, { paddingRight: 28 }]}>Filter posts</Text>

                        <Text style={styles.filterLabel}>Sort by</Text>
                        <View style={styles.filterRow}>
                            {[
                                { key: 'newest', label: 'Newest' },
                                { key: 'liked', label: 'Most liked' },
                                { key: 'comments', label: 'Most commented' },
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    onPress={() => setPendingSortBy(opt.key)}
                                    style={[styles.pill, pendingSortBy === opt.key && styles.pillActive]}
                                >
                                    <Text style={[styles.pillText, pendingSortBy === opt.key && styles.pillTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* --- Parks multi-select --- */}
                        <Text style={styles.filterLabel}>Parks</Text>

                        <View style={{ position: 'relative', marginTop: 6 }}>
                            <TextInput
                                placeholder="Search parks…"
                                value={parkQuery}
                                onChangeText={(t) => {
                                    setParkQuery(t);
                                    const hasQuery = !!t.trim();
                                    setParkLoading(hasQuery);
                                    if (!hasQuery) setParkResults([]);
                                }}
                                style={[
                                    styles.parkSearch,
                                    { paddingRight: 40, height: 44, paddingVertical: 0, textAlignVertical: 'center' }
                                ]}
                            />

                            {!!parkQuery.trim() && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setParkQuery('');
                                        setParkResults([]);
                                        setParkLoading(false);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: 32,
                                    }}
                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {pendingParkIds.length > 0 && (
                            <View style={styles.selectedChipsWrap}>
                                {pendingParkObjs.map(p => {
                                    const id = String(p._id || p.id);
                                    return (
                                        <View key={id} style={styles.chip}>
                                            <Text style={styles.chipText} numberOfLines={1}>{p.name}</Text>
                                            <Pressable onPress={() => togglePendingPark(p)} style={{ paddingLeft: 6 }}>
                                                <Ionicons name="close" size={14} color="#7c2d12" />
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <ScrollView style={{ maxHeight: 220, marginTop: 8 }}>
                            {parkResults.map(p => {
                                const id = String(p._id || p.id);
                                const selected = pendingParkIds.some(x => String(x) === id);
                                return (
                                    <Pressable key={id} onPress={() => togglePendingPark(p)} style={styles.rowItem}>
                                        <Ionicons
                                            name={selected ? 'checkbox' : 'square-outline'}
                                            size={20}
                                            color={selected ? '#f28b02' : '#64748b'}
                                        />
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={styles.rowTitle} numberOfLines={1}>{p.name}</Text>
                                            {(p.city || p.state) ? (
                                                <Text style={styles.rowSub} numberOfLines={1}>
                                                    {p.city}{p.city && p.state ? ', ' : ''}{p.state}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </Pressable>
                                );
                            })}
                            {parkLoading ? (
                                <View className="loadingRow">
                                    <ActivityIndicator />
                                </View>
                            ) : parkQuery && parkResults.length === 0 ? (
                                <Text style={[styles.hintMuted, { marginTop: 8 }]}>No parks found</Text>
                            ) : null}
                        </ScrollView>

                        <View style={styles.sheetButtons}>
                            <TouchableOpacity
                                onPress={() => {
                                    setPendingFilter(null);
                                    setPendingSortBy('newest');
                                    setParkQuery('');
                                    setPendingParkIds([]);
                                    setPendingParkObjs([]);
                                }}
                                style={[styles.sheetBtn, styles.btnGhost]}
                            >
                                <Text style={styles.btnGhostText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (pendingParkIds.length) {
                                        setAppliedFilter({ type: 'parks', parkIds: pendingParkIds, parks: pendingParkObjs });
                                    } else {
                                        setAppliedFilter(null);
                                    }
                                    setAppliedSortBy(pendingSortBy);
                                    navigation.setParams && navigation.setParams({ filter: undefined });
                                    setFilterSheetOpen(false);
                                }}
                                style={[styles.sheetBtn, styles.btnPrimary]}
                            >
                                <Text style={styles.btnPrimaryText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>

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
    filterBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
    },
    filterTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
    filterLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 6, marginBottom: 8 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    pillActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
    pillText: { color: '#334155', fontSize: 13, fontWeight: '600' },
    pillTextActive: { color: '#3730a3' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 6 },
    toggleText: { color: '#334155', fontSize: 14, fontWeight: '600' },
    currentFilterBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        backgroundColor: '#fff8ee',
        borderWidth: 1,
        borderColor: '#ffe0bf',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    currentFilterText: { color: '#7c2d12', fontWeight: '700' },
    sheetButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 10 },
    sheetBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
    btnPrimary: { backgroundColor: '#f28b02' },
    btnPrimaryText: { color: '#fff', fontWeight: '700' },
    btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
    btnGhostText: { color: '#334155', fontWeight: '700' },
    filterChip: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#eef2ff',
        borderWidth: 1,
        borderColor: '#c7d2fe',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 14,
    },
    filterChipText: { color: '#3730a3', fontSize: 12, fontWeight: '600' },
    filterCloseX: {
        position: 'absolute',
        right: 8,
        top: 8,
        padding: 6,
        zIndex: 2,
    },
    parkSearch: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    selectedChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff8ee',
        borderWidth: 1,
        borderColor: '#ffe0bf',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
        maxWidth: '100%',
    },
    chipText: { color: '#7c2d12', fontWeight: '700', maxWidth: 200 },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eef2f7',
    },
    rowTitle: { color: '#0f172a', fontWeight: '600' },
    rowSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    hintMuted: { color: '#475569', opacity: 0.8 },
    loadingRow: { paddingVertical: 12, alignItems: 'center' },
});