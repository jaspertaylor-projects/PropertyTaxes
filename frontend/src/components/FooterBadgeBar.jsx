// frontend/src/components/FooterBadgeBar.jsx
// Purpose: Fixed, full-width footer bar that hosts the PuraViba badge; reserves space so it never overlaps page content.
// Imports From: ../theme.js, ./PuraVibaBadge.jsx
// Exported To: ../App.jsx
import React from 'react';
import theme from '../theme.js';
import PuraVibaBadge from './PuraVibaBadge.jsx';

export const BADGE_RESERVED_SPACE_CSS = 'calc(28px + env(safe-area-inset-bottom))';

export default function FooterBadgeBar() {
  const containerStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    backgroundColor: theme.background,
    borderTop: `1px solid ${theme.border}`,
    boxShadow: `0 -2px 12px ${theme.shadow}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '8px',
    padding: '4px 8px',
    paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
    minHeight: '20px',
  };

  return (
    <div
      className="footer-badge-bar-container"
      style={containerStyle}
      role="contentinfo"
      aria-label="PuraViba footer badge"
    >
      <PuraVibaBadge />
    </div>
  );
}
