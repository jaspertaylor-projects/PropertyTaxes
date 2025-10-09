// frontend/src/components/Spinner.jsx
// Purpose: A simple SVG loading spinner component.
// Imports From: ../theme.js
// Exported To: ../pages/PolicyEditor.jsx
import React from 'react';
import theme from '../theme.js';

export default function Spinner() {
  const styles = {
    spinner: {
      animation: 'rotate 1s linear infinite',
      width: '24px',
      height: '24px',
    },
    path: {
      stroke: theme.primary,
      strokeLinecap: 'round',
      animation: 'dash 1.5s ease-in-out infinite',
    },
  };

  // Inject keyframes into a style tag
  const keyframes = `
    @keyframes rotate { 100% { transform: rotate(360deg); } }
    @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <svg style={styles.spinner} viewBox="0 0 50 50">
        <circle
          style={styles.path}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        ></circle>
      </svg>
    </>
  );
}
