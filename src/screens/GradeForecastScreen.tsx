import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';

import { useAppSelector } from '../store/store';
import { MainStackParamList } from '../types';
import { getGradeForecasts, GradeForecast } from '../services/geminiService';

type Props = StackScreenProps<MainStackParamList, 'GradeForecast'>;

export default function GradeForecastScreen({ navigation }: Props) {
  const { tasks } = useAppSelector(state => state.tasks);
  const { courses } = useAppSelector(state => state.academic);

  const [forecasts, setForecasts] = useState<GradeForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecasts = useCallback(async () => {
    if (courses.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGradeForecasts(courses, tasks);
      setForecasts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate grade forecasts.');
    } finally {
      setIsLoading(false);
    }
  }, [courses, tasks]);

  useEffect(() => {
    fetchForecasts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchForecasts();
    setRefreshing(false);
  }, [fetchForecasts]);

  const riskColor = (risk: GradeForecast['riskLevel']) => {
    return { low: '#059669', medium: '#D97706', high: '#DC2626' }[risk];
  };

  const riskBg = (risk: GradeForecast['riskLevel']) => {
    return { low: '#ECFDF5', medium: '#FFFBEB', high: '#FEF2F2' }[risk];
  };

  const confidenceLabel = (c: GradeForecast['confidence']) => {
    return { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' }[c];
  };

  const gradeColor = (grade: number) => {
    if (grade >= 90) return '#059669';
    if (grade >= 85) return '#4A90E2';
    if (grade >= 80) return '#D97706';
    if (grade >= 75) return '#F59E0B';
    return '#DC2626';
  };

  const gradeLabel = (grade: number) => {
    if (grade >= 90) return 'Outstanding';
    if (grade >= 85) return 'Excellent';
    if (grade >= 80) return 'Good';
    if (grade >= 75) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Grade Forecast"
        subtitle="TASK AI grade predictions for your courses"
        gradient={['#059669', '#047857']}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* Header Info */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <MaterialCommunityIcons name="robot" size={24} color="#059669" />
            <View style={styles.infoText}>
              <Text variant="titleSmall" style={styles.infoTitle}>TASK AI Forecasting</Text>
              <Text variant="bodySmall" style={styles.infoDesc}>
                Forecasts are based on your task completion rates, grades, and workload using the Philippine grading system (75 passing).
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator color="#059669" />
              <Text variant="bodyMedium" style={styles.loadingText}>Analyzing your academic performance...</Text>
            </Card.Content>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
              <Button mode="contained" onPress={fetchForecasts} style={styles.retryBtn} buttonColor="#059669">
                Try Again
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* No courses */}
        {!isLoading && courses.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="school-outline" size={48} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>No Courses Found</Text>
              <Text variant="bodyMedium" style={styles.emptyDesc}>
                Go to the Academic tab to add your courses first.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Forecast Cards */}
        {!isLoading && forecasts.map((forecast, i) => {
          const course = courses.find(c => c.id === forecast.courseId);
          const courseColor = course?.color || '#4A90E2';
          const diff = forecast.forecastedGrade - forecast.currentGrade;

          return (
            <Card key={i} style={[styles.forecastCard, { borderLeftColor: courseColor, borderLeftWidth: 4 }]}>
              <Card.Content>
                {/* Course header */}
                <View style={styles.courseHeader}>
                  <View style={[styles.courseColorDot, { backgroundColor: courseColor }]} />
                  <View style={styles.courseInfo}>
                    <Text variant="titleMedium" style={styles.courseName}>{forecast.courseName}</Text>
                    <View style={styles.riskRow}>
                      <View style={[styles.riskBadge, { backgroundColor: riskBg(forecast.riskLevel) }]}>
                        <Text style={[styles.riskText, { color: riskColor(forecast.riskLevel) }]}>
                          {forecast.riskLevel.toUpperCase()} RISK
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.confidenceText}>
                        {confidenceLabel(forecast.confidence)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Grade comparison */}
                <View style={styles.gradeRow}>
                  <View style={styles.gradeBox}>
                    <Text variant="bodySmall" style={styles.gradeBoxLabel}>Current</Text>
                    <Text variant="headlineSmall" style={[styles.gradeValue, { color: gradeColor(forecast.currentGrade) }]}>
                      {forecast.currentGrade.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.gradeArrow}>
                    <MaterialIcons
                      name={diff >= 0 ? 'trending-up' : 'trending-down'}
                      size={28}
                      color={diff >= 0 ? '#059669' : '#DC2626'}
                    />
                    <Text style={[styles.diffText, { color: diff >= 0 ? '#059669' : '#DC2626' }]}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.gradeBox}>
                    <Text variant="bodySmall" style={styles.gradeBoxLabel}>Forecast</Text>
                    <Text variant="headlineSmall" style={[styles.gradeValue, { color: gradeColor(forecast.forecastedGrade) }]}>
                      {forecast.forecastedGrade.toFixed(1)}
                    </Text>
                    <Text variant="bodySmall" style={[styles.gradeLabel, { color: gradeColor(forecast.forecastedGrade) }]}>
                      {gradeLabel(forecast.forecastedGrade)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={Math.min(forecast.forecastedGrade / 100, 1)}
                    color={gradeColor(forecast.forecastedGrade)}
                    style={styles.gradeProgress}
                  />
                  <View style={styles.passingLine}>
                    <Text variant="bodySmall" style={styles.passingLabel}>75 (passing)</Text>
                  </View>
                </View>

                {/* AI Recommendation */}
                <View style={styles.recommendationBox}>
                  <MaterialCommunityIcons name="robot" size={16} color="#8B5CF6" />
                  <Text variant="bodySmall" style={styles.recommendationText}>{forecast.recommendation}</Text>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        {/* Refresh button */}
        {!isLoading && forecasts.length > 0 && (
          <Button mode="outlined" onPress={fetchForecasts} icon="refresh" style={styles.refreshBtn}>
            Recalculate Forecasts
          </Button>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  infoCard: { marginBottom: 16, backgroundColor: '#ECFDF5', elevation: 1 },
  infoContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoText: { flex: 1 },
  infoTitle: { color: '#047857', fontWeight: 'bold', marginBottom: 4 },
  infoDesc: { color: '#065F46', lineHeight: 18 },
  loadingCard: { elevation: 2, marginBottom: 12 },
  loadingContent: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', paddingVertical: 12 },
  loadingText: { color: '#6B7280' },
  errorCard: { elevation: 2, marginBottom: 12, backgroundColor: '#FEF2F2' },
  errorText: { color: '#DC2626', marginBottom: 12 },
  retryBtn: { alignSelf: 'flex-start' },
  emptyCard: { elevation: 2 },
  emptyContent: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { color: '#2E3A59', fontWeight: 'bold' },
  emptyDesc: { color: '#6B7280', textAlign: 'center' },
  forecastCard: { marginBottom: 16, elevation: 3 },
  courseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  courseColorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  courseInfo: { flex: 1 },
  courseName: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 6 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  riskText: { fontSize: 10, fontWeight: 'bold' },
  confidenceText: { color: '#9CA3AF' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16 },
  gradeBox: { alignItems: 'center' },
  gradeBoxLabel: { color: '#9CA3AF', marginBottom: 4 },
  gradeValue: { fontWeight: 'bold' },
  gradeLabel: { fontSize: 11, marginTop: 2 },
  gradeArrow: { alignItems: 'center' },
  diffText: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  progressContainer: { marginBottom: 12 },
  gradeProgress: { height: 8, borderRadius: 4 },
  passingLine: { marginTop: 4, alignItems: 'flex-start', paddingLeft: '75%' },
  passingLabel: { color: '#9CA3AF', fontSize: 10 },
  recommendationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F5F3FF', padding: 10, borderRadius: 8 },
  recommendationText: { color: '#4B5563', flex: 1, lineHeight: 18 },
  refreshBtn: { marginTop: 8, borderColor: '#059669' },
});
