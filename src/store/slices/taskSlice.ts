import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TaskState, Task, AcademicResource, StudySession } from '../../types';
import { inAppAlertService } from '../../services/inAppAlertService';
import { supabase } from '../../services/supabase';
import {
  taskRowToTask,
  taskToInsertRow,
  taskToUpdateRow,
  resourceToInsertRow,
} from '../../services/supabaseMappers';
import { TaskRow, ResourceRow } from '../../types/database';

// ============================================================================
// Smart Priority Algorithm
// Urgency  = how soon the deadline is (0-50)
// Importance = priority + task type + grade weight (0-50)
// Difficulty no longer boosts importance — only affects effort estimation,
// not whether something is "urgent" (per panel feedback).
// ============================================================================
const calculateSmartPriority = (
  task: Task
): { smartPriority: number; urgencyScore: number; importanceScore: number } => {
  const now = new Date();
  let urgencyScore = 0;
  let importanceScore = 0;

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

    if (daysDiff < 0)        urgencyScore = 50;
    else if (daysDiff <= 1)  urgencyScore = 45;
    else if (daysDiff <= 3)  urgencyScore = 35;
    else if (daysDiff <= 7)  urgencyScore = 25;
    else if (daysDiff <= 14) urgencyScore = 15;
    else                     urgencyScore = 5;
  }

  importanceScore += { high: 20, medium: 12, low: 6 }[task.priority] || 6;

  if (task.isAcademic) {
    importanceScore += {
      exam: 15, project: 12, assignment: 10, reading: 6, study: 8, other: 5,
    }[task.taskType] || 5;
    if (task.weight && task.weight > 0) {
      importanceScore += Math.min(task.weight / 5, 10);
    }
  }

  urgencyScore = Math.min(Math.max(urgencyScore, 0), 50);
  importanceScore = Math.min(Math.max(importanceScore, 0), 50);

  return {
    smartPriority: Math.min(urgencyScore + importanceScore, 100),
    urgencyScore,
    importanceScore,
  };
};

// ============================================================================
// Helpers
// ============================================================================
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in.');
  return id;
}

// ============================================================================
// Thunks
// ============================================================================

export const loadTasks = createAsyncThunk('tasks/loadTasks', async () => {
  await getUserId(); // ensures session exists; RLS scopes the query

  const { data, error } = await supabase
    .from('tasks')
    .select('*, resources(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as (TaskRow & { resources: ResourceRow[] })[]).map((row) =>
    taskRowToTask(row, row.resources || [])
  );
});

type CreateTaskInput =
  Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'resources' | 'studySessions' | 'smartPriority' | 'urgencyScore' | 'importanceScore'> & {
    resources?: AcademicResource[];
  };

