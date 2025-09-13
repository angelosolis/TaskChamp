# TaskChamp Entity Relationship Diagram (ERD)

## Core Entities

### 1. **User**
- `id` (PK)
- `email`
- `name` 
- `avatar`

### 2. **Course**
- `id` (PK)
- `code` (e.g., "CS101")
- `name`
- `professor`
- `color`
- `credits`
- `currentGrade`
- `targetGrade`

### 3. **Task**
- `id` (PK)
- `title`
- `description`
- `completed`
- `status`
- `priority`
- `category`
- `dueDate`
- `createdAt`
- `updatedAt`
- `courseId` (FK → Course)
- `taskType`
- `estimatedTime`
- `actualTime`
- `difficulty`
- `grade`
- `weight`
- `smartPriority`
- `urgencyScore`
- `importanceScore`

### 4. **AcademicResource**
- `id` (PK)
- `type`
- `title`
- `url`
- `description`
- `attachedAt`

### 5. **StudySession**
- `id` (PK)
- `taskId` (FK → Task)
- `startTime`
- `endTime`
- `duration`
- `type`
- `productivity`

### 6. **CalendarEvent**
- `id` (PK)
- `title`
- `description`
- `type`
- `startDate`
- `endDate`
- `startTime`
- `endTime`
- `location`
- `color`
- `recurring`
- `createdAt`
- `updatedAt`

---

## Relationships

### **Course → Task** (One-to-Many)
- **Direction**: Course (1) → Task (Many)
- **Connection**: `Course.id` = `Task.courseId`
- **Meaning**: One course can have many tasks assigned to it

### **Task → AcademicResource** (One-to-Many, Embedded)
- **Direction**: Task (1) → AcademicResource (Many)
- **Connection**: Embedded array `Task.resources[]`
- **Meaning**: One task can have multiple resources attached (links, files, notes)

### **Task → StudySession** (One-to-Many, Embedded)
- **Direction**: Task (1) → StudySession (Many) 
- **Connection**: Embedded array `Task.studySessions[]`
- **Meaning**: One task can have multiple study sessions recorded

### **User → Task** (One-to-Many, Implicit)
- **Direction**: User (1) → Task (Many)
- **Connection**: Currently implicit (single user app)
- **Meaning**: One user owns all tasks (would add `userId` FK for multi-user)

### **Task ↔ CalendarEvent** (Conceptual Link)
- **Direction**: Bidirectional conceptual relationship
- **Connection**: `CalendarEvent.type` matches `Task.taskType`
- **Meaning**: Tasks can be represented as calendar events (due dates, exam dates)

---

## Data Flow Patterns

### **Smart Priority Calculation**
```
Task.urgencyScore + Task.importanceScore = Task.smartPriority
  ↗ (based on dueDate, difficulty)     ↗ (based on priority, weight)
```

### **Actual Time Tracking** 
```
Task.studySessions[].duration (sum) = Task.actualTime
```

### **Course Grade Calculation**
```
Task.grade × Task.weight (for all course tasks) = Course.currentGrade
```

---

## Storage Architecture

### **Current Implementation (AsyncStorage)**
- All entities stored as JSON in device local storage
- Relationships maintained through embedded arrays and foreign keys
- No referential integrity constraints

### **Future Database Considerations**
- **SQL**: Each entity = table, foreign keys for relationships
- **NoSQL**: Could keep embedded structure or normalize into collections

---

## Key Design Decisions

1. **Embedded vs Referenced**: Resources and StudySessions embedded in Task for simplicity
2. **Smart Priority**: Calculated field, not stored separately  
3. **Single User**: No user relationships modeled yet (implicit ownership)
4. **Flexible Types**: Union types for taskType, difficulty, etc.
5. **Time Tracking**: Centralized in StudySession entity
