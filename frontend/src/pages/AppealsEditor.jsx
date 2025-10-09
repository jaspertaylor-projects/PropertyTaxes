// frontend/src/pages/AppealsEditor.jsx
// Purpose: Provides a UI for users to view and edit property tax appeal values by class.
// Imports From: ../theme.js, ../components/Spinner.jsx, ../store/forecastSlice.js
// Exported To: ../App.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import theme from '../theme.js';
import Spinner from '../components/Spinner.jsx';
import { fetchDefaultAppeals, updateAppeal } from '../store/forecastSlice.js';

export default function AppealsEditor() {
  const dispatch = useDispatch();
  const { appeals, status, error } = useSelector((state) => state.forecast);
  const isLoading = status === 'loading' && Object.keys(appeals).length === 0;

  useEffect(() => {
    if (Object.keys(appeals).length === 0) {
      dispatch(fetchDefaultAppeals());
    }
  }, [dispatch, appeals]);

  const handleAppealChange = (className, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      dispatch(updateAppeal({ className, value: numericValue }));
    }
  };

  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

  const styles = {
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    title: {
      color: theme.primary,
      margin: '0 0 0.5rem 0',
    },
    subtitle: {
      color: theme.textSecondary,
      margin: 0,
    },
    contentCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: '12px',
      padding: '2rem',
      border: `1px solid ${theme.border}`,
      boxShadow: `0 4px 12px ${theme.shadow}`,
      maxWidth: '800px',
      margin: '0 auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      backgroundColor: theme.secondary,
      color: theme.buttonText,
      padding: '12px 15px',
      textAlign: 'left',
      borderBottom: `2px solid ${theme.border}`,
    },
    td: {
      padding: '12px 15px',
      borderBottom: `1px solid ${theme.border}`,
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.background,
      color: theme.textPrimary,
      fontSize: '1em',
      textAlign: 'right',
    },
    errorMessage: {
      color: theme.error,
      textAlign: 'center',
      marginTop: '1rem',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>Appeals Editor</h1>
        <p style={styles.subtitle}>Adjust the total appeal value for each tax class. 50% of this value will be deducted from the class's total assessed value before calculating revenue.</p>
      </header>
      <main style={styles.contentCard}>
        {isLoading ? (
          <div style={styles.loadingContainer}><Spinner /></div>
        ) : error ? (
          <p style={styles.errorMessage}>{error}</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tax Class</th>
                <th style={{...styles.th, textAlign: 'right'}}>Appeal Value ($)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(appeals).sort().map((className) => (
                <tr key={className}>
                  <td style={styles.td}>{className}</td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      style={styles.input}
                      value={formatNumber(appeals[className])}
                      onChange={(e) => handleAppealChange(className, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
