// frontend/src/components/PolicyTiers.jsx
// Purpose: Renders an editable form for a single tax class policy.
// Imports From: ../theme.js
// Exported To: ../pages/PolicyEditor.jsx
import React from 'react';
import theme from '../theme.js';

export default function PolicyTiers({ className, policy, onPolicyChange }) {
  const handleRateChange = (e) => {
    onPolicyChange(className, { ...policy, rate: parseFloat(e.target.value) || 0 });
  };

  const handleTierChange = (tierIndex, field, value) => {
    const newTiers = [...policy.tiers];
    newTiers[tierIndex] = { ...newTiers[tierIndex], [field]: parseFloat(value) || 0 };
    onPolicyChange(className, { ...policy, tiers: newTiers });
  };

  const formatLimit = (value) => {
    if (value >= 1000000) return `$${value / 1000000}M`;
    if (value >= 1000) return `$${value / 1000}k`;
    return `$${value}`;
  };

  const styles = {
    card: {
      backgroundColor: theme.background,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
    },
    header: {
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: '1rem',
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '0.5rem',
    },
    label: {
      flex: '1 1 auto',
      fontSize: '0.9em',
      color: theme.textSecondary,
      minWidth: '150px',
    },
    input: {
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme.border}`,
      backgroundColor: 'white',
      color: theme.textPrimary,
      width: '100px',
    },
    prefix: {
      color: theme.textSecondary,
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>{className}</h3>
      {policy.tiers && policy.tiers.length > 0 ? (
        policy.tiers.map((tier, index) => {
          const prevTierLimit = index > 0 ? policy.tiers[index - 1].up_to : 0;
          return (
            <div key={index} style={styles.inputGroup}>
              <label style={styles.label}>
                {`Tier ${index + 1} `}
                {tier.up_to ? `(> ${formatLimit(prevTierLimit)} to ${formatLimit(tier.up_to)})` : `(> ${formatLimit(prevTierLimit)})`}
              </label>
              <span style={styles.prefix}>$</span>
              <input
                type="number"
                style={styles.input}
                value={tier.rate}
                onChange={(e) => handleTierChange(index, 'rate', e.target.value)}
                step="0.01"
              />
               <span style={styles.prefix}>per $1k</span>
            </div>
          );
        })
      ) : (
        <div style={styles.inputGroup}>
          <label style={styles.label}>Flat Rate</label>
           <span style={styles.prefix}>$</span>
          <input
            type="number"
            style={styles.input}
            value={policy.rate || ''}
            onChange={handleRateChange}
            step="0.01"
          />
           <span style={styles.prefix}>per $1k</span>
        </div>
      )}
    </div>
  );
}
