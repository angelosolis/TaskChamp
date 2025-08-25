import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../store/store';
import { loadUser } from '../store/slices/authSlice';
import { loadTasks } from '../store/slices/taskSlice';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TaskListScreen from '../screens/TaskListScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import AIInsightsScreen from '../screens/AIInsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

import { RootStackParamList, MainTabParamList, TaskStackParamList } from '../types';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const TaskStack = createStackNavigator<TaskStackParamList>();

function TaskNavigator() {
  return (
    <TaskStack.Navigator screenOptions={{ headerShown: false }}>
      <TaskStack.Screen
        name="TaskList"
        component={TaskListScreen}
      />
      <TaskStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
      />
    </TaskStack.Navigator>
  );
}

function MainTabNavigator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadTasks());
  }, [dispatch]);

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
        name="Tasks"
        component={TaskNavigator}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
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
        name="AIInsights"
        component={AIInsightsScreen}
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
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
