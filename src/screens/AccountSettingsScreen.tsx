import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, Avatar, Snackbar, Switch, Divider, ActivityIndicator } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModernHeader from '../components/ModernHeader';

import { useAppDispatch, useAppSelector } from '../store/store';
import { MainStackParamList } from '../types';
import { loadUser } from '../store/slices/authSlice';
import { notificationService } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

type Props = StackScreenProps<MainStackParamList, 'AccountSettings'>;

export default function AccountSettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersBefore, setRemindersBefore] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const testNotification = async (type: 'immediate' | '5sec' | 'event') => {
    setIsTesting(true);
    try {
      const initialized = await notificationService.initialize();
      if (!initialized) {
        setSnackMsg('Notification permission denied. Please enable in device settings.');
        return;
      }

      if (type === 'immediate') {
        await notificationService.sendImmediateNotification(
          '🔔 Test Notification',
          'TaskChamp notifications are working!',
          { type: 'test' }
        );
        setSnackMsg('Notification sent! Check your notification shade.');
      } else if (type === '5sec') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Deadline Reminder (Test)',
            body: '"CS Finals Exam" is due in 2 hours!',
            sound: 'default',
          },
          trigger: { date: new Date(Date.now() + 5000), channelId: 'task-reminders' } as any,
        });
        setSnackMsg('Task reminder in 5 seconds — minimize the app!');
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📝 Tomorrow: Math Midterm Exam (Test)',
            body: 'Scheduled for tomorrow. Review your notes tonight!',
            sound: 'default',
          },
          trigger: { date: new Date(Date.now() + 5000), channelId: 'calendar-events' } as any,
        });
        setSnackMsg('Calendar event notification in 5 seconds — minimize the app!');
      }
    } catch (e) {
      setSnackMsg('Failed to send notification.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setSnackMsg('Name and email are required.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = { ...user, name: name.trim(), email: email.trim() };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      await dispatch(loadUser());
      setSnackMsg('Profile updated successfully!');
    } catch {
      setSnackMsg('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Account Settings"
        subtitle="Update your profile and preferences"
        gradient={['#6366F1', '#4F46E5']}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar */}
        <Card style={styles.card}>
          <Card.Content style={styles.avatarSection}>
            <Avatar.Text
              size={72}
              label={name.substring(0, 2).toUpperCase() || 'U'}
              style={styles.avatar}
              labelStyle={{ color: '#FFF', fontWeight: 'bold' }}
            />
            <Text variant="bodySmall" style={styles.avatarHint}>
              Avatar is auto-generated from your name
            </Text>
          </Card.Content>
        </Card>

        {/* Profile Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Profile Information</Text>

            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
              buttonColor="#6366F1"
            >
              Save Changes
            </Button>
          </Card.Content>
        </Card>

        {/* Notification Preferences */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Notification Preferences</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium" style={styles.switchLabel}>Enable Notifications</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>
                  Receive alerts for due tasks and deadlines
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color="#6366F1"
              />
            </View>

            <Divider style={styles.divider} />

            {notificationsEnabled && (
              <TextInput
                label="Remind me (minutes before deadline)"
                value={remindersBefore}
                onChangeText={setRemindersBefore}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
                left={<TextInput.Icon icon="bell" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Academic Context */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Academic Context</Text>
            <Text variant="bodySmall" style={styles.contextNote}>
              TaskChamp is optimized for Filipino college students using the Philippine grading system (75 passing grade).
              AI features are tailored to local academic culture including semester-based scheduling, midterms, finals, and group work norms.
            </Text>
          </Card.Content>
        </Card>

        {/* Notification Test */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.testHeader}>
              <MaterialCommunityIcons name="bell-ring" size={20} color="#6366F1" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Test Notifications</Text>
            </View>
            <Text variant="bodySmall" style={styles.contextNote}>
              Tap a button below to verify notifications are working on your device.
              Minimize the app after tapping "5 sec" tests.
            </Text>

            {isTesting && <ActivityIndicator style={{ marginVertical: 8 }} color="#6366F1" />}

            <Button
              mode="contained"
              onPress={() => testNotification('immediate')}
              disabled={isTesting}
              style={styles.testBtn}
              buttonColor="#6366F1"
              icon="bell"
              labelStyle={{ color: '#fff' }}
            >
              Send Immediate Notification
            </Button>

            <Button
              mode="outlined"
              onPress={() => testNotification('5sec')}
              disabled={isTesting}
              style={styles.testBtn}
              icon="clock-alert"
            >
              Task Deadline Reminder (5s)
            </Button>

            <Button
              mode="outlined"
              onPress={() => testNotification('event')}
              disabled={isTesting}
              style={styles.testBtn}
              icon="calendar-clock"
            >
              Calendar Event Alert (5s)
            </Button>
          </Card.Content>
        </Card>

      </ScrollView>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3000}
        style={snackMsg.includes('success') ? styles.snackSuccess : styles.snackError}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  card: { marginBottom: 16, elevation: 2 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  avatar: { backgroundColor: '#6366F1' },
  avatarHint: { color: '#9CA3AF' },
  sectionTitle: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 0 },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { color: '#2E3A59', fontWeight: '500' },
  switchDesc: { color: '#9CA3AF', marginTop: 2 },
  divider: { marginVertical: 16 },
  contextNote: { color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  testBtn: { marginTop: 8 },
  snackSuccess: { backgroundColor: '#059669' },
  snackError: { backgroundColor: '#DC2626' },
});
