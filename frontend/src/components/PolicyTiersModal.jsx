// frontend/src/components/PolicyTiersModal.jsx
// Purpose: Provides a modal UI for editing, adding, and removing policy tiers for a tax class.
// Imports From: ../theme.js
// Exported To: ../components/PolicyTiers.jsx
import React from 'react';
import { PlusCircle, XCircle } from 'lucide-react';
import theme from '../theme.js';

export default function PolicyTiersModal({ className, policy, onPolicyChange, onClose }) {
  const handleTierChange = (tierIndex, field, value) => {
    const newTiers = [...policy.tiers];
    newTiers[tierIndex] = { ...newTiers[tierIndex], [field]: parseFloat(value) || 0 };

    // Sort tiers to ensure they are always in ascending order of 'up_to'
    const sortedTiers = newTiers.sort((a, b) => {
      if (a.up_to === null) return 1; // null (infinity) should be last
      if (b.up_to === null) return -1;
      return a.up_to - b.up_to;
    });

    onPolicyChange(className, { ...policy, tiers: sortedTiers });
  };

  const addTier = () => {
    const currentTiers = policy.tiers || [];

    // This function is called from the modal to add a new tier to an existing list.
    // The parent component ensures there's at least one tier before opening the modal.
    if (currentTiers.length === 0) {
      console.error("addTier was called with no tiers, which should not happen.");
      // As a fallback, create a first tier, clearing the flat rate.
      const newTier = { rate: policy.rate || 10, up_to: null };
      onPolicyChange(className, { ...policy, rate: undefined, tiers: [newTier] });
      return;
    }

    // Ensure we are working with sorted tiers before adding a new one
    const sortedCurrentTiers = [...currentTiers].sort((a, b) => {
      if (a.up_to === null) return 1;
      if (b.up_to === null) return -1;
      return a.up_to - b.up_to;
    });

    const lastTierIndex = sortedCurrentTiers.length - 1;
    const lastTier = sortedCurrentTiers[lastTierIndex];
    
    // The lower bound for the last tier is the upper bound of the tier before it.
    const lowerBoundOfLastTier = lastTierIndex > 0 ? sortedCurrentTiers[lastTierIndex - 1].up_to : 0;

    // The tier that was previously last now needs an upper bound.
    // We'll set a default that is 1M higher than its lower bound.
    const updatedLastTier = {
      ...lastTier,
      up_to: (lowerBoundOfLastTier || 0) + 1000000,
    };

    // The new tier becomes the last one, with no upper bound (infinity).
    // It inherits the rate from the previously last tier.
    const newTier = {
      rate: lastTier.rate,
      up_to: null,
    };

    const newTiers = [
      ...sortedCurrentTiers.slice(0, lastTierIndex),
      updatedLastTier,
      newTier,
    ];
    
    onPolicyChange(className, { ...policy, tiers: newTiers });
  };

  const removeTier = (tierIndex) => {
    const currentTiers = policy.tiers;
    const removedTier = currentTiers[tierIndex];

    // Create new array without the removed tier
    let newTiers = currentTiers.filter((_, i) => i !== tierIndex);

    if (newTiers.length === 0) {
      onPolicyChange(className, { rate: removedTier.rate || 0, tiers: [] });
      onClose();
      return;
    }
    
    const lastTierIndex = newTiers.length - 1;
    const lastTier = newTiers[lastTierIndex];

    // Ensure the new last tier is a new object with up_to: null to trigger re-render
    newTiers[lastTierIndex] = { ...lastTier, up_to: null };

    onPolicyChange(className, { ...policy, tiers: newTiers });
  };

  const formatLimit = (value) => {
    if (value >= 1000000) return `$${value / 1000000}M`;
    if (value >= 1000) return `$${value / 1000}k`;
    return `$${value}`;
  };

  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      padding: '2rem',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      boxShadow: `0 6px 20px ${theme.shadow}`,
      width: '90%',
      maxWidth: '600px',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    modalTitle: {
      color: theme.primary,
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0.5rem',
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '1rem',
    },
    label: {
      fontSize: '0.9em',
      color: theme.textSecondary,
    },
    input: {
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme.border}`,
      backgroundColor: 'white',
      color: theme.textPrimary,
      width: '120px',
    },
    prefix: {
      color: theme.textSecondary,
    },
    tierActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.5rem',
    },
    addButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontSize: '0.9em',
        backgroundColor: theme.background,
        color: theme.primary,
        border: `1px solid ${theme.primary}`,
        borderRadius: '6px',
        cursor: 'pointer',
    },
    doneButton: {
      padding: '10px 20px',
      fontSize: '1em',
      fontWeight: 'bold',
      color: theme.buttonText,
      backgroundColor: theme.primary,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
  };

  const tiers = policy.tiers || [];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Tiers for {className}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <XCircle color={theme.textSecondary} />
          </button>
        </div>
        
        <div>
          {tiers.map((tier, index) => {
            const prevTierLimit = index > 0 ? tiers[index - 1].up_to : 0;
            const isLastTier = index === tiers.length - 1;

            return (
              <div key={index} style={styles.inputGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto' }}>
                  <label style={{...styles.label, flex: '0 0 auto', minWidth: 'auto'}}>
                    {`Tier ${index + 1} (> ${formatLimit(prevTierLimit)} to`}
                  </label>
                  {isLastTier ? (
                    <span style={{...styles.label, flex: '0 0 auto', minWidth: 'auto', color: theme.textPrimary, marginLeft: '8px'}}> Infinity)</span>
                  ) : (
                    <>
                      <input
                        type="number"
                        style={styles.input}
                        value={tier.up_to || ''}
                        onChange={(e) => handleTierChange(index, 'up_to', e.target.value)}
                        step="10000"
                      />
                      <span style={styles.prefix}>)</span>
                    </>
                  )}
                </div>
                <span style={styles.prefix}>$</span>
                <input
                  type="number"
                  style={styles.input}
                  value={tier.rate}
                  onChange={(e) => handleTierChange(index, 'rate', e.target.value)}
                  step="0.01"
                />
                <span style={styles.prefix}>per $1k</span>
                <div style={styles.tierActions}>
                    <button onClick={() => removeTier(index)} style={styles.actionButton}>
                        <XCircle size={20} color={theme.error} />
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.footer}>
            <button onClick={addTier} style={styles.addButton}>
                <PlusCircle size={18} /> Add Tier
            </button>
            <button onClick={onClose} style={styles.doneButton}>Done</button>
        </div>
      </div>
    </div>
  );
}
