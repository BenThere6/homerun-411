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

    const onLayoutFor = useCallback((key, opts = {}) => (e) => {
        const y = e?.nativeEvent?.layout?.y ?? 0;
        const base = opts.offsetKey ? (sectionYsRef.current[opts.offsetKey] ?? 0) : 0;
        rememberY(key, y + base);
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

    // --- alias index (terms -> one or more keys) ---
    const aliasesRef = useRef(new Map()); // Map<string, Set<string>>
    const addAliases = useCallback((entries = []) => {
        // entries: Array<{ term: string, keys: string[] }>
        const m = aliasesRef.current;
        for (const { term, keys } of entries) {
            if (!term || !keys?.length) continue;
            const t = term.trim().toLowerCase();
            if (!m.has(t)) m.set(t, new Set());
            const set = m.get(t);
            keys.forEach(k => set.add(k));
        }
    }, []);
    const clearAliases = useCallback(() => {
        aliasesRef.current = new Map();
    }, []);

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

        // 1) aliases first (prefer precise sub-rows)
        for (const [term, keys] of aliasesRef.current.entries()) {
            if (term.startsWith(s)) return Array.from(keys);
        }
        for (const [term, keys] of aliasesRef.current.entries()) {
            if (term.includes(s)) return Array.from(keys);
        }

        // 2) fallback to section titles & keywords
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

        // run any expanders first (e.g., auto-expand restrooms or field groups)
        ks.forEach(k => {
            if (expanders[k]) try { expanders[k](); } catch { }
        });

        let tries = 0;
        const tryScroll = () => {
            tries += 1;
            const ys = ks.map(k => sectionYsRef.current[k]).filter(y => y != null);
            const targetY = ys.length ? Math.min(...ys) : sectionYsRef.current[ks[0]];
            if (targetY != null && scrollRef?.current?.scrollTo) {
                scrollRef.current.scrollTo({ y: Math.max(targetY - 12, 0), animated: true });
                if (opts.flash !== false) ks.forEach(k => flash(k));
                return;
            }
            if (tries < 4) requestAnimationFrame(tryScroll);
        };

        requestAnimationFrame(tryScroll);
    }, [scrollRef, flash, expanders]);

    const scrollToSection = useCallback((key) => scrollToKeys(key), [scrollToKeys]);

    // --- parking-special submit behavior like your current code ---
    const handleSubmit = useCallback(() => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return;

        const parkingWords = ['parking', 'handicap', 'handicapped', 'handicap spots', 'accessible parking'];
        if (parkingWords.some(w => q.includes(w))) {
            scrollToKeys(['details'], { flash: false });
            flash('details_parkingLocation');
            flash('details_handicapSpots');
            return;
        }

        const target = resolveKeyForQuery(q);
        if (!target) return;

        // target may be a single key or an array of keys from aliases
        const keys = Array.isArray(target) ? target : [target];
        scrollToKeys(keys, { flash: false });
        keys.forEach(k => flash(k));
    }, [query, resolveKeyForQuery, scrollToKeys, flash]);

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
        addAliases,
        clearAliases,
    };
}