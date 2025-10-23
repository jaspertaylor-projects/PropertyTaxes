// frontend/src/components/PuraVibaBadge.jsx
// Purpose: Brand badge for PuraViba; larger clickable area with text revealed only when hovering the PNG.
// Imports From: None
// Exported To: ../components/FooterBadgeBar.jsx, ../App.jsx
import React from 'react';

export default function PuraVibaBadge() {
  const [isBadgeHovered, setIsBadgeHovered] = React.useState(false);
  const [isImageHovered, setIsImageHovered] = React.useState(false);

  const containerStyle = {
    display: 'inline-block',
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px 6px 4px',
    borderRadius: '9999px',
    textDecoration: 'none',
    backgroundColor: isBadgeHovered ? 'rgba(0,0,0,0.08)' : 'transparent',
    border: 'none',
    color: '#222',
    transform: isBadgeHovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'background-color 160ms ease, transform 160ms ease',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const imageStyle = {
    width: '16px',
    height: '16px',
    borderRadius: '6px',
    display: 'block',
  };

  const textStyle = {
    fontSize: '11px',
    lineHeight: 1,
    opacity: 0.9,
    whiteSpace: 'nowrap',
    display: isImageHovered ? 'inline' : 'none',
  };

  return (
    <div className="pura-viba-badge-container" style={containerStyle}>
      <div
        className="pura-viba-badge"
        style={badgeStyle}
        onMouseEnter={() => setIsBadgeHovered(true)}
        onMouseLeave={() => setIsBadgeHovered(false)}
      >
        <img
          className="pura-viba-badge-image"
          src="/puraviba.png"
          alt="PuraViba logo"
          style={imageStyle}
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
        />
        <span className="pura-viba-badge-text" style={textStyle}>
          Made by PuraViba IDE
        </span>
      </div>
    </div>
  );
}
