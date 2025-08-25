import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Surface, FAB, Searchbar, Button, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';

import { useAppDispatch, useAppSelector } from '../store/store';
import { updateTask, setFilter, setSortBy } from '../store/slices/taskSlice';
import { TaskStackParamList, Task } from '../types';

type Props = StackScreenProps<TaskStackParamList, 'TaskList'>;

export default function TaskListScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  const dispatch = useAppDispatch();
  const { tasks, filter, sortBy } = useAppSelector((state) => state.tasks);

  const handleToggleComplete = async (task: Task) => {
    await dispatch(updateTask({
      id: task.id,
      updates: { completed: !task.completed }
    }));
  };

  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    // Apply filter
    switch (filter) {
      case 'active':
        filteredTasks = tasks.filter(task => !task.completed);
        break;
      case 'completed':
        filteredTasks = tasks.filter(task => task.completed);
        break;
      default:
        filteredTasks = tasks;
    }

    // Apply search
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <Card 
      style={[styles.taskCard, task.completed && styles.completedTask]}
      onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
    >
      <Card.Content style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Button
              mode="text"
              compact
              onPress={() => handleToggleComplete(task)}
              style={styles.checkButton}
            >
              <MaterialIcons
                name={task.completed ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={task.completed ? '#059669' : '#6B7280'}
              />
            </Button>
            <View style={styles.taskDetails}>
              <Text
                variant="bodyLarge"
                style={[styles.taskTitle, task.completed && styles.completedText]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.description && (
                <Text
                  variant="bodyMedium"
                  style={[styles.taskDescription, task.completed && styles.completedText]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              )}
            </View>
          </View>
          
          <Chip
            mode="outlined"
            compact
            textStyle={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
            style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
          >
            {task.priority.toUpperCase()}
          </Chip>
        </View>

        {(task.dueDate || task.category) && (
          <View style={styles.taskMeta}>
            {task.dueDate && (
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color="#6B7280" />
                <Text variant="bodySmall" style={styles.metaText}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {task.category && (
              <View style={styles.metaItem}>
                <MaterialIcons name="label" size={16} color="#6B7280" />
                <Text variant="bodySmall" style={styles.metaText}>
                  {task.category}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          My Tasks
        </Text>
        <View style={styles.headerActions}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="text"
                compact
                onPress={() => setSortMenuVisible(true)}
              >
                <MaterialIcons name="sort" size={20} />
                Sort
              </Button>
            }
          >
            <Menu.Item
              title="By Date Created"
              onPress={() => {
                dispatch(setSortBy('created'));
                setSortMenuVisible(false);
              }}
            />
            <Menu.Item
              title="By Due Date"
              onPress={() => {
                dispatch(setSortBy('dueDate'));
                setSortMenuVisible(false);
              }}
            />
            <Menu.Item
              title="By Priority"
              onPress={() => {
                dispatch(setSortBy('priority'));
                setSortMenuVisible(false);
              }}
            />
          </Menu>
        </View>
      </Surface>

      {/* Search */}
      <Searchbar
        placeholder="Search tasks..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        <Chip
          selected={filter === 'all'}
          onPress={() => dispatch(setFilter('all'))}
          style={styles.filterChip}
        >
          All ({tasks.length})
        </Chip>
        <Chip
          selected={filter === 'active'}
          onPress={() => dispatch(setFilter('active'))}
          style={styles.filterChip}
        >
          Active ({tasks.filter(t => !t.completed).length})
        </Chip>
        <Chip
          selected={filter === 'completed'}
          onPress={() => dispatch(setFilter('completed'))}
          style={styles.filterChip}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </Chip>
      </View>

      {/* Task List */}
      <FlatList
        data={getFilteredTasks()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskItem task={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={64} color="#E5E7EB" />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No tasks found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {searchQuery 
                ? `No tasks match "${searchQuery}"`
                : filter === 'active'
                  ? 'All your tasks are completed!'
                  : filter === 'completed'
                    ? 'No completed tasks yet'
                    : 'Create your first task to get started'
              }
            </Text>
          </View>
        )}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Create' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  title: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchbar: {
    margin: 16,
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  checkButton: {
    minWidth: 'auto',
    marginRight: 8,
    marginLeft: -8,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 4,
  },
  taskDescription: {
    color: '#6B7280',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityChip: {
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E3A59',
  },
});
