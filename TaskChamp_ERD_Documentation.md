# TaskChamp Application - Entity Relationship Diagram (ERD)

## Overview
This document presents the complete data structure and relationships for the TaskChamp mobile application. Even though the application uses Redux state management with AsyncStorage (NoSQL) rather than a traditional SQL database, this ERD represents the logical data relationships as if they were implemented in a relational database.

## 📊 Entity Relationship Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│      USER       │    │      COURSE      │    │  CALENDAR_EVENT │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ PK id: string   │    │ PK id: string    │    │ PK id: string   │
│    email: string│    │    code: string  │    │    title: string│
│    name: string │    │    name: string  │    │    description? │
│    avatar?      │    │    professor?    │    │    type: enum   │
└─────────────────┘    │    color: string │    │    startDate    │
         │              │    credits?      │    │    endDate?     │
         │              │    currentGrade? │    │    startTime?   │
         │              │    targetGrade?  │    │    endTime?     │
         │              └──────────────────┘    │    location?    │
         │                        │             │    color?       │
         │                        │             │    recurring?   │
         │                        │             │    createdAt    │
         │                        │             │    updatedAt    │
         │                        │             └─────────────────┘
         │                        │
         │              ┌─────────────────────────────────────────────────────┐
         │              │                     TASK                           │
         │              ├─────────────────────────────────────────────────────┤
         └──────────────│ PK id: string                                      │
                        │    title: string                                   │
                        │    description?: string                            │
                        │    completed: boolean                              │
                        │    status: 'to-do'|'in-progress'|'completed'      │
                        │    priority: 'low'|'medium'|'high'                │
                        │    category?: string                               │
                        │    dueDate?: string                                │
                        │    createdAt: string                               │
                        │    updatedAt: string                               │
                        │    ┌─────────────────────────────────────────────┐ │
                        │    │         ACADEMIC FEATURES                   │ │
                        │    │ FK courseId?: string → COURSE.id           │ │
                        │    │    taskType: enum                          │ │
                        │    │    estimatedTime?: number                  │ │
                        │    │    actualTime?: number                     │ │
                        │    │    difficulty?: 'easy'|'medium'|'hard'    │ │
                        │    │    grade?: number                          │ │
                        │    │    weight?: number                         │ │
                        │    └─────────────────────────────────────────────┘ │
                        │    ┌─────────────────────────────────────────────┐ │
                        │    │       SMART PRIORITY (calculated)          │ │
                        │    │    smartPriority?: number                  │ │
                        │    │    urgencyScore?: number                   │ │
                        │    │    importanceScore?: number                │ │
                        │    └─────────────────────────────────────────────┘ │
                        └─────────────────────────────────────────────────────┘
                                        │           │
                                        │           │
              ┌─────────────────────────┘           └─────────────────────────┐
              │                                                               │
              ▼                                                               ▼
┌─────────────────────────┐                               ┌──────────────────────────┐
│   ACADEMIC_RESOURCE     │                               │     STUDY_SESSION        │
├─────────────────────────┤                               ├──────────────────────────┤
│ PK id: string          │                               │ PK id: string           │
│ FK taskId → TASK.id    │                               │ FK taskId → TASK.id     │
│    type: enum          │                               │    startTime: string    │
│    title: string       │                               │    endTime?: string     │
│    url?: string        │                               │    duration: number     │
│    description?        │                               │    type: enum           │
│    attachedAt: string  │                               │    productivity?: enum  │
└─────────────────────────┘                               └──────────────────────────┘
```

## 🔗 Detailed Entity Relationships

### Primary Entities

#### 1. **USER** (Authentication Entity)
- **Purpose**: Stores user authentication and profile information
- **Relationships**: 
  - One-to-Many with Tasks (implicit through state management)
  - One-to-Many with Calendar Events (implicit through state management)

#### 2. **COURSE** (Academic Entity)
- **Purpose**: Represents academic courses/subjects
- **Relationships**:
  - One-to-Many with Tasks (via `courseId` foreign key)
- **Key Features**: Color coding, grade tracking, credit hours

#### 3. **TASK** (Core Entity)
- **Purpose**: Central entity for task management
- **Relationships**:
  - Many-to-One with Course (via `courseId`)
  - One-to-Many with Academic Resources (embedded array)
  - One-to-Many with Study Sessions (embedded array)
- **Key Features**: Smart prioritization, academic integration, time tracking

#### 4. **CALENDAR_EVENT** (Scheduling Entity)
- **Purpose**: Calendar and scheduling functionality
- **Relationships**: 
  - Independent entity (could be linked to tasks in future versions)
- **Key Features**: Recurring events, multiple event types

### Supporting Entities

#### 5. **ACADEMIC_RESOURCE** (Embedded Entity)
- **Purpose**: Links learning resources to tasks
- **Relationship**: Many-to-One with Task (embedded within Task)
- **Types**: link, file, note, video, document

#### 6. **STUDY_SESSION** (Time Tracking Entity)
- **Purpose**: Tracks focused study time using Pomodoro technique
- **Relationship**: Many-to-One with Task (embedded within Task)
- **Features**: Duration tracking, productivity rating

## 🏗️ State Management Structure

### Redux Store Structure
```
RootState
├── auth: AuthState
│   ├── user: User | null
│   ├── isAuthenticated: boolean
│   ├── isLoading: boolean
│   └── error: string | null
│
├── tasks: TaskState
│   ├── tasks: Task[]
│   ├── isLoading: boolean
│   ├── error: string | null
│   ├── filter: 'all' | 'active' | 'completed'
│   └── sortBy: 'dueDate' | 'priority' | 'created' | 'smartPriority'
│
├── calendar: CalendarState
│   ├── events: CalendarEvent[]
│   ├── isLoading: boolean
│   ├── error: string | null
│   ├── selectedDate: string
│   └── viewMode: 'month' | 'week' | 'day'
│
└── academic: AcademicState
    ├── courses: Course[]
    ├── currentSemester: string
    ├── isLoading: boolean
    └── error: string | null
