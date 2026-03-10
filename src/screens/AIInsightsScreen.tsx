import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Surface, ProgressBar, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ModernHeader from '../components/ModernHeader';

import { useAppSelector } from '../store/store';
import { MainTabParamList } from '../types';
import {
  getAIInsights,
  getTaskRecommendations,
  AIInsight,
  TaskRecommendation,
  getStudyTip,
} from '../services/geminiService';

type Props = BottomTabScreenProps<MainTabParamList, 'AIInsights'>;

export default function AIInsightsScreen({}: Props) {
  const { tasks } = useAppSelector((state) => state.tasks);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [studyTip, setStudyTip] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Local stats (always calculated, no AI needed)
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
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
  const averageDaysToComplete = (() => {
    const withDates = completedTasks.filter(t => t.createdAt && t.updatedAt);
    if (withDates.length === 0) return 0;
    return Math.round(
      withDates.reduce((acc, t) => {
        return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / withDates.length
    );
  })();

  const fetchAIData = useCallback(async () => {
    if (tasks.length === 0) return;

    setError(null);
    setIsLoadingInsights(true);
    setIsLoadingRecs(true);
    setIsLoadingTip(true);

    // Fetch all three in parallel
    const [insightsResult, recsResult, tipResult] = await Promise.allSettled([
      getAIInsights(tasks),
      getTaskRecommendations(tasks),
      getStudyTip(tasks),
    ]);

    setIsLoadingInsights(false);
    setIsLoadingRecs(false);
    setIsLoadingTip(false);

    if (insightsResult.status === 'fulfilled') {
      setAiInsights(insightsResult.value);
    } else {
      setError('Could not load AI insights. Check your connection.');
    }

    if (recsResult.status === 'fulfilled') {
      setRecommendations(recsResult.value);
    }

    if (tipResult.status === 'fulfilled') {
      setStudyTip(tipResult.value);
    }
  }, [tasks]);

  useEffect(() => {
    fetchAIData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAIData();
    setRefreshing(false);
  }, [fetchAIData]);

  const priorityColor = (p: TaskRecommendation['priority']) => {
    const colors = { urgent: '#DC2626', high: '#D97706', medium: '#4A90E2', low: '#059669' };
    return colors[p];
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="AI Insights"
        subtitle="Powered by TASK AI — personalized for you"
        gradient={['#8B5CF6', '#7C3AED']}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* Study Tip Banner */}
        {(isLoadingTip || studyTip) && (
          <Card style={styles.tipCard}>
            <Card.Content style={styles.tipContent}>
              <MaterialIcons name="lightbulb" size={20} color="#D97706" />
              {isLoadingTip ? (
                <ActivityIndicator size="small" color="#D97706" style={{ marginLeft: 8 }} />
              ) : (
                <Text variant="bodyMedium" style={styles.tipText}>{studyTip}</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Quick Statistics</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total', value: totalTasks, color: '#2E3A59' },
                { label: 'Done', value: completedTasks.length, color: '#059669' },
                { label: 'Pending', value: pendingTasks.length, color: '#D97706' },
                { label: 'Overdue', value: overdueTasks.length, color: '#DC2626' },
              ].map(stat => (
                <View key={stat.label} style={styles.statItem}>
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text variant="bodyMedium" style={styles.progressLabel}>Overall Completion Rate</Text>
                <Text variant="bodyMedium" style={styles.progressPercentage}>
                  {Math.round(completionRate * 100)}%
                </Text>
              </View>
              <ProgressBar progress={completionRate} color="#4A90E2" style={styles.progressBar} />
            </View>
          </Card.Content>
        </Card>

        {/* Priority Breakdown */}
        <Card style={styles.priorityCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Priority Distribution</Text>
            <View style={styles.priorityBreakdown}>
              {[
                { label: 'High', count: highPriorityTasks.length, color: '#DC2626', icon: 'keyboard-arrow-up' as const },
                { label: 'Medium', count: mediumPriorityTasks.length, color: '#D97706', icon: 'remove' as const },
                { label: 'Low', count: lowPriorityTasks.length, color: '#059669', icon: 'keyboard-arrow-down' as const },
              ].map(item => (
                <View key={item.label} style={styles.priorityItem}>
                  <MaterialIcons name={item.icon} size={20} color={item.color} />
                  <Text variant="bodyMedium" style={styles.priorityText}>{item.label}:</Text>
                  <Text variant="bodyMedium" style={styles.priorityCount}>{item.count} tasks</Text>
                </View>
              ))}
            </View>
            {averageDaysToComplete > 0 && (
              <Text variant="bodySmall" style={styles.avgDays}>
                Avg. completion time: {averageDaysToComplete} day{averageDaysToComplete !== 1 ? 's' : ''}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* AI-Powered Task Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Task Recommendations</Text>
            <Chip icon="robot" style={styles.aiChip} textStyle={styles.aiChipText}>TASK AI</Chip>
          </View>

          {isLoadingRecs ? (
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator color="#8B5CF6" />
                <Text variant="bodyMedium" style={styles.loadingText}>Analyzing your tasks...</Text>
              </Card.Content>
            </Card>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <Card key={i} style={styles.recCard}>
                <Card.Content>
                  <View style={styles.recHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor(rec.priority) + '20' }]}>
                      <Text style={[styles.priorityBadgeText, { color: priorityColor(rec.priority) }]}>
                        {rec.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Text variant="titleSmall" style={styles.recTitle} numberOfLines={1}>{rec.taskTitle}</Text>
                  </View>
                  <Text variant="bodySmall" style={styles.recReason}>{rec.reason}</Text>
                  <View style={styles.recAction}>
                    <MaterialIcons name="arrow-forward" size={14} color="#8B5CF6" />
                    <Text variant="bodySmall" style={styles.recActionText}>{rec.suggestedAction}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : tasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyText}>Add some tasks to get AI recommendations!</Text>
              </Card.Content>
            </Card>
          ) : null}
        </View>

        {/* AI Smart Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Smart Insights</Text>
            <Chip icon="robot" style={styles.aiChip} textStyle={styles.aiChipText}>TASK AI</Chip>
          </View>

          {error && (
            <Card style={styles.errorCard}>
              <Card.Content style={styles.errorContent}>
                <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
                <Button mode="text" onPress={fetchAIData} style={styles.retryButton}>Retry</Button>
              </Card.Content>
            </Card>
          )}

          {isLoadingInsights ? (
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator color="#8B5CF6" />
                <Text variant="bodyMedium" style={styles.loadingText}>Generating insights...</Text>
              </Card.Content>
            </Card>
          ) : (
            aiInsights.map((insight, i) => (
              <Card key={i} style={styles.insightCard}>
                <Card.Content style={styles.insightContent}>
                  <View style={styles.insightHeader}>
                    <MaterialIcons name={insight.icon as any} size={24} color={insight.color} />
                    <Text variant="titleSmall" style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.insightDescription}>{insight.description}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* Refresh Button */}
        <Button
          mode="outlined"
          onPress={fetchAIData}
          style={styles.refreshButton}
          icon="refresh"
          disabled={isLoadingInsights || isLoadingRecs}
        >
          Refresh AI Analysis
        </Button>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  tipCard: { marginBottom: 12, backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#D97706' },
  tipContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { flex: 1, color: '#92400E', lineHeight: 20 },
  statsCard: { marginBottom: 16, elevation: 2 },
  cardTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontWeight: 'bold' },
  statLabel: { color: '#6B7280', textAlign: 'center', marginTop: 4 },
  progressSection: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { color: '#6B7280' },
  progressPercentage: { color: '#4A90E2', fontWeight: 'bold' },
  progressBar: { height: 8, borderRadius: 4 },
  priorityCard: { marginBottom: 16, elevation: 2 },
  priorityBreakdown: { gap: 12 },
  priorityItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityText: { color: '#4B5563', minWidth: 60 },
  priorityCount: { color: '#2E3A59', fontWeight: 'bold' },
  avgDays: { color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#2E3A59', fontWeight: 'bold' },
  aiChip: { backgroundColor: '#EDE9FE', height: 28 },
  aiChipText: { color: '#7C3AED', fontSize: 11 },
  loadingCard: { elevation: 2, marginBottom: 8 },
  loadingContent: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', paddingVertical: 8 },
  loadingText: { color: '#6B7280' },
  recCard: { marginBottom: 10, elevation: 2 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityBadgeText: { fontSize: 10, fontWeight: 'bold' },
  recTitle: { color: '#2E3A59', flex: 1 },
  recReason: { color: '#4B5563', marginBottom: 6, lineHeight: 18 },
  recAction: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  recActionText: { color: '#8B5CF6', flex: 1, lineHeight: 18 },
  emptyCard: { elevation: 2 },
  emptyText: { color: '#9CA3AF', textAlign: 'center' },
  errorCard: { elevation: 2, marginBottom: 8, backgroundColor: '#FEF2F2' },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#DC2626', flex: 1 },
  retryButton: { marginLeft: 'auto' },
  insightCard: { marginBottom: 12, elevation: 2 },
  insightContent: { padding: 4 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  insightTitle: { color: '#2E3A59', fontWeight: 'bold', flex: 1 },
  insightDescription: { color: '#4B5563', lineHeight: 20 },
  refreshButton: { marginTop: 8, borderColor: '#8B5CF6' },
});
