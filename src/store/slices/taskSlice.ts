import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskState, Task } from '../../types';

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
    
    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    tasks[taskIndex] = updatedTask;
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    
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
      state.tasks = action.payload;
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
  },
});

export const { setFilter, setSortBy, clearError } = taskSlice.actions;
export default taskSlice.reducer;
