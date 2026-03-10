import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';

import { useAppDispatch, useAppSelector } from '../store/store';
import { resetPassword, clearError } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'PasswordReset'>;

export default function PasswordResetScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const handleReset = async () => {
    if (!email.trim()) return;
    try {
      await dispatch(resetPassword({ email: email.trim() })).unwrap();
      setSubmitted(true);
    } catch {
      // error handled by Redux
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <MaterialCommunityIcons name="email-check" size={80} color="#059669" />
          <Text variant="headlineSmall" style={styles.successTitle}>Check your email</Text>
          <Text variant="bodyLarge" style={styles.successText}>
            We sent a password reset link to{'\n'}
            <Text style={styles.emailBold}>{email}</Text>
          </Text>
          <Text variant="bodyMedium" style={styles.successNote}>
            (This is a demo — in production, a real email would be sent.)
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
            buttonColor="#2E3A59"
          >
            Back to Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="lock-reset" size={64} color="#2E3A59" />
          <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <Button
              mode="contained"
              onPress={handleReset}
              style={styles.resetButton}
              contentStyle={styles.buttonContent}
              disabled={isLoading || !email.trim()}
              loading={isLoading}
              buttonColor="#2E3A59"
            >
              Send Reset Link
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.backLink}
            >
              Back to Login
            </Button>
          </Card.Content>
        </Card>

        <Snackbar
          visible={!!error}
          onDismiss={() => dispatch(clearError())}
          duration={4000}
          style={styles.snackbar}
        >
          {error}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { color: '#2E3A59', fontWeight: 'bold', marginTop: 16 },
  subtitle: { color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  card: { elevation: 4, backgroundColor: '#FFFFFF' },
  cardContent: { padding: 24 },
  input: { marginBottom: 16 },
  resetButton: { marginTop: 8, marginBottom: 16 },
  buttonContent: { height: 48 },
  backLink: { marginTop: 4 },
  snackbar: { backgroundColor: '#DC2626' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successTitle: { color: '#2E3A59', fontWeight: 'bold' },
  successText: { color: '#4B5563', textAlign: 'center', lineHeight: 24 },
  emailBold: { color: '#2E3A59', fontWeight: 'bold' },
  successNote: { color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
  backButton: { marginTop: 8, paddingHorizontal: 24 },
});
