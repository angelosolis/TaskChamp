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
  status: 'to-do' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'class' | 'exam' | 'assignment' | 'event' | 'reminder';
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  color?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
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

export interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  viewMode: 'month' | 'week' | 'day';
}

export interface RootState {
  auth: AuthState;
  tasks: TaskState;
  calendar: CalendarState;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Create: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  TaskList: undefined;
  TaskDetail: { taskId: string };
  AIInsights: undefined;
  KanbanBoard: undefined;
};
