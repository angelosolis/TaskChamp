import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Task } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2E3A59',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('overdue-tasks', {
          name: 'Overdue Tasks',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DC2626',
          sound: 'default',
        });
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  // Schedule notifications for a task
  async scheduleTaskNotifications(task: Task): Promise<void> {
    if (!task.dueDate) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Don't schedule notifications for past dates or completed tasks
    if (dueDate <= now || task.completed) return;

    // Cancel existing notifications for this task
    await this.cancelTaskNotifications(task.id);

    const notificationIds: string[] = [];

    // 24 hours before due date
    const oneDayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 Task Due Tomorrow",
          body: `"${task.title}" is due tomorrow`,
          data: { 
            taskId: task.id, 
            type: 'reminder',
            priority: task.priority 
          },
          sound: 'default',
        },
        trigger: {
          date: oneDayBefore,
          channelId: 'task-reminders',
        },
      });
      notificationIds.push(id);
    }

    // 2 hours before due date
    const twoHoursBefore = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore > now) {
      const priorityEmoji = task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📝';
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${priorityEmoji} Task Due Soon`,
          body: `"${task.title}" is due in 2 hours`,
          data: { 
            taskId: task.id, 
            type: 'urgent_reminder',
            priority: task.priority 
          },
          sound: 'default',
        },
        trigger: {
          date: twoHoursBefore,
          channelId: 'task-reminders',
        },
      });
      notificationIds.push(id);
    }

    // On due date (if not already passed)
    if (dueDate > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Task Due Now!",
          body: `"${task.title}" is due now`,
          data: { 
            taskId: task.id, 
            type: 'due_now',
            priority: task.priority 
          },
          sound: 'default',
        },
        trigger: {
          date: dueDate,
          channelId: 'task-reminders',
        },
      });
      notificationIds.push(id);
    }

    // Store notification IDs for this task (for cancellation later)
    this.storeNotificationIds(task.id, notificationIds);
  }

  // Schedule overdue notification
  async scheduleOverdueNotification(task: Task): Promise<void> {
    if (!task.dueDate || task.completed) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Only schedule if task is actually overdue
    if (dueDate >= now) return;

    // Schedule notification for 1 hour after due date (if not too far in past)
    const oneHourAfterDue = new Date(dueDate.getTime() + 60 * 60 * 1000);
    if (oneHourAfterDue > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Task Overdue!",
          body: `"${task.title}" is overdue. Complete it now?`,
          data: { 
            taskId: task.id, 
            type: 'overdue',
            priority: task.priority 
          },
          sound: 'default',
        },
        trigger: {
          date: oneHourAfterDue,
          channelId: 'overdue-tasks',
        },
      });
    }
  }

  // Cancel all notifications for a specific task
  async cancelTaskNotifications(taskId: string): Promise<void> {
    const notificationIds = this.getStoredNotificationIds(taskId);
    if (notificationIds.length > 0) {
      await Notifications.cancelScheduledNotificationsAsync(notificationIds);
      this.clearStoredNotificationIds(taskId);
    }
  }

  // Send immediate notification (for testing or instant feedback)
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  }

  // Daily motivation reminder
  async scheduleDailyMotivation(): Promise<void> {
    // Schedule daily motivation at 9 AM
    await Notifications.cancelScheduledNotificationsAsync(['daily-motivation']);
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-motivation',
      content: {
        title: "🌟 Good Morning, Champion!",
        body: "Ready to tackle your tasks today? Let's make it productive!",
        data: { type: 'motivation' },
        sound: 'default',
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
        channelId: 'task-reminders',
      },
    });
  }

  // Check and reschedule all task notifications (useful after app updates)
  async rescheduleAllTaskNotifications(tasks: Task[]): Promise<void> {
    // Cancel all existing task notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotificationIds = scheduledNotifications
      .filter(notification => notification.content.data?.taskId)
      .map(notification => notification.identifier);
    
    if (taskNotificationIds.length > 0) {
      await Notifications.cancelScheduledNotificationsAsync(taskNotificationIds);
    }

    // Reschedule for all pending tasks with due dates
    for (const task of tasks) {
      if (!task.completed && task.dueDate) {
        await this.scheduleTaskNotifications(task);
      }
    }
  }

  // Private helper methods for storing notification IDs
  private notificationStore: { [taskId: string]: string[] } = {};

  private storeNotificationIds(taskId: string, notificationIds: string[]): void {
    this.notificationStore[taskId] = notificationIds;
  }

  private getStoredNotificationIds(taskId: string): string[] {
    return this.notificationStore[taskId] || [];
  }

  private clearStoredNotificationIds(taskId: string): void {
    delete this.notificationStore[taskId];
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    scheduled: number;
    delivered: number;
  }> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return {
      scheduled: scheduled.length,
      delivered: 0, // This would require more complex tracking
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export notification response type for handling taps
export type NotificationResponse = Notifications.NotificationResponse;
