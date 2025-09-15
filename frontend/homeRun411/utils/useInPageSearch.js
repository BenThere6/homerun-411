// utils/useInPageSearch.js
import { useMemo, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * Centralizes:
 * - in-page query
 * - section keyword matching
 * - measuring section Y offsets
 * - smooth scrolling to sections
 * - targeted flashing highlights
 *
 * Usage:
 * const {
 *   query, setQuery,
 *   onLayoutFor,            // use on sections and targeted sub-rows
 *   flashOpacity,           // Animated.Value for overlays
 *   handleSubmit,           // TextInput onSubmit handler
 *   chipPress,              // quick-jump chips
 *   scrollToSection,        // API parity with your old function
 *   scrollToKeys,           // API parity with your old function
 *   resolveKeyForQuery,     // (optional) map a query → section key
 * } = useInPageSearch({ scrollRef, expanders: { restrooms: () => setShowRestrooms(true) } });
 */

export default function useInPageSearch({ scrollRef, expanders = {} } = {}) {
    // --- query state ---
    const [query, setQuery] = useState('');

    // --- section Y measurements ---
    const sectionYsRef = useRef({}); // { key: y }
    const rememberY = useCallback((key, y) => {
        if (key == null || y == null) return;
        const cur = sectionYsRef.current[key];
        if (cur !== y) sectionYsRef.current = { ...sectionYsRef.current, [key]: y };
    }, []);

    const onLayoutFor = useCallback((key) => (e) => {
        rememberY(key, e?.nativeEvent?.layout?.y);
    }, [rememberY]);

    // --- flash registry (lazy) ---
    const flashMapRef = useRef(new Map());
    const getFlashVal = useCallback((key) => {
        if (!flashMapRef.current.has(key)) {
            flashMapRef.current.set(key, new Animated.Value(0));
        }
        return flashMapRef.current.get(key);
    }, []);

    const flash = useCallback((key) => {
        if (!key) return;
        const v = getFlashVal(key);
        v.setValue(1);
        Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: true }).start();
    }, [getFlashVal]);

    const flashOpacity = useCallback((key) => getFlashVal(key), [getFlashVal]);

    // --- keyword index (mirrors your current config) ---
    const sectionIndex = useMemo(() => ([
        { key: 'amenities', title: 'Amenities & Features', kw: ['amenities', 'features', 'pet', 'playground'] },
        { key: 'details', title: 'Additional Park Details', kw: ['parking', 'handicap', 'outlets', 'electrical', 'sidewalk', 'stairs', 'hills', 'spectator'] },
        { key: 'restrooms', title: 'Restrooms', kw: ['restroom', 'bathroom', 'toilet', 'changing table', 'water'] },
        { key: 'concessions', title: 'Concessions', kw: ['concessions', 'food', 'snack', 'drink', 'payment'] },
        { key: 'fields', title: 'Field Details', kw: ['field', 'dimensions', 'surface', 'dugout', 'amenities'] },
        { key: 'qa', title: 'Park Q&A', kw: ['q&a', 'questions', 'posts', 'forum'] },
    ]), []);

    const resolveKeyForQuery = useCallback((raw) => {
        const s = (raw || '').trim().toLowerCase();
        if (!s) return null;
        for (const sec of sectionIndex) {
            if (sec.title.toLowerCase().startsWith(s) || sec.kw.some(k => k.startsWith(s))) return sec.key;
        }
        for (const sec of sectionIndex) {
            if (sec.title.toLowerCase().includes(s) || sec.kw.some(k => k.includes(s))) return sec.key;
        }
        return null;
    }, [sectionIndex]);

    // --- scrolling helpers ---
    const scrollToKeys = useCallback((keys = [], opts = { flash: true }) => {
        const ks = Array.isArray(keys) ? keys : [keys];

        // run any expanders first (e.g., auto-expand restrooms)
        ks.forEach(k => {
            if (expanders[k]) try { expanders[k](); } catch { }
        });

        requestAnimationFrame(() => {
            const ys = ks.map(k => sectionYsRef.current[k]).filter(y => y != null);
            const targetY = ys.length ? Math.min(...ys) : sectionYsRef.current[ks[0]];
            if (targetY != null && scrollRef?.current?.scrollTo) {
                scrollRef.current.scrollTo({ y: Math.max(targetY - 12, 0), animated: true });
                if (opts.flash !== false) ks.forEach(k => flash(k));
            }
        });
    }, [scrollRef, flash, expanders]);

    const scrollToSection = useCallback((key) => scrollToKeys(key), [scrollToKeys]);

    // --- parking-special submit behavior like your current code ---
    const handleSubmit = useCallback(() => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return;

        const parkingWords = ['parking', 'handicap', 'handicapped', 'handicap spots', 'accessible parking'];
        if (parkingWords.some(w => q.includes(w))) {
            // go to details section, but only flash targeted sub-rows
            scrollToKeys(['details'], { flash: false });
            flash('details_parkingLocation');
            flash('details_handicapSpots');
            return;
        }

        const key = resolveKeyForQuery(q);
        if (key) scrollToSection(key);
    }, [query, resolveKeyForQuery, scrollToKeys, scrollToSection, flash]);

    // --- chip shortcuts ---
    const chipPress = useCallback((label) => {
        if (label === 'Parking') {
            scrollToKeys(['details'], { flash: false });
            flash('details_parkingLocation');
            flash('details_handicapSpots');
            return;
        }
        const map = {
            Concessions: ['concessions'],
            Restrooms: ['restrooms'],
            Fields: ['fields'],
        };
        const keys = map[label] || [];
        if (keys.length) scrollToKeys(keys);
    }, [scrollToKeys, flash]);

    return {
        // state
        query, setQuery,

        // measuring + flashing
        onLayoutFor,
        flashOpacity,

        // navigation/submit
        handleSubmit,
        chipPress,
        scrollToSection,
        scrollToKeys,
        resolveKeyForQuery,
    };
}