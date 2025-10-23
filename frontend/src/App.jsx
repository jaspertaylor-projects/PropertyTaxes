// frontend/src/App.jsx
// Purpose: Main application layout and routing. Sets Policy Editor as the home page and wires navigation.
// Imports From: ./App.css, ./theme.js, ./components/Navbar.jsx, ./pages/PolicyEditor.jsx, ./pages/AppealsEditor.jsx, ./components/PuraVibaBadge.jsx
// Exported To: ./main.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import theme from './theme.js';
import Navbar from './components/Navbar.jsx';
import PolicyEditor from './pages/PolicyEditor.jsx';
import AppealsEditor from './pages/AppealsEditor.jsx';
import PuraVibaBadge from './components/PuraVibaBadge.jsx';

export default function App() {
  const styles = {
    appContainer: {
      backgroundColor: theme.background,
      color: theme.textPrimary,
      minHeight: '100vh',
    },
    pageContent: {
      padding: '2rem',
      boxSizing: 'border-box',
    },
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      <Navbar />
      <div className="page-content" style={styles.pageContent}>
        <Routes>
          <Route path="/" element={<PolicyEditor />} />
          <Route path="/policy-editor" element={<PolicyEditor />} />
          <Route path="/appeals-editor" element={<AppealsEditor />} />
        </Routes>
      </div>
      <PuraVibaBadge />
    </div>
  );
}
