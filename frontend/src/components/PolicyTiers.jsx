// frontend/src/components/PolicyTiers.jsx
// Purpose: Renders an editable form for a single tax class policy, including rates and tier limits. Labels show lower bound exclusive and upper bound inclusive.
// Imports From: ../theme.js, ./PolicyTiersModal.jsx
// Exported To: ../pages/PolicyEditor.jsx
import React, { useState } from 'react';
import theme from '../theme.js';
import PolicyTiersModal from './PolicyTiersModal.jsx';

export default function PolicyTiers({ className, policy, onPolicyChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRateChange = (e) => {
    onPolicyChange(className, { ...policy, rate: parseFloat(e.target.value) || 0 });
  };

  const handleTierRateChange = (tierIndex, value) => {
    const newTiers = [...policy.tiers];
    newTiers[tierIndex] = { ...newTiers[tierIndex], rate: parseFloat(value) || 0 };
    onPolicyChange(className, { ...policy, tiers: newTiers });
  };

  const handleAddTiers = () => {
    const newPolicy = {
      ...policy,
      rate: undefined,
      tiers: [{ rate: policy.rate || 0, up_to: null }],
    };
    onPolicyChange(className, newPolicy);
    setIsModalOpen(true);
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
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    header: {
      fontWeight: 'bold',
      color: theme.textPrimary,
      margin: 0,
    },
    editButton: {
      padding: '4px 8px',
      fontSize: '0.8em',
      backgroundColor: theme.background,
      color: theme.primary,
      border: `1px solid ${theme.primary}`,
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s',
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
    },
  };

  const hasTiers = policy.tiers && policy.tiers.length > 0;

  return (
    <>
      <div style={styles.card} className="policy-tiers-card">
        <div style={styles.headerContainer} className="policy-tiers-header">
          <h3 style={styles.header}>{className}</h3>
          {hasTiers ? (
            <button onClick={() => setIsModalOpen(true)} style={styles.editButton} className="policy-tiers-edit-button">
              Edit Tiers
            </button>
          ) : (
            <button onClick={handleAddTiers} style={styles.editButton} className="policy-tiers-add-button">
              Add Tiers
            </button>
          )}
        </div>

        {hasTiers ? (
          policy.tiers.map((tier, index) => {
            const prevTierLimit = index > 0 ? policy.tiers[index - 1].up_to : 0;
            const isLast = tier.up_to == null;
            const labelText = (() => {
              if (isLast) return `Tier ${index + 1} (over ${formatLimit(prevTierLimit)})`;
              if (index === 0) return `Tier ${index + 1} (up to ${formatLimit(tier.up_to)})`;
              const displayLower = (prevTierLimit || 0) + 1;
              return `Tier ${index + 1} (${formatLimit(displayLower)} to ${formatLimit(tier.up_to)})`;
            })();
            return (
              <div key={index} style={styles.inputGroup} className="policy-tiers-input-group">
                <label style={styles.label} className="policy-tiers-rate-label">
                  {labelText}
                </label>
                <span style={styles.prefix}>$</span>
                <input
                  type="number"
                  style={styles.input}
                  value={tier.rate}
                  onChange={(e) => handleTierRateChange(index, e.target.value)}
                  step="0.01"
                />
                <span style={styles.prefix}>per $1k</span>
              </div>
            );
          })
        ) : (
          <div style={styles.inputGroup} className="policy-tiers-flat-rate-group">
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
      {isModalOpen && (
        <PolicyTiersModal
          className={className}
          policy={policy}
          onPolicyChange={onPolicyChange}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
