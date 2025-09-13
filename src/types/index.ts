export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Course {
  id: string;
  code: string; // CS101, MATH202, etc.
  name: string;
  professor?: string;
  color: string;
  credits?: number;
  currentGrade?: number;
  targetGrade?: number;
}

export interface AcademicResource {
  id: string;
  type: 'link' | 'file' | 'note' | 'video' | 'document';
  title: string;
  url?: string;
  description?: string;
  attachedAt: string;
}

export interface StudySession {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  type: 'focus' | 'break' | 'review';
  productivity?: 'low' | 'medium' | 'high';
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
  
  // Academic Features
  courseId?: string; // Links to Course
  taskType: 'assignment' | 'exam' | 'project' | 'reading' | 'study' | 'other';
  estimatedTime?: number; // in minutes
  actualTime?: number; // tracked time in minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  grade?: number; // 0-100 or 0-4.0 scale
  weight?: number; // % of final grade
  resources: AcademicResource[];
  studySessions: StudySession[];
  
  // Smart Priority (calculated)
  smartPriority?: number; // 0-100 calculated score
  urgencyScore?: number;
  importanceScore?: number;
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
  sortBy: 'dueDate' | 'priority' | 'created' | 'smartPriority';
}

export interface AcademicState {
  courses: Course[];
  currentSemester: string;
  isLoading: boolean;
  error: string | null;
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
  academic: AcademicState;
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
  Academic: undefined;
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
