// frontend/src/App.jsx
// Purpose: Main application layout and routing. Ensures page content scrolls independently and reserves space for the fixed footer.
// Imports From: ./App.css, ./theme.js, ./components/Navbar.jsx, ./pages/PolicyEditor.jsx, ./pages/AppealsEditor.jsx, ./components/FooterBadgeBar.jsx
// Exported To: ./main.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import theme from './theme.js';
import Navbar from './components/Navbar.jsx';
import PolicyEditor from './pages/PolicyEditor.jsx';
import AppealsEditor from './pages/AppealsEditor.jsx';
import FooterBadgeBar, { BADGE_RESERVED_SPACE_CSS } from './components/FooterBadgeBar.jsx';

export default function App() {
  const styles = {
    appContainer: {
      backgroundColor: theme.background,
      color: theme.textPrimary,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    pageContent: {
      padding: '2rem',
      boxSizing: 'border-box',
      flex: '1 1 auto',
      overflowY: 'auto',
      paddingBottom: 'calc(2rem + var(--footer-badge-reserved-space, ' + BADGE_RESERVED_SPACE_CSS + '))',
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
      <FooterBadgeBar />
    </div>
  );
}
