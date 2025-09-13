import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskState, Task, AcademicResource, StudySession } from '../../types';
import { inAppAlertService } from '../../services/inAppAlertService';

// Mock data storage key
const TASKS_STORAGE_KEY = 'tasks';

// Smart Priority Algorithm
const calculateSmartPriority = (task: Task): { smartPriority: number; urgencyScore: number; importanceScore: number } => {
  const now = new Date();
  let urgencyScore = 0;
  let importanceScore = 0;

  // Urgency calculation (0-50 points)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) {
      // Overdue - maximum urgency
      urgencyScore = 50;
    } else if (daysDiff <= 1) {
      // Due within 1 day
      urgencyScore = 45;
    } else if (daysDiff <= 3) {
      // Due within 3 days
      urgencyScore = 35;
    } else if (daysDiff <= 7) {
      // Due within 1 week
      urgencyScore = 25;
    } else if (daysDiff <= 14) {
      // Due within 2 weeks
      urgencyScore = 15;
    } else {
      // More than 2 weeks
      urgencyScore = 5;
    }
  }

  // Importance calculation (0-50 points)
  // Base priority
  const priorityPoints = {
    'high': 20,
    'medium': 12,
    'low': 6
  }[task.priority] || 6;
  importanceScore += priorityPoints;

  // Task type weight
  const taskTypePoints = {
    'exam': 15,
    'project': 12,
    'assignment': 10,
    'reading': 6,
    'study': 8,
    'other': 5
  }[task.taskType] || 5;
  importanceScore += taskTypePoints;

  // Grade weight (if specified)
  if (task.weight && task.weight > 0) {
    importanceScore += Math.min(task.weight / 5, 10); // Max 10 points for weight
  }

  // Difficulty adjustment
  const difficultyMultiplier = {
    'hard': 1.2,
    'medium': 1.0,
    'easy': 0.8
  }[task.difficulty || 'medium'];
  importanceScore *= difficultyMultiplier;

  // Ensure scores are within bounds
  urgencyScore = Math.min(Math.max(urgencyScore, 0), 50);
  importanceScore = Math.min(Math.max(importanceScore, 0), 50);

  const smartPriority = urgencyScore + importanceScore;

  return {
    smartPriority: Math.min(Math.max(smartPriority, 0), 100),
    urgencyScore,
    importanceScore
  };
};

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
  async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'resources' | 'studySessions' | 'smartPriority' | 'urgencyScore' | 'importanceScore'> & {
    resources?: AcademicResource[];
    studySessions?: StudySession[];
  }) => {
    const baseTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      status: taskData.status || (taskData.completed ? 'completed' : 'to-do'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Academic field defaults
      taskType: taskData.taskType || 'other',
      resources: taskData.resources || [],
      studySessions: taskData.studySessions || [],
      estimatedTime: taskData.estimatedTime,
      difficulty: taskData.difficulty || 'medium',
    };
    
    // Calculate smart priority
    const priorityData = calculateSmartPriority(baseTask);
    const newTask: Task = {
      ...baseTask,
      ...priorityData,
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
    
    let updatedTask: Task = {
      ...oldTask,
      ...syncedUpdates,
      updatedAt: new Date().toISOString(),
    };
    
    // Recalculate smart priority if relevant fields changed
    if (updates.dueDate !== undefined || updates.priority !== undefined || 
        updates.taskType !== undefined || updates.difficulty !== undefined || 
        updates.weight !== undefined) {
      const priorityData = calculateSmartPriority(updatedTask);
      updatedTask = { ...updatedTask, ...priorityData };
    }
    
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
    setSortBy: (state, action: PayloadAction<'dueDate' | 'priority' | 'created' | 'smartPriority'>) => {
      state.sortBy = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Academic Resource Management
    addResourceToTask: (state, action: PayloadAction<{ taskId: string; resource: Omit<AcademicResource, 'id' | 'attachedAt'> }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        const newResource: AcademicResource = {
          ...action.payload.resource,
          id: Date.now().toString(),
          attachedAt: new Date().toISOString(),
        };
        task.resources = task.resources || [];
        task.resources.push(newResource);
        task.updatedAt = new Date().toISOString();
      }
    },
    removeResourceFromTask: (state, action: PayloadAction<{ taskId: string; resourceId: string }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task && task.resources) {
        task.resources = task.resources.filter(r => r.id !== action.payload.resourceId);
        task.updatedAt = new Date().toISOString();
      }
    },
    // Study Session Management
    addStudySession: (state, action: PayloadAction<{ taskId: string; session: Omit<StudySession, 'id'> }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        const newSession: StudySession = {
          ...action.payload.session,
          id: Date.now().toString(),
        };
        task.studySessions = task.studySessions || [];
        task.studySessions.push(newSession);
        
        // Update actual time spent
        const totalTime = task.studySessions.reduce((sum, session) => sum + session.duration, 0);
        task.actualTime = totalTime;
        task.updatedAt = new Date().toISOString();
      }
    },
    // Recalculate all smart priorities (useful for bulk updates)
    recalculateAllSmartPriorities: (state) => {
      state.tasks.forEach(task => {
        if (!task.completed) {
          const priorityData = calculateSmartPriority(task);
          task.smartPriority = priorityData.smartPriority;
          task.urgencyScore = priorityData.urgencyScore;
          task.importanceScore = priorityData.importanceScore;
        }
      });
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
      // Ensure all tasks have required fields for backwards compatibility
      state.tasks = action.payload.map(task => {
        const compatibleTask: Task = {
          ...task,
          status: task.status || (task.completed ? 'completed' : 'to-do'),
          
          // Academic field defaults for existing tasks
          taskType: task.taskType || 'other',
          resources: task.resources || [],
          studySessions: task.studySessions || [],
          difficulty: task.difficulty || 'medium',
        };
        
        // Calculate smart priority for existing tasks if not present
        if (!compatibleTask.smartPriority) {
          const priorityData = calculateSmartPriority(compatibleTask);
          compatibleTask.smartPriority = priorityData.smartPriority;
          compatibleTask.urgencyScore = priorityData.urgencyScore;
          compatibleTask.importanceScore = priorityData.importanceScore;
        }
        
        return compatibleTask;
      });
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

export const { 
  setFilter, 
  setSortBy, 
  clearError,
  addResourceToTask,
  removeResourceFromTask,
  addStudySession,
  recalculateAllSmartPriorities
} = taskSlice.actions;
export default taskSlice.reducer;
