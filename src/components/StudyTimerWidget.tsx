import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, ProgressBar, IconButton, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { studyTimerService, TimerState } from '../services/studyTimerService';

interface StudyTimerWidgetProps {
  taskId?: string;
  onTimerStart?: () => void;
  onTimerComplete?: (minutes: number) => void;
  compact?: boolean;
}

export default function StudyTimerWidget({ 
  taskId, 
  onTimerStart, 
  onTimerComplete, 
  compact = false 
}: StudyTimerWidgetProps) {
  const [timerState, setTimerState] = useState<TimerState>(studyTimerService.getState());
  const [customMinutes, setCustomMinutes] = useState('');

  const DURATION_PRESETS = [15, 25, 45, 60];

  const applyDuration = (minutes: number) => {
    if (timerState.isActive || !Number.isFinite(minutes) || minutes <= 0) return;
    studyTimerService.setTimerDuration(Math.min(minutes, 180));
  };

  const applyCustomDuration = () => {
    const parsed = parseInt(customMinutes, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      applyDuration(parsed);
      setCustomMinutes('');
    }
  };

  const currentMinutes = Math.round(timerState.initialTime / 60);

  useEffect(() => {
    const unsubscribe = studyTimerService.subscribe((state) => {
      setTimerState(state);
      
      // Notify parent when timer completes
      if (!state.isActive && state.timeLeft === 0 && onTimerComplete) {
        const completedMinutes = Math.floor(state.initialTime / 60);
        onTimerComplete(completedMinutes);
      }
    });

    return unsubscribe;
  }, [onTimerComplete]);

  const handleStartStop = () => {
    if (timerState.isActive) {
      if (timerState.isPaused) {
        studyTimerService.startTimer(taskId);
        onTimerStart?.();
      } else {
        studyTimerService.pauseTimer();
      }
    } else {
      studyTimerService.startTimer(taskId);
      onTimerStart?.();
    }
  };

  const handleReset = () => {
    studyTimerService.stopTimer();
  };

  const handleSwitchMode = () => {
    if (!timerState.isActive) {
      const newMode = timerState.sessionType === 'focus' ? 'break' : 'focus';
      studyTimerService.switchSessionType(newMode);
    }
  };

  const progress = timerState.initialTime > 0 ? 
    (timerState.initialTime - timerState.timeLeft) / timerState.initialTime : 0;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = () => {
    return timerState.sessionType === 'focus' ? 'brain' : 'coffee';
  };

  const getSessionColor = () => {
    return timerState.sessionType === 'focus' ? '#2E3A59' : '#10B981';
  };

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactTimer}>
            <MaterialCommunityIcons 
              name={getSessionIcon()} 
              size={20} 
              color={getSessionColor()} 
            />
            <Text variant="bodyMedium" style={[styles.compactTime, { color: getSessionColor() }]}>
              {formatTime(timerState.timeLeft)}
            </Text>
            <IconButton
              icon={timerState.isActive && !timerState.isPaused ? 'pause' : 'play'}
              size={16}
              onPress={handleStartStop}
              style={styles.compactButton}
            />
          </View>
          {timerState.isActive && (
            <ProgressBar 
              progress={progress} 
              color={getSessionColor()} 
              style={styles.compactProgress}
            />
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.sessionInfo}>
            <MaterialCommunityIcons 
              name={getSessionIcon()} 
              size={24} 
              color={getSessionColor()} 
            />
            <Text variant="titleMedium" style={[styles.sessionTitle, { color: getSessionColor() }]}>
              {timerState.sessionType === 'focus' ? 'Focus Time' : 'Break Time'}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.sessionCount}>
            Sessions: {timerState.completedSessions}
          </Text>
        </View>

        <View style={styles.timerDisplay}>
          <Text variant="headlineLarge" style={[styles.timeText, { color: getSessionColor() }]}>
            {formatTime(timerState.timeLeft)}
          </Text>
          <Text variant="bodyMedium" style={styles.initialTime}>
            / {formatTime(timerState.initialTime)}
          </Text>
        </View>

        {timerState.isActive && (
          <ProgressBar
            progress={progress}
            color={getSessionColor()}
            style={styles.progressBar}
          />
        )}

        {!timerState.isActive && timerState.sessionType === 'focus' && (
          <View style={styles.durationPicker}>
            <Text variant="bodySmall" style={styles.durationLabel}>Duration</Text>
            <View style={styles.presetRow}>
              {DURATION_PRESETS.map((mins) => {
                const selected = currentMinutes === mins;
                return (
                  <Button
                    key={mins}
                    mode={selected ? 'contained' : 'outlined'}
                    compact
                    onPress={() => applyDuration(mins)}
                    style={styles.presetButton}
                    contentStyle={styles.presetButtonContent}
                    labelStyle={styles.presetLabel}
                    buttonColor={selected ? getSessionColor() : undefined}
                    textColor={selected ? '#FFFFFF' : '#374151'}
                  >
                    {mins}
                  </Button>
                );
              })}
            </View>
            <View style={styles.customRow}>
              <TextInput
                value={customMinutes}
                onChangeText={setCustomMinutes}
                mode="outlined"
                placeholder="Custom"
                keyboardType="numeric"
                dense
                style={styles.customInput}
                right={<TextInput.Affix text="min" />}
                onSubmitEditing={applyCustomDuration}
              />
              <Button
                mode="outlined"
                compact
                onPress={applyCustomDuration}
                disabled={!customMinutes.trim()}
                style={styles.customApply}
              >
                Set
              </Button>
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <Button
            mode={timerState.isActive && !timerState.isPaused ? 'contained' : 'outlined'}
            onPress={handleStartStop}
            style={styles.controlButton}
            buttonColor={timerState.isActive && !timerState.isPaused ? getSessionColor() : undefined}
          >
            <MaterialCommunityIcons 
              name={timerState.isActive && !timerState.isPaused ? 'pause' : 'play'} 
              size={16} 
            />
            {timerState.isActive && !timerState.isPaused ? 'Pause' : 'Start'}
          </Button>

          {timerState.isActive && (
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.controlButton}
            >
              <MaterialCommunityIcons name="stop" size={16} />
              Stop
            </Button>
          )}

          {!timerState.isActive && (
            <Button
              mode="outlined"
              onPress={handleSwitchMode}
              style={styles.controlButton}
            >
              <MaterialCommunityIcons 
                name={timerState.sessionType === 'focus' ? 'coffee' : 'brain'} 
                size={16} 
              />
              {timerState.sessionType === 'focus' ? 'Break' : 'Focus'}
            </Button>
          )}
        </View>

        {timerState.currentTaskId && (
          <Text variant="bodySmall" style={styles.taskInfo}>
            📚 Studying for task
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTitle: {
    fontWeight: 'bold',
  },
  sessionCount: {
    color: '#6B7280',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  initialTime: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  durationPicker: {
    marginBottom: 16,
    gap: 8,
  },
  durationLabel: {
    color: '#6B7280',
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    borderRadius: 8,
    minWidth: 0,
  },
  presetButtonContent: {
    height: 36,
    paddingHorizontal: 0,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 0,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  customApply: {
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  controlButton: {
    flex: 1,
  },
  taskInfo: {
    textAlign: 'center',
    marginTop: 8,
    color: '#6B7280',
  },
  // Compact styles
  compactCard: {
    elevation: 1,
  },
  compactContent: {
    padding: 8,
  },
  compactTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTime: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  compactButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  compactProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
});
