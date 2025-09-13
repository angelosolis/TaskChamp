import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Course, AcademicState } from '../../types';

const initialState: AcademicState = {
  courses: [],
  currentSemester: 'Fall 2024',
  isLoading: false,
  error: null,
};

// Predefined course colors
const COURSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#C44569', '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8'
];

const academicSlice = createSlice({
  name: 'academic',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addCourse: (state, action: PayloadAction<Omit<Course, 'id' | 'color'>>) => {
      const newCourse: Course = {
        ...action.payload,
        id: Date.now().toString(),
        color: COURSE_COLORS[state.courses.length % COURSE_COLORS.length],
      };
      state.courses.push(newCourse);
    },
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(course => course.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    deleteCourse: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(course => course.id !== action.payload);
    },
    updateCurrentSemester: (state, action: PayloadAction<string>) => {
      state.currentSemester = action.payload;
    },
    // Bulk operations
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    // Common academic courses initialization
    initializeDefaultCourses: (state) => {
      if (state.courses.length === 0) {
        const defaultCourses: Omit<Course, 'id' | 'color'>[] = [
          {
            code: 'CS101',
            name: 'Introduction to Programming',
            credits: 3,
            targetGrade: 90,
          },
          {
            code: 'MATH202',
            name: 'Discrete Mathematics',
            credits: 4,
            targetGrade: 85,
          },
          {
            code: 'ENG105',
            name: 'Technical Writing',
            credits: 3,
            targetGrade: 90,
          },
        ];

        defaultCourses.forEach((courseData, index) => {
          const newCourse: Course = {
            ...courseData,
            id: Date.now().toString() + index,
            color: COURSE_COLORS[index % COURSE_COLORS.length],
          };
          state.courses.push(newCourse);
        });
      }
    },
  },
});

export const {
  setLoading,
  setError,
  addCourse,
  updateCourse,
  deleteCourse,
  updateCurrentSemester,
  setCourses,
  initializeDefaultCourses,
} = academicSlice.actions;

export default academicSlice.reducer;
