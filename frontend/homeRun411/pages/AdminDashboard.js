// pages/AdminDashboard.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/axiosInstance';
import colors from '../assets/colors';
import { useAuth } from '../AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---- Admin API endpoints (adjust these when your backend routes are ready) ----
const ENDPOINTS = {
  dataRequestsList: '/api/admin/feedback/data-requests',
  reportsList: '/api/admin/mod/reports',
  usersList: '/api/user',        // hits router.get('/', auth, isAdmin, listAdminUsers)
  usersSummary: '/api/user',     // same
};

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Graceful GET that treats 404/HTML error pages as "no data yet" instead of crashing
async function safeGet(url, params) {
  try {
    const res = await api.get(url, { params });
    // If backend returns arrays directly or {items:[]}
    const data = res?.data;
    if (Array.isArray(data)) return { items: data };
    if (data && typeof data === 'object' && Array.isArray(data.items)) return data;
    return { items: [] };
  } catch (e) {
    const msg = e?.response?.data;
    const looksLikeHtml = typeof msg === 'string' && msg.includes('<!DOCTYPE html>');
    if (e?.response?.status === 404 || looksLikeHtml) {
      return { items: [] }; // not wired yet; don’t hard fail
    }
    throw e;
  }
}

const TABS = ['Home', 'Data Requests', 'Moderation', 'Parks', 'Users', 'Audit'];

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('Home');

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Unauthorized</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <HeaderTabs tab={tab} setTab={setTab} />
      <View style={styles.content}>
        {tab === 'Home' && <HomeOverview />}
        {tab === 'Data Requests' && <DataRequestsTab />}
        {tab === 'Moderation' && <ModerationTab />}
        {tab === 'Parks' && <Soon label="Parks table/editor (next pass)" />}
        {tab === 'Users' && <UsersTab />}
        {tab === 'Audit' && <Soon label="Audit log (next pass)" />}
      </View>
    </SafeAreaView>
  );
}

