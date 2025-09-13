import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ModernHeader from '../components/ModernHeader';

import { useAppSelector } from '../store/store';
import { MainTabParamList } from '../types';

type Props = BottomTabScreenProps<MainTabParamList, 'AIInsights'>;

export default function AIInsightsScreen({}: Props) {
  const { tasks } = useAppSelector((state) => state.tasks);

  // Calculate insights
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  });

  const highPriorityTasks = tasks.filter(task => task.priority === 'high');
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium');
  const lowPriorityTasks = tasks.filter(task => task.priority === 'low');

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

  // Calculate average days to complete
  const completedWithDates = completedTasks.filter(task => task.createdAt && task.updatedAt);
  const averageDaysToComplete = completedWithDates.length > 0 
    ? Math.round(completedWithDates.reduce((acc, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return acc + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedWithDates.length)
    : 0;

  // Get most productive day
  const tasksByDay: { [key: string]: number } = {};
  completedTasks.forEach(task => {
    const day = new Date(task.updatedAt).toLocaleDateString('en-US', { weekday: 'long' });
    tasksByDay[day] = (tasksByDay[day] || 0) + 1;
  });
  const mostProductiveDay = Object.keys(tasksByDay).reduce((a, b) => 
    tasksByDay[a] > tasksByDay[b] ? a : b, 'Monday'
  );

  // Generate insights
  const insights = [
    {
      id: 'completion',
      title: 'Task Completion',
      description: `You have a ${Math.round(completionRate * 100)}% completion rate. ${
        completionRate > 0.8 ? 'Excellent work!' : 
        completionRate > 0.6 ? 'Good progress, keep it up!' :
        'Consider breaking larger tasks into smaller ones.'
      }`,
      icon: 'check-circle',
      color: completionRate > 0.8 ? '#059669' : completionRate > 0.6 ? '#D97706' : '#DC2626',
    },
    {
      id: 'priority',
      title: 'Priority Management',
      description: `You have ${highPriorityTasks.filter(t => !t.completed).length} high-priority tasks pending. ${
        highPriorityTasks.filter(t => !t.completed).length === 0 ? 
        'Great job staying on top of important tasks!' :
        'Focus on completing high-priority tasks first.'
      }`,
      icon: 'priority-high',
      color: highPriorityTasks.filter(t => !t.completed).length === 0 ? '#059669' : '#DC2626',
    },
    {
      id: 'overdue',
      title: 'Due Date Management',
      description: `${overdueTasks.length} tasks are overdue. ${
        overdueTasks.length === 0 ?
        'Perfect! You\'re staying on schedule.' :
        'Consider updating due dates or completing overdue tasks.'
      }`,
      icon: 'schedule',
      color: overdueTasks.length === 0 ? '#059669' : '#DC2626',
    },
    {
      id: 'productivity',
      title: 'Productivity Pattern',
      description: `Your most productive day is ${mostProductiveDay}. ${
        averageDaysToComplete > 0 ?
        `On average, you complete tasks in ${averageDaysToComplete} days.` :
        'Start tracking completion times for better insights.'
      }`,
      icon: 'trending-up',
      color: '#4A90E2',
    },
  ];

  const recommendations = [
    'Break large tasks into smaller, manageable subtasks',
    'Set realistic due dates to avoid overdue tasks',
    'Focus on high-priority tasks during your most productive hours',
    'Review and update your task list regularly',
    'Celebrate completed tasks to stay motivated',
  ];

  const InsightCard = ({ insight }: { insight: typeof insights[0] }) => (
    <Card style={styles.insightCard}>
      <Card.Content style={styles.insightContent}>
        <View style={styles.insightHeader}>
          <MaterialIcons name={insight.icon as any} size={24} color={insight.color} />
          <Text variant="titleMedium" style={styles.insightTitle}>
            {insight.title}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.insightDescription}>
          {insight.description}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="AI Insights"
        subtitle="Analytics and recommendations for your productivity"
        gradient={['#8B5CF6', '#7C3AED']}
      />
      
      <ScrollView contentContainerStyle={styles.content}>

      {/* Quick Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Quick Statistics
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
                {completedTasks.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Completed
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#D97706' }]}>
                {pendingTasks.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#DC2626' }]}>
                {overdueTasks.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Overdue
              </Text>
            </View>
          </View>

          {/* Completion Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="bodyMedium" style={styles.progressLabel}>
                Overall Completion Rate
              </Text>
              <Text variant="bodyMedium" style={styles.progressPercentage}>
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={completionRate}
              color="#4A90E2"
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Priority Breakdown */}
      <Card style={styles.priorityCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Priority Distribution
          </Text>
          
          <View style={styles.priorityBreakdown}>
            <View style={styles.priorityItem}>
              <MaterialIcons name="keyboard-arrow-up" size={20} color="#DC2626" />
              <Text variant="bodyMedium" style={styles.priorityText}>High:</Text>
              <Text variant="bodyMedium" style={styles.priorityCount}>
                {highPriorityTasks.length} tasks
              </Text>
            </View>
            
            <View style={styles.priorityItem}>
              <MaterialIcons name="remove" size={20} color="#D97706" />
              <Text variant="bodyMedium" style={styles.priorityText}>Medium:</Text>
              <Text variant="bodyMedium" style={styles.priorityCount}>
                {mediumPriorityTasks.length} tasks
              </Text>
            </View>
            
            <View style={styles.priorityItem}>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#059669" />
              <Text variant="bodyMedium" style={styles.priorityText}>Low:</Text>
              <Text variant="bodyMedium" style={styles.priorityCount}>
                {lowPriorityTasks.length} tasks
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* AI Insights */}
      <View style={styles.insightsSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Smart Insights
        </Text>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      {/* Recommendations */}
      <Card style={styles.recommendationsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Productivity Tips
          </Text>
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <MaterialIcons name="lightbulb" size={16} color="#D97706" />
              <Text variant="bodyMedium" style={styles.recommendationText}>
                {recommendation}
              </Text>
            </View>
          ))}
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
    marginBottom: 20,
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
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#6B7280',
  },
  progressPercentage: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  priorityCard: {
    marginBottom: 16,
    elevation: 2,
  },
  priorityBreakdown: {
    gap: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityText: {
    color: '#4B5563',
    minWidth: 60,
  },
  priorityCount: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  insightsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightCard: {
    marginBottom: 12,
    elevation: 2,
  },
  insightContent: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  insightTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  insightDescription: {
    color: '#4B5563',
    lineHeight: 20,
  },
  recommendationsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
});
