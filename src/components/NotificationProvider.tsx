import React, { createContext, useContext, useState, ReactNode } from 'react';
import NotificationBanner, { NotificationData } from './NotificationBanner';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showSuccess: (title: string, message: string, actions?: NotificationData['actions']) => void;
  showWarning: (title: string, message: string, actions?: NotificationData['actions']) => void;
  showError: (title: string, message: string, actions?: NotificationData['actions']) => void;
  showInfo: (title: string, message: string, actions?: NotificationData['actions']) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function NotificationProvider({ children }: Props) {
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      duration: notification.duration ?? 4000, // Default 4 seconds
    };
    setCurrentNotification(newNotification);
  };

  const showSuccess = (title: string, message: string, actions?: NotificationData['actions']) => {
    showNotification({
      type: 'success',
      title,
      message,
      actions,
      icon: 'check-circle',
    });
  };

  const showWarning = (title: string, message: string, actions?: NotificationData['actions']) => {
    showNotification({
      type: 'warning',
      title,
      message,
      actions,
      icon: 'alert',
    });
  };

  const showError = (title: string, message: string, actions?: NotificationData['actions']) => {
    showNotification({
      type: 'error',
      title,
      message,
      actions,
      icon: 'alert-circle',
    });
  };

  const showInfo = (title: string, message: string, actions?: NotificationData['actions']) => {
    showNotification({
      type: 'info',
      title,
      message,
      actions,
      icon: 'information',
    });
  };

  const hideNotification = () => {
    setCurrentNotification(null);
  };

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationBanner
        notification={currentNotification}
        onDismiss={hideNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

