import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CalendarState, CalendarEvent } from '../../types';
import { supabase } from '../../services/supabase';
import { CalendarEventRow } from '../../types/database';
import { eventRowToEvent, eventToInsertRow, eventToUpdateRow } from '../../services/supabaseMappers';

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in.');
  return id;
}

export const loadEvents = createAsyncThunk('calendar/loadEvents', async () => {
  await getUserId();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data || []) as CalendarEventRow[]).map(eventRowToEvent);
});

export const createEvent = createAsyncThunk(
  'calendar/createEvent',
  async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(eventToInsertRow(eventData, userId) as any)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to create event.');
    return eventRowToEvent(data as CalendarEventRow);
  }
);

export const updateEvent = createAsyncThunk(
  'calendar/updateEvent',
  async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
    await getUserId();
    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventToUpdateRow(updates) as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update event.');
    return eventRowToEvent(data as CalendarEventRow);
  }
);

export const deleteEvent = createAsyncThunk('calendar/deleteEvent', async (id: string) => {
  await getUserId();
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return id;
});

const initialState: CalendarState = {
  events: [],
  isLoading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'month',
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'month' | 'week' | 'day'>) => {
      state.viewMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadEvents.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadEvents.fulfilled, (state, action: PayloadAction<CalendarEvent[]>) => {
      state.isLoading = false;
      state.events = action.payload;
    });
    builder.addCase(loadEvents.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load events';
    });

    builder.addCase(createEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
      state.events.push(action.payload);
    });
    builder.addCase(createEvent.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to create event';
    });

    builder.addCase(updateEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
      const i = state.events.findIndex((e) => e.id === action.payload.id);
      if (i !== -1) state.events[i] = action.payload;
    });

    builder.addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
    });
  },
});

export const { setSelectedDate, setViewMode, clearError } = calendarSlice.actions;
export default calendarSlice.reducer;
