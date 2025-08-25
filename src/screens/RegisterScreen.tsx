import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';

import { useAppDispatch, useAppSelector } from '../store/store';
import { registerUser, clearError } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return;
    }

    if (password !== confirmPassword) {
      // You could add a local error state here for password mismatch
      return;
    }

    try {
      await dispatch(registerUser({ 
        name: name.trim(), 
        email: email.trim(), 
        password 
      })).unwrap();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  const isFormValid = () => {
    return (
      name.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword
    );
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
            Join TaskChamp
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Create an account to start managing your tasks effectively.
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoComplete="name"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

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
              autoComplete="password-new"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              error={confirmPassword.trim() && password !== confirmPassword}
            />

            {confirmPassword.trim() && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                'Create Account'
              )}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Already have an account? Sign In
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
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#2E3A59',
  },
  buttonContent: {
    height: 48,
  },
  loginButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#DC2626',
  },
});
