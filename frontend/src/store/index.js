// frontend/src/store/index.js
// Purpose: Configures and exports the Redux store for state management.
// Imports From: ./forecastSlice.js
// Exported To: ../main.jsx
import { configureStore } from '@reduxjs/toolkit';
import forecastReducer from './forecastSlice.js';

export const store = configureStore({
  reducer: {
    forecast: forecastReducer,
  },
});
