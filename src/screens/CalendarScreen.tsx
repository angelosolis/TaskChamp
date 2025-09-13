import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, FAB, Chip, Button } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import ModernHeader from '../components/ModernHeader';
import { useAppDispatch, useAppSelector } from '../store/store';
import { loadEvents, setSelectedDate } from '../store/slices/calendarSlice';
import { MainTabParamList, CalendarEvent, Task } from '../types';
import { useNotification } from '../components/NotificationProvider';

type Props = BottomTabScreenProps<MainTabParamList, 'Calendar'>;

const { width } = Dimensions.get('window');

export default function CalendarScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { events, selectedDate, isLoading } = useAppSelector((state) => state.calendar);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { showSuccess } = useNotification();
  
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    dispatch(loadEvents());
  }, [dispatch]);

  // Combine tasks and events for calendar display
  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark task due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = task.dueDate.split('T')[0]; // Extract YYYY-MM-DD
        if (!marked[date]) {
          marked[date] = { dots: [] };
        }
        marked[date].dots.push({
          color: task.completed ? '#10B981' : task.priority === 'high' ? '#EF4444' : '#F59E0B',
          selectedDotColor: '#FFFFFF',
        });
      }
    });

    // Mark calendar events
    events.forEach(event => {
      const date = event.startDate.split('T')[0]; // Extract YYYY-MM-DD
      if (!marked[date]) {
        marked[date] = { dots: [] };
      }
      marked[date].dots.push({
        color: getEventColor(event.type),
        selectedDotColor: '#FFFFFF',
      });
    });

    // Mark selected date
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#667eea';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#667eea',
      };
    }

    return marked;
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'class': return '#3B82F6';
      case 'exam': return '#EF4444';
      case 'assignment': return '#F59E0B';
      case 'event': return '#8B5CF6';
      case 'reminder': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.startDate.split('T')[0] === date);
  };

  const getTasksForDate = (date: string) => {
    return tasks.filter(task => task.dueDate && task.dueDate.split('T')[0] === date);
  };

  const onDayPress = (day: DateData) => {
    dispatch(setSelectedDate(day.dateString));
  };

  const handleAddEvent = () => {
    showSuccess('Coming Soon!', 'Event creation will be available shortly');
  };

  const EventCard = ({ event }: { event: CalendarEvent }) => (
    <Card style={[styles.eventCard, { borderLeftColor: getEventColor(event.type) }]}>
      <Card.Content style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <MaterialCommunityIcons 
            name={getEventIcon(event.type)} 
            size={20} 
            color={getEventColor(event.type)} 
          />
          <Text variant="bodyMedium" style={styles.eventTitle}>{event.title}</Text>
        </View>
        {event.startTime && (
          <Text variant="bodySmall" style={styles.eventTime}>
            {event.startTime} {event.endTime && `- ${event.endTime}`}
          </Text>
        )}
        {event.location && (
          <Text variant="bodySmall" style={styles.eventLocation}>
            📍 {event.location}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const TaskCard = ({ task }: { task: Task }) => (
    <Card style={[styles.taskCard, { borderLeftColor: task.completed ? '#10B981' : '#EF4444' }]}>
      <Card.Content style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <MaterialCommunityIcons 
            name={task.completed ? 'check-circle' : 'clock-alert'} 
            size={20} 
            color={task.completed ? '#10B981' : '#EF4444'} 
          />
          <Text 
            variant="bodyMedium" 
            style={[styles.eventTitle, task.completed && styles.completedTask]}
          >
            {task.title}
          </Text>
          <Chip
            mode="outlined"
            compact
            style={styles.priorityChip}
            textStyle={{ color: getPriorityColor(task.priority), fontSize: 10 }}
          >
            {task.priority.toUpperCase()}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'class': return 'school';
      case 'exam': return 'file-document-edit';
      case 'assignment': return 'clipboard-text';
      case 'event': return 'calendar-star';
      case 'reminder': return 'bell';
      default: return 'calendar';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateTasks = getTasksForDate(selectedDate);
  const hasItems = selectedDateEvents.length > 0 || selectedDateTasks.length > 0;

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Calendar"
        subtitle="Manage your schedule and deadlines"
        gradient={['#667eea', '#764ba2']}
        rightElement={
          <Button
            mode="text"
            compact
            onPress={() => navigation.navigate('Create')}
            textColor="#FFFFFF"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            Add
          </Button>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Calendar */}
        <Card style={styles.calendarCard}>
          <Calendar
            onDayPress={onDayPress}
            markingType="multi-dot"
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#2E3A59',
              selectedDayBackgroundColor: '#667eea',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#667eea',
              dayTextColor: '#2E3A59',
              textDisabledColor: '#9CA3AF',
              dotColor: '#667eea',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#667eea',
              monthTextColor: '#2E3A59',
              indicatorColor: '#667eea',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </Card>

        {/* Legend */}
        <Card style={styles.legendCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text variant="bodySmall" style={styles.legendText}>High Priority</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text variant="bodySmall" style={styles.legendText}>Medium Priority</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text variant="bodySmall" style={styles.legendText}>Completed</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text variant="bodySmall" style={styles.legendText}>Classes</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text variant="bodySmall" style={styles.legendText}>Events</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text variant="bodySmall" style={styles.legendText}>Exams</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Selected Date Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.detailsTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {!hasItems && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#E5E7EB" />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No events or tasks for this date
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleAddEvent}
                  style={styles.addButton}
                  compact
                >
                  Add Event
                </Button>
              </View>
            )}

            {/* Events for selected date */}
            {selectedDateEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}

            {/* Tasks for selected date */}
            {selectedDateTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                onPress={handleAddEvent}
                style={styles.actionButton}
                buttonColor="#3B82F6"
              >
                <MaterialCommunityIcons name="school" size={20} />
                Add Class
              </Button>
              <Button
                mode="contained"
                onPress={handleAddEvent}
                style={styles.actionButton}
                buttonColor="#EF4444"
              >
                <MaterialCommunityIcons name="file-document-edit" size={20} />
                Add Exam
              </Button>
            </View>
            <View style={styles.quickActions}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Create')}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons name="clipboard-plus" size={20} />
                Add Task
              </Button>
              <Button
                mode="outlined"
                onPress={handleAddEvent}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons name="calendar-plus" size={20} />
                Add Event
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for quick add */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddEvent}
        label="Add Event"
      />
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
    paddingTop: 8,
    paddingBottom: 100, // Space for FAB
  },
  calendarCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  calendar: {
    borderRadius: 12,
  },
  legendCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  legendTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#6B7280',
    fontSize: 12,
  },
  detailsCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  detailsTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  taskCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  eventContent: {
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eventTitle: {
    flex: 1,
    color: '#2E3A59',
    fontWeight: '500',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityChip: {
    height: 24,
  },
  eventTime: {
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 28,
  },
  eventLocation: {
    color: '#6B7280',
    marginTop: 2,
    marginLeft: 28,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    borderColor: '#667eea',
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
});


