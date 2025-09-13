import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, Surface, ProgressBar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppSelector } from '../store/store';
import { MainTabParamList, MainStackParamList, Task } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  StackScreenProps<MainStackParamList>
>;

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAppSelector((state) => state.auth);
  const { tasks } = useAppSelector((state) => state.tasks);

  // Calculate statistics
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed);
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  });

  const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRecentTasks = (): Task[] => {
    return tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 4);
  };

  const ModernStatCard = ({ title, value, subtitle, icon, gradient, textColor = '#FFFFFF' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    gradient: string[];
    textColor?: string;
  }) => (
    <View style={styles.modernStatCard}>
      <LinearGradient
        colors={gradient}
        style={styles.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statCardContent}>
          <View style={styles.statIcon}>
            <MaterialCommunityIcons name={icon as any} size={28} color={textColor} />
          </View>
          <View style={styles.statData}>
            <Text variant="headlineLarge" style={[styles.statValue, { color: textColor }]}>
              {value}
            </Text>
            <Text variant="bodyMedium" style={[styles.statTitle, { color: textColor, opacity: 0.9 }]}>
              {title}
            </Text>
            {subtitle && (
              <Text variant="bodySmall" style={[styles.statSubtitle, { color: textColor, opacity: 0.8 }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const TaskPreviewCard = ({ task }: { task: Task }) => (
    <Surface style={styles.taskPreview} elevation={1}>
      <View style={styles.taskPreviewContent}>
        <View style={styles.taskPreviewLeft}>
          <View style={[styles.priorityIndicator, { backgroundColor: 
            task.priority === 'high' ? '#FF6B6B' : 
            task.priority === 'medium' ? '#FFD93D' : '#6BCF7F' 
          }]} />
          <View style={styles.taskPreviewText}>
            <Text variant="bodyMedium" style={styles.taskPreviewTitle} numberOfLines={1}>
              {task.title}
            </Text>
            {task.dueDate && (
              <Text variant="bodySmall" style={styles.taskPreviewDue}>
                Due {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <IconButton
          icon="chevron-right"
          size={20}
          iconColor="#9CA3AF"
          onPress={() => navigation.navigate('TaskList')}
        />
      </View>
    </Surface>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.modernHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text variant="headlineLarge" style={styles.greeting}>
              {getGreeting()}!
            </Text>
            <Text variant="bodyLarge" style={styles.userName}>
              {user?.name || 'Welcome back'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Let's make today productive 🚀
            </Text>
          </View>
          
          {/* Floating Progress Ring */}
          <View style={styles.progressRing}>
            <View style={styles.progressCircle}>
              <Text variant="titleLarge" style={styles.progressText}>
                {Math.round(completionRate * 100)}%
              </Text>
              <Text variant="bodySmall" style={styles.progressLabel}>
                Complete
              </Text>
            </View>
          </View>
        </View>
        
        {/* Wave decoration */}
        <View style={styles.waveDecoration} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Modern Statistics Grid */}
        <View style={styles.statsSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.modernStatsGrid}>
            <ModernStatCard
              title="Total Tasks"
              value={tasks.length}
              icon="clipboard-list"
              gradient={['#667eea', '#764ba2']}
            />
            <ModernStatCard
              title="Completed"
              value={completedTasks.length}
              icon="check-circle"
              gradient={['#11998e', '#38ef7d']}
            />
            <ModernStatCard
              title="In Progress"
              value={pendingTasks.length}
              icon="clock"
              gradient={['#f093fb', '#f5576c']}
            />
            <ModernStatCard
              title="High Priority"
              value={highPriorityTasks.length}
              subtitle={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : 'On track'}
              icon="alert"
              gradient={['#ff9a9e', '#fecfef']}
            />
          </View>
        </View>

        {/* Progress Visualization */}
        <Card style={styles.modernProgressCard}>
          <Card.Content style={styles.progressCardContent}>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Daily Progress
              </Text>
              <View style={styles.progressBadge}>
                <Text variant="bodySmall" style={styles.progressBadgeText}>
                  {completedTasks.length}/{tasks.length}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressVisualization}>
              <ProgressBar
                progress={completionRate}
                color="#667eea"
                style={styles.modernProgressBar}
              />
              <View style={styles.progressDetails}>
                <Text variant="bodySmall" style={styles.progressDetailText}>
                  {Math.round(completionRate * 100)}% completed
                </Text>
                <Text variant="bodySmall" style={styles.progressDetailText}>
                  {pendingTasks.length} remaining
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Quick Insights
            </Text>
            <View style={styles.insightsList}>
              {completionRate > 0.8 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: '#E8F5E8' }]}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#4CAF50" />
                  </View>
                  <Text variant="bodyMedium" style={styles.insightText}>
                    Excellent work! You're crushing your goals 🎉
                  </Text>
                </View>
              )}
              
              {highPriorityTasks.length > 0 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialCommunityIcons name="fire" size={20} color="#FF9800" />
                  </View>
                  <Text variant="bodyMedium" style={styles.insightText}>
                    {highPriorityTasks.length} high-priority task{highPriorityTasks.length > 1 ? 's' : ''} need attention
                  </Text>
                </View>
              )}
              
              {overdueTasks.length > 0 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: '#FFEBEE' }]}>
                    <MaterialCommunityIcons name="clock-alert" size={20} color="#F44336" />
                  </View>
                  <Text variant="bodyMedium" style={styles.insightText}>
                    {overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue
                  </Text>
                </View>
              )}
              
              {tasks.length === 0 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name="rocket-launch" size={20} color="#2196F3" />
                  </View>
                  <Text variant="bodyMedium" style={styles.insightText}>
                    Ready to start? Create your first task!
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Tasks Preview */}
        {getRecentTasks().length > 0 && (
          <Card style={styles.recentTasksCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Up Next
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={() => navigation.navigate('TaskList')}
                >
                  View All
                </Button>
              </View>
              
              <View style={styles.tasksList}>
                {getRecentTasks().map((task, index) => (
                  <TaskPreviewCard key={task.id} task={task} />
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Modern Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Quick Actions
            </Text>
            <View style={styles.modernQuickActions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Create')}
                style={[styles.quickActionButton, styles.primaryAction]}
                contentStyle={styles.quickActionContent}
                buttonColor="#667eea"
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                New Task
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('KanbanBoard')}
                style={styles.quickActionButton}
                contentStyle={styles.quickActionContent}
              >
                <MaterialCommunityIcons name="view-column" size={24} />
                Kanban
              </Button>
            </View>
            <View style={styles.modernQuickActions}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('TaskList')}
                style={styles.quickActionButton}
                contentStyle={styles.quickActionContent}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={24} />
                All Tasks
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('AIInsights')}
                style={styles.quickActionButton}
                contentStyle={styles.quickActionContent}
              >
                <MaterialCommunityIcons name="chart-line" size={24} />
                Insights
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modernHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  progressCircle: {
    alignItems: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  waveDecoration: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernStatCard: {
    width: (width - 44) / 2, // Account for padding and gap
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statData: {
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modernProgressCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
  },
  progressCardContent: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  progressBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressBadgeText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  progressVisualization: {
    gap: 12,
  },
  modernProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailText: {
    color: '#6B7280',
  },
  insightsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
  },
  insightsList: {
    gap: 12,
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    color: '#4B5563',
    lineHeight: 20,
  },
  recentTasksCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksList: {
    gap: 8,
  },
  taskPreview: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  taskPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskPreviewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  taskPreviewText: {
    flex: 1,
  },
  taskPreviewTitle: {
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  taskPreviewDue: {
    color: '#6B7280',
  },
  quickActionsCard: {
    marginBottom: 32,
    borderRadius: 16,
    elevation: 3,
  },
  modernQuickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
  },
  quickActionContent: {
    height: 56,
    flexDirection: 'row-reverse',
  },
  primaryAction: {
    elevation: 4,
  },
});