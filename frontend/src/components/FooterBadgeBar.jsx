// frontend/src/components/FooterBadgeBar.jsx
// Purpose: Fixed, full-width footer bar that hosts the PuraViba badge so it always sits on its own line without overlapping content.
// Imports From: ../theme.js, ./PuraVibaBadge.jsx
// Exported To: ../App.jsx
import React from 'react';
import theme from '../theme.js';
import PuraVibaBadge from './PuraVibaBadge.jsx';

export const BADGE_RESERVED_SPACE_CSS = 'calc(72px + env(safe-area-inset-bottom))';

export default function FooterBadgeBar() {
  const containerStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    backgroundColor: theme.cardBackground,
    borderTop: `1px solid ${theme.border}`,
    boxShadow: `0 -2px 12px ${theme.shadow}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    padding: '10px 16px',
    paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
    minHeight: '56px',
  };

  return (
    <div className="footer-badge-bar-container" style={containerStyle} role="contentinfo" aria-label="PuraViba footer badge">
      <PuraVibaBadge />
    </div>
  );
}
