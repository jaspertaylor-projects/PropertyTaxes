// frontend/src/components/PuraVibaBadge.jsx
// Purpose: Brand badge that links to PuraViba. Designed to be placed inside a footer bar so it does not overlap content.
// Imports From: None
// Exported To: ../components/FooterBadgeBar.jsx, ../App.jsx
import React from 'react';

export default function PuraVibaBadge() {
  const [isHovered, setIsHovered] = React.useState(false);

  const containerStyle = {
    display: 'inline-block',
  };

  const linkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px 6px 6px',
    borderRadius: '9999px',
    textDecoration: 'none',
    backgroundColor: isHovered ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#222',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const imageStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'block',
  };

  const textStyle = {
    fontSize: '12px',
    lineHeight: 1,
    opacity: 0.85,
    whiteSpace: 'nowrap',
  };

  return (
    <div className="pura-viba-badge-container" style={containerStyle}>
      <a
        className="pura-viba-badge-link"
        href="https://www.puraviba.com"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Visit PuraViba"
      >
        <img
          className="pura-viba-badge-image"
          src="/puraviba.png"
          alt="PuraViba logo"
          style={imageStyle}
        />
        <span className="pura-viba-badge-text" style={textStyle}>
          Made by PuraViba IDE
        </span>
      </a>
    </div>
  );
}
