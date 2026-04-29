import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text, Card, IconButton, Dialog, Portal, Button, TextInput, FAB, Switch, ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModernHeader from '../../components/ModernHeader';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { loadPrograms, createProgram, updateProgram, deleteProgram } from '../../store/slices/programsSlice';
import { useNotification } from '../../components/NotificationProvider';
import { Program } from '../../types';

type FormState = { id: string | null; code: string; name: string; isActive: boolean };
const empty: FormState = { id: null, code: '', name: '', isActive: true };

export default function AdminProgramsScreen() {
  const dispatch = useAppDispatch();
  const { programs, isLoading } = useAppSelector((s) => s.programs);
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<FormState>(empty);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { dispatch(loadPrograms()); }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await dispatch(loadPrograms()).unwrap(); } finally { setRefreshing(false); }
  };

  const openAdd = () => { setForm(empty); setDialogOpen(true); };
  const openEdit = (p: Program) => {
    setForm({ id: p.id, code: p.code, name: p.name, isActive: p.isActive });
    setDialogOpen(true);
  };
  const close = () => { setDialogOpen(false); setForm(empty); };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { showError('Missing fields', 'Code and name required.'); return; }
    try {
      if (form.id) {
        await dispatch(updateProgram({
          id: form.id, code: form.code, name: form.name, isActive: form.isActive,
        })).unwrap();
        showSuccess('Program updated', '');
      } else {
        await dispatch(createProgram({ code: form.code, name: form.name })).unwrap();
        showSuccess('Program added', '');
      }
      close();
    } catch (e: any) {
      showError('Save failed', e.message);
    }
  };

  const remove = async (id: string) => {
    try {
      await dispatch(deleteProgram(id)).unwrap();
      showSuccess('Program removed', '');
      setConfirmDeleteId(null);
    } catch (e: any) {
      showError('Delete failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Programs"
        subtitle={`${programs.length} active`}
        gradient={['#EC4899', '#8B5CF6']}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && programs.length === 0 ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#EC4899" /></View>
        ) : programs.length === 0 ? (
          <Card style={styles.emptyCard}><Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="school-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No programs yet — tap + to add one.</Text>
          </Card.Content></Card>
        ) : (
          programs.map((p) => (
            <Card key={p.id} style={styles.programCard}>
              <Card.Content>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.code}>{p.code}</Text>
                    <Text variant="bodyMedium" style={styles.name}>{p.name}</Text>
                  </View>
                  <IconButton icon="pencil" size={20} onPress={() => openEdit(p)} />
                  <IconButton icon="delete" size={20} iconColor="#DC2626" onPress={() => setConfirmDeleteId(p.id)} />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={openAdd} color="#FFFFFF" />

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={close}>
          <Dialog.Title>{form.id ? 'Edit Program' : 'Add Program'}</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 8 }}>
              <TextInput
                label="Code (e.g. BSCS)" value={form.code} mode="outlined"
                autoCapitalize="characters"
                onChangeText={(v) => setForm({ ...form, code: v })}
              />
              <TextInput
                label="Name (e.g. Bachelor of Science in Computer Science)" value={form.name} mode="outlined"
                onChangeText={(v) => setForm({ ...form, name: v })}
              />
              {form.id ? (
                <View style={styles.activeRow}>
                  <Text>Active (visible to students)</Text>
                  <Switch value={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v })} />
                </View>
              ) : null}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={close}>Cancel</Button>
            <Button mode="contained" buttonColor="#EC4899" onPress={save}>{form.id ? 'Save' : 'Add'}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!confirmDeleteId} onDismiss={() => setConfirmDeleteId(null)}>
          <Dialog.Title>Delete program?</Dialog.Title>
          <Dialog.Content>
            <Text>Existing students will keep their assigned course on their profile, but it won't appear in dropdowns anymore.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button textColor="#DC2626" onPress={() => confirmDeleteId && remove(confirmDeleteId)}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 96 },
  loading: { paddingVertical: 64, alignItems: 'center' },
  emptyCard: { marginTop: 40 },
  emptyContent: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280' },
  programCard: { marginBottom: 8, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  code: { fontWeight: 'bold', color: '#1F2937' },
  name: { color: '#6B7280', marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#EC4899' },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
