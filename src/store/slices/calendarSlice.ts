import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarState, CalendarEvent } from '../../types';

// Storage key for calendar events
const EVENTS_STORAGE_KEY = 'calendar_events';

// Async thunks for calendar operations
export const loadEvents = createAsyncThunk('calendar/loadEvents', async () => {
  const eventsData = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
  if (eventsData) {
    return JSON.parse(eventsData) as CalendarEvent[];
  }
  return [];
});

export const createEvent = createAsyncThunk(
  'calendar/createEvent',
  async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Get existing events
    const existingEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    const events: CalendarEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
    
    // Add new event
    events.push(newEvent);
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    
    return newEvent;
  }
);

export const updateEvent = createAsyncThunk(
  'calendar/updateEvent',
  async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
    const existingEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    const events: CalendarEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
    
    const eventIndex = events.findIndex(event => event.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    const updatedEvent: CalendarEvent = {
      ...events[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    events[eventIndex] = updatedEvent;
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    
    return updatedEvent;
  }
);

export const deleteEvent = createAsyncThunk(
  'calendar/deleteEvent',
  async (id: string) => {
    const existingEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    const events: CalendarEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
    
    const filteredEvents = events.filter(event => event.id !== id);
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filteredEvents));
    
    return id;
  }
);

const initialState: CalendarState = {
  events: [],
  isLoading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
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
    // Load events
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

    // Create event
    builder.addCase(createEvent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
      state.isLoading = false;
      state.events.push(action.payload);
    });
    builder.addCase(createEvent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to create event';
    });

    // Update event
    builder.addCase(updateEvent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
      state.isLoading = false;
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    });
    builder.addCase(updateEvent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to update event';
    });

    // Delete event
    builder.addCase(deleteEvent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.events = state.events.filter(event => event.id !== action.payload);
    });
    builder.addCase(deleteEvent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to delete event';
    });
  },
});

export const { setSelectedDate, setViewMode, clearError } = calendarSlice.actions;
export default calendarSlice.reducer;


