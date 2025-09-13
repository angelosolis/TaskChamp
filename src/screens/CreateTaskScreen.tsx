import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, SegmentedButtons, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';

import { useAppDispatch, useAppSelector } from '../store/store';
import { createTask } from '../store/slices/taskSlice';
import { MainTabParamList, MainStackParamList } from '../types';
import { inAppAlertService } from '../services/inAppAlertService';
import { useNotification } from '../components/NotificationProvider';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Create'>,
  StackScreenProps<MainStackParamList>
>;

export default function CreateTaskScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.tasks);
  const { showInfo, showError } = useNotification();

  const handleCreateTask = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      await dispatch(createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        completed: false,
      })).unwrap();

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('');
      setDueDate(undefined);
      
      // Show success message
      setSuccessVisible(true);
      
      // Navigate to tasks after a short delay
      setTimeout(() => {
        navigation.navigate('TaskList');
      }, 1000);
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleTestAlert = () => {
    showInfo(
      "Good morning, Champion!",
      "🌟 Ready to tackle your tasks today? Let's make today productive!"
    );
  };

  const handleTestOverdueAlert = () => {
    showError(
      "🚨 Overdue Tasks!",
      "You have 2 overdue tasks:\n\n• Submit Assignment 🔥\n• Study for Quiz\n\nTime to catch up!"
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const isFormValid = () => {
    return title.trim().length > 0;
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: 'keyboard-arrow-down' },
    { value: 'medium', label: 'Medium', icon: 'remove' },
    { value: 'high', label: 'High', icon: 'keyboard-arrow-up' },
  ];

  const commonCategories = [
    'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Home'
  ];

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Create New Task"
        subtitle="Add a new task to your list"
        gradient={['#10B981', '#059669']}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            {/* Title */}
            <TextInput
              label="Task Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="What needs to be done?"
              left={<TextInput.Icon icon="clipboard-text" />}
            />

            {/* Description */}
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Add more details about your task..."
              left={<TextInput.Icon icon="note-text" />}
            />

            {/* Priority */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Priority Level
              </Text>
              <SegmentedButtons
                value={priority}
                onValueChange={setPriority as any}
                buttons={[
                  {
                    value: 'low',
                    label: 'Low',
                    icon: () => <MaterialCommunityIcons name="chevron-down" size={16} color="#059669" />,
                  },
                  {
                    value: 'medium',
                    label: 'Medium',
                    icon: () => <MaterialCommunityIcons name="minus" size={16} color="#D97706" />,
                  },
                  {
                    value: 'high',
                    label: 'High',
                    icon: () => <MaterialCommunityIcons name="chevron-up" size={16} color="#DC2626" />,
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <TextInput
                label="Category (Optional)"
                value={category}
                onChangeText={setCategory}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Work, Personal, Health"
                left={<TextInput.Icon icon="label" />}
              />
              <View style={styles.categoryChips}>
                {commonCategories.map((cat) => (
                  <Button
                    key={cat}
                    mode={category === cat ? 'contained' : 'outlined'}
                    compact
                    onPress={() => setCategory(category === cat ? '' : cat)}
                    style={styles.categoryChip}
                  >
                    {cat}
                  </Button>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Due Date (Optional)
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
              >
                <MaterialCommunityIcons name="clock" size={20} />
                {dueDate ? dueDate.toDateString() : 'Select due date'}
              </Button>
              {dueDate && (
                <Button
                  mode="text"
                  compact
                  onPress={() => setDueDate(undefined)}
                  style={styles.clearDateButton}
                >
                  Clear date
                </Button>
              )}
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleCreateTask}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              disabled={!isFormValid() || isLoading}
              loading={isLoading}
            >
              Create Task
            </Button>

            {/* Test Alert Buttons */}
            <View style={styles.testSection}>
              <Button
                mode="outlined"
                onPress={handleTestAlert}
                style={styles.testButton}
                contentStyle={styles.testButtonContent}
              >
                <MaterialCommunityIcons name="emoticon-happy" size={20} />
                Test Motivation
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleTestOverdueAlert}
                style={[styles.testButton, styles.warningTestButton]}
                contentStyle={styles.testButtonContent}
              >
                <MaterialCommunityIcons name="alert" size={20} />
                Test Overdue Alert
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Success Snackbar */}
        <Snackbar
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          duration={3000}
          style={styles.successSnackbar}
        >
          Task created successfully!
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          visible={!!error}
          onDismiss={() => {}}
          duration={4000}
          style={styles.errorSnackbar}
        >
          {error}
        </Snackbar>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  formCard: {
    elevation: 2,
  },
  formContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: '#F9FAFB',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  dateButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dateButtonContent: {
    flexDirection: 'row-reverse',
    paddingVertical: 8,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#2E3A59',
  },
  testSection: {
    marginTop: 16,
    gap: 8,
  },
  testButton: {
    borderColor: '#4A90E2',
  },
  warningTestButton: {
    borderColor: '#D97706',
  },
  testButtonContent: {
    height: 44,
  },
  submitButtonContent: {
    height: 48,
  },
  successSnackbar: {
    backgroundColor: '#059669',
  },
  errorSnackbar: {
    backgroundColor: '#DC2626',
  },
});
