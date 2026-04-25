import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Dialog, Portal, FAB, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';

import { useAppDispatch, useAppSelector } from '../store/store';
import { addCourse, updateCourse, deleteCourse } from '../store/slices/academicSlice';
import { useNotification } from '../components/NotificationProvider';
import { MainStackParamList, Course } from '../types';

type Props = StackScreenProps<MainStackParamList, 'ManageCourses'>;

type FormState = {
  code: string;
  name: string;
  professor: string;
  credits: string;
  currentGrade: string;
  targetGrade: string;
};

const emptyForm: FormState = {
  code: '',
  name: '',
  professor: '',
  credits: '',
  currentGrade: '',
  targetGrade: '',
};

export default function ManageCoursesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { courses } = useAppSelector((state) => state.academic);
  const { showSuccess, showError, showWarning } = useNotification();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogVisible(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingId(course.id);
    setForm({
      code: course.code,
      name: course.name,
      professor: course.professor ?? '',
      credits: course.credits?.toString() ?? '',
      currentGrade: course.currentGrade?.toString() ?? '',
      targetGrade: course.targetGrade?.toString() ?? '',
    });
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code || !name) {
      showError('Missing info', 'Course code and name are required.');
      return;
    }

    const credits = form.credits.trim() ? parseFloat(form.credits) : undefined;
    const currentGrade = form.currentGrade.trim() ? parseFloat(form.currentGrade) : undefined;
    const targetGrade = form.targetGrade.trim() ? parseFloat(form.targetGrade) : undefined;

    if (editingId) {
      const existing = courses.find((c) => c.id === editingId);
      if (!existing) return;
      dispatch(updateCourse({
        ...existing,
        code,
        name,
        professor: form.professor.trim() || undefined,
        credits,
        currentGrade,
        targetGrade,
      }));
      showSuccess('Course updated', `${code} saved.`);
    } else {
      dispatch(addCourse({
        code,
        name,
        professor: form.professor.trim() || undefined,
        credits,
        currentGrade,
        targetGrade,
      }));
      showSuccess('Course added', `${code} added to your courses.`);
    }

    closeDialog();
  };

  const handleDelete = (id: string) => {
    dispatch(deleteCourse(id));
    setConfirmDeleteId(null);
    showWarning('Course deleted', 'The course has been removed.');
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Manage Courses"
        subtitle={`${courses.length} course${courses.length === 1 ? '' : 's'}`}
        gradient={['#6366F1', '#8B5CF6']}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {courses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="school-outline" size={48} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No courses yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Add your first course to start tracking grades and assignments.
              </Text>
              <Button
                mode="contained"
                onPress={openAddDialog}
                style={styles.emptyButton}
                buttonColor="#6366F1"
              >
                Add Course
              </Button>
            </Card.Content>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} style={styles.courseCard}>
              <Card.Content>
                <View style={styles.courseHeader}>
                  <View style={[styles.colorDot, { backgroundColor: course.color }]} />
                  <View style={styles.courseInfo}>
                    <Text variant="titleMedium" style={styles.courseCode}>
                      {course.code}
                    </Text>
                    <Text variant="bodyMedium" style={styles.courseName}>
                      {course.name}
                    </Text>
                    {course.professor ? (
                      <Text variant="bodySmall" style={styles.courseMeta}>
                        Prof. {course.professor}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => openEditDialog(course)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#DC2626"
                    onPress={() => setConfirmDeleteId(course.id)}
                  />
                </View>

                {(course.credits || course.currentGrade || course.targetGrade) && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.statsRow}>
                      {course.credits !== undefined && (
                        <View style={styles.stat}>
                          <Text variant="bodySmall" style={styles.statLabel}>Credits</Text>
                          <Text variant="titleMedium" style={styles.statValue}>{course.credits}</Text>
                        </View>
                      )}
                      {course.currentGrade !== undefined && (
                        <View style={styles.stat}>
                          <Text variant="bodySmall" style={styles.statLabel}>Current</Text>
                          <Text variant="titleMedium" style={styles.statValue}>{course.currentGrade}%</Text>
                        </View>
                      )}
                      {course.targetGrade !== undefined && (
                        <View style={styles.stat}>
                          <Text variant="bodySmall" style={styles.statLabel}>Target</Text>
                          <Text variant="titleMedium" style={styles.statValue}>{course.targetGrade}%</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        color="#FFFFFF"
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog} style={styles.dialog}>
          <Dialog.Title>{editingId ? 'Edit Course' : 'Add Course'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView contentContainerStyle={styles.dialogContent}>
                <TextInput
                  label="Course Code *"
                  value={form.code}
                  onChangeText={(v) => setForm({ ...form, code: v })}
                  mode="outlined"
                  placeholder="CS101"
                  autoCapitalize="characters"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Course Name *"
                  value={form.name}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                  mode="outlined"
                  placeholder="Introduction to Programming"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Professor"
                  value={form.professor}
                  onChangeText={(v) => setForm({ ...form, professor: v })}
                  mode="outlined"
                  placeholder="Dr. Smith"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Credits"
                  value={form.credits}
                  onChangeText={(v) => setForm({ ...form, credits: v })}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="3"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Current Grade (%)"
                  value={form.currentGrade}
                  onChangeText={(v) => setForm({ ...form, currentGrade: v })}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="85"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Target Grade (%)"
                  value={form.targetGrade}
                  onChangeText={(v) => setForm({ ...form, targetGrade: v })}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="90"
                  style={styles.dialogInput}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained" buttonColor="#6366F1">
              {editingId ? 'Save' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={confirmDeleteId !== null} onDismiss={() => setConfirmDeleteId(null)}>
          <Dialog.Title>Delete course?</Dialog.Title>
          <Dialog.Content>
            <Text>This will remove the course. Tasks linked to it will remain but lose their course reference.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              onPress={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              textColor="#DC2626"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 96,
  },
  emptyCard: {
    elevation: 2,
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  courseCard: {
    marginBottom: 12,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  courseName: {
    color: '#4B5563',
    marginTop: 2,
  },
  courseMeta: {
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#6B7280',
  },
  statValue: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6366F1',
  },
  dialog: {
    maxHeight: '85%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  dialogInput: {
    marginBottom: 4,
  },
});
