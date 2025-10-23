// frontend/src/components/PuraVibaBadge.jsx
// Purpose: Brand badge that links to PuraViba; sized to fit inside the footer bar without overlapping content.
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
    gap: '6px',
    padding: '2px 6px 2px 2px',
    borderRadius: '9999px',
    textDecoration: 'none',
    backgroundColor: isHovered ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#222',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const imageStyle = {
    width: '12px',
    height: '12px',
    borderRadius: '4px',
    display: 'block',
  };

  const textStyle = {
    fontSize: '10px',
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
