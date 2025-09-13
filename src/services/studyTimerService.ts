import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudySession } from '../types';
import { notificationService } from './notificationService';

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  timeLeft: number; // in seconds
  initialTime: number;
  currentTaskId?: string;
  sessionType: 'focus' | 'break';
  completedSessions: number;
  currentSession?: StudySession;
}

// Timer presets (in minutes)
export const TIMER_PRESETS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  custom: 0,
};

class StudyTimerService {
  private static instance: StudyTimerService;
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: TimerState) => void> = new Set();
  private state: TimerState = {
    isActive: false,
    isPaused: false,
    timeLeft: TIMER_PRESETS.focus * 60,
    initialTime: TIMER_PRESETS.focus * 60,
    sessionType: 'focus',
    completedSessions: 0,
  };

  static getInstance(): StudyTimerService {
    if (!StudyTimerService.instance) {
      StudyTimerService.instance = new StudyTimerService();
    }
    return StudyTimerService.instance;
  }

  // Subscribe to timer state changes
  subscribe(listener: (state: TimerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Start timer
  startTimer(taskId?: string): void {
    if (this.state.isActive && !this.state.isPaused) return;

    this.state.isActive = true;
    this.state.isPaused = false;
    this.state.currentTaskId = taskId;

    // Create new session if starting fresh
    if (!this.state.currentSession || this.state.timeLeft === this.state.initialTime) {
      this.state.currentSession = {
        id: Date.now().toString(),
        taskId: taskId || 'general',
        startTime: new Date().toISOString(),
        duration: 0,
        type: this.state.sessionType,
      };
    }

    this.timer = setInterval(() => {
      if (this.state.timeLeft > 0) {
        this.state.timeLeft -= 1;
        this.updateSessionDuration();
        this.notifyListeners();
      } else {
        this.completeSession();
      }
    }, 1000);

    this.notifyListeners();
  }

  // Pause timer
  pauseTimer(): void {
    if (!this.state.isActive || this.state.isPaused) return;

    this.state.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notifyListeners();
  }

  // Stop timer
  stopTimer(): void {
    this.state.isActive = false;
    this.state.isPaused = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Save incomplete session
    if (this.state.currentSession && this.state.currentSession.duration > 60) {
      this.saveSession(this.state.currentSession);
    }

    this.resetTimer();
    this.notifyListeners();
  }

  // Reset timer to initial state
  resetTimer(): void {
    this.state.timeLeft = this.state.initialTime;
    this.state.currentSession = undefined;
    this.notifyListeners();
  }

  // Set timer duration
  setTimerDuration(minutes: number): void {
    if (this.state.isActive) return;

    this.state.initialTime = minutes * 60;
    this.state.timeLeft = minutes * 60;
    this.notifyListeners();
  }

  // Switch session type
  switchSessionType(type: 'focus' | 'break'): void {
    if (this.state.isActive) return;

    this.state.sessionType = type;
    const duration = type === 'focus' ? TIMER_PRESETS.focus :
                    (this.state.completedSessions > 0 && this.state.completedSessions % 4 === 0) 
                      ? TIMER_PRESETS.longBreak 
                      : TIMER_PRESETS.shortBreak;
    
    this.setTimerDuration(duration);
  }

  // Get current state
  getState(): TimerState {
    return { ...this.state };
  }

  // Update session duration
  private updateSessionDuration(): void {
    if (this.state.currentSession) {
      const elapsed = this.state.initialTime - this.state.timeLeft;
      this.state.currentSession.duration = Math.floor(elapsed / 60);
    }
  }

  // Complete current session
  private async completeSession(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.state.isActive = false;

    if (this.state.currentSession) {
      this.state.currentSession.endTime = new Date().toISOString();
      this.state.currentSession.duration = Math.floor(this.state.initialTime / 60);
      
      await this.saveSession(this.state.currentSession);

      // Send completion notification
      if (this.state.sessionType === 'focus') {
        this.state.completedSessions += 1;
        await notificationService.sendImmediateNotification(
          '🎉 Focus Session Complete!',
          `Great work! You completed a ${TIMER_PRESETS.focus}-minute focus session.`,
          { type: 'study_complete' }
        );

        // Switch to break
        this.switchSessionType('break');
      } else {
        await notificationService.sendImmediateNotification(
          '⏰ Break Time Over!',
          'Ready to get back to work? Start your next focus session.',
          { type: 'break_complete' }
        );

        // Switch to focus
        this.switchSessionType('focus');
      }
    }

    this.notifyListeners();
  }

  // Save study session
  private async saveSession(session: StudySession): Promise<void> {
    try {
      const existingSessions = await AsyncStorage.getItem('study_sessions');
      const sessions: StudySession[] = existingSessions ? JSON.parse(existingSessions) : [];
      sessions.push(session);
      await AsyncStorage.setItem('study_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save study session:', error);
    }
  }

  // Get study statistics
  async getStudyStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    focusSessionsToday: number;
    productivityStreak: number;
  }> {
    try {
      const existingSessions = await AsyncStorage.getItem('study_sessions');
      const sessions: StudySession[] = existingSessions ? JSON.parse(existingSessions) : [];

      const now = new Date();
      const daysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const today = now.toDateString();

      const recentSessions = sessions.filter(s => new Date(s.startTime) >= daysAgo);
      const todaySessions = sessions.filter(s => 
        new Date(s.startTime).toDateString() === today && s.type === 'focus'
      );

      const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
      const focusSessions = recentSessions.filter(s => s.type === 'focus');

      return {
        totalSessions: focusSessions.length,
        totalMinutes,
        averageSessionLength: focusSessions.length > 0 ? totalMinutes / focusSessions.length : 0,
        focusSessionsToday: todaySessions.length,
        productivityStreak: this.calculateStreak(sessions),
      };
    } catch (error) {
      console.error('Failed to get study stats:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        focusSessionsToday: 0,
        productivityStreak: 0,
      };
    }
  }

  // Calculate productivity streak (consecutive days with at least one focus session)
  private calculateStreak(sessions: StudySession[]): number {
    const focusSessions = sessions.filter(s => s.type === 'focus');
    if (focusSessions.length === 0) return 0;

    const daysSessions = new Map<string, boolean>();
    focusSessions.forEach(session => {
      const day = new Date(session.startTime).toDateString();
      daysSessions.set(day, true);
    });

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Max 365 day streak
      const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayString = checkDate.toDateString();
      
      if (daysSessions.has(dayString)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Format time for display
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export const studyTimerService = StudyTimerService.getInstance();
