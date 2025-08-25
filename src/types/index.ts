export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'completed';
  sortBy: 'dueDate' | 'priority' | 'created';
}

export interface RootState {
  auth: AuthState;
  tasks: TaskState;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Create: undefined;
  AIInsights: undefined;
  Profile: undefined;
};

export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
};
