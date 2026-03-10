import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Divider, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModernHeader from '../components/ModernHeader';

import { useAppDispatch } from '../store/store';
import { logoutUser } from '../store/slices/authSlice';
import { MainStackParamList } from '../types';

type Props = StackScreenProps<MainStackParamList, 'DataPrivacy'>;

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card style={sectionStyles.card}>
    <Card.Content>
      <Text variant="titleMedium" style={sectionStyles.title}>{title}</Text>
      {children}
    </Card.Content>
  </Card>
);

const sectionStyles = StyleSheet.create({
  card: { marginBottom: 16, elevation: 2 },
  title: { color: '#2E3A59', fontWeight: 'bold', marginBottom: 12 },
});

export default function DataPrivacyScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your tasks, courses, and account data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            dispatch(logoutUser());
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'In a production app, this would export all your data as a JSON file. This is a demo placeholder.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Data & Privacy"
        subtitle="Manage your data and privacy settings"
        gradient={['#374151', '#1F2937']}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* What we store */}
        <SECTION title="What Data We Store">
          <Text variant="bodySmall" style={styles.bodyText}>
            TaskChamp stores the following data <Text style={styles.bold}>locally on your device</Text> only:
          </Text>
          {[
            { icon: 'account', text: 'Your name and email address' },
            { icon: 'clipboard-list', text: 'Your tasks, priorities, and deadlines' },
            { icon: 'school', text: 'Your courses and academic records' },
            { icon: 'calendar', text: 'Your calendar events' },
            { icon: 'timer', text: 'Study session history' },
          ].map((item, i) => (
            <View key={i} style={styles.dataItem}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color="#6366F1" />
              <Text variant="bodySmall" style={styles.dataItemText}>{item.text}</Text>
            </View>
          ))}
        </SECTION>

        {/* AI Data Usage */}
        <SECTION title="AI Features (TASK AI)">
          <Text variant="bodySmall" style={styles.bodyText}>
            When you use AI Insights or Grade Forecasting, a <Text style={styles.bold}>summary of your task data</Text> (counts, types, priorities — no personal identifiers) is processed by TASK AI, a lightweight LLM optimized for Android, to generate recommendations.
          </Text>
          <Text variant="bodySmall" style={[styles.bodyText, { marginTop: 8 }]}>
            No personal data is permanently stored by TASK AI from these requests.
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text variant="bodyMedium" style={styles.switchLabel}>Enable AI Features</Text>
              <Text variant="bodySmall" style={styles.switchDesc}>Allow task data to be processed by TASK AI</Text>
            </View>
            <Switch value={aiConsent} onValueChange={setAiConsent} color="#6366F1" />
          </View>

          <View style={[styles.switchRow, { marginTop: 12 }]}>
            <View style={styles.switchInfo}>
              <Text variant="bodyMedium" style={styles.switchLabel}>Analytics</Text>
              <Text variant="bodySmall" style={styles.switchDesc}>Allow local usage analytics for insights</Text>
            </View>
            <Switch value={analyticsConsent} onValueChange={setAnalyticsConsent} color="#6366F1" />
          </View>
        </SECTION>

        {/* Philippine Data Privacy Act */}
        <SECTION title="Republic Act 10173 — Data Privacy Act">
          <Text variant="bodySmall" style={styles.bodyText}>
            In compliance with the <Text style={styles.bold}>Philippine Data Privacy Act of 2012 (RA 10173)</Text>, TaskChamp:
          </Text>
          {[
            'Collects only data necessary for app functionality',
            'Stores all data locally on your device — no cloud servers',
            'Does not sell or share your personal data with third parties',
            'Gives you full control to export or delete your data at any time',
            'Uses secure storage practices for all personal information',
          ].map((item, i) => (
            <View key={i} style={styles.bulletItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
              <Text variant="bodySmall" style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </SECTION>

        {/* Your Rights */}
        <SECTION title="Your Rights">
          <List.Item
            title="Export My Data"
            description="Download all your data as a file"
            left={p => <MaterialCommunityIcons {...p} name="download" size={22} color="#4A90E2" style={{ marginLeft: 8 }} />}
            right={p => <MaterialCommunityIcons {...p} name="chevron-right" size={22} color="#9CA3AF" />}
            onPress={handleExportData}
          />
          <Divider />
          <List.Item
            title="Delete All My Data"
            description="Permanently erase everything and log out"
            left={p => <MaterialCommunityIcons {...p} name="delete-forever" size={22} color="#DC2626" style={{ marginLeft: 8 }} />}
            right={p => <MaterialCommunityIcons {...p} name="chevron-right" size={22} color="#9CA3AF" />}
            onPress={handleDeleteAllData}
            titleStyle={{ color: '#DC2626' }}
          />
        </SECTION>

        <Text variant="bodySmall" style={styles.footer}>
          TaskChamp v1.0.0 — For academic use by Filipino college students.{'\n'}
          Last updated: March 2026
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  bodyText: { color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  bold: { fontWeight: 'bold', color: '#2E3A59' },
  dataItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dataItemText: { color: '#4B5563', flex: 1 },
  divider: { marginVertical: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { color: '#2E3A59', fontWeight: '500' },
  switchDesc: { color: '#9CA3AF', marginTop: 2 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bulletText: { color: '#4B5563', flex: 1, lineHeight: 18 },
  footer: { color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
