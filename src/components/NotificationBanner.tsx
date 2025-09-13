import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Surface, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface NotificationData {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onPress: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

interface Props {
  notification: NotificationData | null;
  onDismiss: () => void;
}

export default function NotificationBanner({ notification, onDismiss }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (notification) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    }
  }, [notification]);

  const handleDismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!notification) return null;

  const getThemeColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          background: '#10B981',
          text: '#FFFFFF',
          icon: 'check-circle',
        };
      case 'warning':
        return {
          background: '#F59E0B',
          text: '#FFFFFF',
          icon: 'alert',
        };
      case 'error':
        return {
          background: '#EF4444',
          text: '#FFFFFF',
          icon: 'alert-circle',
        };
      case 'info':
      default:
        return {
          background: '#3B82F6',
          text: '#FFFFFF',
          icon: 'information',
        };
    }
  };

  const theme = getThemeColors();
  const iconName = notification.icon || theme.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Surface style={[styles.notification, { backgroundColor: theme.background }]} elevation={4}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={20}
            color={theme.text}
            style={styles.icon}
          />
          
          <View style={styles.textContainer}>
            <Text variant="bodyMedium" style={[styles.title, { color: theme.text }]}>
              {notification.title}
            </Text>
          </View>

          <IconButton
            icon="close"
            iconColor={theme.text}
            size={16}
            onPress={handleDismiss}
            style={styles.closeButton}
          />
        </View>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notification: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 8,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    lineHeight: 20,
  },
  closeButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
});
