import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Platform } from 'react-native';
import { Text, Card, FAB, Chip, Button, TextInput, IconButton } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';

import ModernHeader from '../components/ModernHeader';
import { useAppDispatch, useAppSelector } from '../store/store';
import { loadEvents, setSelectedDate, createEvent, deleteEvent } from '../store/slices/calendarSlice';
import { MainTabParamList, CalendarEvent, Task } from '../types';
import { useNotification } from '../components/NotificationProvider';
import { notificationService } from '../services/notificationService';

type Props = BottomTabScreenProps<MainTabParamList, 'Calendar'>;
type EventType = CalendarEvent['type'];

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'class',    label: 'Class',    color: '#3B82F6' },
  { value: 'exam',     label: 'Exam',     color: '#EF4444' },
  { value: 'event',    label: 'Event',    color: '#8B5CF6' },
  { value: 'reminder', label: 'Reminder', color: '#10B981' },
];

export default function CalendarScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { events, selectedDate, isLoading } = useAppSelector((state) => state.calendar);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { showSuccess, showError } = useNotification();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    dispatch(loadEvents());
  }, [dispatch]);

  const openModal = (presetType: EventType = 'event') => {
    setType(presetType);
    setTitle('');
    setLocation('');
    setStartTime('');
    setEndTime('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Missing Title', 'Please enter a title.');
      return;
    }
    try {
      await notificationService.initialize();
      const newEvent = await dispatch(createEvent({
        title: title.trim(),
        type,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location.trim() || undefined,
      })).unwrap();
      // Schedule notification for this event
      await notificationService.scheduleEventNotification(
        newEvent,
        startTime ? startTimeDate : undefined,
      );
      showSuccess('Event Added!', `"${title}" saved — you'll be notified!`);
      setModalVisible(false);
    } catch {
      showError('Error', 'Could not save event.');
    }
  };

  const handleDelete = async (id: string, eventTitle: string) => {
    try {
      await notificationService.cancelEventNotification(id);
      await dispatch(deleteEvent(id)).unwrap();
      showSuccess('Deleted', `"${eventTitle}" removed.`);
    } catch {
      showError('Error', 'Could not delete event.');
    }
  };

  const onStartTimeChange = (_: any, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      setStartTimeDate(date);
      setStartTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const onEndTimeChange = (_: any, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      setEndTimeDate(date);
      setEndTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const getEventColor = (t: CalendarEvent['type']) =>
    ({ class: '#3B82F6', exam: '#EF4444', assignment: '#F59E0B', event: '#8B5CF6', reminder: '#10B981' }[t] || '#6B7280');

  const getEventIcon = (t: CalendarEvent['type']): any =>
    ({ class: 'school', exam: 'file-document-edit', assignment: 'clipboard-text', event: 'calendar-star', reminder: 'bell' }[t] || 'calendar');

  const getPriorityColor = (p: Task['priority']) =>
    ({ high: '#EF4444', medium: '#F59E0B', low: '#10B981' }[p] || '#6B7280');

  const getMarkedDates = () => {
    const marked: any = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = task.dueDate.split('T')[0];
        if (!marked[date]) marked[date] = { dots: [] };
        marked[date].dots.push({ color: task.completed ? '#10B981' : task.priority === 'high' ? '#EF4444' : '#F59E0B' });
      }
    });
    events.forEach(event => {
      const date = event.startDate.split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      marked[date].dots.push({ color: getEventColor(event.type) });
    });
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#667eea';
    } else {
      marked[selectedDate] = { selected: true, selectedColor: '#667eea' };
    }
    return marked;
  };

  const selectedDateEvents = events.filter(e => e.startDate.split('T')[0] === selectedDate);
  const selectedDateTasks = tasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === selectedDate);
  const hasItems = selectedDateEvents.length > 0 || selectedDateTasks.length > 0;

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Calendar"
        subtitle="Manage your schedule and deadlines"
        gradient={['#667eea', '#764ba2']}
        rightElement={
          <Button mode="text" compact onPress={() => openModal('event')} textColor="#FFFFFF">
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" /> Add
          </Button>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.calendarCard}>
          <Calendar
            onDayPress={(day: DateData) => dispatch(setSelectedDate(day.dateString))}
            markingType="multi-dot"
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: '#FFFFFF', calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#2E3A59', selectedDayBackgroundColor: '#667eea',
              selectedDayTextColor: '#FFFFFF', todayTextColor: '#667eea',
              dayTextColor: '#2E3A59', textDisabledColor: '#9CA3AF',
              arrowColor: '#667eea', monthTextColor: '#2E3A59',
              textMonthFontWeight: 'bold', textDayFontSize: 16,
              textMonthFontSize: 18, textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </Card>

        <Card style={styles.legendCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendRow}>
              {[['#EF4444', 'High Priority'], ['#F59E0B', 'Medium'], ['#10B981', 'Completed']].map(([color, label]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text variant="bodySmall" style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              {[['#3B82F6', 'Classes'], ['#8B5CF6', 'Events'], ['#EF4444', 'Exams']].map(([color, label]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text variant="bodySmall" style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Selected Date */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.detailsTitle}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Text>

            {!hasItems && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#E5E7EB" />
                <Text variant="bodyMedium" style={styles.emptyText}>No events or tasks for this date</Text>
                <Button mode="outlined" onPress={() => openModal('event')} style={styles.addButton} compact>
                  Add Event
                </Button>
              </View>
            )}

            {selectedDateEvents.map(event => (
              <Card key={event.id} style={[styles.eventCard, { borderLeftColor: getEventColor(event.type) }]}>
                <Card.Content style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <MaterialCommunityIcons name={getEventIcon(event.type)} size={20} color={getEventColor(event.type)} />
                    <Text variant="bodyMedium" style={styles.eventTitle}>{event.title}</Text>
                    <IconButton icon="delete-outline" size={16} iconColor="#9CA3AF" onPress={() => handleDelete(event.id, event.title)} style={styles.deleteBtn} />
                  </View>
                  {event.startTime && (
                    <View style={styles.eventMetaRow}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.eventTime}>
                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                      </Text>
                    </View>
                  )}
                  {event.location && (
                    <View style={styles.eventMetaRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.eventLocation}>{event.location}</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            {selectedDateTasks.map(task => (
              <Card key={task.id} style={[styles.taskCard, { borderLeftColor: task.completed ? '#10B981' : '#EF4444' }]}>
                <Card.Content style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <MaterialCommunityIcons
                      name={task.completed ? 'check-circle' : 'clock-alert'}
                      size={20}
                      color={task.completed ? '#10B981' : '#EF4444'}
                    />
                    <Text variant="bodyMedium" style={[styles.eventTitle, task.completed && styles.completedTask]}>
                      {task.title}
                    </Text>
                    <Chip mode="outlined" compact style={styles.priorityChip}
                      textStyle={{ color: getPriorityColor(task.priority || 'medium'), fontSize: 10 }}>
                      {(task.priority || 'medium').toUpperCase()}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <Button mode="contained" onPress={() => openModal('class')} style={styles.actionButton}
                buttonColor="#3B82F6" labelStyle={{ color: '#fff' }}>
                Add Class
              </Button>
              <Button mode="contained" onPress={() => openModal('exam')} style={styles.actionButton}
                buttonColor="#EF4444" labelStyle={{ color: '#fff' }}>
                Add Exam
              </Button>
            </View>
            <View style={styles.quickActions}>
              <Button mode="outlined" onPress={() => navigation.navigate('Create')} style={styles.actionButton}>
                Add Task
              </Button>
              <Button mode="outlined" onPress={() => openModal('event')} style={styles.actionButton}>
                Add Event
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => openModal('event')} label="Add Event" />

      {/* Add Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {type === 'class' ? 'Add Class' : type === 'exam' ? 'Add Exam' : type === 'reminder' ? 'Add Reminder' : 'Add Event'}
              </Text>
              <IconButton icon="close" size={20} onPress={() => setModalVisible(false)} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
              />

              <Text variant="bodyMedium" style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map(et => (
                  <Chip
                    key={et.value}
                    selected={type === et.value}
                    onPress={() => setType(et.value)}
                    style={[styles.typeChip, type === et.value && { backgroundColor: et.color + '22' }]}
                    textStyle={{ color: type === et.value ? et.color : '#6B7280', fontSize: 12 }}
                  >
                    {et.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Date"
                value={selectedDate}
                mode="outlined"
                style={styles.input}
                editable={false}
                left={<TextInput.Icon icon="calendar" />}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <TextInput
                    label="Start Time"
                    value={startTime}
                    mode="outlined"
                    editable={false}
                    onPressIn={() => setShowStartPicker(true)}
                    right={<TextInput.Icon icon="clock-outline" onPress={() => setShowStartPicker(true)} />}
                    placeholder="Tap to set"
                  />
                </View>
                <View style={styles.timeField}>
                  <TextInput
                    label="End Time"
                    value={endTime}
                    mode="outlined"
                    editable={false}
                    onPressIn={() => setShowEndPicker(true)}
                    right={<TextInput.Icon icon="clock-outline" onPress={() => setShowEndPicker(true)} />}
                    placeholder="Tap to set"
                  />
                </View>
              </View>

              {showStartPicker && (
                <DateTimePicker value={startTimeDate} mode="time" is24Hour={false} onChange={onStartTimeChange} />
              )}
              {showEndPicker && (
                <DateTimePicker value={endTimeDate} mode="time" is24Hour={false} onChange={onEndTimeChange} />
              )}

              <TextInput
                label="Location (optional)"
                value={location}
                onChangeText={setLocation}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="map-marker" />}
              />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={isLoading}
                  disabled={!title.trim() || isLoading}
                  style={styles.saveBtn}
                  buttonColor={EVENT_TYPES.find(e => e.value === type)?.color || '#667eea'}
                  labelStyle={{ color: '#fff' }}
                >
                  Save
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 100 },
  calendarCard: { marginBottom: 16, elevation: 3, borderRadius: 12 },
  calendar: { borderRadius: 12 },
  legendCard: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  legendTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#6B7280', fontSize: 12 },
  detailsCard: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  detailsTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9CA3AF', marginTop: 12, marginBottom: 16 },
  addButton: { borderColor: '#667eea' },
  eventCard: { marginBottom: 8, elevation: 1, borderRadius: 8, borderLeftWidth: 4 },
  taskCard: { marginBottom: 8, elevation: 1, borderRadius: 8, borderLeftWidth: 4 },
  eventContent: { padding: 4 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventTitle: { flex: 1, color: '#2E3A59', fontWeight: '500' },
  completedTask: { textDecorationLine: 'line-through', opacity: 0.7 },
  priorityChip: { alignSelf: 'center' },
  deleteBtn: { margin: 0 },
  eventTime: { color: '#6B7280', marginTop: 4, marginLeft: 28, fontSize: 12 },
  eventLocation: { color: '#6B7280', marginTop: 2, marginLeft: 28, fontSize: 12 },
  actionsCard: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  cardTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 12 },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionButton: { flex: 1, borderRadius: 8 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#667eea' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#2E3A59', fontWeight: 'bold' },
  fieldLabel: { color: '#6B7280', marginBottom: 8, marginTop: 4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { borderRadius: 16 },
  input: { marginBottom: 12 },
  timeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timeField: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 24 },
  cancelBtn: { flex: 1 },
  saveBtn: { flex: 1 },
});
