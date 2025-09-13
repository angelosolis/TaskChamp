import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Surface, Chip, ProgressBar, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppDispatch, useAppSelector } from '../store/store';
import { initializeDefaultCourses, addCourse } from '../store/slices/academicSlice';
import StudyTimerWidget from '../components/StudyTimerWidget';
import ModernHeader from '../components/ModernHeader';
import { studyTimerService } from '../services/studyTimerService';
import { MainTabParamList, MainStackParamList } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Academic'>,
  StackScreenProps<MainStackParamList>
>;

export default function AcademicScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { courses } = useAppSelector((state) => state.academic);
  const [studyStats, setStudyStats] = useState<any>(null);

  // Initialize courses and load study stats
  useEffect(() => {
    if (courses.length === 0) {
      dispatch(initializeDefaultCourses());
    }
    
    // Load study statistics
    studyTimerService.getStudyStats(7).then(setStudyStats);
  }, [dispatch, courses.length]);

  // Academic Statistics
  const getAcademicStats = () => {
    const academicTasks = tasks.filter(task => task.taskType !== 'other');
    const courseStats = new Map();

    // Calculate stats per course
    academicTasks.forEach(task => {
      if (task.courseId) {
        const course = courses.find(c => c.id === task.courseId);
        if (course) {
          if (!courseStats.has(course.id)) {
            courseStats.set(course.id, {
              course,
              totalTasks: 0,
              completedTasks: 0,
              totalGrades: 0,
              gradeCount: 0,
              totalTime: 0,
            });
          }
          
          const stats = courseStats.get(course.id);
          stats.totalTasks++;
          if (task.completed) stats.completedTasks++;
          if (task.grade !== undefined) {
            stats.totalGrades += task.grade;
            stats.gradeCount++;
          }
          if (task.actualTime) stats.totalTime += task.actualTime;
        }
      }
    });

    return {
      totalAcademicTasks: academicTasks.length,
      completedAcademicTasks: academicTasks.filter(t => t.completed).length,
      averageGrade: academicTasks.filter(t => t.grade !== undefined).length > 0 
        ? academicTasks.filter(t => t.grade !== undefined).reduce((sum, t) => sum + (t.grade || 0), 0) / academicTasks.filter(t => t.grade !== undefined).length 
        : null,
      courseStats: Array.from(courseStats.values()),
    };
  };

  const stats = getAcademicStats();

  const CourseCard = ({ courseData }: { courseData: any }) => {
    const { course, totalTasks, completedTasks, totalGrades, gradeCount, totalTime } = courseData;
    const completion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageGrade = gradeCount > 0 ? totalGrades / gradeCount : null;

    return (
      <Card style={[styles.courseCard, { borderLeftColor: course.color }]}>
        <Card.Content style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={styles.courseInfo}>
              <View style={[styles.courseColorDot, { backgroundColor: course.color }]} />
              <View>
                <Text variant="titleMedium" style={styles.courseCode}>
                  {course.code}
                </Text>
                <Text variant="bodySmall" style={styles.courseName}>
                  {course.name}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.completionText}>
              {Math.round(completion)}% Complete
            </Text>
          </View>

          <ProgressBar 
            progress={completion / 100} 
            color={course.color} 
            style={styles.courseProgress} 
          />

          <View style={styles.courseStats}>
            <View style={styles.courseStat}>
              <Text variant="bodySmall" style={styles.statLabel}>Tasks</Text>
              <Text variant="bodyMedium" style={styles.statValue}>
                {completedTasks}/{totalTasks}
              </Text>
            </View>
            
            {averageGrade && (
              <View style={styles.courseStat}>
                <Text variant="bodySmall" style={styles.statLabel}>Avg Grade</Text>
                <Text variant="bodyMedium" style={[styles.statValue, { color: course.color }]}>
                  {Math.round(averageGrade)}%
                </Text>
              </View>
            )}
            
            {totalTime > 0 && (
              <View style={styles.courseStat}>
                <Text variant="bodySmall" style={styles.statLabel}>Study Time</Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {Math.round(totalTime / 60)}h
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Academic Hub"
        subtitle="Track your academic progress"
        gradient={['#8B5CF6', '#3B82F6']}
        rightElement={
          <IconButton
            icon="cog"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => navigation.navigate('Profile')}
          />
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Study Timer Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🧠 Study Timer
          </Text>
          <StudyTimerWidget 
            onTimerStart={() => console.log('Timer started')}
            onTimerComplete={(minutes) => console.log(`Completed ${minutes} minutes`)}
          />
          
          {studyStats && (
            <Card style={styles.statsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Study Statistics (This Week)
                </Text>
                <View style={styles.studyStatsGrid}>
                  <View style={styles.studyStat}>
                    <Text variant="headlineMedium" style={[styles.studyStatNumber, { color: '#10B981' }]}>
                      {studyStats.totalSessions}
                    </Text>
                    <Text variant="bodySmall" style={styles.studyStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.studyStat}>
                    <Text variant="headlineMedium" style={[styles.studyStatNumber, { color: '#F59E0B' }]}>
                      {Math.round(studyStats.totalMinutes / 60)}
                    </Text>
                    <Text variant="bodySmall" style={styles.studyStatLabel}>Hours</Text>
                  </View>
                  <View style={styles.studyStat}>
                    <Text variant="headlineMedium" style={[styles.studyStatNumber, { color: '#8B5CF6' }]}>
                      {studyStats.productivityStreak}
                    </Text>
                    <Text variant="bodySmall" style={styles.studyStatLabel}>Day Streak</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Academic Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📚 Academic Overview
            </Text>
            <Button 
              mode="outlined" 
              compact
              onPress={() => navigation.navigate('Create')}
            >
              + Add Task
            </Button>
          </View>

          <View style={styles.overviewGrid}>
            <Surface style={styles.overviewCard} elevation={2}>
              <MaterialCommunityIcons name="clipboard-list" size={24} color="#667eea" />
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {stats.totalAcademicTasks}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Academic Tasks
              </Text>
            </Surface>

            <Surface style={styles.overviewCard} elevation={2}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {stats.completedAcademicTasks}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Completed
              </Text>
            </Surface>

            <Surface style={styles.overviewCard} elevation={2}>
              <MaterialCommunityIcons name="trophy" size={24} color="#F59E0B" />
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {stats.averageGrade ? `${Math.round(stats.averageGrade)}%` : '--'}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Avg Grade
              </Text>
            </Surface>

            <Surface style={styles.overviewCard} elevation={2}>
              <MaterialCommunityIcons name="school" size={24} color="#8B5CF6" />
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {courses.length}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Courses
              </Text>
            </Surface>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Courses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🎓 Course Progress
            </Text>
            <Button 
              mode="text" 
              compact
              onPress={() => {
                const newCourse = {
                  code: 'NEW101',
                  name: 'New Course',
                };
                dispatch(addCourse(newCourse));
              }}
            >
              + Course
            </Button>
          </View>

          {stats.courseStats.length > 0 ? (
            stats.courseStats.map((courseData: any) => (
              <CourseCard key={courseData.course.id} courseData={courseData} />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="school-outline" size={48} color="#9CA3AF" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No Course Data Yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Create tasks and assign them to courses to see progress here
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('Create')}
                  style={styles.emptyButton}
                  buttonColor="#667eea"
                >
                  Create Academic Task
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Create')}
            style={styles.actionButton}
            buttonColor="#10B981"
          >
            <MaterialCommunityIcons name="plus" size={20} />
            New Assignment
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('KanbanBoard')}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="view-column" size={20} />
            Kanban View
          </Button>
        </View>

        <View style={styles.bottomPadding} />
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
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  
  // Study Stats
  statsCard: {
    marginTop: 12,
    elevation: 2,
  },
  cardTitle: {
    color: '#2E3A59',
    marginBottom: 16,
    textAlign: 'center',
  },
  studyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  studyStat: {
    alignItems: 'center',
  },
  studyStatNumber: {
    fontWeight: 'bold',
  },
  studyStatLabel: {
    color: '#6B7280',
    marginTop: 4,
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  overviewNumber: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  overviewLabel: {
    color: '#6B7280',
    textAlign: 'center',
  },

  // Course Cards
  courseCard: {
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courseCode: {
    color: '#2E3A59',
    fontWeight: 'bold',
  },
  courseName: {
    color: '#6B7280',
    marginTop: 2,
  },
  completionText: {
    color: '#10B981',
    fontWeight: '500',
  },
  courseProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  courseStat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    color: '#2E3A59',
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    color: '#2E3A59',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 8,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  bottomPadding: {
    height: 32,
  },
});
