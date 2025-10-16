// frontend/src/store/forecastSlice.js
// Purpose: Manages state for policy, appeals, and revenue forecast results using Redux Toolkit.
// Imports From: None
// Exported To: ./index.js, ../pages/PolicyEditor.jsx, ../pages/AppealsEditor.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper to load policy from localStorage
const loadPolicyFromStorage = () => {
  try {
    const serializedPolicy = localStorage.getItem('mauiForecastPolicy');
    if (serializedPolicy === null) return null;
    return JSON.parse(serializedPolicy);
  } catch (e) {
    console.error("Could not load policy from local storage", e);
    return null;
  }
};

// Helper to save policy to localStorage
const savePolicyToStorage = (policy) => {
  try {
    const serializedPolicy = JSON.stringify(policy);
    localStorage.setItem('mauiForecastPolicy', serializedPolicy);
  } catch (e) {
    console.error("Could not save policy to local storage", e);
  }
};

const initialState = {
  policy: loadPolicyFromStorage(),
  defaultPolicy: null,
  appeals: {},
  exemptions: {},
  results: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchDefaultPolicy = createAsyncThunk('forecast/fetchDefaultPolicy', async () => {
  const response = await fetch('/api/policy/default');
  if (!response.ok) throw new Error('Failed to fetch default policy');
  return response.json();
});

export const fetchDefaults = createAsyncThunk('forecast/fetchDefaults', async () => {
  const response = await fetch('/api/appeals-and-exemptions');
  if (!response.ok) throw new Error('Failed to fetch default appeals and exemptions');
  return response.json();
});

export const calculateForecast = createAsyncThunk('forecast/calculateForecast', async ({ policy, appeals, applyExemptionAverage }) => {
  const response = await fetch('/api/revenue-forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policy, appeals, applyExemptionAverage }),
  });
  if (!response.ok) {
    let errorDetail = 'Calculation failed on the server.';
    try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
            errorDetail = errorData.detail;
        }
    } catch (e) {
        // Response was not JSON or was empty. Keep default error.
    }
    throw new Error(errorDetail);
  }
  return response.json();
});

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    updatePolicy: (state, action) => {
      const { className, policy } = action.payload;
      if (state.policy) {
        state.policy[className] = policy;
        savePolicyToStorage(state.policy);
      }
    },
    updateAppeal: (state, action) => {
      const { className, value } = action.payload;
      state.appeals[className] = value;
    },
    restoreDefaultPolicy: (state) => {
      if (state.defaultPolicy) {
        state.policy = state.defaultPolicy;
        savePolicyToStorage(state.policy);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDefaultPolicy.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDefaultPolicy.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.defaultPolicy = action.payload;
        if (state.policy === null) {
          state.policy = action.payload;
        }
      })
      .addCase(fetchDefaultPolicy.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchDefaults.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDefaults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appeals = action.payload.appeals;
        state.exemptions = action.payload.exemptions;
      })
      .addCase(fetchDefaults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(calculateForecast.pending, (state) => {
        state.status = 'loading';
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

export const { updatePolicy, updateAppeal, restoreDefaultPolicy } = forecastSlice.actions;

export default forecastSlice.reducer;
