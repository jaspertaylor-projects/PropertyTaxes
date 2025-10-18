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
  fetchDefaults,
  restoreDefaultPolicy,
  fetchTierParcelCounts,
} from '../store/forecastSlice.js';

export default function PolicyEditor() {
  const dispatch = useDispatch();
  const { policy, defaultPolicy, appeals, results, status, error, tierCounts } = useSelector((state) => state.forecast) || {};
  const [comparisonYear, setComparisonYear] = useState('None');
  const [applyExemptionAverage, setApplyExemptionAverage] = useState(false);
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchDefaultPolicy());
    if (!appeals || Object.keys(appeals).length === 0) {
      dispatch(fetchDefaults());
    }
  }, [dispatch]);

  const handlePolicyChange = (className, newPolicy) => {
    dispatch(updatePolicy({ className, policy: newPolicy }));
  };

  const handleCalculate = () => {
    if (policy && appeals) {
      dispatch(calculateForecast({ policy, appeals, applyExemptionAverage }));
      dispatch(fetchTierParcelCounts({ policy }));
    }
  };

  const handleExemptionChange = (isChecked) => {
    setApplyExemptionAverage(isChecked);
    // Automatically recalculate if results are already being displayed
    if (policy && appeals && results) {
      dispatch(calculateForecast({ policy, appeals, applyExemptionAverage: isChecked }));
      dispatch(fetchTierParcelCounts({ policy }));
    }
  };

  const handleRestoreDefaults = () => {
    dispatch(restoreDefaultPolicy());
  };

  const arePoliciesDifferent = policy && defaultPolicy && JSON.stringify(policy) !== JSON.stringify(defaultPolicy);

  const styles = {
    spinnerOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    topBar: {
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '0.5rem 2rem',
      minHeight: '50px', // Reserve space to avoid layout shift
      alignItems: 'center',
    },
    restoreButton: {
      padding: '8px 16px',
      fontSize: '0.9em',
      fontWeight: 'bold',
      color: theme.primary,
      backgroundColor: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: theme.primary,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s, opacity 0.2s, border-color 0.2s',
    },
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
      flexWrap: 'wrap',
    },
    restoreContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '1.5rem',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      minHeight: '48px', // Reserve space to prevent layout shift
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
  };

  return (
    <div>
      {isLoading && (
        <div style={styles.spinnerOverlay}>
          <Spinner size="64px" />
        </div>
      )}
      <div style={styles.topBar}></div>
      <header style={styles.header}>
        <h1 style={styles.title}>Policy Editor & Revenue Forecaster</h1>
        <p style={styles.subtitle}>
          Adjust tax rates and tiers to forecast revenue based on 2025 property data.
        </p>
      </header>
      <main className="policy-editor-content-card" style={styles.contentCard}>
        {policy ? (
          <>
            <div style={styles.restoreContainer}>
              <button
                style={{
                  ...styles.restoreButton,
                  ...(!arePoliciesDifferent && {
                    cursor: 'not-allowed',
                    opacity: 0.5,
                    color: theme.textSecondary,
                    borderColor: theme.border,
                  }),
                }}
                onClick={handleRestoreDefaults}
                disabled={!arePoliciesDifferent}
              >
                Restore Actual 2026 Rates
              </button>
            </div>
            <div style={styles.policyGrid}>
              {Object.keys(policy)
                .sort()
                .map((className) => (
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
                  Calculate Revenue
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.buttonContainer}>
            {!isLoading && !error && <p>Loading policy editor...</p>}
          </div>
        )}

        {error && <p style={styles.errorMessage}>{error}</p>}

        <RevenueSummary
          results={results}
          appeals={appeals}
          comparisonYear={comparisonYear}
          onComparisonYearChange={setComparisonYear}
          applyExemptionAverage={applyExemptionAverage}
          onExemptionChange={handleExemptionChange}
          isLoading={isLoading}
          tierCounts={tierCounts}
        />
      </main>
    </div>
  );
}
