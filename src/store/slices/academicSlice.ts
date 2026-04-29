import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, AcademicState } from '../../types';
import { supabase } from '../../services/supabase';
import { CourseRow } from '../../types/database';
import { courseRowToCourse, courseToInsertRow, courseToUpdateRow } from '../../services/supabaseMappers';

const COURSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#C44569', '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8',
];

const initialState: AcademicState = {
  courses: [],
  currentSemester: 'Fall 2024',
  isLoading: false,
  error: null,
};

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in.');
  return id;
}

// ---------- Thunks ----------
export const loadCourses = createAsyncThunk('academic/loadCourses', async () => {
  await getUserId();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('code', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data || []) as CourseRow[]).map(courseRowToCourse);
});

export const addCourse = createAsyncThunk(
  'academic/addCourse',
  async (input: Omit<Course, 'id' | 'color'> & { color?: string }, { getState }) => {
    const userId = await getUserId();
    const state = (getState() as any).academic as AcademicState;
    const color = input.color || COURSE_COLORS[state.courses.length % COURSE_COLORS.length];

    const { data, error } = await supabase
      .from('courses')
      .insert(courseToInsertRow({ ...input, color }, userId) as any)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to add course.');
    return courseRowToCourse(data as CourseRow);
  }
);

export const updateCourse = createAsyncThunk(
  'academic/updateCourse',
  async (course: Course) => {
    await getUserId();
    const { data, error } = await supabase
      .from('courses')
      .update(courseToUpdateRow(course) as any)
      .eq('id', course.id)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update course.');
    return courseRowToCourse(data as CourseRow);
  }
);

export const deleteCourse = createAsyncThunk('academic/deleteCourse', async (id: string) => {
  await getUserId();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return id;
});

// ---------- Slice ----------
const academicSlice = createSlice({
  name: 'academic',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateCurrentSemester: (state, action: PayloadAction<string>) => {
      state.currentSemester = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCourses.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
      state.isLoading = false;
      state.courses = action.payload;
    });
    builder.addCase(loadCourses.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load courses';
    });

    builder.addCase(addCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      state.courses.push(action.payload);
    });
    builder.addCase(addCourse.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to add course';
    });

    builder.addCase(updateCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      const i = state.courses.findIndex((c) => c.id === action.payload.id);
      if (i !== -1) state.courses[i] = action.payload;
    });

    builder.addCase(deleteCourse.fulfilled, (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter((c) => c.id !== action.payload);
    });
  },
});

export const { setError, updateCurrentSemester } = academicSlice.actions;
export default academicSlice.reducer;