/* ---------------- UI: tabs header ---------------- */
function HeaderTabs({ tab, setTab }) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map(t => {
          const active = t === tab;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------------- Home / overview ---------------- */
function HomeOverview() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ dataNew: 0, reportsOpen: 0, usersToday: 0, totalUsers: 0, postsToday: 0, parksEdited: 0 });

  useEffect(() => {
    (async () => {
      try {
        // Lightweight summary calls; adjust if you have a summary endpoint.
        const [dr, rep, users] = await Promise.all([
          safeGet(ENDPOINTS.dataRequestsList, { status: 'new', page: 1 }),
          safeGet(ENDPOINTS.reportsList, { status: 'open', page: 1 }),
          safeGet(ENDPOINTS.usersSummary, { since: startOfTodayISO(), page: 1 }),
        ]);

        const rawUsers = users.items || [];
        const todayStart = new Date(startOfTodayISO()).getTime();
        const usersToday = rawUsers.filter(u => {
          const ts = new Date(u.createdAt || u.created_at || 0).getTime();
          return ts >= todayStart;
        }).length;

        setCounts({
          dataNew: (dr.items || []).length,
          reportsOpen: (rep.items || []).length,
          usersToday,
          totalUsers: users.total ?? (users.items || []).length,
          postsToday: 0,
          parksEdited: 0,
        });
      } catch (e) {
        console.log('Overview failed', e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 }}>
      <Card title="Queues">
        <Row icon="document-text-outline" label="New Data Requests" value={counts.dataNew} />
        <Row icon="flag-outline" label="Open Reports" value={counts.reportsOpen} />
      </Card>
      <Card title="Today">
        <Row icon="people-outline" label="Total Users" value={counts.totalUsers} />
        <Row icon="people-outline" label="New Users" value={counts.usersToday} />
        <Row icon="chatbubbles-outline" label="Posts" value={counts.postsToday} />
        <Row icon="create-outline" label="Parks Edited" value={counts.parksEdited} />
      </Card>
    </View>
  );
}

/* ---------------- Data Requests tab ---------------- */
function DataRequestsTab() {
  const [status, setStatus] = useState('new'); // new | inprogress | done
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (pageNum, replace = false) => {
    try {
      if (!replace) setLoading(true);
      const data = await safeGet(ENDPOINTS.dataRequestsList, { status, page: pageNum, q: query || undefined });
      const list = data?.items || [];
      setHasMore(list.length > 0);
      setItems(prev => (replace ? list : [...prev, ...list]));
    } catch (e) {
      Alert.alert('Load failed', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, query]);

  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
  }, [status, fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, true);
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  const filtered = useMemo(() => items, [items]);

  return (
    <View style={{ flex: 1 }}>
      <ListHeader
        title="Data Requests"
        right={<StatusSegment status={status} setStatus={setStatus} />}
      />
      <SearchBar value={query} onChange={setQuery} onSubmit={() => { setPage(1); fetchPage(1, true); }} placeholder="Filter by park/city/state/text" />
      {loading && page === 1 ? (
        <Loading />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => <DataRequestRow item={item} onUpdated={() => onRefresh()} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          ListEmptyComponent={<Empty label="No requests" />}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

function DataRequestRow({ item, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [nextStatus, setNextStatus] = useState(item.status || 'new');

  const update = async (s) => {
    try {
      setSaving(true);
      await api.put(`/api/admin/feedback/data-requests/${item._id}`, { status: s });
      setNextStatus(s);
      onUpdated?.();
    } catch (e) {
      Alert.alert('Update failed', e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.rowCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.parkName || 'Unknown Park'}</Text>
        <Text style={styles.rowSub}>{[item.city, item.state].filter(Boolean).join(', ')}</Text>
        {!!item.message && <Text style={styles.rowBody}>{item.message}</Text>}
        {!!item.contactEmail && <Text style={styles.rowMeta}>Contact: {item.contactEmail}</Text>}
        <Text style={styles.rowMeta}>Created: {new Date(item.createdAt || item.created_at || Date.now()).toLocaleString()}</Text>
      </View>

      <View style={styles.rowActions}>
        <StatusBadge status={nextStatus} />
        <TouchableOpacity style={[styles.smallBtn]} onPress={() => update('inprogress')} disabled={saving || nextStatus === 'inprogress'}>
          <Text style={styles.smallBtnText}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#16a34a' }]} onPress={() => update('done')} disabled={saving || nextStatus === 'done'}>
          <Text style={[styles.smallBtnText, { color: '#fff' }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Moderation tab ---------------- */
function ModerationTab() {
  const [status, setStatus] = useState('open'); // open | closed
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await safeGet(ENDPOINTS.reportsList, { status, page: 1 });
      setItems(data?.items || []);
    } catch (e) {
      Alert.alert('Load failed', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  return (
    <View style={{ flex: 1 }}>
      <ListHeader
        title="Reports"
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Segment value={status} setValue={setStatus} options={[
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
            ]} />
            <TouchableOpacity onPress={load} style={styles.iconBtn}><Ionicons name="refresh" size={18} color={colors.primaryText} /></TouchableOpacity>
          </View>
        }
      />
      {loading ? <Loading /> : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => <ReportRow item={item} onChanged={load} />}
          ListEmptyComponent={<Empty label="No reports" />}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

function ReportRow({ item, onChanged }) {
  const [saving, setSaving] = useState(false);
  const resolve = async () => {
    try {
      setSaving(true);
      await api.post(`/api/admin/mod/reports/${item._id}/resolve`, { resolution: 'resolved' });
      onChanged?.();
    } catch (e) {
      Alert.alert('Action failed', e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.rowCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.postTitle || 'Reported content'}</Text>
        <Text style={styles.rowSub}>Reason: {item.reason || 'unspecified'}</Text>
        {!!item.snippet && <Text style={styles.rowBody}>"{item.snippet}"</Text>}
        <Text style={styles.rowMeta}>By: {item.reporterEmail || 'user'}</Text>
        <Text style={styles.rowMeta}>Created: {new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
      </View>
      <View style={styles.rowActions}>
        <StatusBadge status={item.status || 'open'} />
        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#2563eb' }]} onPress={resolve} disabled={saving || (item.status === 'closed')}>
          <Text style={[styles.smallBtnText, { color: '#fff' }]}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Users tab ---------------- */
const PAGE_LIMIT = 25; // request a fixed page size so we can know when to stop

function UsersTab() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');   // all | user | admin | top-admin (shown via badge)
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [myLevel, setMyLevel] = useState(null);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/user/profile');
        const lvl = r?.data?.adminLevel ?? (r?.data?.role === 'top-admin' ? 0 : r?.data?.role === 'admin' ? 1 : 2);
        setMyLevel(lvl);
        setMyId(r?.data?._id);
      } catch (e) {
        console.log('profile load failed', e?.response?.data || e.message);
      }
    })();
  }, []);

  const fetchPage = useCallback(async (pageNum, replace = false) => {
    try {
      if (!replace) setLoading(true);
      const data = await safeGet(ENDPOINTS.usersList, {
        page: pageNum,
        limit: PAGE_LIMIT,
        q: query || undefined,
        role: role === 'all' ? undefined : role,
      });
      const list = data?.items || [];

      // If backend ignores pagination, de-dupe and stop when we see a repeat set.
      setItems(prev => {
        const combined = replace ? list : [...prev, ...list];
        const seen = new Set();
        const uniq = [];
        for (const u of combined) {
          const id = u?._id || u?.id || u?.email; // stable fallback
          if (!id || seen.has(id)) continue;
          seen.add(id);
          uniq.push(u);
        }
        return uniq;
      });

      // End if fewer than PAGE_LIMIT returned (or nothing)
      setHasMore(list.length === PAGE_LIMIT);
    } catch (e) {
      Alert.alert('Load failed', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, role]);

  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
  }, [role, fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, true);
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  // Client-side filter so chips instantly affect the rendered list
  const filteredItems = useMemo(() => {
    if (role === 'all') return items;
    return items.filter(u => {
      const r =
        u.role ??
        (u.adminLevel === 0 ? 'top-admin' : u.adminLevel === 1 ? 'admin' : 'user');
      // "Admins" chip should include top-admins
      if (role === 'admin') return r === 'admin' || r === 'top-admin';
      return r === role;
    });
  }, [items, role]);

  return (
    <View style={{ flex: 1 }}>
      <ListHeader
        title="Users"
        right={
          <RoleChips
            value={role}
            onChange={(r) => { setRole(r); setPage(1); fetchPage(1, true); }}
          />
        }
      />
      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => { setPage(1); fetchPage(1, true); }}
        placeholder="Filter by name or email"
      />
      {loading && page === 1 ? (
        <Loading />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it, idx) => String(it?._id || it?.id || it?.email || idx)}
          renderItem={({ item }) => <UserRow item={item} myLevel={myLevel} myId={myId} onChanged={() => { setPage(1); fetchPage(1, true); }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          ListEmptyComponent={<Empty label="No users" />}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

function deriveNameFromEmail(email = '') {
  const local = String(email).split('@')[0] || '';
  if (!local) return '';
  // "john.doe_smith" -> "John Doe Smith"
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function UserRow({ item, myLevel, myId, onChanged }) {
  const createdLabel = new Date(item.createdAt || item.created_at || 0).toLocaleString();
  const role =
    item.role ||
    (item.adminLevel === 0 ? 'top-admin' : item.adminLevel === 1 ? 'admin' : 'user');

  const title =
    (item.profile?.firstName || item.profile?.lastName
      ? `${item.profile?.firstName ?? ''} ${item.profile?.lastName ?? ''}`.trim()
      : null) ||
    item.name ||
    item.displayName ||
    deriveNameFromEmail(item.email) ||
    'User';

  const canChange = myLevel === 0 && String(item._id || item.id) !== String(myId || '');
  const [saving, setSaving] = useState(false);

  const changeLevel = async (newLevel) => {
    try {
      setSaving(true);
      await api.patch(`/api/user/admin/users/${item._id || item.id}/role`, { adminLevel: newLevel });
      onChanged?.();
    } catch (e) {
      Alert.alert('Update failed', e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.userTitle}>{title}</Text>
        {!!item.email && <Text style={styles.userSub}>{item.email}</Text>}
        <Text style={styles.userMeta}>Joined: {createdLabel}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>

        <StatusBadge status={role} />
        {!!item.postsCount && <Text style={styles.userMeta}>{item.postsCount} posts</Text>}

        {canChange && (
          <MoreMenu
            currentLevel={item.adminLevel}
            disabled={saving}
            onPick={(nextLevel, label) => {
              Alert.alert(
                'Confirm role change',
                `Are you sure you want to ${label.toLowerCase()} for ${title}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => changeLevel(nextLevel),
                  },
                ]
              );
            }}
          />
        )}

      </View>
    </View>
  );
}

function MoreMenu({ currentLevel, onPick, disabled }) {
  const [open, setOpen] = useState(false);

  // Available actions based on current level
  const actions =
    currentLevel === 2
      ? [
        { label: 'Make Admin', level: 1 },
        { label: 'Make Top Admin', level: 0 },
      ]
      : currentLevel === 1
        ? [
          { label: 'Make Top Admin', level: 0 },
          { label: 'Demote → User', level: 2 },
        ]
        : [
          { label: 'Demote → Admin', level: 1 },
          { label: 'Demote → User', level: 2 },
        ];

  return (
    <View style={{ position: 'relative', marginTop: 4 }}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => setOpen(v => !v)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.primaryText} />
      </TouchableOpacity>

      {open && (
        <>
          {/* tap outside to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <View style={styles.menu}>
            {actions.map(a => (
              <TouchableOpacity
                key={a.label}
                style={styles.menuItem}
                onPress={() => {
                  setOpen(false);
                  onPick?.(a.level, a.label);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/* ---------------- small shared bits ---------------- */
function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Row({ icon, label, value }) {
  return (
    <View style={styles.cardRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={18} color={colors.primaryText} />
        <Text style={styles.cardRowLabel}>{label}</Text>
      </View>
      <Text style={styles.cardRowValue}>{value}</Text>
    </View>
  );
}
function ListHeader({ title, right }) {
  return (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderTitle}>{title}</Text>
      <View>{right}</View>
    </View>
  );
}
function StatusBadge({ status }) {
  const map = {
    new: { bg: '#fee2e2', fg: '#991b1b', label: 'New' },
    inprogress: { bg: '#fff7ed', fg: '#9a3412', label: 'In Progress' },
    done: { bg: '#dcfce7', fg: '#166534', label: 'Done' },
    open: { bg: '#fff7ed', fg: '#9a3412', label: 'Open' },
    closed: { bg: '#dcfce7', fg: '#166534', label: 'Closed' },

    // roles
    user: { bg: '#e5e7eb', fg: '#111827', label: 'user' },
    admin: { bg: '#DBEAFE', fg: '#1E40AF', label: 'admin' },
    'top-admin': { bg: '#E0E7FF', fg: '#3730A3', label: 'top admin' },
  };
  const s = map[status] || { bg: '#e5e7eb', fg: '#111827', label: status };
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 }}>
      <Text style={{ color: s.fg, fontSize: 13, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
}
function RoleChips({ value, onChange }) {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'user', label: 'Users' },
    { value: 'admin', label: 'Admins' }, // includes top-admin on the backend
  ];
  return (
    <View style={styles.roleChips}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.roleChip, active && styles.roleChipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatusSegment({ status, setStatus }) {
  return (
    <Segment
      value={status}
      setValue={setStatus}
      options={[
        { value: 'new', label: 'New' },
        { value: 'inprogress', label: 'In Progress' },
        { value: 'done', label: 'Done' },
      ]}
    />
  );
}
function SearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color="#64748b" />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder || 'Search'}
        style={{ flex: 1, marginLeft: 8, fontSize: 14 }}
        returnKeyType="search"
      />
      {!!value && (
        <TouchableOpacity onPress={() => { onChange(''); onSubmit?.(); }}>
          <Ionicons name="close-circle" size={16} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  );
}
function Loading() {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
function Empty({ label }) {
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text style={{ color: '#64748b' }}>{label}</Text>
    </View>
  );
}
function Soon({ label }) {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontWeight: '700', marginBottom: 6 }}>Coming soon</Text>
      <Text style={{ color: '#475569' }}>{label}</Text>
    </View>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sixty },

  // Fixed strip that clamps the pills to 36px and prevents ScrollView from stretching
  tabsContainer: {
    height: 44, // 28px pill + 8px top + 8px bottom
    backgroundColor: colors.sixty,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tabsRow: {
    height: 44,               // match tabsContainer for equal top/bottom space
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  tabBtn: {
    height: 28,
    paddingHorizontal: 12,
    paddingVertical: 0, // keep pill height exact so spacing stays symmetric
    borderRadius: 10,
    backgroundColor: '#eef2f7',
    justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: '#1f2937' },
  tabText: { color: '#1f2937', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#ffffff' },

  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#d1d5db' },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#0b1220' },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  cardRowLabel: { fontSize: 16, color: '#0b1220' },
  cardRowValue: { fontSize: 16, fontWeight: '900', color: '#0b1220' },

  content: {
    flex: 1,
    paddingTop: 8,           // single, consistent gap under the pills
  },

  listHeader: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#0b1220' },
  searchBar: { marginHorizontal: 12, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },

  rowCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12 },
  rowTitle: { fontSize: 17, fontWeight: '900', color: '#0b1220' },
  rowSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  rowBody: { fontSize: 14, color: '#111827', marginTop: 8, lineHeight: 20 },
  rowMeta: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  rowActions: { width: 132, alignItems: 'flex-end' },

  smallBtn: { backgroundColor: '#e5e7eb', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8 },
  smallBtnText: { fontSize: 13, fontWeight: '800', color: '#0b1220' },

  iconBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },

  userCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  userTitle: { fontSize: 16, fontWeight: '900', color: '#0b1220' },
  userSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  userMeta: { fontSize: 12, color: '#6b7280', marginTop: 6 },

  roleChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  roleChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },

  menu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    minWidth: 180,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    zIndex: 100,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#0b1220',
    fontWeight: '700',
  },

});
