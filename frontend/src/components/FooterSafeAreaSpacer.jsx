// frontend/src/components/FooterSafeAreaSpacer.jsx
// Purpose: Visual spacer matching the app background to reserve space above the fixed footer badge bar so content never appears clipped.
// Imports From: ../theme.js, ./FooterBadgeBar.jsx
// Exported To: ../App.jsx
import React from 'react';
import theme from '../theme.js';
import { BADGE_RESERVED_SPACE_CSS } from './FooterBadgeBar.jsx';

export default function FooterSafeAreaSpacer() {
  const spacerStyle = {
    width: '100%',
    height: BADGE_RESERVED_SPACE_CSS,
    backgroundColor: theme.background,
    flexShrink: 0,
  };

  return (
    <div
      className="footer-safe-area-spacer"
      style={spacerStyle}
      aria-hidden="true"
    />
  );
}
