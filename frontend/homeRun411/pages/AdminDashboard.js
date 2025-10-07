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
};

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
        {tab === 'Users' && <Soon label="Users list/roles (next pass)" />}
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
  const [counts, setCounts] = useState({ dataNew: 0, reportsOpen: 0, usersToday: 0, postsToday: 0, parksEdited: 0 });

  useEffect(() => {
    (async () => {
      try {
        // Lightweight summary calls; adjust if you have a summary endpoint.
        const [dr, rep] = await Promise.all([
          safeGet(ENDPOINTS.dataRequestsList, { status: 'new', page: 1 }),
          safeGet(ENDPOINTS.reportsList, { status: 'open', page: 1 }),
        ]);
        setCounts({
          dataNew: (dr.items || []).length,
          reportsOpen: (rep.items || []).length,
          usersToday: 0,
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
  };
  const s = map[status] || { bg: '#e5e7eb', fg: '#111827', label: status };
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 }}>
      <Text style={{ color: s.fg, fontSize: 13, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
}
function Segment({ value, setValue, options }) {
  return (
    <View style={styles.segment}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity key={o.value} onPress={() => setValue(o.value)} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
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
});
