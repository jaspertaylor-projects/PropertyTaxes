// frontend/src/components/Navbar.jsx
// Purpose: Renders the main navigation bar for the application.
// Imports From: ../theme.js
// Exported To: ../App.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import theme from '../theme.js';

export default function Navbar() {
  const styles = {
    nav: {
      backgroundColor: theme.primary,
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: `0 2px 4px ${theme.shadow}`,
    },
    logo: {
      color: theme.buttonText,
      textDecoration: 'none',
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    navList: {
      listStyle: 'none',
      display: 'flex',
      margin: 0,
      padding: 0,
      gap: '1.5rem',
    },
    navLink: {
      color: theme.buttonText,
      textDecoration: 'none',
      fontSize: '1rem',
      fontWeight: '500',
      padding: '0.5rem 0',
      position: 'relative',
      opacity: 0.8,
    },
    activeLink: {
      opacity: 1,
      borderBottom: `2px solid ${theme.buttonText}`,
    },
  };

  const getNavLinkStyle = ({ isActive }) => {
    return isActive ? { ...styles.navLink, ...styles.activeLink } : styles.navLink;
  };

  return (
    <nav style={styles.nav}>
      <NavLink to="/" style={styles.logo}>
        Revenue Forecaster
      </NavLink>
      <ul style={styles.navList}>
        <li>
          <NavLink to="/" style={getNavLinkStyle}>
            Data Inspector
          </NavLink>
        </li>
        <li>
          <NavLink to="/policy-editor" style={getNavLinkStyle}>
            Policy Editor
          </NavLink>
        </li>
        <li>
          <NavLink to="/appeals-editor" style={getNavLinkStyle}>
            Appeals Editor
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
