import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';

import { useAppDispatch, useAppSelector } from '../store/store';
import { loginUser, clearError } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="clipboard-text" size={64} color="#2E3A59" />
          <Text variant="headlineMedium" style={styles.title}>
            TaskChamp
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Welcome back! Please sign in to continue.
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
            >
              Don't have an account? Sign Up
            </Button>
          </Card.Content>
        </Card>

        <Snackbar
          visible={!!error}
          onDismiss={handleDismissError}
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
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#2E3A59',
  },
  buttonContent: {
    height: 48,
  },
  registerButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#DC2626',
  },
});
