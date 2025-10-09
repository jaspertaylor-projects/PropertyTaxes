// frontend/src/store/forecastSlice.js
// Purpose: Manages state for policy, appeals, and revenue forecast results using Redux Toolkit.
// Imports From: None
// Exported To: ./index.js, ../pages/PolicyEditor.jsx, ../pages/AppealsEditor.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  policy: null,
  appeals: {},
  results: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchDefaultPolicy = createAsyncThunk('forecast/fetchDefaultPolicy', async () => {
  const response = await fetch('/api/policy/default');
  if (!response.ok) throw new Error('Failed to fetch default policy');
  return response.json();
});

export const fetchDefaultAppeals = createAsyncThunk('forecast/fetchDefaultAppeals', async () => {
  const response = await fetch('/api/appeals/default');
  if (!response.ok) throw new Error('Failed to fetch default appeals');
  return response.json();
});

export const calculateForecast = createAsyncThunk('forecast/calculateForecast', async ({ policy, appeals }) => {
  const response = await fetch('/api/revenue-forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policy, appeals }),
  });
  if (!response.ok) throw new Error('Calculation failed on the server.');
  return response.json();
});

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    updatePolicy: (state, action) => {
      const { className, policy } = action.payload;
      state.policy[className] = policy;
    },
    updateAppeal: (state, action) => {
      const { className, value } = action.payload;
      state.appeals[className] = value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDefaultPolicy.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDefaultPolicy.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.policy = action.payload;
      })
      .addCase(fetchDefaultPolicy.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchDefaultAppeals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDefaultAppeals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appeals = action.payload;
      })
      .addCase(fetchDefaultAppeals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(calculateForecast.pending, (state) => {
        state.status = 'loading';
        state.results = null;
        state.error = null;
      })
      .addCase(calculateForecast.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload;
      })
      .addCase(calculateForecast.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updatePolicy, updateAppeal } = forecastSlice.actions;

export default forecastSlice.reducer;
