import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Program } from '../../types';
import { supabase } from '../../services/supabase';
import { ProgramRow } from '../../types/database';

const rowToProgram = (r: ProgramRow): Program => ({
  id: r.id,
  code: r.code,
  name: r.name,
  isActive: r.is_active,
});

interface ProgramsState {
  programs: Program[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgramsState = { programs: [], isLoading: false, error: null };

export const loadPrograms = createAsyncThunk('programs/load', async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('code');
  if (error) throw new Error(error.message);
  return (data as ProgramRow[]).map(rowToProgram);
});

export const createProgram = createAsyncThunk(
  'programs/create',
  async (input: { code: string; name: string }) => {
    const { data, error } = await supabase
      .from('programs')
      .insert({ code: input.code.trim().toUpperCase(), name: input.name.trim() })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProgram(data as ProgramRow);
  }
);

export const updateProgram = createAsyncThunk(
  'programs/update',
  async (input: { id: string; code?: string; name?: string; isActive?: boolean }) => {
    const updates: Record<string, unknown> = {};
    if (input.code !== undefined) updates.code = input.code.trim().toUpperCase();
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.isActive !== undefined) updates.is_active = input.isActive;

    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProgram(data as ProgramRow);
  }
);

export const deleteProgram = createAsyncThunk('programs/delete', async (id: string) => {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return id;
});

const programsSlice = createSlice({
  name: 'programs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadPrograms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadPrograms.fulfilled, (state, action: PayloadAction<Program[]>) => {
      state.isLoading = false;
      state.programs = action.payload;
    });
    builder.addCase(loadPrograms.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load programs.';
    });

    builder.addCase(createProgram.fulfilled, (state, action: PayloadAction<Program>) => {
      state.programs.push(action.payload);
      state.programs.sort((a, b) => a.code.localeCompare(b.code));
    });
    builder.addCase(updateProgram.fulfilled, (state, action: PayloadAction<Program>) => {
      const i = state.programs.findIndex((p) => p.id === action.payload.id);
      if (i !== -1) state.programs[i] = action.payload;
    });
    builder.addCase(deleteProgram.fulfilled, (state, action: PayloadAction<string>) => {
      state.programs = state.programs.filter((p) => p.id !== action.payload);
    });
  },
});

export default programsSlice.reducer;
