import { Task } from '../types';

// We'll inject the notification functions from the context
interface NotificationFunctions {
  showSuccess: (title: string, message: string, actions?: any[]) => void;
  showWarning: (title: string, message: string, actions?: any[]) => void;
  showError: (title: string, message: string, actions?: any[]) => void;
  showInfo: (title: string, message: string, actions?: any[]) => void;
}

export class InAppAlertService {
  private static instance: InAppAlertService;
  private hasShownTodayAlert = false;
  private notificationFunctions: NotificationFunctions | null = null;

  static getInstance(): InAppAlertService {
    if (!InAppAlertService.instance) {
      InAppAlertService.instance = new InAppAlertService();
    }
    return InAppAlertService.instance;
  }

  // Set the notification functions from the context
  setNotificationFunctions(functions: NotificationFunctions): void {
    this.notificationFunctions = functions;
  }

  // Check and show alerts when app opens/becomes active
  checkAndShowAlerts(tasks: Task[]): void {
    const overdueTasks = this.getOverdueTasks(tasks);
    const dueTodayTasks = this.getDueTodayTasks(tasks);
    const dueSoonTasks = this.getDueSoonTasks(tasks);

    // Show overdue alert (highest priority)
    if (overdueTasks.length > 0) {
      this.showOverdueAlert(overdueTasks);
      return; // Don't show other alerts if there are overdue tasks
    }

    // Show due today alert
    if (dueTodayTasks.length > 0 && !this.hasShownTodayAlert) {
      this.showDueTodayAlert(dueTodayTasks);
      this.hasShownTodayAlert = true;
      return;
    }

    // Show due soon alert (lowest priority)
    if (dueSoonTasks.length > 0) {
      this.showDueSoonAlert(dueSoonTasks);
    }
  }

  // Show celebration when task is completed
  showCompletionCelebration(task: Task): void {
    if (!this.notificationFunctions) return;

    const celebrations = [
      "🎉 Awesome! You completed a task!",
      "✨ Great job finishing that task!", 
      "🚀 One step closer to your goals!",
      "🌟 You're crushing it today!",
      "💪 Task conquered! Keep going!"
    ];
    
    const randomCelebration = celebrations[Math.floor(Math.random() * celebrations.length)];
    
    this.notificationFunctions.showSuccess(
      randomCelebration,
      `"${task.title}" has been completed!`
    );
  }

  // Show daily motivation
  showDailyMotivation(): void {
    if (!this.notificationFunctions) return;

    const motivations = [
      "🌟 Ready to tackle your tasks today?",
      "💪 Let's make today productive!",
      "🚀 Time to achieve your goals!",
      "✨ Every task completed is progress!",
      "🎯 Focus on what matters most today!"
    ];

    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    
    this.notificationFunctions.showInfo(
      "Good morning, Champion!",
      randomMotivation
    );
  }

  // Reset daily flags (call this when new day starts)
  resetDailyFlags(): void {
    this.hasShownTodayAlert = false;
  }

  private getOverdueTasks(tasks: Task[]): Task[] {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < now;
    });
  }

  private getDueTodayTasks(tasks: Task[]): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  private getDueSoonTasks(tasks: Task[]): Task[] {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate > tomorrow && dueDate <= dayAfterTomorrow;
    });
  }

  private showOverdueAlert(overdueTasks: Task[]): void {
    if (!this.notificationFunctions) return;

    const taskList = overdueTasks
      .slice(0, 3) // Show max 3 tasks
      .map(task => `• ${task.title}`)
      .join('\n');
    
    const moreText = overdueTasks.length > 3 ? `... and ${overdueTasks.length - 3} more` : '';
    const message = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:\n\n${taskList}${moreText ? '\n' + moreText : ''}\n\nTime to catch up!`;

    this.notificationFunctions.showError(
      "🚨 Overdue Tasks!",
      message
    );
  }

  private showDueTodayAlert(dueTodayTasks: Task[]): void {
    if (!this.notificationFunctions) return;

    const highPriorityCount = dueTodayTasks.filter(t => t.priority === 'high').length;
    const taskList = dueTodayTasks
      .slice(0, 3)
      .map(task => `• ${task.title} ${task.priority === 'high' ? '🔥' : ''}`)
      .join('\n');
    
    const moreText = dueTodayTasks.length > 3 ? `... and ${dueTodayTasks.length - 3} more` : '';
    const priorityText = highPriorityCount > 0 ? ` (${highPriorityCount} high priority!)` : '';
    const message = `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today${priorityText}:\n\n${taskList}${moreText ? '\n' + moreText : ''}\n\nLet's get them done!`;

    this.notificationFunctions.showWarning(
      "📅 Tasks Due Today!",
      message
    );
  }

  private showDueSoonAlert(dueSoonTasks: Task[]): void {
    if (!this.notificationFunctions) return;

    this.notificationFunctions.showInfo(
      "⏰ Tasks Due Soon",
      `You have ${dueSoonTasks.length} task${dueSoonTasks.length > 1 ? 's' : ''} due in the next 2 days. Plan ahead to stay on track!`
    );
  }

  // Get urgency level for visual indicators
  getTaskUrgency(task: Task): 'overdue' | 'due-today' | 'due-soon' | 'normal' {
    if (!task.dueDate || task.completed) return 'normal';

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    if (dueDate < now) return 'overdue';
    if (dueDate >= today && dueDate < tomorrow) return 'due-today';
    if (dueDate >= tomorrow && dueDate <= dayAfterTomorrow) return 'due-soon';
    return 'normal';
  }

  // Get urgency colors for UI
  getUrgencyColor(urgency: 'overdue' | 'due-today' | 'due-soon' | 'normal'): string {
    switch (urgency) {
      case 'overdue': return '#DC2626'; // Red
      case 'due-today': return '#D97706'; // Orange
      case 'due-soon': return '#059669'; // Green
      default: return '#6B7280'; // Gray
    }
  }

  // Get urgency icon
  getUrgencyIcon(urgency: 'overdue' | 'due-today' | 'due-soon' | 'normal'): string {
    switch (urgency) {
      case 'overdue': return 'alert-circle';
      case 'due-today': return 'clock-alert';
      case 'due-soon': return 'clock';
      default: return 'circle-outline';
    }
  }
}

export const inAppAlertService = InAppAlertService.getInstance();
