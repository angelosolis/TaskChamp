import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  gradient?: string[];
}

export default function ModernHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  onBackPress,
  rightElement,
  gradient = ['#667eea', '#764ba2']
}: Props) {
  return (
    <LinearGradient
      colors={gradient}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerContent}>
        {showBackButton && (
          <IconButton
            icon="chevron-left"
            iconColor="#FFFFFF"
            size={28}
            onPress={onBackPress}
            style={styles.backButton}
          />
        )}
        
        <View style={styles.titleSection}>
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightElement && (
          <View style={styles.rightElement}>
            {rightElement}
          </View>
        )}
      </View>
      
      {/* Wave decoration */}
      <View style={styles.waveDecoration} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backButton: {
    margin: 0,
    marginRight: 8,
    marginTop: -8,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  rightElement: {
    marginLeft: 16,
  },
  waveDecoration: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

