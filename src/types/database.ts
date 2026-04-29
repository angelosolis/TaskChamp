// Supabase row types — match the SQL schema in supabase/schema.sql
// Stored in DB as snake_case; UI/state code uses camelCase via mappers.

export type UserRole = 'student' | 'admin';

export type TaskStatus = 'to-do' | 'in-progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'assignment' | 'exam' | 'project' | 'reading' | 'study' | 'other';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type ResourceType = 'link' | 'file' | 'note' | 'video' | 'document';

export type EventType = 'class' | 'exam' | 'assignment' | 'event' | 'reminder';
export type Recurring = 'none' | 'daily' | 'weekly' | 'monthly';

export type SessionType = 'focus' | 'break' | 'review';
export type Productivity = 'low' | 'medium' | 'high';

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  course: string | null;
  education_level: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramRow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CourseRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  professor: string | null;
  color: string | null;
  credits: number | null;
  current_grade: number | null;
  target_grade: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  category: string | null;
  due_date: string | null;
  is_academic: boolean;
  course_id: string | null;
  task_type: TaskType;
  estimated_time: number | null;
  actual_time: number | null;
  difficulty: Difficulty | null;
  grade: number | null;
  weight: number | null;
  smart_priority: number | null;
  urgency_score: number | null;
  importance_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceRow {
  id: string;
  task_id: string;
  type: ResourceType;
  title: string;
  url: string | null;
  description: string | null;
  attached_at: string;
}

export interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: EventType;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  color: string | null;
  recurring: Recurring | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionRow {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  type: SessionType;
  productivity: Productivity | null;
  created_at: string;
}

// Keep this in sync with SQL when you add/remove tables
export interface Database {
  public: {
    Tables: {
      profiles:        { Row: ProfileRow;       Insert: Partial<ProfileRow>       & { id: string; email: string; name: string }; Update: Partial<ProfileRow> };
      programs:        { Row: ProgramRow;       Insert: Partial<ProgramRow>       & { code: string; name: string };               Update: Partial<ProgramRow> };
      courses:         { Row: CourseRow;        Insert: Partial<CourseRow>        & { user_id: string; code: string; name: string }; Update: Partial<CourseRow> };
      tasks:           { Row: TaskRow;          Insert: Partial<TaskRow>          & { user_id: string; title: string };           Update: Partial<TaskRow> };
      resources:       { Row: ResourceRow;      Insert: Partial<ResourceRow>      & { task_id: string; type: ResourceType; title: string }; Update: Partial<ResourceRow> };
      calendar_events: { Row: CalendarEventRow; Insert: Partial<CalendarEventRow> & { user_id: string; title: string; type: EventType; start_date: string }; Update: Partial<CalendarEventRow> };
      study_sessions:  { Row: StudySessionRow;  Insert: Partial<StudySessionRow>  & { user_id: string; start_time: string };      Update: Partial<StudySessionRow> };
    };
  };
}
