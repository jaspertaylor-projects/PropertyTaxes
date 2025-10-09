// frontend/src/App.jsx
// Purpose: Serves as the main application layout, including routing and global styles.
// Imports From: ./App.css, ./theme.js, ./components/Navbar.jsx, ./pages/DataInspector.jsx, ./pages/PolicyEditor.jsx
// Exported To: ./main.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import theme from './theme.js';
import Navbar from './components/Navbar.jsx';
import DataInspector from './pages/DataInspector.jsx';
import PolicyEditor from './pages/PolicyEditor.jsx';

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
    }
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      <Navbar />
      <div className="page-content" style={styles.pageContent}>
        <Routes>
          <Route path="/" element={<DataInspector />} />
          <Route path="/policy-editor" element={<PolicyEditor />} />
        </Routes>
      </div>
    </div>
  );
}
