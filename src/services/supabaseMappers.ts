import { Task, AcademicResource, Course, CalendarEvent, StudySession } from '../types';
import {
  TaskRow,
  ResourceRow,
  CourseRow,
  CalendarEventRow,
  StudySessionRow,
} from '../types/database';

// ---------- Tasks ----------
export const taskRowToTask = (row: TaskRow, resources: ResourceRow[] = []): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  completed: row.completed,
  status: row.status,
  priority: row.priority,
  category: row.category ?? undefined,
  dueDate: row.due_date ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,

  isAcademic: row.is_academic,
  courseId: row.course_id ?? undefined,
  taskType: row.task_type,
  estimatedTime: row.estimated_time ?? undefined,
  actualTime: row.actual_time ?? undefined,
  difficulty: row.difficulty ?? undefined,
  grade: row.grade ?? undefined,
  weight: row.weight ?? undefined,
  resources: resources.map(resourceRowToResource),
  studySessions: [],
  smartPriority: row.smart_priority ?? undefined,
  urgencyScore: row.urgency_score ?? undefined,
  importanceScore: row.importance_score ?? undefined,
});

export const taskToInsertRow = (task: Partial<Task>, userId: string): Partial<TaskRow> => ({
  user_id: userId,
  title: task.title!,
  description: task.description ?? null,
  completed: task.completed ?? false,
  status: task.status ?? 'to-do',
  priority: task.priority ?? 'medium',
  category: task.category ?? null,
  due_date: task.dueDate ?? null,
  is_academic: task.isAcademic ?? true,
  course_id: task.courseId ?? null,
  task_type: task.taskType ?? 'other',
  estimated_time: task.estimatedTime ?? null,
  actual_time: task.actualTime ?? null,
  difficulty: task.difficulty ?? null,
  grade: task.grade ?? null,
  weight: task.weight ?? null,
  smart_priority: task.smartPriority ?? null,
  urgency_score: task.urgencyScore ?? null,
  importance_score: task.importanceScore ?? null,
});

export const taskToUpdateRow = (updates: Partial<Task>): Partial<TaskRow> => {
  const out: Partial<TaskRow> = {};
  if (updates.title !== undefined)            out.title = updates.title;
  if (updates.description !== undefined)      out.description = updates.description ?? null;
  if (updates.completed !== undefined)        out.completed = updates.completed;
  if (updates.status !== undefined)           out.status = updates.status;
  if (updates.priority !== undefined)         out.priority = updates.priority;
  if (updates.category !== undefined)         out.category = updates.category ?? null;
  if (updates.dueDate !== undefined)          out.due_date = updates.dueDate ?? null;
  if (updates.isAcademic !== undefined)       out.is_academic = updates.isAcademic;
  if (updates.courseId !== undefined)         out.course_id = updates.courseId ?? null;
  if (updates.taskType !== undefined)         out.task_type = updates.taskType;
  if (updates.estimatedTime !== undefined)    out.estimated_time = updates.estimatedTime ?? null;
  if (updates.actualTime !== undefined)       out.actual_time = updates.actualTime ?? null;
  if (updates.difficulty !== undefined)       out.difficulty = updates.difficulty ?? null;
  if (updates.grade !== undefined)            out.grade = updates.grade ?? null;
  if (updates.weight !== undefined)           out.weight = updates.weight ?? null;
  if (updates.smartPriority !== undefined)    out.smart_priority = updates.smartPriority ?? null;
  if (updates.urgencyScore !== undefined)     out.urgency_score = updates.urgencyScore ?? null;
  if (updates.importanceScore !== undefined)  out.importance_score = updates.importanceScore ?? null;
  return out;
};

// ---------- Resources ----------
export const resourceRowToResource = (row: ResourceRow): AcademicResource => ({
  id: row.id,
  type: row.type,
  title: row.title,
  url: row.url ?? undefined,
  description: row.description ?? undefined,
  attachedAt: row.attached_at,
});

