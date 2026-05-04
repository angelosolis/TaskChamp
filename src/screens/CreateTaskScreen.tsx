import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Text, TextInput, Button, Card, Snackbar, SegmentedButtons, Surface, Menu, Chip, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import ModernHeader from '../components/ModernHeader';

import { useAppDispatch, useAppSelector } from '../store/store';
import { createTask } from '../store/slices/taskSlice';
import { loadCourses } from '../store/slices/academicSlice';
import { MainTabParamList, MainStackParamList, Course, AcademicResource } from '../types';
import { inAppAlertService } from '../services/inAppAlertService';
import { useNotification } from '../components/NotificationProvider';
import StudyTimerWidget from '../components/StudyTimerWidget';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Create'>,
  StackScreenProps<MainStackParamList>
>;

export default function CreateTaskScreen({ navigation }: Props) {
  const [isAcademic, setIsAcademic] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  // Academic fields
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [taskType, setTaskType] = useState<'assignment' | 'exam' | 'project' | 'reading' | 'study' | 'other'>('other');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gradeWeight, setGradeWeight] = useState('');
  const [resources, setResources] = useState<AcademicResource[]>([]);
  
  // UI state
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'link' | 'file' | 'note' | 'video' | 'document'>('link');
  const [pickedFileName, setPickedFileName] = useState<string>('');
  const [pickedFileSize, setPickedFileSize] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.tasks);
  const { courses } = useAppSelector((state) => state.academic);
  const { showInfo, showError } = useNotification();

  useEffect(() => {
    dispatch(loadCourses());
  }, [dispatch]);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        completed: false,

        isAcademic,
        // Academic-only fields are blanked out for personal tasks
        courseId: isAcademic ? (selectedCourseId || undefined) : undefined,
        taskType: isAcademic ? taskType : 'other',
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        difficulty,
        weight: isAcademic && gradeWeight ? parseFloat(gradeWeight) : undefined,
        resources: resources,
      };

      await dispatch(createTask(taskData)).unwrap();

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('');
      setDueDate(undefined);
      setIsAcademic(true);
      setSelectedCourseId('');
      setTaskType('other');
      setEstimatedTime('');
      setDifficulty('medium');
      setGradeWeight('');
      setResources([]);
      setShowTimer(false);
      
      // Show success message
      setSuccessVisible(true);
      
      // Navigate to task list after a short delay
      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Dashboard' });
      }, 1000);
    } catch (error) {
      // Error is handled by Redux
    }
  };


  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Resource management functions
  const handleAddResource = () => {
    if (!newResourceTitle.trim()) return;

    const newResource: AcademicResource = {
      id: Date.now().toString(),
      type: newResourceType,
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim() || undefined,
      attachedAt: new Date().toISOString(),
    };

    setResources([...resources, newResource]);
    handleCloseResourceDialog();
  };

  const handleCloseResourceDialog = () => {
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceType('link');
    setPickedFileName('');
    setPickedFileSize(null);
    setShowResourceDialog(false);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: newResourceType === 'video' ? 'video/*' : '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setNewResourceUrl(asset.uri);
      setPickedFileName(asset.name);
      setPickedFileSize(asset.size ?? null);
      if (!newResourceTitle.trim()) {
        setNewResourceTitle(asset.name);
      }
    } catch (err) {
      showError('Could not pick file', 'Please try again.');
    }
  };

  const handleOpenResource = async (resource: AcademicResource) => {
    if (!resource.url) return;
    if (resource.type === 'link') {
      try { await Linking.openURL(resource.url); } catch { Alert.alert('Cannot open link', resource.url); }
      return;
    }
    if (resource.type === 'document' || resource.type === 'video' || resource.type === 'file') {
      try {
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
          await Linking.openURL(resource.url);
        } else {
          Alert.alert('No app available', 'Install an app that can open this file type.');
        }
      } catch {
        Alert.alert('Cannot open file', resource.url);
      }
      return;
    }
    Alert.alert(resource.title, resource.url);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleRemoveResource = (resourceId: string) => {
    setResources(resources.filter(r => r.id !== resourceId));
  };

  const isFormValid = () => {
    return title.trim().length > 0;
  };

  // Form options
  const taskTypeOptions = [
    { value: 'assignment', label: 'Assignment', icon: 'file-document' },
    { value: 'exam', label: 'Exam', icon: 'school' },
    { value: 'project', label: 'Project', icon: 'folder' },
    { value: 'reading', label: 'Reading', icon: 'book' },
    { value: 'study', label: 'Study', icon: 'brain' },
    { value: 'other', label: 'Other', icon: 'dots-horizontal' },
  ];

  const getTaskTypeIcon = (type: string) => {
    const option = taskTypeOptions.find(opt => opt.value === type);
    return option?.icon || 'dots-horizontal';
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: 'keyboard-arrow-down' },
    { value: 'medium', label: 'Medium', icon: 'remove' },
    { value: 'high', label: 'High', icon: 'keyboard-arrow-up' },
  ];

  const personalCategories = [
    'Health', 'Fitness', 'Home', 'Errand', 'Finance', 'Hobby', 'Family', 'Work',
  ];

  const switchMode = (academic: boolean) => {
    if (academic === isAcademic) return;
    setIsAcademic(academic);
    if (academic) {
      // entering Academic — drop personal-only state
      setCategory('');
    } else {
      // entering Personal — drop academic-only state
      setSelectedCourseId('');
      setTaskType('other');
      setGradeWeight('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Create New Task"
        subtitle="Add a new task to your list"
        gradient={['#10B981', '#059669']}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.formCard} elevation={8}>
          <Card.Content style={styles.formContent}>
            {/* Title */}
            <TextInput
              label="Task Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="What needs to be done?"
              left={<TextInput.Icon icon="clipboard-text" />}
            />

            {/* Description */}
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Add more details about your task..."
              left={<TextInput.Icon icon="note-text" />}
            />

            {/* Priority */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Priority Level
              </Text>
              <SegmentedButtons
                value={priority}
                onValueChange={setPriority as any}
                buttons={[
                  {
                    value: 'low',
                    label: 'Low',
                    icon: () => <MaterialCommunityIcons name="chevron-down" size={16} color="#059669" />,
                  },
                  {
                    value: 'medium',
                    label: 'Medium',
                    icon: () => <MaterialCommunityIcons name="minus" size={16} color="#D97706" />,
                  },
                  {
                    value: 'high',
                    label: 'High',
                    icon: () => <MaterialCommunityIcons name="chevron-up" size={16} color="#DC2626" />,
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Due Date */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Due Date (Optional)
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
              >
                <MaterialCommunityIcons name="clock" size={20} />
                {dueDate ? dueDate.toDateString() : 'Select due date'}
              </Button>
              {dueDate && (
                <Button
                  mode="text"
                  compact
                  onPress={() => setDueDate(undefined)}
                  style={styles.clearDateButton}
                >
                  Clear date
                </Button>
              )}
            </View>

            {/* Academic / Personal toggle */}
            <View style={styles.toggleRow}>
              <Surface
                style={[styles.toggleOption, isAcademic && styles.toggleOptionActive]}
                elevation={isAcademic ? 2 : 0}
              >
                <Button
                  mode="text"
                  onPress={() => switchMode(true)}
                  style={styles.toggleButton}
                  contentStyle={styles.toggleContent}
                  labelStyle={[styles.toggleLabel, isAcademic && styles.toggleLabelActive]}
                  icon={({ color }) => (
                    <MaterialCommunityIcons name="school" size={18} color={isAcademic ? '#FFFFFF' : '#6B7280'} />
                  )}
                >
                  Academic
                </Button>
              </Surface>
              <Surface
                style={[styles.toggleOption, !isAcademic && styles.toggleOptionActive]}
                elevation={!isAcademic ? 2 : 0}
              >
                <Button
                  mode="text"
                  onPress={() => switchMode(false)}
                  style={styles.toggleButton}
                  contentStyle={styles.toggleContent}
                  labelStyle={[styles.toggleLabel, !isAcademic && styles.toggleLabelActive]}
                  icon={({ color }) => (
                    <MaterialCommunityIcons name="run" size={18} color={!isAcademic ? '#FFFFFF' : '#6B7280'} />
                  )}
                >
                  Personal
                </Button>
              </Surface>
            </View>

            {/* Academic Section — only when isAcademic */}
            {isAcademic && (
            <View style={styles.academicSection}>
              <Surface style={styles.academicHeader} elevation={1}>
                <MaterialCommunityIcons name="school" size={24} color="#667eea" />
                <Text variant="titleLarge" style={styles.academicTitle}>
                  Academic Details
                </Text>
                <Text variant="bodySmall" style={styles.academicSubtitle}>
                  Optional - for academic task tracking
                </Text>
              </Surface>

              {/* Course Selection */}
              <View style={styles.academicField}>
                <View style={styles.fieldLabelRow}>
                  <MaterialCommunityIcons name="book-open-variant" size={16} color="#374151" />
                  <Text variant="titleSmall" style={styles.fieldLabelText}>
                    Course
                  </Text>
                </View>
                <Menu
                  visible={showCourseMenu}
                  onDismiss={() => setShowCourseMenu(false)}
                  anchor={
                    <Surface style={styles.courseSelector} elevation={1}>
                      <Button
                        mode="text"
                        onPress={() => setShowCourseMenu((v) => !v)}
                        style={styles.courseSelectorButton}
                        contentStyle={styles.courseSelectorContent}
                        labelStyle={styles.courseSelectorLabel}
                      >
                        {selectedCourseId ? (
                          <View style={styles.selectedCourse}>
                            <View style={[
                              styles.courseDot, 
                              { backgroundColor: courses.find(c => c.id === selectedCourseId)?.color || '#667eea' }
                            ]} />
                            <Text style={styles.selectedCourseText}>
                              {courses.find(c => c.id === selectedCourseId)?.code}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.placeholderText}>Select Course</Text>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                      </Button>
                    </Surface>
                  }
                >
                  {courses.map((course) => (
                    <Menu.Item
                      key={course.id}
                      onPress={() => {
                        setSelectedCourseId(course.id);
                        setShowCourseMenu(false);
                      }}
                      title={course.code}
                      titleStyle={{ fontWeight: '600' }}
                      leadingIcon={() => (
                        <View style={[styles.menuCourseDot, { backgroundColor: course.color }]} />
                      )}
                    />
                  ))}
                  <Divider />
                  <Menu.Item
                    onPress={() => {
                      setShowCourseMenu(false);
                      navigation.navigate('ManageCourses');
                    }}
                    title="Add New Course"
                    leadingIcon="plus"
                  />
                  {selectedCourseId && (
                    <Menu.Item
                      onPress={() => {
                        setSelectedCourseId('');
                        setShowCourseMenu(false);
                      }}
                      title="Clear Selection"
                      leadingIcon="close"
                    />
                  )}
                </Menu>
              </View>

              {/* Task Type */}
              <View style={styles.academicField}>
                <View style={styles.fieldLabelRow}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#374151" />
                  <Text variant="titleSmall" style={styles.fieldLabelText}>
                    Task Type
                  </Text>
                </View>
                <View style={styles.taskTypeGrid}>
                  {taskTypeOptions.map((option) => (
                    <Surface 
                      key={option.value}
                      style={[
                        styles.taskTypeCard,
                        taskType === option.value && styles.selectedTaskTypeCard
                      ]}
                      elevation={taskType === option.value ? 3 : 1}
                    >
                      <Button
                        mode="text"
                        onPress={() => setTaskType(option.value as any)}
                        style={styles.taskTypeButton}
                        contentStyle={styles.taskTypeButtonContent}
                        labelStyle={[
                          styles.taskTypeLabel,
                          taskType === option.value && styles.selectedTaskTypeLabel
                        ]}
                      >
                        <MaterialCommunityIcons 
                          name={option.icon as any} 
                          size={20} 
                          color={taskType === option.value ? '#FFFFFF' : '#6B7280'} 
                        />
                        {option.label}
                      </Button>
                    </Surface>
                  ))}
                </View>
              </View>

              {/* Grade Weight — only when a course is selected */}
              {selectedCourseId && (
                <View style={styles.academicField}>
                  <View style={styles.fieldLabelRow}>
                    <MaterialCommunityIcons name="chart-bar" size={16} color="#374151" />
                    <Text variant="titleSmall" style={styles.fieldLabelText}>
                      Grade Weight
                    </Text>
                  </View>
                  <Surface style={styles.inputSurface} elevation={1}>
                    <TextInput
                      value={gradeWeight}
                      onChangeText={setGradeWeight}
                      mode="flat"
                      keyboardType="numeric"
                      placeholder="25"
                      right={<TextInput.Affix text="%" />}
                      style={styles.flatInput}
                      contentStyle={styles.flatInputContent}
                    />
                  </Surface>
                </View>
              )}
            </View>
            )}

            {/* Personal section — only when Personal mode */}
            {!isAcademic && (
              <View style={styles.section}>
                <TextInput
                  label="Category (Optional)"
                  value={category}
                  onChangeText={setCategory}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., Health, Fitness, Errand"
                  left={<TextInput.Icon icon="label" />}
                />
                <View style={styles.categoryChips}>
                  {personalCategories.map((cat) => (
                    <Button
                      key={cat}
                      mode={category === cat ? 'contained' : 'outlined'}
                      compact
                      onPress={() => setCategory(category === cat ? '' : cat)}
                      style={styles.categoryChip}
                    >
                      {cat}
                    </Button>
                  ))}
                </View>
              </View>
            )}

            {/* Common section — both modes: effort tracking + attachments */}
            <View style={styles.academicRow}>
              <View style={styles.academicFieldHalf}>
                <View style={styles.fieldLabelRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#374151" />
                  <Text variant="titleSmall" style={styles.fieldLabelText}>
                    Est. Time
                  </Text>
                </View>
                <Surface style={styles.inputSurface} elevation={1}>
                  <TextInput
                    value={estimatedTime}
                    onChangeText={setEstimatedTime}
                    mode="flat"
                    keyboardType="numeric"
                    placeholder="90"
                    right={<TextInput.Affix text="min" />}
                    style={styles.flatInput}
                    contentStyle={styles.flatInputContent}
                  />
                </Surface>
              </View>

              <View style={styles.academicFieldHalf}>
                <View style={styles.fieldLabelRow}>
                  <MaterialCommunityIcons name="target" size={16} color="#374151" />
                  <Text variant="titleSmall" style={styles.fieldLabelText}>
                    Difficulty
                  </Text>
                </View>
                <View style={styles.difficultyContainer}>
                  {['easy', 'medium', 'hard'].map((level) => (
                    <Surface
                      key={level}
                      style={[
                        styles.difficultyChip,
                        difficulty === level && styles.selectedDifficultyChip,
                      ]}
                      elevation={difficulty === level ? 2 : 0}
                    >
                      <Button
                        mode="text"
                        compact
                        onPress={() => setDifficulty(level as any)}
                        style={styles.difficultyButton}
                        contentStyle={styles.difficultyButtonContent}
                        labelStyle={[
                          styles.difficultyLabel,
                          difficulty === level && styles.selectedDifficultyLabel,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    </Surface>
                  ))}
                </View>
              </View>
            </View>

            {/* Resources — both modes */}
            <View style={styles.academicField}>
              <View style={styles.resourcesHeader}>
                <View style={styles.fieldLabelRow}>
                  <MaterialCommunityIcons name="paperclip" size={16} color="#374151" />
                  <Text variant="titleSmall" style={styles.fieldLabelText}>
                    Resources
                  </Text>
                </View>
                <Button
                  mode="text"
                  compact
                  onPress={() => setShowResourceDialog(true)}
                  labelStyle={styles.addResourceLabel}
                >
                  <MaterialCommunityIcons name="plus" size={16} />
                  Add Resource
                </Button>
              </View>

              {resources.length > 0 ? (
                <View style={styles.resourcesList}>
                  {resources.map((resource) => (
                    <Surface key={resource.id} style={styles.resourceChipSurface} elevation={1}>
                      <Chip
                        mode="flat"
                        onPress={() => handleOpenResource(resource)}
                        onClose={() => handleRemoveResource(resource.id)}
                        icon={
                          resource.type === 'link' ? 'link' :
                          resource.type === 'video' ? 'play' :
                          resource.type === 'document' ? 'file-document' :
                          resource.type === 'note' ? 'note-text' : 'paperclip'
                        }
                        style={styles.resourceChip}
                        textStyle={styles.resourceChipText}
                      >
                        {resource.title}
                      </Chip>
                    </Surface>
                  ))}
                </View>
              ) : (
                <Surface style={styles.emptyResourcesCard} elevation={0}>
                  <Text variant="bodySmall" style={styles.emptyResourcesText}>
                    No resources added yet
                  </Text>
                </Surface>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Optional Focus Timer — opt-in, hidden by default */}
            <View style={styles.section}>
              <Button
                mode="outlined"
                onPress={() => setShowTimer((v) => !v)}
                icon={() => (
                  <MaterialCommunityIcons
                    name={showTimer ? 'chevron-up' : 'timer-outline'}
                    size={18}
                    color="#667eea"
                  />
                )}
                style={styles.timerToggleButton}
                contentStyle={styles.timerToggleContent}
                textColor="#667eea"
              >
                {showTimer ? 'Hide Focus Timer' : 'Start a Focus Session'}
              </Button>
              {showTimer && (
                <View style={styles.timerWidgetWrap}>
                  <StudyTimerWidget compact={true} />
                </View>
              )}
            </View>

            {/* Create Task Button */}
            <Button
              mode="contained"
              onPress={handleCreateTask}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
              disabled={!isFormValid() || isLoading}
              loading={isLoading}
              icon="plus"
              buttonColor="#667eea"
              textColor="#FFFFFF"
            >
              Create Task
            </Button>

          </Card.Content>
        </Card>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Working Resource Dialog */}
        {showResourceDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBackdrop} onTouchEnd={handleCloseResourceDialog} />
            <Surface style={styles.resourceDialog} elevation={10}>
              {/* Header */}
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.dialogGradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.dialogHeaderContent}>
                  <View style={styles.dialogTitleContainer}>
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#FFFFFF" />
                    <Text variant="headlineSmall" style={styles.dialogMainTitle}>
                      Add Resource
                    </Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={22}
                    iconColor="#FFFFFF"
                    onPress={handleCloseResourceDialog}
                    style={styles.dialogCloseButton}
                  />
                </View>
                <Text variant="bodyMedium" style={styles.dialogSubtitle}>
                  Attach links, documents, or notes to your task
                </Text>
              </LinearGradient>

              {/* Main Content */}
              <View style={styles.contentContainer}>
                {/* Resource Type Selection */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 0 }]}>
                  Choose Resource Type
                </Text>
                
                <View style={styles.typeGrid}>
                  {[
                    { value: 'link', label: 'Web Link', icon: 'link', color: '#3B82F6' },
                    { value: 'document', label: 'Document', icon: 'file-document', color: '#10B981' },
                    { value: 'video', label: 'Video', icon: 'play-circle', color: '#F59E0B' },
                    { value: 'note', label: 'Note', icon: 'note-text', color: '#8B5CF6' },
                  ].map((type) => (
                    <Card
                      key={type.value}
                      style={[
                        styles.typeCard,
                        newResourceType === type.value && styles.selectedTypeCard
                      ]}
                      onPress={() => setNewResourceType(type.value as any)}
                    >
                      <Card.Content style={styles.typeCardContent}>
                        <View style={[
                          styles.typeIconContainer,
                          { backgroundColor: newResourceType === type.value ? type.color : '#F3F4F6' }
                        ]}>
                          <MaterialCommunityIcons 
                            name={type.icon as any} 
                            size={20} 
                            color={newResourceType === type.value ? '#FFFFFF' : type.color} 
                          />
                        </View>
                        <Text style={[
                          styles.typeCardLabel,
                          { color: newResourceType === type.value ? type.color : '#6B7280' }
                        ]}>
                          {type.label}
                        </Text>
                      </Card.Content>
                    </Card>
                  ))}
                </View>

                {/* Resource Title */}
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Resource Title *
                </Text>
                <TextInput
                  value={newResourceTitle}
                  onChangeText={setNewResourceTitle}
                  mode="outlined"
                  placeholder="e.g., Chapter 5 PDF, Tutorial Video, Study Notes..."
                  style={styles.dialogInput}
                  left={<TextInput.Icon icon="text" />}
                />

                {/* Resource Content */}
                {(newResourceType === 'document' || newResourceType === 'video') ? (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {newResourceType === 'video' ? 'Video File' : 'Document'}
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={handlePickFile}
                      icon={pickedFileName ? 'file-check' : 'file-upload'}
                      style={styles.pickFileButton}
                      contentStyle={styles.pickFileButtonContent}
                    >
                      {pickedFileName ? 'Replace File' : `Pick ${newResourceType === 'video' ? 'Video' : 'Document'}`}
                    </Button>
                    {pickedFileName ? (
                      <Surface style={styles.pickedFileCard} elevation={1}>
                        <MaterialCommunityIcons
                          name={newResourceType === 'video' ? 'play-circle' : 'file-document'}
                          size={22}
                          color={newResourceType === 'video' ? '#F59E0B' : '#10B981'}
                        />
                        <View style={styles.pickedFileInfo}>
                          <Text style={styles.pickedFileName} numberOfLines={1}>
                            {pickedFileName}
                          </Text>
                          {pickedFileSize !== null && (
                            <Text style={styles.pickedFileMeta}>{formatFileSize(pickedFileSize)}</Text>
                          )}
                        </View>
                        <IconButton
                          icon="close"
                          size={16}
                          onPress={() => {
                            setPickedFileName('');
                            setPickedFileSize(null);
                            setNewResourceUrl('');
                          }}
                        />
                      </Surface>
                    ) : (
                      <Text style={styles.pickFileHint}>
                        Files are copied into the app's cache so you can reopen them later.
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {newResourceType === 'link' ? 'URL' : 'Your Notes'}
                    </Text>
                    <TextInput
                      value={newResourceUrl}
                      onChangeText={setNewResourceUrl}
                      mode="outlined"
                      placeholder={
                        newResourceType === 'link' ? 'https://example.com/resource' :
                        'Write your notes here...'
                      }
                      multiline={newResourceType === 'note'}
                      numberOfLines={newResourceType === 'note' ? 4 : 1}
                      style={styles.dialogInput}
                      left={<TextInput.Icon icon={newResourceType === 'link' ? 'web' : 'pencil'} />}
                    />
                  </>
                )}
              </View>

              {/* Buttons */}
              <View style={styles.dialogFooter}>
                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleCloseResourceDialog}
                    style={styles.cancelButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.cancelLabel}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddResource}
                    style={styles.addButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.addLabel}
                    disabled={
                      !newResourceTitle.trim() ||
                      ((newResourceType === 'document' || newResourceType === 'video') && !newResourceUrl)
                    }
                    buttonColor="#667eea"
                    icon="plus"
                  >
                    Add Resource
                  </Button>
                </View>
              </View>
            </Surface>
          </View>
        )}

        {/* Success Snackbar */}
        <Snackbar
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          duration={3000}
          style={styles.successSnackbar}
        >
          Task created successfully!
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          visible={!!error}
          onDismiss={() => {}}
          duration={4000}
          style={styles.errorSnackbar}
        >
          {error}
        </Snackbar>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  formCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 20,
  },
  formContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: '#F9FAFB',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  dateButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dateButtonContent: {
    flexDirection: 'row-reverse',
    paddingVertical: 8,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  createButton: {
    marginTop: 20,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonContent: {
    height: 52,
    paddingHorizontal: 16,
  },
  successSnackbar: {
    backgroundColor: '#059669',
  },
  errorSnackbar: {
    backgroundColor: '#DC2626',
  },
  divider: {
    marginVertical: 24,
  },

  // Academic / Personal toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  toggleOption: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  toggleOptionActive: {
    backgroundColor: '#667eea',
  },
  toggleButton: {
    width: '100%',
    margin: 0,
  },
  toggleContent: {
    height: 44,
    flexDirection: 'row',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginHorizontal: 6,
  },
  toggleLabelActive: {
    color: '#FFFFFF',
  },
  timerToggleButton: {
    borderRadius: 12,
    borderColor: '#C7D2FE',
  },
  timerToggleContent: {
    height: 44,
  },
  timerWidgetWrap: {
    marginTop: 12,
  },
  // Academic Section Styles
  academicSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  academicHeader: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    marginBottom: 20,
  },
  academicTitle: {
    color: '#2E3A59',
    fontWeight: 'bold',
    marginTop: 8,
  },
  academicSubtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  academicField: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabelText: {
    color: '#374151',
    fontWeight: '600',
  },

  // Course Selection
  courseSelector: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  courseSelectorButton: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  courseSelectorContent: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  courseSelectorLabel: {
    flex: 1,
  },
  selectedCourse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCourseText: {
    color: '#2E3A59',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  courseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  menuCourseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Task Type Grid
  taskTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  taskTypeCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedTaskTypeCard: {
    backgroundColor: '#667eea',
  },
  taskTypeButton: {
    width: '100%',
  },
  taskTypeButtonContent: {
    height: 48,
    paddingHorizontal: 8,
  },
  taskTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedTaskTypeLabel: {
    color: '#FFFFFF',
  },

  // Academic Row
  academicRow: {
    flexDirection: 'row',
    gap: 16,
  },
  academicFieldHalf: {
    flex: 1,
  },

  // Input Surfaces
  inputSurface: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  flatInput: {
    backgroundColor: 'transparent',
  },
  flatInputContent: {
    paddingHorizontal: 16,
  },

  // Difficulty
  difficultyContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  difficultyChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedDifficultyChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  difficultyButton: {
    width: '100%',
    height: 44,
    margin: 0,
    justifyContent: 'center',
    minWidth: 0,
  },
  difficultyButtonContent: {
    paddingHorizontal: 0,
    minWidth: 0,
  },
  difficultyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginHorizontal: 0,
  },
  selectedDifficultyLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Resources
  resourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addResourceLabel: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  resourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resourceChipSurface: {
    borderRadius: 8,
  },
  resourceChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  resourceChipText: {
    fontSize: 12,
    color: '#374151',
  },
  emptyResourcesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyResourcesText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Beautiful Dialog Styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  dialogBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resourceDialog: {
    width: '100%',
    maxWidth: 400,
    height: 600,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // Gradient Header
  dialogGradientHeader: {
    padding: 24,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dialogHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dialogMainTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dialogSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  dialogCloseButton: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Main Dialog Body
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  dialogSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  // Resource Type Cards
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  typeCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    minHeight: 80,
  },
  selectedTypeCard: {
    borderColor: '#667eea',
    backgroundColor: '#F8FAFC',
  },
  typeCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 70,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Dialog Input
  dialogInput: {
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  pickFileButton: {
    borderRadius: 12,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  pickFileButtonContent: {
    height: 48,
  },
  pickedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  pickedFileInfo: {
    flex: 1,
    minWidth: 0,
  },
  pickedFileName: {
    color: '#1F2937',
    fontWeight: '600',
  },
  pickedFileMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  pickFileHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },

  // Footer with Actions
  dialogFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
  },
  addButton: {
    flex: 2,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 16,
  },
  cancelLabel: {
    color: '#6B7280',
    fontWeight: '600',
  },
  addLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
