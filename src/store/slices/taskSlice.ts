import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskState, Task } from '../../types';
import { inAppAlertService } from '../../services/inAppAlertService';

// Mock data storage key
const TASKS_STORAGE_KEY = 'tasks';

// Async thunks for task operations
export const loadTasks = createAsyncThunk('tasks/loadTasks', async () => {
  const tasksData = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
  if (tasksData) {
    return JSON.parse(tasksData) as Task[];
  }
  return [];
});

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      status: taskData.status || (taskData.completed ? 'completed' : 'to-do'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Get existing tasks
    const existingTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = existingTasks ? JSON.parse(existingTasks) : [];
    
    // Add new task
    tasks.push(newTask);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    
    return newTask;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
    const existingTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = existingTasks ? JSON.parse(existingTasks) : [];
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const oldTask = tasks[taskIndex];
    
    // Sync status and completed fields
    let syncedUpdates = { ...updates };
    if (updates.status) {
      syncedUpdates.completed = updates.status === 'completed';
    } else if (updates.completed !== undefined) {
      syncedUpdates.status = updates.completed ? 'completed' : 'to-do';
    }
    
    const updatedTask: Task = {
      ...oldTask,
      ...syncedUpdates,
      updatedAt: new Date().toISOString(),
    };
    
    tasks[taskIndex] = updatedTask;
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    
    // Handle task completion celebration
    if (updatedTask.completed && !oldTask.completed) {
      // Show in-app celebration when task is completed
      inAppAlertService.showCompletionCelebration(updatedTask);
    }
    
    return updatedTask;
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string) => {
    const existingTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = existingTasks ? JSON.parse(existingTasks) : [];
    
    const filteredTasks = tasks.filter(task => task.id !== id);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filteredTasks));
    
    return id;
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }: { id: string; status: Task['status'] }) => {
    const existingTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const tasks: Task[] = existingTasks ? JSON.parse(existingTasks) : [];
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const oldTask = tasks[taskIndex];
    const updatedTask: Task = {
      ...oldTask,
      status,
      completed: status === 'completed',
      updatedAt: new Date().toISOString(),
    };
    
    tasks[taskIndex] = updatedTask;
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    
    // Handle task completion celebration
    if (status === 'completed' && oldTask.status !== 'completed') {
      inAppAlertService.showCompletionCelebration(updatedTask);
    }
    
    return updatedTask;
  }
);

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  filter: 'all',
  sortBy: 'dueDate',
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<'all' | 'active' | 'completed'>) => {
      state.filter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'dueDate' | 'priority' | 'created'>) => {
      state.sortBy = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load tasks
    builder.addCase(loadTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
      state.isLoading = false;
      // Ensure all tasks have a status field for backwards compatibility
      state.tasks = action.payload.map(task => ({
        ...task,
        status: task.status || (task.completed ? 'completed' : 'to-do'),
      }));
    });
    builder.addCase(loadTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load tasks';
    });

    // Create task
    builder.addCase(createTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
      state.isLoading = false;
      state.tasks.push(action.payload);
    });
    builder.addCase(createTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to create task';
    });

    // Update task
    builder.addCase(updateTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
      state.isLoading = false;
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    });
    builder.addCase(updateTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to update task';
    });

    // Delete task
    builder.addCase(deleteTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    });
    builder.addCase(deleteTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to delete task';
    });

    // Update task status
    builder.addCase(updateTaskStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
      state.isLoading = false;
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    });
    builder.addCase(updateTaskStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to update task status';
    });
  },
});

export const { setFilter, setSortBy, clearError } = taskSlice.actions;
export default taskSlice.reducer;