export const resourceToInsertRow = (
  r: Omit<AcademicResource, 'id' | 'attachedAt'>,
  taskId: string
): Partial<ResourceRow> => ({
  task_id: taskId,
  type: r.type,
  title: r.title,
  url: r.url ?? null,
  description: r.description ?? null,
});

// ---------- Courses (subjects) ----------
export const courseRowToCourse = (row: CourseRow): Course => ({
  id: row.id,
  code: row.code,
  name: row.name,
  professor: row.professor ?? undefined,
  color: row.color ?? '#667eea',
  credits: row.credits ?? undefined,
  currentGrade: row.current_grade ?? undefined,
  targetGrade: row.target_grade ?? undefined,
});

export const courseToInsertRow = (
  c: Omit<Course, 'id' | 'color'> & { color?: string },
  userId: string
): Partial<CourseRow> => ({
  user_id: userId,
  code: c.code,
  name: c.name,
  professor: c.professor ?? null,
  color: c.color ?? null,
  credits: c.credits ?? null,
  current_grade: c.currentGrade ?? null,
  target_grade: c.targetGrade ?? null,
});

export const courseToUpdateRow = (updates: Partial<Course>): Partial<CourseRow> => {
  const out: Partial<CourseRow> = {};
  if (updates.code !== undefined)         out.code = updates.code;
  if (updates.name !== undefined)         out.name = updates.name;
  if (updates.professor !== undefined)    out.professor = updates.professor ?? null;
  if (updates.color !== undefined)        out.color = updates.color;
  if (updates.credits !== undefined)      out.credits = updates.credits ?? null;
  if (updates.currentGrade !== undefined) out.current_grade = updates.currentGrade ?? null;
  if (updates.targetGrade !== undefined)  out.target_grade = updates.targetGrade ?? null;
  return out;
};

// ---------- Calendar events ----------
export const eventRowToEvent = (row: CalendarEventRow): CalendarEvent => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  type: row.type,
  startDate: row.start_date,
  endDate: row.end_date ?? undefined,
  startTime: row.start_time ?? undefined,
  endTime: row.end_time ?? undefined,
  location: row.location ?? undefined,
  color: row.color ?? undefined,
  recurring: row.recurring ?? 'none',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const eventToInsertRow = (
  e: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Partial<CalendarEventRow> => ({
  user_id: userId,
  title: e.title,
  description: e.description ?? null,
  type: e.type,
  start_date: e.startDate,
  end_date: e.endDate ?? null,
  start_time: e.startTime ?? null,
  end_time: e.endTime ?? null,
  location: e.location ?? null,
  color: e.color ?? null,
  recurring: e.recurring ?? 'none',
});

export const eventToUpdateRow = (updates: Partial<CalendarEvent>): Partial<CalendarEventRow> => {
  const out: Partial<CalendarEventRow> = {};
  if (updates.title !== undefined)       out.title = updates.title;
  if (updates.description !== undefined) out.description = updates.description ?? null;
  if (updates.type !== undefined)        out.type = updates.type;
  if (updates.startDate !== undefined)   out.start_date = updates.startDate;
  if (updates.endDate !== undefined)     out.end_date = updates.endDate ?? null;
  if (updates.startTime !== undefined)   out.start_time = updates.startTime ?? null;
  if (updates.endTime !== undefined)     out.end_time = updates.endTime ?? null;
  if (updates.location !== undefined)    out.location = updates.location ?? null;
  if (updates.color !== undefined)       out.color = updates.color ?? null;
  if (updates.recurring !== undefined)   out.recurring = updates.recurring ?? null;
  return out;
};

// ---------- Study sessions ----------
export const sessionRowToSession = (row: StudySessionRow): StudySession => ({
  id: row.id,
  taskId: row.task_id ?? '',
  startTime: row.start_time,
  endTime: row.end_time ?? undefined,
  duration: row.duration,
  type: row.type,
  productivity: row.productivity ?? undefined,
});
