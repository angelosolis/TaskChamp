import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Course } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
// gemini-3.1-flash-lite-preview has the highest free-tier quota among the
// flash family: 500 RPD / 15 RPM (vs 20 RPD on 2.5 flash variants).
// Plenty of headroom for the demo.
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — free tier is 20 req/day per model

// Translate raw Google AI errors into user-friendly messages.
function friendlyError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate.?limit/i.test(raw)) {
    return new Error(
      "Task AI is taking a short break. Please try again in a few minutes."
    );
  }
  if (/503|overloaded|unavailable/i.test(raw)) {
    return new Error("Task AI is busy. Please try again in a moment.");
  }
  if (/network|fetch|timeout/i.test(raw)) {
    return new Error("Couldn't reach Task AI. Check your internet connection.");
  }
  return new Error("Task AI couldn't process this request. Please try again.");
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`taskai_cache:${key}`);
    if (!raw) return null;
    const { ts, value } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return value as T;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `taskai_cache:${key}`,
      JSON.stringify({ ts: Date.now(), value })
    );
  } catch {
    /* ignore cache write errors */
  }
}

async function generateJSON<T>(prompt: string, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    const cached = await readCache<T>(cacheKey);
    if (cached) return cached;
  }
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText) as T;
    if (cacheKey) await writeCache(cacheKey, parsed);
    return parsed;
  } catch (err) {
    throw friendlyError(err);
  }
}

export interface AIInsight {
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

export interface GradeForecast {
  courseId: string;
  courseName: string;
  currentGrade: number;
  forecastedGrade: number;
  confidence: 'low' | 'medium' | 'high';
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TaskRecommendation {
  taskId: string;
  taskTitle: string;
  reason: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  suggestedAction: string;
}

// Build a compact task summary for the prompt
const buildTaskSummary = (tasks: Task[]) => {
  const pending = tasks.filter(t => !t.completed);
  const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const high = pending.filter(t => t.priority === 'high');
  const completed = tasks.filter(t => t.completed);
  const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

  const taskList = pending.slice(0, 10).map(t => ({
    title: t.title,
    priority: t.priority,
    type: t.taskType,
    dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'none',
    difficulty: t.difficulty,
    course: t.courseId,
  }));

  return {
    total: tasks.length,
    pending: pending.length,
    completed: completed.length,
    overdue: overdue.length,
    highPriority: high.length,
    completionRate,
    recentTasks: taskList,
  };
};

export const getAIInsights = async (tasks: Task[]): Promise<AIInsight[]> => {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const summary = buildTaskSummary(tasks);

  const prompt = `You are an academic productivity assistant for Filipino college students using TaskChamp.

Task summary:
- Total: ${summary.total}, Pending: ${summary.pending}, Completed: ${summary.completed}
- Overdue: ${summary.overdue}, High priority: ${summary.highPriority}
- Completion rate: ${summary.completionRate}%
- Recent pending tasks: ${JSON.stringify(summary.recentTasks)}

Generate 4 smart productivity insights tailored for a Filipino student. Consider Filipino academic culture (semester-based, midterms/finals pressure, group work).

Return ONLY a valid JSON array with exactly 4 objects, no markdown, no extra text:
[
  {
    "title": "string (max 5 words)",
    "description": "string (1-2 sentences, specific and actionable)",
    "icon": "one of: check-circle, warning, trending-up, star, schedule, school, lightbulb, priority-high",
    "color": "one of: #059669, #DC2626, #D97706, #4A90E2, #8B5CF6",
    "type": "one of: success, warning, danger, info"
  }
]`;

  const cacheKey = `insights:${summary.pending}:${summary.overdue}:${summary.completionRate}`;
  return generateJSON<AIInsight[]>(prompt, cacheKey);
};

export const getTaskRecommendations = async (tasks: Task[]): Promise<TaskRecommendation[]> => {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const pending = tasks.filter(t => !t.completed).slice(0, 15);
  if (pending.length === 0) return [];

  const taskData = pending.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    type: t.taskType,
    dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'no deadline',
    difficulty: t.difficulty || 'medium',
    smartPriority: t.smartPriority || 0,
  }));

  const prompt = `You are a study coach for Filipino college students. Analyze these pending tasks and recommend the top 3 that need immediate attention.

Tasks: ${JSON.stringify(taskData)}
Today's date: ${new Date().toLocaleDateString()}

IMPORTANT RULES for the "priority" field:
- "urgent" is ONLY for tasks that are overdue OR due within 24 hours.
- Difficulty (hard/medium/easy) MUST NOT influence the priority label. A hard task with a deadline 2 weeks away is NOT urgent.
- Use "high" for high-stakes work (exam, project) due within 3-7 days.
- Use "medium" / "low" for the rest.

Return ONLY a valid JSON array with exactly 3 objects (or fewer if there are fewer tasks), no markdown:
[
  {
    "taskId": "the task id",
    "taskTitle": "the task title",
    "reason": "why this needs attention now (1 sentence)",
    "priority": "one of: urgent, high, medium, low",
    "suggestedAction": "specific action to take (1 sentence)"
  }
]`;

  const cacheKey = `reco:${pending.length}:${pending.map((t) => t.id).join(',')}`;
  return generateJSON<TaskRecommendation[]>(prompt, cacheKey);
};

