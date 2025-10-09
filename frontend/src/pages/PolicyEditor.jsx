// frontend/src/pages/PolicyEditor.jsx
// Purpose: Provides a UI for users to edit property tax policy rates and tiers, and view revenue forecasts.
// Imports From: ../theme.js, ../components/PolicyTiers.jsx, ../components/RevenueSummary.jsx, ../components/Spinner.jsx, ../store/forecastSlice.js
// Exported To: ../App.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import theme from '../theme.js';
import PolicyTiers from '../components/PolicyTiers.jsx';
import RevenueSummary from '../components/RevenueSummary.jsx';
import Spinner from '../components/Spinner.jsx';
import {
  fetchDefaultPolicy,
  updatePolicy,
  calculateForecast,
  fetchDefaultAppeals,
} from '../store/forecastSlice.js';

export default function PolicyEditor() {
  const dispatch = useDispatch();
  const { policy, appeals, results, status, error } = useSelector((state) => state.forecast);
  const [comparisonYear, setComparisonYear] = useState('None');
  const isLoading = status === 'loading';

  useEffect(() => {
    if (!policy) {
      dispatch(fetchDefaultPolicy());
    }
    // Ensure appeals are loaded if not already present
    if (Object.keys(appeals).length === 0) {
      dispatch(fetchDefaultAppeals());
    }
  }, [dispatch, policy, appeals]);

  const handlePolicyChange = (className, newPolicy) => {
    dispatch(updatePolicy({ className, policy: newPolicy }));
  };

  const handleCalculate = () => {
    if (policy && appeals) {
      dispatch(calculateForecast({ policy, appeals }));
    }
  };

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
      maxWidth: '1200px',
      margin: '0 auto',
    },
    policyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    controlsContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1.5rem',
      marginBottom: '1rem',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
    },
    calculateButton: {
      padding: '12px 24px',
      fontSize: '1em',
      fontWeight: 'bold',
      color: theme.buttonText,
      backgroundColor: theme.primary,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, opacity 0.2s',
    },
    errorMessage: {
      color: theme.error,
      fontFamily: 'monospace',
      marginTop: '1rem',
      textAlign: 'center',
    },
    selectLabel: {
      color: theme.textSecondary,
      fontWeight: 'bold',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.background,
      color: theme.textPrimary,
      fontSize: '0.9em',
    },
  };

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>Policy Editor & Revenue Forecaster</h1>
        <p style={styles.subtitle}>
          Adjust tax rates and tiers to forecast revenue based on 2025 property data.
        </p>
      </header>
      <main className="content-card" style={styles.contentCard}>
        {policy ? (
          <>
            <div style={styles.policyGrid}>
              {Object.keys(policy).sort().map((className) => (
                <PolicyTiers
                  key={className}
                  className={className}
                  policy={policy[className]}
                  onPolicyChange={handlePolicyChange}
                />
              ))}
            </div>
            <div style={styles.controlsContainer}>
              <div style={styles.buttonContainer}>
                <button
                  style={{
                    ...styles.calculateButton,
                    ...(isLoading && { cursor: 'not-allowed', opacity: 0.6 }),
                  }}
                  onClick={handleCalculate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Calculating...' : 'Calculate Revenue'}
                </button>
                {isLoading && <Spinner />}
              </div>
              <div>
                <label htmlFor="comparison-year" style={styles.selectLabel}>Compare To: </label>
                <select 
                  id="comparison-year"
                  style={styles.select}
                  value={comparisonYear}
                  onChange={(e) => setComparisonYear(e.target.value)}
                >
                  <option value="None">None</option>
                  <option value="FY 2025">FY 2025</option>
                  <option value="FY 2026">FY 2026</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.buttonContainer}>
            {isLoading ? <Spinner /> : <p>Loading policy editor...</p>}
          </div>
        )}

        {error && <p style={styles.errorMessage}>{error}</p>}

        <RevenueSummary results={results} comparisonYear={comparisonYear} appeals={appeals} />
      </main>
    </div>
  );
}
