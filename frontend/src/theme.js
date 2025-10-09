// frontend/src/theme.js
// Purpose: Defines the application's color theme as a simple JS object.
// Imports From: None
// Exported To: frontend/src/App.jsx, frontend/src/errors/ErrorBoundary.jsx, frontend/src/main.jsx

const theme = {
  primary: '#004225', // Forest Green
  secondary: '#556B2F', // Dark Olive Green
  background: '#FDF5E6', // Off-white (Old Lace)
  cardBackground: '#FFFFFF', // White
  textPrimary: '#36454F', // Charcoal
  textSecondary: '#556B2F', // Dark Olive Green
  textMuted: '#808080', // Gray
  textSuccess: '#228B22', // Forest Green
  buttonBackground: '#004225',
  buttonText: '#FFFFFF',
  error: '#B22222', // Firebrick
  border: '#DCDCDC', // Gainsboro (light grey)
  shadow: 'rgba(0, 0, 0, 0.1)',
  globalBackground: '#FDF5E6',
  globalText: '#36454F',
  // Generic button styles for global CSS
  buttonGenericBackground: '#F5F5F5',
  buttonGenericBorder: 'transparent',
  buttonGenericBackgroundHover: '#E0E0E0',
  buttonGenericBorderHover: '#004225',
};

export default theme;