export const getGradeForecasts = async (courses: Course[], tasks: Task[]): Promise<GradeForecast[]> => {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  if (courses.length === 0) return [];

  const courseData = courses.map(c => {
    const courseTasks = tasks.filter(t => t.courseId === c.id);
    const completedTasks = courseTasks.filter(t => t.completed);
    const gradedTasks = completedTasks.filter(t => t.grade !== undefined);
    const avgGrade = gradedTasks.length > 0
      ? gradedTasks.reduce((sum, t) => sum + (t.grade || 0), 0) / gradedTasks.length
      : null;
    const pendingCount = courseTasks.filter(t => !t.completed).length;
    const overdueCount = courseTasks.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    return {
      id: c.id,
      name: c.name,
      code: c.code,
      currentGrade: c.currentGrade || avgGrade,
      targetGrade: c.targetGrade || 85,
      credits: c.credits || 3,
      totalTasks: courseTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingCount,
      overdueTasks: overdueCount,
      averageTaskGrade: avgGrade,
    };
  });

  const prompt = `You are an academic grade forecasting system for Filipino college students (using percentage-based grading: 75 passing, 80 good, 85+ excellent, 90+ outstanding).

Course data: ${JSON.stringify(courseData)}

For each course, forecast the final grade based on current performance, task completion rate, and overdue tasks. Consider Filipino grading system context.

Return ONLY a valid JSON array, no markdown:
[
  {
    "courseId": "the course id",
    "courseName": "the course name",
    "currentGrade": number (use current grade or estimate from task data, 0-100),
    "forecastedGrade": number (0-100, realistic forecast),
    "confidence": "one of: low, medium, high",
    "recommendation": "specific actionable advice for this course (1-2 sentences)",
    "riskLevel": "one of: low, medium, high"
  }
]`;

  const cacheKey = `forecast:${courses.length}:${courseData.map((c) => `${c.id}:${c.completedTasks}/${c.totalTasks}`).join('|')}`;
  return generateJSON<GradeForecast[]>(prompt, cacheKey);
};

// ---------------------------------------------------------------------------
// Combined bundle: insights + recommendations + tip in ONE API call.
// Avoids burning 3 separate RPM slots on every screen load.
// ---------------------------------------------------------------------------
export interface AIBundle {
  insights: AIInsight[];
  recommendations: TaskRecommendation[];
  tip: string;
}

export const getAIBundle = async (tasks: Task[]): Promise<AIBundle> => {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const summary = buildTaskSummary(tasks);
  const pending = tasks.filter((t) => !t.completed).slice(0, 15);
  const taskData = pending.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    type: t.taskType,
    dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'no deadline',
    smartPriority: t.smartPriority || 0,
  }));

  const prompt = `You are an academic productivity assistant for Filipino college students using TaskChamp.

Today's date: ${new Date().toLocaleDateString()}

Task summary:
- Total: ${summary.total}, Pending: ${summary.pending}, Completed: ${summary.completed}
- Overdue: ${summary.overdue}, High priority: ${summary.highPriority}
- Completion rate: ${summary.completionRate}%

Pending tasks: ${JSON.stringify(taskData)}

Generate a single JSON object with three fields: "insights", "recommendations", "tip".

RULES for "recommendations[].priority":
- "urgent" only when overdue OR due within 24 hours
- Difficulty MUST NOT influence priority — a hard task due in 2 weeks is NOT urgent
- "high" for high-stakes (exam/project) due within 3-7 days
- "medium"/"low" otherwise

Return ONLY this JSON object, no markdown, no extra text:
{
  "insights": [
    { "title":"max 5 words", "description":"1-2 actionable sentences", "icon":"one of: check-circle, warning, trending-up, star, schedule, school, lightbulb, priority-high", "color":"one of: #059669, #DC2626, #D97706, #4A90E2, #8B5CF6", "type":"one of: success, warning, danger, info" }
  ],
  "recommendations": [
    { "taskId":"id from pending list", "taskTitle":"title", "reason":"1 sentence", "priority":"urgent|high|medium|low", "suggestedAction":"1 sentence" }
  ],
  "tip": "1-2 sentence motivating study tip in plain text"
}

"insights" should have exactly 4 items, "recommendations" should have up to 3 items (or fewer if fewer pending tasks).`;

  const cacheKey = `bundle:${summary.pending}:${summary.overdue}:${summary.completionRate}:${pending.map((t) => t.id).join(',')}`;
  return generateJSON<AIBundle>(prompt, cacheKey);
};

export const getStudyTip = async (tasks: Task[]): Promise<string> => {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const upcoming = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const days = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  }).length;

  const prompt = `Give one short, motivating study tip (max 2 sentences) for a Filipino college student who has ${overdue} overdue tasks and ${upcoming} tasks due in the next 3 days. Be encouraging and practical. No JSON, just plain text.`;

  const cacheKey = `tip:${overdue}:${upcoming}`;
  const cached = await readCache<string>(cacheKey);
  if (cached) return cached;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    await writeCache(cacheKey, text);
    return text;
  } catch (err) {
    throw friendlyError(err);
  }
};
