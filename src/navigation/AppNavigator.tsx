import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppState } from 'react-native';

import { useAppDispatch, useAppSelector } from '../store/store';
import { loadUser } from '../store/slices/authSlice';
import { loadTasks } from '../store/slices/taskSlice';
import { loadEvents } from '../store/slices/calendarSlice';
import { inAppAlertService } from '../services/inAppAlertService';
import { useNotification } from '../components/NotificationProvider';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TaskListScreen from '../screens/TaskListScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AcademicScreen from '../screens/AcademicScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import AIInsightsScreen from '../screens/AIInsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import KanbanScreen from '../screens/KanbanScreen';

import { RootStackParamList, MainTabParamList, MainStackParamList } from '../types';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

function TabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        headerShown: false, // Remove all headers for modern look
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Academic"
        component={AcademicScreen}
        options={{
          title: 'Academic',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="school" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Create"
        component={CreateTaskScreen}
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

function MainTabNavigator() {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { showSuccess, showWarning, showError, showInfo } = useNotification();

  // Inject notification functions into the service
  useEffect(() => {
    inAppAlertService.setNotificationFunctions({
      showSuccess,
      showWarning,
      showError,
      showInfo,
    });
  }, [showSuccess, showWarning, showError, showInfo]);

  useEffect(() => {
    dispatch(loadTasks());
    dispatch(loadEvents());
  }, [dispatch]);

  // Check for alerts when tasks load or app becomes active
  useEffect(() => {
    if (tasks.length > 0) {
      // Small delay to let the app finish loading
      setTimeout(() => {
        inAppAlertService.checkAndShowAlerts(tasks);
      }, 1000);
    }
  }, [tasks]);

  // Listen for app state changes to show alerts when returning to app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && tasks.length > 0) {
        setTimeout(() => {
          inAppAlertService.checkAndShowAlerts(tasks);
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [tasks]);

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={TabNavigator} />
      <MainStack.Screen name="TaskList" component={TaskListScreen} />
      <MainStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <MainStack.Screen name="AIInsights" component={AIInsightsScreen} />
      <MainStack.Screen name="KanbanBoard" component={KanbanScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