export const createTask = createAsyncThunk('tasks/createTask', async (input: CreateTaskInput) => {
  const userId = await getUserId();

  const seed: Task = {
    ...input,
    id: 'temp',
    isAcademic: input.isAcademic ?? true,
    status: input.status || (input.completed ? 'completed' : 'to-do'),
    taskType: input.taskType || 'other',
    difficulty: input.difficulty || 'medium',
    resources: [],
    studySessions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const priority = calculateSmartPriority(seed);

  const insertRow = taskToInsertRow({ ...seed, ...priority }, userId);

  const { data: taskRow, error: taskErr } = await supabase
    .from('tasks')
    .insert(insertRow as any)
    .select('*')
    .single();
  if (taskErr || !taskRow) throw new Error(taskErr?.message || 'Failed to create task.');

  let resourceRows: ResourceRow[] = [];
  if (input.resources && input.resources.length > 0) {
    const inserts = input.resources.map((r) => resourceToInsertRow(r, (taskRow as TaskRow).id));
    const { data: resData, error: resErr } = await supabase
      .from('resources')
      .insert(inserts as any)
      .select('*');
    if (resErr) throw new Error(resErr.message);
    resourceRows = (resData || []) as ResourceRow[];
  }

  return taskRowToTask(taskRow as TaskRow, resourceRows);
});

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }, { getState }) => {
    await getUserId();

    let synced: Partial<Task> = { ...updates };
    if (updates.status) {
      synced.completed = updates.status === 'completed';
    } else if (updates.completed !== undefined) {
      synced.status = updates.completed ? 'completed' : 'to-do';
    }

    // Recalculate smart priority if relevant fields changed
    const recalcKeys: (keyof Task)[] = ['dueDate', 'priority', 'taskType', 'difficulty', 'weight', 'isAcademic'];
    if (recalcKeys.some((k) => k in updates)) {
      const state = (getState() as any).tasks;
      const oldTask = state.tasks.find((t: Task) => t.id === id);
      if (oldTask) {
        const merged: Task = { ...oldTask, ...synced } as Task;
        const priority = calculateSmartPriority(merged);
        synced = { ...synced, ...priority };
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(taskToUpdateRow(synced) as any)
      .eq('id', id)
      .select('*, resources(*)')
      .single();
    if (error || !data) throw new Error(error?.message || 'Update failed.');

    const row = data as TaskRow & { resources: ResourceRow[] };
    const updated = taskRowToTask(row, row.resources || []);

    if (updated.completed && synced.completed) {
      inAppAlertService.showCompletionCelebration(updated);
    }
    return updated;
  }
);

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id: string) => {
  await getUserId();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return id;
});

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }: { id: string; status: Task['status'] }, thunkApi) => {
    return await (thunkApi.dispatch(
      updateTask({ id, updates: { status, completed: status === 'completed' } })
    ) as any).unwrap();
  }
);

// ---------- Resources ----------
export const addResourceToTask = createAsyncThunk(
  'tasks/addResource',
  async ({ taskId, resource }: { taskId: string; resource: Omit<AcademicResource, 'id' | 'attachedAt'> }) => {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceToInsertRow(resource, taskId) as any)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to add resource.');
    const row = data as ResourceRow;
    const item: AcademicResource = {
      id: row.id,
      type: row.type,
      title: row.title,
      url: row.url ?? undefined,
      description: row.description ?? undefined,
      attachedAt: row.attached_at,
    };
    return { taskId, resource: item };
  }
);

export const removeResourceFromTask = createAsyncThunk(
  'tasks/removeResource',
  async ({ taskId, resourceId }: { taskId: string; resourceId: string }) => {
    const { error } = await supabase.from('resources').delete().eq('id', resourceId);
    if (error) throw new Error(error.message);
    return { taskId, resourceId };
  }
);

// ============================================================================
// Slice
// ============================================================================
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
    addStudySession: (state, action: PayloadAction<{ taskId: string; session: Omit<StudySession, 'id'> }>) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (!task) return;
      const newSession: StudySession = { ...action.payload.session, id: Date.now().toString() };
      task.studySessions = task.studySessions || [];
      task.studySessions.push(newSession);
      task.actualTime = task.studySessions.reduce((sum, s) => sum + s.duration, 0);
      task.updatedAt = new Date().toISOString();
    },
    recalculateAllSmartPriorities: (state) => {
      state.tasks.forEach((task) => {
        if (!task.completed) {
          const p = calculateSmartPriority(task);
          task.smartPriority = p.smartPriority;
          task.urgencyScore = p.urgencyScore;
          task.importanceScore = p.importanceScore;
        }
      });
    },
  },
  extraReducers: (builder) => {
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

    builder.addCase(createTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
      state.isLoading = false;
      state.tasks.unshift(action.payload);
    });
    builder.addCase(createTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to create task';
    });

    builder.addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
      const i = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (i !== -1) state.tasks[i] = action.payload;
    });
    builder.addCase(updateTask.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to update task';
    });

    builder.addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    });

    builder.addCase(addResourceToTask.fulfilled, (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.resources = task.resources || [];
        task.resources.push(action.payload.resource);
      }
    });

    builder.addCase(removeResourceFromTask.fulfilled, (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task && task.resources) {
        task.resources = task.resources.filter((r) => r.id !== action.payload.resourceId);
      }
    });
  },
});

export const {
  setFilter,
  setSortBy,
  clearError,
  addStudySession,
  recalculateAllSmartPriorities,
} = taskSlice.actions;
export default taskSlice.reducer;