```

## 📋 Data Types and Enums

### Task-Related Enums
- **TaskType**: `'assignment' | 'exam' | 'project' | 'reading' | 'study' | 'other'`
- **Priority**: `'low' | 'medium' | 'high'`
- **Status**: `'to-do' | 'in-progress' | 'completed'`
- **Difficulty**: `'easy' | 'medium' | 'hard'`

### Calendar-Related Enums
- **EventType**: `'class' | 'exam' | 'assignment' | 'event' | 'reminder'`
- **Recurring**: `'none' | 'daily' | 'weekly' | 'monthly'`
- **ViewMode**: `'month' | 'week' | 'day'`

### Resource-Related Enums
- **ResourceType**: `'link' | 'file' | 'note' | 'video' | 'document'`

### Study Session Enums
- **SessionType**: `'focus' | 'break' | 'review'`
- **Productivity**: `'low' | 'medium' | 'high'`

## 🔄 Key Relationships and Business Logic

### 1. **Course → Task Relationship**
- **Type**: One-to-Many (Optional)
- **Implementation**: `Task.courseId` references `Course.id`
- **Business Logic**: Tasks can be associated with courses for academic tracking

### 2. **Task → Academic Resources Relationship**
- **Type**: One-to-Many (Embedded)
- **Implementation**: `Task.resources[]` contains `AcademicResource` objects
- **Business Logic**: Each task can have multiple learning resources attached

### 3. **Task → Study Sessions Relationship**
- **Type**: One-to-Many (Embedded)
- **Implementation**: `Task.studySessions[]` contains `StudySession` objects
- **Business Logic**: Time tracking for Pomodoro study sessions per task

### 4. **Smart Priority Calculation**
- **Dependencies**: `dueDate`, `priority`, `taskType`, `difficulty`, `weight`
- **Algorithm**: Combines urgency (time-based) + importance (type/priority-based)
- **Output**: `smartPriority`, `urgencyScore`, `importanceScore`

## 🗄️ Storage Implementation

### Current Storage Strategy
- **Primary Storage**: AsyncStorage (React Native local storage)
- **State Management**: Redux Toolkit with RTK Query patterns
- **Data Persistence**: JSON serialization in AsyncStorage
- **Storage Keys**: 
  - `'tasks'` → Task[]
  - `'calendar_events'` → CalendarEvent[]
  - `'courses'` → Course[]
  - `'study_sessions'` → StudySession[]

### Potential Database Migration Schema
If migrating to a SQL database, the structure would be:

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    avatar VARCHAR
);

-- Courses table  
CREATE TABLE courses (
    id VARCHAR PRIMARY KEY,
    code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    professor VARCHAR,
    color VARCHAR NOT NULL,
    credits INTEGER,
    current_grade DECIMAL,
    target_grade DECIMAL
);

-- Tasks table (main entity)
CREATE TABLE tasks (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    status VARCHAR DEFAULT 'to-do',
    priority VARCHAR DEFAULT 'medium',
    category VARCHAR,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Academic features
    course_id VARCHAR REFERENCES courses(id),
    task_type VARCHAR DEFAULT 'other',
    estimated_time INTEGER,
    actual_time INTEGER,
    difficulty VARCHAR DEFAULT 'medium',
    grade DECIMAL,
    weight DECIMAL,
    
    -- Smart priority (calculated)
    smart_priority INTEGER,
    urgency_score INTEGER,
    importance_score INTEGER
);

-- Academic resources table
CREATE TABLE academic_resources (
    id VARCHAR PRIMARY KEY,
    task_id VARCHAR REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    url TEXT,
    description TEXT,
    attached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Study sessions table
CREATE TABLE study_sessions (
    id VARCHAR PRIMARY KEY,
    task_id VARCHAR REFERENCES tasks(id) ON DELETE CASCADE,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER NOT NULL,
    type VARCHAR DEFAULT 'focus',
    productivity VARCHAR
);

-- Calendar events table
CREATE TABLE calendar_events (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR DEFAULT 'event',
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR,
    color VARCHAR,
    recurring VARCHAR DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 Data Flow and Integration Points

### 1. **Task Creation Flow**
```
User Input → CreateTaskScreen → Redux Action → TaskSlice → AsyncStorage
                                     ↓
                            Smart Priority Calculator
                                     ↓
                              UI Update (Dashboard/Lists)
```

### 2. **Study Timer Integration**
```
StudyTimerService → StudySession Creation → Task.studySessions Update → AsyncStorage
```

### 3. **Academic Resource Management**
```
Resource Dialog → AcademicResource Creation → Task.resources Update → AsyncStorage
```

## 🎯 Conclusion

This ERD represents a comprehensive academic task management system with the following key characteristics:

- **Flexibility**: Supports both academic and general task management
- **Smart Features**: Intelligent prioritization based on multiple factors
- **Time Tracking**: Integrated Pomodoro timer with session tracking
- **Resource Management**: Embedded resource linking per task
- **Academic Integration**: Course-based organization and grade tracking
- **Scalability**: Designed for easy migration to relational database if needed

The current NoSQL implementation provides rapid development and deployment while maintaining the logical relationships that could be easily translated to a traditional relational database structure in the future.
