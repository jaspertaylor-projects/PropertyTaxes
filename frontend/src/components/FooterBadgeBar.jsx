// frontend/src/components/FooterBadgeBar.jsx
// Purpose: Provides a fixed, transparent bottom tray and a separate badge anchor so content can scroll beneath; sets a CSS var for reserved height used by App layout.
// Imports From: ./PuraVibaBadge.jsx
// Exported To: ../App.jsx
import React from 'react';
import PuraVibaBadge from './PuraVibaBadge.jsx';

export const BADGE_RESERVED_SPACE_CSS = 'calc(44px + env(safe-area-inset-bottom))';

export default function FooterBadgeBar() {
  const anchorRef = React.useRef(null);

  React.useEffect(() => {
    const setHeightVar = () => {
      const el = anchorRef.current;
      const h = el ? el.offsetHeight : 0;
      const value = h > 0 ? `${h}px` : BADGE_RESERVED_SPACE_CSS;
      document.documentElement.style.setProperty('--footer-badge-reserved-space', value);
    };

    setHeightVar();

    const ro = new ResizeObserver(() => setHeightVar());
    if (anchorRef.current) {
      ro.observe(anchorRef.current);
    }

    const onResize = () => setHeightVar();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

  const trayStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 800,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    minHeight: 'var(--footer-badge-reserved-space, ' + BADGE_RESERVED_SPACE_CSS + ')',
  };

  const anchorBarStyle = {
    position: 'fixed',
    left: 0,
    right: 'auto',
    bottom: 0,
    zIndex: 900,
    backgroundColor: 'transparent',
    borderTop: 'none',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '8px',
    padding: '4px 8px',
    paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
    minHeight: '20px',
  };

  return (
    <>
      <div
        className="footer-badge-tray-transparent"
        style={trayStyle}
        aria-hidden="true"
      />
      <div
        ref={anchorRef}
        className="footer-badge-bar-anchor"
        style={anchorBarStyle}
        role="contentinfo"
        aria-label="PuraViba footer badge"
      >
        <PuraVibaBadge />
      </div>
    </>
  );
}
