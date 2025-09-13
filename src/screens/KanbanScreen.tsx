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
const COLUMN_WIDTH = Math.max((width - 60) / 3, 280); // Minimum 280px width, responsive

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

    const getPriorityIcon = (priority: Task['priority']) => {
      switch (priority) {
        case 'high': return '🔥';
        case 'medium': return '⚡';
        case 'low': return '📝';
        default: return '📝';
      }
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
      <Card style={[styles.taskCard, isOverdue && styles.overdueCard]}>
        <Card.Content style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleContainer}>
              <Text variant="titleSmall" style={styles.taskTitle} numberOfLines={3}>
                {task.title}
              </Text>
            </View>
            <IconButton
              icon="delete"
              size={18}
              iconColor="#EF4444"
              onPress={() => handleDeleteTask(task.id, task.title)}
              style={styles.deleteButton}
            />
          </View>
          
          {task.description && (
            <Text variant="bodyMedium" style={styles.taskDescription} numberOfLines={3}>
              {task.description}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityIcon}>{getPriorityIcon(task.priority)}</Text>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
            
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
                  {isOverdue ? '⚠️' : '📅'}
                </Text>
                <Text style={[styles.dueDateText, isOverdue && styles.overdueDueDate]}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Quick move buttons */}
          <View style={styles.moveButtons}>
            {task.status !== 'to-do' && (
              <Button
                mode="outlined"
                compact
                onPress={() => onMove('to-do')}
                style={[styles.moveButton, styles.todoButton]}
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
                style={[styles.moveButton, styles.progressButton]}
                labelStyle={styles.moveButtonLabel}
              >
                ⏳ Working
              </Button>
            )}
            {task.status !== 'completed' && (
              <Button
                mode="outlined"
                compact
                onPress={() => onMove('completed')}
                style={[styles.moveButton, styles.doneButton]}
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
              size={56} 
              color="#D1D5DB" 
            />
            <Text variant="bodyMedium" style={styles.emptyText}>
              {column.id === 'to-do' ? 'No pending tasks' :
               column.id === 'in-progress' ? 'Nothing in progress' :
               'No completed tasks'}
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {column.id === 'to-do' ? 'Create your first task to get started' :
               column.id === 'in-progress' ? 'Move tasks here when you start working' :
               'Completed tasks will appear here'}
            </Text>
            {column.id === 'to-do' && (
              <Button
                mode="contained"
                compact
                onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
                style={styles.addTaskButton}
                buttonColor="#667eea"
              >
                <MaterialCommunityIcons name="plus" size={16} />
                Add First Task
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
    elevation: 3,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    color: '#2E3A59',
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  boardContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  column: {
    width: COLUMN_WIDTH,
    marginRight: 16,
    flex: 1,
    minHeight: 500,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  columnTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  taskCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  taskCountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  columnContent: {
    flex: 1,
    minHeight: 400,
  },
  emptyColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#9CA3AF',
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  addTaskButton: {
    borderColor: '#667eea',
    borderRadius: 8,
  },
  taskList: {
    paddingBottom: 20,
  },
  taskWrapper: {
    marginBottom: 12,
  },
  activeTask: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
    elevation: 8,
  },
  taskCard: {
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  overdueCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitle: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  deleteButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  taskDescription: {
    color: '#6B7280',
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueDate: {
    fontSize: 12,
    marginRight: 4,
  },
  dueDateText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  overdueDueDate: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  moveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  moveButton: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
  },
  todoButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  progressButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  doneButton: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  moveButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
});