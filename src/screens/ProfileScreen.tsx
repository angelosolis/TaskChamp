import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Surface, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';
import { useNotification } from '../components/NotificationProvider';

import { useAppDispatch, useAppSelector } from '../store/store';
import { logoutUser } from '../store/slices/authSlice';
import { MainTabParamList, MainStackParamList } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<MainStackParamList>
>;

export default function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { showInfo, showWarning } = useNotification();

  const handleLogout = () => {
    showWarning(
      'Logout Confirmation',
      'Are you sure you want to logout?'
    );
    // For now, just show the warning. In a real app, you'd add action buttons
    setTimeout(() => {
      dispatch(logoutUser());
    }, 2000);
  };

  const handleClearData = () => {
    showWarning(
      'Clear All Data',
      'This will delete all your tasks and data. This action cannot be undone.'
    );
    // For demo purposes, just show the warning
  };

  // Calculate user statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const joinDate = user?.email ? new Date().toLocaleDateString() : 'N/A';

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Profile"
        subtitle="Manage your account and preferences"
        gradient={['#6366F1', '#8B5CF6']}
      />
      
      <ScrollView contentContainerStyle={styles.content}>

      {/* User Info Card */}
      <Card style={styles.userCard}>
        <Card.Content style={styles.userContent}>
          <View style={styles.userHeader}>
            <Avatar.Text
              size={80}
              label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.userInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user?.name || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {user?.email || 'No email'}
              </Text>
              <Text variant="bodySmall" style={styles.memberSince}>
                Member since {joinDate}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Statistics Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Your Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {totalTasks}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Tasks
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#059669' }]}>
                {completedTasks}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Completed
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#D97706' }]}>
                {pendingTasks}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4A90E2' }]}>
                {completionRate}%
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Success Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Achievement Card */}
      <Card style={styles.achievementCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Achievements
          </Text>
          
          <View style={styles.achievementItem}>
            <MaterialIcons 
              name="grade" 
              size={24} 
              color={completedTasks >= 10 ? '#D97706' : '#E5E7EB'} 
            />
            <View style={styles.achievementText}>
              <Text variant="bodyMedium" style={styles.achievementTitle}>
                Task Master
              </Text>
              <Text variant="bodySmall" style={styles.achievementDesc}>
                Complete 10 tasks ({completedTasks}/10)
              </Text>
            </View>
          </View>

          <View style={styles.achievementItem}>
            <MaterialIcons 
              name="trending-up" 
              size={24} 
              color={completionRate >= 80 ? '#059669' : '#E5E7EB'} 
            />
            <View style={styles.achievementText}>
              <Text variant="bodyMedium" style={styles.achievementTitle}>
                High Achiever
              </Text>
              <Text variant="bodySmall" style={styles.achievementDesc}>
                Maintain 80%+ completion rate
              </Text>
            </View>
          </View>

          <View style={styles.achievementItem}>
            <MaterialIcons 
              name="speed" 
              size={24} 
              color={totalTasks >= 5 ? '#4A90E2' : '#E5E7EB'} 
            />
            <View style={styles.achievementText}>
              <Text variant="bodyMedium" style={styles.achievementTitle}>
                Getting Started
              </Text>
              <Text variant="bodySmall" style={styles.achievementDesc}>
                Create your first 5 tasks ({totalTasks}/5)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Features Card */}
      <Card style={styles.featuresCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Features
          </Text>
          
          <List.Section>
            <List.Item
              title="AI Insights"
              description="View your productivity analytics and insights"
              left={(props) => <MaterialIcons {...props} name="analytics" size={24} color="#4A90E2" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => navigation.navigate('AIInsights')}
            />
            
            <Divider />
            
            <List.Item
              title="Task Management"
              description="View and manage all your tasks"
              left={(props) => <MaterialIcons {...props} name="task-alt" size={24} color="#059669" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => navigation.navigate('TaskList')}
            />
            
            <Divider />
            
            <List.Item
              title="Kanban Board"
              description="Visual task management with drag and drop"
              left={(props) => <MaterialIcons {...props} name="view-column" size={24} color="#8B5CF6" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => navigation.navigate('KanbanBoard')}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Settings Card */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Settings
          </Text>
          
          <List.Section>
            <List.Item
              title="Account Settings"
              description="Update your profile information"
              left={(props) => <MaterialIcons {...props} name="account-circle" size={24} color="#6B7280" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => {
                showInfo('Coming Soon', 'Account settings will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Notifications"
              description="Manage your notification preferences"
              left={(props) => <MaterialIcons {...props} name="notifications" size={24} color="#6B7280" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => {
                showInfo('Coming Soon', 'Notification settings will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Theme"
              description="Choose your preferred theme"
              left={(props) => <MaterialIcons {...props} name="palette" size={24} color="#6B7280" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => {
                showInfo('Coming Soon', 'Theme settings will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Backup & Sync"
              description="Manage your data backup"
              left={(props) => <MaterialIcons {...props} name="cloud-sync" size={24} color="#6B7280" />}
              right={(props) => <MaterialIcons {...props} name="chevron-right" size={24} color="#6B7280" />}
              onPress={() => {
                showInfo('Coming Soon', 'Backup & sync will be available in a future update.');
              }}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Actions
          </Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                showInfo(
                  'About TaskChamp',
                  'TaskChamp v1.0.0 - A modern task management app built with React Native and Expo.'
                );
              }}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              <MaterialIcons name="info" size={20} />
              About
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleClearData}
              style={[styles.actionButton, styles.warningButton]}
              contentStyle={styles.actionButtonContent}
            >
              <MaterialIcons name="clear-all" size={20} color="#D97706" />
              Clear Data
            </Button>
            
            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.actionButton, styles.logoutButton]}
              contentStyle={styles.actionButtonContent}
            >
              <MaterialIcons name="logout" size={20} color="white" />
              Logout
            </Button>
          </View>
        </Card.Content>
      </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    marginBottom: 16,
    elevation: 2,
  },
  userContent: {
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    backgroundColor: '#2E3A59',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    color: '#9CA3AF',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  achievementCard: {
    marginBottom: 16,
    elevation: 2,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  achievementDesc: {
    color: '#6B7280',
  },
  featuresCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonContent: {
    height: 48,
    flexDirection: 'row-reverse',
  },
  warningButton: {
    borderColor: '#D97706',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
  },
});
