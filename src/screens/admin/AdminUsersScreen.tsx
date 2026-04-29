import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text, Card, IconButton, Dialog, Portal, Button, TextInput, Menu, Surface, Chip, ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModernHeader from '../../components/ModernHeader';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../components/NotificationProvider';
import { ProfileRow, ProgramRow } from '../../types/database';
import { EDUCATION_LEVELS } from '../../types';

type EditState = {
  id: string;
  name: string;
  course: string;
  educationLevel: string;
  role: 'student' | 'admin';
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [courseMenu, setCourseMenu] = useState(false);
  const [eduMenu, setEduMenu] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchUsers = useCallback(async () => {
    const [{ data: profileData, error }, { data: programData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('programs').select('*').eq('is_active', true).order('code'),
    ]);
    if (error) { showError('Failed to load', error.message); return; }
    setUsers((profileData || []) as ProfileRow[]);
    setPrograms((programData || []) as ProgramRow[]);
  }, [showError]);

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchUsers(); } finally { setRefreshing(false); }
  }, [fetchUsers]);

  const openEdit = (u: ProfileRow) => {
    setEdit({
      id: u.id,
      name: u.name,
      course: u.course || '',
      educationLevel: u.education_level || '',
      role: u.role,
    });
  };

  const handleSave = async () => {
    if (!edit) return;
    const { error } = await supabase.from('profiles').update({
      name: edit.name.trim(),
      course: edit.course || null,
      education_level: edit.educationLevel || null,
      role: edit.role,
    }).eq('id', edit.id);
    if (error) { showError('Save failed', error.message); return; }
    showSuccess('User updated', '');
    setEdit(null);
    await fetchUsers();
  };

  const handleDelete = async (id: string) => {
    // Deleting from profiles cascades. The auth.users record stays — only an admin
    // service-role can fully delete that.
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { showError('Delete failed', error.message); return; }
    showSuccess('User removed', 'Their data has been deleted.');
    setDeleteId(null);
    await fetchUsers();
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Students"
        subtitle={`${users.length} registered`}
        gradient={['#3B82F6', '#6366F1']}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>
        ) : users.length === 0 ? (
          <Card style={styles.emptyCard}><Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="account-off" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No users yet.</Text>
          </Card.Content></Card>
        ) : (
          users.map((u) => (
            <Card key={u.id} style={styles.userCard}>
              <Card.Content>
                <View style={styles.row}>
                  <View style={styles.userInfo}>
                    <Text variant="titleMedium" style={styles.userName}>{u.name}</Text>
                    <Text variant="bodySmall" style={styles.userEmail}>{u.email}</Text>
                    <View style={styles.chipRow}>
                      {u.course ? <Chip compact style={styles.chip}>{u.course}</Chip> : null}
                      {u.education_level ? <Chip compact style={styles.chip}>{u.education_level}</Chip> : null}
                      <Chip compact style={[styles.chip, u.role === 'admin' && styles.adminChip]}
                            textStyle={u.role === 'admin' ? styles.adminText : undefined}>
                        {u.role}
                      </Chip>
                    </View>
                  </View>
                  <IconButton icon="pencil" size={20} onPress={() => openEdit(u)} />
                  <IconButton icon="delete" size={20} iconColor="#DC2626" onPress={() => setDeleteId(u.id)} />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={!!edit} onDismiss={() => setEdit(null)}>
          <Dialog.Title>Edit User</Dialog.Title>
          <Dialog.Content>
            {edit ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  label="Name" value={edit.name} mode="outlined"
                  onChangeText={(v) => setEdit({ ...edit, name: v })}
                />

                <Menu visible={courseMenu} onDismiss={() => setCourseMenu(false)} anchor={
                  <Surface style={styles.menuAnchor} elevation={0}>
                    <Button mode="outlined" onPress={() => setCourseMenu(true)} icon="school">
                      {edit.course || 'Select course'}
                    </Button>
                  </Surface>
                }>
                  <Menu.Item title="(none)" onPress={() => { setEdit({ ...edit, course: '' }); setCourseMenu(false); }} />
                  {programs.map((p) => (
                    <Menu.Item key={p.id} title={p.code}
                      onPress={() => { setEdit({ ...edit, course: p.code }); setCourseMenu(false); }} />
                  ))}
                </Menu>

                <Menu visible={eduMenu} onDismiss={() => setEduMenu(false)} anchor={
                  <Surface style={styles.menuAnchor} elevation={0}>
                    <Button mode="outlined" onPress={() => setEduMenu(true)} icon="account-school">
                      {edit.educationLevel || 'Select level'}
                    </Button>
                  </Surface>
                }>
                  <Menu.Item title="(none)" onPress={() => { setEdit({ ...edit, educationLevel: '' }); setEduMenu(false); }} />
                  {EDUCATION_LEVELS.map((lvl) => (
                    <Menu.Item key={lvl} title={lvl}
                      onPress={() => { setEdit({ ...edit, educationLevel: lvl }); setEduMenu(false); }} />
                  ))}
                </Menu>

                <Menu visible={roleMenu} onDismiss={() => setRoleMenu(false)} anchor={
                  <Surface style={styles.menuAnchor} elevation={0}>
                    <Button mode="outlined" onPress={() => setRoleMenu(true)} icon="shield-account">
                      Role: {edit.role}
                    </Button>
                  </Surface>
                }>
                  <Menu.Item title="student" onPress={() => { setEdit({ ...edit, role: 'student' }); setRoleMenu(false); }} />
                  <Menu.Item title="admin" onPress={() => { setEdit({ ...edit, role: 'admin' }); setRoleMenu(false); }} />
                </Menu>
              </View>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEdit(null)}>Cancel</Button>
            <Button mode="contained" buttonColor="#6366F1" onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)}>
          <Dialog.Title>Delete user?</Dialog.Title>
          <Dialog.Content>
            <Text>This removes their profile and all their tasks/courses/events. The auth login still exists until manually deleted from the Supabase dashboard.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteId(null)}>Cancel</Button>
            <Button textColor="#DC2626" onPress={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  loading: { paddingVertical: 64, alignItems: 'center' },
  emptyCard: { marginTop: 40 },
  emptyContent: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280' },
  userCard: { marginBottom: 8, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontWeight: 'bold', color: '#1F2937' },
  userEmail: { color: '#6B7280', marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: '#F3F4F6' },
  adminChip: { backgroundColor: '#8B5CF6' },
  adminText: { color: '#FFFFFF', fontWeight: 'bold' },
  menuAnchor: { backgroundColor: 'transparent' },
});
