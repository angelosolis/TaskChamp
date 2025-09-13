import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip, FAB, Surface, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useNotification } from '../components/NotificationProvider';

import { useAppDispatch, useAppSelector } from '../store/store';
import { updateTask, deleteTask } from '../store/slices/taskSlice';
import { TaskStackParamList } from '../types';

type Props = StackScreenProps<TaskStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const [menuVisible, setMenuVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { showWarning } = useNotification();
  
  const task = tasks.find(t => t.id === taskId);

  useEffect(() => {
    if (!task) {
      navigation.goBack();
    }
  }, [task, navigation]);

  if (!task) {
    return null;
  }

  const handleToggleComplete = async () => {
    await dispatch(updateTask({
      id: task.id,
      updates: { completed: !task.completed }
    }));
  };

  const handleUpdatePriority = async (priority: 'low' | 'medium' | 'high') => {
    await dispatch(updateTask({
      id: task.id,
      updates: { priority }
    }));
    setMenuVisible(false);
  };

  const handleDeleteTask = () => {
    showWarning(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.'
    );
    // For demo purposes, delete after showing warning
    setTimeout(async () => {
      await dispatch(deleteTask(task.id));
      navigation.goBack();
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'chevron-up';
      case 'medium': return 'minus';
      case 'low': return 'chevron-down';
      default: return 'minus';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  const dueSoon = task.dueDate && !task.completed && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Surface style={styles.customHeader}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          contentStyle={styles.backButtonContent}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#667eea" />
        </Button>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Task Details
        </Text>
        <View style={styles.headerRight} />
      </Surface>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        {task.completed && (
          <Surface style={styles.completedBanner}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#059669" />
            <Text variant="bodyMedium" style={styles.completedText}>
              This task has been completed
            </Text>
          </Surface>
        )}

        {isOverdue && (
          <Surface style={styles.overdueBanner}>
            <MaterialCommunityIcons name="clock-alert" size={24} color="#DC2626" />
            <Text variant="bodyMedium" style={styles.overdueText}>
              This task is overdue
            </Text>
          </Surface>
        )}

        {dueSoon && !isOverdue && (
          <Surface style={styles.dueSoonBanner}>
            <MaterialCommunityIcons name="clock" size={24} color="#D97706" />
            <Text variant="bodyMedium" style={styles.dueSoonText}>
              This task is due soon
            </Text>
          </Surface>
        )}

        {/* Task Title */}
        <Card style={styles.titleCard}>
          <Card.Content>
            <Text
              variant="headlineMedium"
              style={[styles.taskTitle, task.completed && styles.completedTitle]}
            >
              {task.title}
            </Text>
          </Card.Content>
        </Card>

        {/* Task Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            {/* Priority */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="flag" size={20} color="#6B7280" />
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Priority:
              </Text>
              <View style={styles.detailValue}>
                <Chip
                  icon={() => (
                    <MaterialCommunityIcons
                      name={getPriorityIcon(task.priority)}
                      size={16}
                      color={getPriorityColor(task.priority)}
                    />
                  )}
                  textStyle={{ color: getPriorityColor(task.priority), fontWeight: 'bold' }}
                  style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
                  mode="outlined"
                >
                  {task.priority.toUpperCase()}
                </Chip>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button
                      mode="text"
                      compact
                      onPress={() => setMenuVisible(true)}
                    >
                      Change
                    </Button>
                  }
                >
                  <Menu.Item
                    title="Low Priority"
                    leadingIcon={() => <MaterialCommunityIcons name="chevron-down" size={20} color="#059669" />}
                    onPress={() => handleUpdatePriority('low')}
                  />
                  <Menu.Item
                    title="Medium Priority"
                    leadingIcon={() => <MaterialCommunityIcons name="minus" size={20} color="#D97706" />}
                    onPress={() => handleUpdatePriority('medium')}
                  />
                  <Menu.Item
                    title="High Priority"
                    leadingIcon={() => <MaterialCommunityIcons name="chevron-up" size={20} color="#DC2626" />}
                    onPress={() => handleUpdatePriority('high')}
                  />
                </Menu>
              </View>
            </View>

            {/* Category */}
            {task.category && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="label" size={20} color="#6B7280" />
                <Text variant="bodyMedium" style={styles.detailLabel}>
                  Category:
                </Text>
                <Chip mode="outlined" style={styles.categoryChip}>
                  {task.category}
                </Chip>
              </View>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock" size={20} color="#6B7280" />
                <Text variant="bodyMedium" style={styles.detailLabel}>
                  Due Date:
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.dueDateText,
                    isOverdue && styles.overdueDate,
                    dueSoon && !isOverdue && styles.dueSoonDate,
                  ]}
                >
                  {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Status */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons 
                name={task.completed ? "check-circle" : "circle-outline"} 
                size={20} 
                color={task.completed ? "#059669" : "#6B7280"} 
              />
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Status:
              </Text>
              <Chip
                mode="outlined"
                textStyle={{
                  color: task.completed ? '#059669' : '#D97706',
                  fontWeight: 'bold',
                }}
                style={{
                  borderColor: task.completed ? '#059669' : '#D97706',
                }}
              >
                {task.completed ? 'COMPLETED' : 'PENDING'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Description */}
        {task.description && (
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Description
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.description, task.completed && styles.completedText]}
              >
                {task.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Timestamps */}
        <Card style={styles.timestampCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Timeline
            </Text>
            <View style={styles.timestampRow}>
              <MaterialCommunityIcons name="plus" size={16} color="#6B7280" />
              <Text variant="bodySmall" style={styles.timestampText}>
                Created: {formatDate(task.createdAt)}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <MaterialCommunityIcons name="pencil" size={16} color="#6B7280" />
              <Text variant="bodySmall" style={styles.timestampText}>
                Last updated: {formatDate(task.updatedAt)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actions
            </Text>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleToggleComplete}
                style={[styles.actionButton, task.completed ? styles.undoButton : styles.completeButton]}
                contentStyle={styles.actionButtonContent}
              >
                <MaterialCommunityIcons
                  name={task.completed ? "undo" : "check"}
                  size={20}
                  color="white"
                />
                {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Button
                mode="outlined"
                onPress={handleDeleteTask}
                style={[styles.actionButton, styles.deleteButton]}
                contentStyle={styles.actionButtonContent}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#DC2626" />
                Delete Task
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    minWidth: 'auto',
  },
  backButtonContent: {
    height: 40,
    width: 40,
  },
  headerTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  completedText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  dueSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  dueSoonText: {
    color: '#D97706',
    fontWeight: 'bold',
  },
  titleCard: {
    marginBottom: 16,
    elevation: 2,
  },
  taskTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  detailsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    minWidth: 80,
    color: '#6B7280',
  },
  detailValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityChip: {
    backgroundColor: 'transparent',
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
  },
  dueDateText: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  overdueDate: {
    color: '#DC2626',
  },
  dueSoonDate: {
    color: '#D97706',
  },
  descriptionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#4B5563',
    lineHeight: 20,
  },
  completedText: {
    opacity: 0.7,
  },
  timestampCard: {
    marginBottom: 16,
    elevation: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  timestampText: {
    color: '#6B7280',
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonContent: {
    height: 48,
    flexDirection: 'row-reverse',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  undoButton: {
    backgroundColor: '#D97706',
  },
  deleteButton: {
    borderColor: '#DC2626',
  },
});
