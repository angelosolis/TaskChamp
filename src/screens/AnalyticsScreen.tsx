import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';

import { useAppSelector } from '../store/store';
import { MainStackParamList, Task } from '../types';

type Props = StackScreenProps<MainStackParamList, 'Analytics'>;

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }: Props) {
  const { tasks } = useAppSelector(state => state.tasks);
  const { courses } = useAppSelector(state => state.academic);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);
    const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    // Missed deadlines = currently overdue + tasks that were completed after their due date
    const lateCompletions = completed.filter(t =>
      t.dueDate && new Date(t.updatedAt) > new Date(t.dueDate)
    );
    const missedDeadlines = overdue.length + lateCompletions.length;
    const onTimeRate = (overdue.length + lateCompletions.length + completed.length - lateCompletions.length) > 0
      ? (completed.length - lateCompletions.length) /
        (overdue.length + lateCompletions.length + completed.length - lateCompletions.length)
      : 0;

    const completionRate = total > 0 ? completed.length / total : 0;

    // By priority
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high'),
      medium: tasks.filter(t => t.priority === 'medium'),
      low: tasks.filter(t => t.priority === 'low'),
    };

    // By task type
    const taskTypes = ['assignment', 'exam', 'project', 'reading', 'study', 'other'] as const;
    const byType = taskTypes.map(type => ({
      type,
      total: tasks.filter(t => t.taskType === type).length,
      completed: tasks.filter(t => t.taskType === type && t.completed).length,
    })).filter(t => t.total > 0);

    // By day of week (completed tasks)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDay = days.map((day, i) => ({
      day: day.slice(0, 3),
      count: completed.filter(t => new Date(t.updatedAt).getDay() === i).length,
    }));
    const maxDayCount = Math.max(...byDay.map(d => d.count), 1);

    // Weekly completion (last 4 weeks)
    const now = Date.now();
    const weeks = [0, 1, 2, 3].map(w => {
      const start = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      const end = now - w * 7 * 24 * 60 * 60 * 1000;
      return {
        label: w === 0 ? 'This week' : `${w}w ago`,
        count: completed.filter(t => {
          const d = new Date(t.updatedAt).getTime();
          return d >= start && d < end;
        }).length,
      };
    }).reverse();
    const maxWeek = Math.max(...weeks.map(w => w.count), 1);

    // Average completion time
    const withTimes = completed.filter(t => t.createdAt && t.updatedAt);
    const avgDays = withTimes.length > 0
      ? (withTimes.reduce((acc, t) =>
          acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0
        ) / withTimes.length / (1000 * 60 * 60 * 24)).toFixed(1)
      : '—';

    // Course performance
    const courseStats = courses.map(c => {
      const courseTasks = tasks.filter(t => t.courseId === c.id);
      const done = courseTasks.filter(t => t.completed).length;
      const rate = courseTasks.length > 0 ? done / courseTasks.length : 0;
      return { course: c, total: courseTasks.length, done, rate };
    }).filter(c => c.total > 0);

    // Most productive day
    const mostProductiveDay = byDay.reduce((a, b) => a.count > b.count ? a : b);

    return {
      total, completed: completed.length, pending: pending.length, overdue: overdue.length,
      lateCompletions: lateCompletions.length, missedDeadlines, onTimeRate,
      completionRate, byPriority, byType, byDay, maxDayCount, weeks, maxWeek,
      avgDays, courseStats, mostProductiveDay,
    };
  }, [tasks, courses]);

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      assignment: 'file-document', exam: 'pencil', project: 'folder', reading: 'book-open',
      study: 'brain', other: 'dots-horizontal',
    };
    return icons[type] || 'dots-horizontal';
  };

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      assignment: '#4A90E2', exam: '#DC2626', project: '#8B5CF6', reading: '#059669',
      study: '#D97706', other: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Analytics"
        subtitle="Your task completion reports"
        gradient={['#F59E0B', '#D97706']}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Missed Deadlines highlight */}
        <Card style={styles.deadlineCard}>
          <Card.Content>
            <View style={styles.deadlineRow}>
              <View style={styles.deadlineIcon}>
                <MaterialCommunityIcons name="calendar-alert" size={28} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={styles.deadlineTitle}>Missed Deadlines</Text>
                <Text variant="bodySmall" style={styles.deadlineMeta}>
                  {stats.overdue} currently overdue · {stats.lateCompletions} completed late
                </Text>
              </View>
              <Text variant="displaySmall" style={styles.deadlineBig}>{stats.missedDeadlines}</Text>
            </View>
            <View style={styles.deadlineRateRow}>
              <Text variant="bodySmall" style={styles.deadlineRateLabel}>On-time rate</Text>
              <Text variant="titleSmall" style={[styles.deadlineRate, { color: stats.onTimeRate >= 0.8 ? '#059669' : stats.onTimeRate >= 0.5 ? '#D97706' : '#DC2626' }]}>
                {Math.round(stats.onTimeRate * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={stats.onTimeRate}
              color={stats.onTimeRate >= 0.8 ? '#059669' : stats.onTimeRate >= 0.5 ? '#D97706' : '#DC2626'}
              style={styles.deadlineProgress}
            />
          </Card.Content>
        </Card>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total', value: stats.total, color: '#2E3A59', bg: '#F1F5F9' },
            { label: 'Done', value: stats.completed, color: '#059669', bg: '#ECFDF5' },
            { label: 'Pending', value: stats.pending, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Overdue', value: stats.overdue, color: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <View key={s.label} style={[styles.summaryBox, { backgroundColor: s.bg }]}>
              <Text variant="headlineSmall" style={[styles.summaryNum, { color: s.color }]}>{s.value}</Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Completion Rate */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Overall Completion Rate</Text>
            <View style={styles.rateRow}>
              <Text variant="displaySmall" style={styles.rateNumber}>
                {Math.round(stats.completionRate * 100)}%
              </Text>
              <View style={styles.rateDetails}>
                <Text variant="bodySmall" style={styles.rateDetail}>
                  {stats.completed} of {stats.total} tasks done
                </Text>
                <Text variant="bodySmall" style={styles.rateDetail}>
                  Avg. {stats.avgDays} days to complete
                </Text>
                <Text variant="bodySmall" style={styles.rateDetail}>
                  Most productive: {stats.mostProductiveDay.day} ({stats.mostProductiveDay.count})
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={stats.completionRate}
              color="#4A90E2"
              style={styles.mainProgress}
            />
          </Card.Content>
        </Card>

        {/* Weekly Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Weekly Completions</Text>
            <View style={styles.barChart}>
              {stats.weeks.map((w, i) => (
                <View key={i} style={styles.barColumn}>
                  <Text variant="bodySmall" style={styles.barValue}>{w.count}</Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((w.count / stats.maxWeek) * 80, 4),
                          backgroundColor: i === stats.weeks.length - 1 ? '#4A90E2' : '#BFDBFE',
                        },
                      ]}
                    />
                  </View>
                  <Text variant="bodySmall" style={styles.barLabel}>{w.label}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Day of Week Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Activity by Day</Text>
            <View style={styles.dayChart}>
              {stats.byDay.map((d, i) => (
                <View key={i} style={styles.dayColumn}>
                  <View style={styles.dayBarWrapper}>
                    <View
                      style={[
                        styles.dayBar,
                        {
                          height: Math.max((d.count / stats.maxDayCount) * 60, 4),
                          backgroundColor: d.count === stats.mostProductiveDay.count && d.count > 0
                            ? '#8B5CF6' : '#DDD6FE',
                        },
                      ]}
                    />
                  </View>
                  <Text variant="bodySmall" style={styles.dayLabel}>{d.day}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* By Priority */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Tasks by Priority</Text>
            {[
              { label: 'High', tasks: stats.byPriority.high, color: '#DC2626' },
              { label: 'Medium', tasks: stats.byPriority.medium, color: '#D97706' },
              { label: 'Low', tasks: stats.byPriority.low, color: '#059669' },
            ].map(p => {
              const done = p.tasks.filter(t => t.completed).length;
              const rate = p.tasks.length > 0 ? done / p.tasks.length : 0;
              return (
                <View key={p.label} style={styles.priorityRow}>
                  <Text variant="bodyMedium" style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
                  <View style={styles.priorityBarContainer}>
                    <ProgressBar progress={rate} color={p.color} style={styles.priorityBar} />
                  </View>
                  <Text variant="bodySmall" style={styles.priorityCount}>
                    {done}/{p.tasks.length}
                  </Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* By Task Type */}
        {stats.byType.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Tasks by Type</Text>
              {stats.byType.map(t => {
                const rate = t.total > 0 ? t.completed / t.total : 0;
                return (
                  <View key={t.type} style={styles.typeRow}>
                    <MaterialCommunityIcons
                      name={typeIcon(t.type) as any}
                      size={18}
                      color={typeColor(t.type)}
                      style={styles.typeIcon}
                    />
                    <Text variant="bodyMedium" style={styles.typeLabel}>{t.type}</Text>
                    <View style={styles.typeBarContainer}>
                      <ProgressBar progress={rate} color={typeColor(t.type)} style={styles.typeBar} />
                    </View>
                    <Text variant="bodySmall" style={styles.typeCount}>{t.completed}/{t.total}</Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Course Performance */}
        {stats.courseStats.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Course Performance</Text>
              {stats.courseStats.map(c => (
                <View key={c.course.id} style={styles.courseRow}>
                  <View style={[styles.courseDot, { backgroundColor: c.course.color }]} />
                  <View style={styles.courseInfo}>
                    <Text variant="bodySmall" style={styles.courseCode}>{c.course.code}</Text>
                    <ProgressBar progress={c.rate} color={c.course.color} style={styles.courseBar} />
                  </View>
                  <Text variant="bodySmall" style={styles.courseCount}>{c.done}/{c.total}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {tasks.length === 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="chart-bar" size={48} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>No Data Yet</Text>
              <Text variant="bodyMedium" style={styles.emptyDesc}>
                Start creating tasks to see your analytics here.
              </Text>
            </Card.Content>
          </Card>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  deadlineCard: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deadlineIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  deadlineTitle: { fontWeight: 'bold', color: '#1F2937' },
  deadlineMeta: { color: '#6B7280', marginTop: 2 },
  deadlineBig: { color: '#DC2626', fontWeight: 'bold' },
  deadlineRateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  deadlineRateLabel: { color: '#6B7280' },
  deadlineRate: { fontWeight: 'bold' },
  deadlineProgress: { height: 8, borderRadius: 4, marginTop: 6 },
  summaryBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryNum: { fontWeight: 'bold' },
  summaryLabel: { color: '#6B7280', marginTop: 2 },
  card: { marginBottom: 16, elevation: 2 },
  cardTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 16 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  rateNumber: { color: '#4A90E2', fontWeight: 'bold' },
  rateDetails: { flex: 1, gap: 4 },
  rateDetail: { color: '#6B7280' },
  mainProgress: { height: 10, borderRadius: 5 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  barColumn: { alignItems: 'center', flex: 1 },
  barValue: { color: '#4B5563', marginBottom: 4 },
  barWrapper: { height: 80, justifyContent: 'flex-end', width: '70%' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { color: '#6B7280', marginTop: 4, textAlign: 'center' },
  dayChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 80 },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayBarWrapper: { height: 60, justifyContent: 'flex-end', width: '80%' },
  dayBar: { width: '100%', borderRadius: 3 },
  dayLabel: { color: '#6B7280', marginTop: 4 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  priorityLabel: { width: 52, fontWeight: 'bold' },
  priorityBarContainer: { flex: 1 },
  priorityBar: { height: 8, borderRadius: 4 },
  priorityCount: { color: '#6B7280', width: 36, textAlign: 'right' },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  typeIcon: { width: 22 },
  typeLabel: { color: '#4B5563', width: 70, textTransform: 'capitalize' },
  typeBarContainer: { flex: 1 },
  typeBar: { height: 6, borderRadius: 3 },
  typeCount: { color: '#6B7280', width: 36, textAlign: 'right' },
  courseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  courseDot: { width: 10, height: 10, borderRadius: 5 },
  courseInfo: { flex: 1 },
  courseCode: { color: '#4B5563', marginBottom: 4 },
  courseBar: { height: 6, borderRadius: 3 },
  courseCount: { color: '#6B7280', width: 36, textAlign: 'right' },
  emptyContent: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { color: '#2E3A59', fontWeight: 'bold' },
  emptyDesc: { color: '#6B7280', textAlign: 'center' },
});
