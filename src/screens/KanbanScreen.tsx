import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { Text, Card, Chip, Button, IconButton } from 'react-native-paper';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';

import ModernHeader from '../components/ModernHeader';
import { useAppDispatch, useAppSelector } from '../store/store';
import { updateTaskStatus, deleteTask } from '../store/slices/taskSlice';
import { MainStackParamList, Task } from '../types';
import { useNotification } from '../components/NotificationProvider';

type Props = StackScreenProps<MainStackParamList, 'KanbanBoard'>;

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 3; // Account for padding and gaps

interface KanbanColumn {
  id: Task['status'];
  title: string;
  color: string;
  icon: string;
  tasks: Task[];
}

export default function KanbanScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { showSuccess, showWarning } = useNotification();

  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  useEffect(() => {
    // Organize tasks into columns
    const todoTasks = tasks.filter(task => task.status === 'to-do');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');

    setColumns([
      {
        id: 'to-do',
        title: 'To Do',
        color: '#EF4444',
        icon: 'clipboard-text-outline',
        tasks: todoTasks,
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        color: '#F59E0B',
        icon: 'clock-outline',
        tasks: inProgressTasks,
      },
      {
        id: 'completed',
        title: 'Done',
        color: '#10B981',
        icon: 'check-circle-outline',
        tasks: completedTasks,
      },
    ]);
  }, [tasks]);

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    dispatch(updateTaskStatus({ id: taskId, status: newStatus }));
    showSuccess('Task Moved!', `Task moved to ${newStatus.replace('-', ' ')}`);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    showWarning(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTask(taskId));
            showSuccess('Task Deleted', 'Task has been removed successfully');
          },
        },
      ]
    );
  };

  const TaskCard = ({ task, onMove }: { task: Task; onMove: (status: Task['status']) => void }) => {
    const getPriorityColor = (priority: Task['priority']) => {
      switch (priority) {
        case 'high': return '#EF4444';
        case 'medium': return '#F59E0B';
        case 'low': return '#10B981';
        default: return '#6B7280';
      }
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
      <Card style={[styles.taskCard, isOverdue && styles.overdueCard]}>
        <Card.Content style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text variant="bodyMedium" style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            <IconButton
              icon="delete"
              size={16}
              iconColor="#EF4444"
              onPress={() => handleDeleteTask(task.id, task.title)}
              style={styles.deleteButton}
            />
          </View>
          
          {task.description && (
            <Text variant="bodySmall" style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <Chip
              mode="outlined"
              compact
              style={styles.priorityChip}
              textStyle={{ color: getPriorityColor(task.priority), fontSize: 10 }}
            >
              {task.priority.toUpperCase()}
            </Chip>
            
            {task.dueDate && (
              <Text variant="bodySmall" style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
                {isOverdue ? '⚠️ ' : '📅 '}
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Quick move buttons */}
          <View style={styles.moveButtons}>
            {task.status !== 'to-do' && (
              <Button
                mode="outlined"
                compact
                onPress={() => onMove('to-do')}
                style={styles.moveButton}
                labelStyle={styles.moveButtonLabel}
              >
                📋 To Do
              </Button>
            )}
            {task.status !== 'in-progress' && (
              <Button
                mode="outlined"
                compact
                onPress={() => onMove('in-progress')}
                style={styles.moveButton}
                labelStyle={styles.moveButtonLabel}
              >
                ⏳ Progress
              </Button>
            )}
            {task.status !== 'completed' && (
              <Button
                mode="outlined"
                compact
                onPress={() => onMove('completed')}
                style={styles.moveButton}
                labelStyle={styles.moveButtonLabel}
              >
                ✅ Done
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTaskItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <View style={[styles.taskWrapper, isActive && styles.activeTask]}>
        <TaskCard
          task={item}
          onMove={(status) => handleTaskMove(item.id, status)}
        />
      </View>
    </ScaleDecorator>
  );

  const KanbanColumn = ({ column }: { column: KanbanColumn }) => (
    <View style={styles.column}>
      <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
        <MaterialCommunityIcons name={column.icon as any} size={20} color="#FFFFFF" />
        <Text variant="titleSmall" style={styles.columnTitle}>
          {column.title}
        </Text>
        <View style={styles.taskCount}>
          <Text variant="bodySmall" style={styles.taskCountText}>
            {column.tasks.length}
          </Text>
        </View>
      </View>

      <View style={styles.columnContent}>
        {column.tasks.length === 0 ? (
          <View style={styles.emptyColumn}>
            <MaterialCommunityIcons 
              name={column.icon as any} 
              size={48} 
              color="#E5E7EB" 
            />
            <Text variant="bodySmall" style={styles.emptyText}>
              No tasks
            </Text>
            {column.id === 'to-do' && (
              <Button
                mode="outlined"
                compact
                onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
                style={styles.addTaskButton}
              >
                + Add Task
              </Button>
            )}
          </View>
        ) : (
          <DraggableFlatList
            data={column.tasks}
            onDragEnd={({ data }) => {
              // Update the local state immediately for better UX
              setColumns(prev => prev.map(col => 
                col.id === column.id ? { ...col, tasks: data } : col
              ));
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );

  const getKanbanStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getKanbanStats();

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Kanban Board"
        subtitle="Visualize your task progress"
        gradient={['#8B5CF6', '#3B82F6']}
        rightElement={
          <Button
            mode="text"
            compact
            onPress={() => navigation.goBack()}
            textColor="#FFFFFF"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            Back
          </Button>
        }
      />

      {/* Stats Bar */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text variant="bodyLarge" style={styles.statNumber}>{stats.total}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodyLarge" style={[styles.statNumber, { color: '#F59E0B' }]}>
              {stats.inProgress}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodyLarge" style={[styles.statNumber, { color: '#10B981' }]}>
              {stats.completed}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Completed</Text>
          </View>
          {stats.overdue > 0 && (
            <View style={styles.statItem}>
              <Text variant="bodyLarge" style={[styles.statNumber, { color: '#EF4444' }]}>
                {stats.overdue}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Overdue</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Kanban Board */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContainer}
      >
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
          style={styles.actionButton}
          buttonColor="#667eea"
        >
          <MaterialCommunityIcons name="plus" size={20} />
          Add Task
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
          style={styles.actionButton}
        >
          <MaterialCommunityIcons name="view-dashboard" size={20} />
          Dashboard
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    borderRadius: 12,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#2E3A59',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statLabel: {
    color: '#6B7280',
    marginTop: 2,
  },
  boardContainer: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  column: {
    width: COLUMN_WIDTH,
    marginRight: 12,
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  columnTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
  },
  taskCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  taskCountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  columnContent: {
    flex: 1,
    minHeight: 400,
  },
  emptyColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 16,
  },
  addTaskButton: {
    borderColor: '#667eea',
  },
  taskList: {
    paddingBottom: 16,
  },
  taskWrapper: {
    marginBottom: 8,
  },
  activeTask: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  taskCard: {
    elevation: 2,
    borderRadius: 8,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  taskContent: {
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    color: '#2E3A59',
    fontWeight: '500',
    paddingRight: 8,
  },
  deleteButton: {
    margin: 0,
    width: 24,
    height: 24,
  },
  taskDescription: {
    color: '#6B7280',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priorityChip: {
    height: 24,
  },
  dueDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  overdueDueDate: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  moveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  moveButton: {
    borderRadius: 6,
    borderColor: '#E5E7EB',
  },
  moveButtonLabel: {
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
});