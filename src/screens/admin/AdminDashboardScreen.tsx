import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Surface, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModernHeader from '../../components/ModernHeader';
import { supabase } from '../../services/supabase';
import { useAppSelector } from '../../store/store';

interface Stats {
  totalStudents: number;
  totalAdmins: number;
  totalTasks: number;
  totalEvents: number;
  totalPrograms: number;
  recentSignups: number;
}

export default function AdminDashboardScreen() {
  const { user } = useAppSelector((s) => s.auth);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [students, admins, tasks, events, programs, recent] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
      supabase.from('programs').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ]);

    setStats({
      totalStudents: students.count || 0,
      totalAdmins: admins.count || 0,
      totalTasks: tasks.count || 0,
      totalEvents: events.count || 0,
      totalPrograms: programs.count || 0,
      recentSignups: recent.count || 0,
    });
  }, []);

  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchStats(); } finally { setRefreshing(false); }
  }, [fetchStats]);

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Admin Panel"
        subtitle={`Signed in as ${user?.name || ''}`}
        gradient={['#6366F1', '#8B5CF6']}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : stats ? (
          <>
            <View style={styles.grid}>
              <StatCard icon="account-group" label="Students" value={stats.totalStudents} color="#3B82F6" />
              <StatCard icon="shield-account" label="Admins" value={stats.totalAdmins} color="#8B5CF6" />
              <StatCard icon="clipboard-text" label="Tasks" value={stats.totalTasks} color="#10B981" />
              <StatCard icon="calendar" label="Events" value={stats.totalEvents} color="#F59E0B" />
              <StatCard icon="school" label="Programs" value={stats.totalPrograms} color="#EC4899" />
              <StatCard icon="trending-up" label="New (7d)" value={stats.recentSignups} color="#06B6D4" />
            </View>

            <Card style={styles.tipCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.tipTitle}>Quick actions</Text>
                <Text variant="bodySmall" style={styles.tipText}>
                  Use the bottom tabs to manage students and degree programs. Pull down to refresh.
                </Text>
              </Card.Content>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Surface style={styles.statCard} elevation={2}>
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={26} color={color} />
      </View>
      <Text variant="headlineMedium" style={styles.statValue}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  loading: { paddingVertical: 64, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '47%', borderRadius: 12, backgroundColor: '#FFFFFF',
    padding: 16, alignItems: 'flex-start', gap: 10,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontWeight: 'bold', color: '#1F2937' },
  statLabel: { color: '#6B7280' },
  tipCard: { marginTop: 8 },
  tipTitle: { fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  tipText: { color: '#6B7280' },
});
