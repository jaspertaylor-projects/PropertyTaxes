// frontend/src/components/RevenueSummary.jsx
// Purpose: Displays the calculated revenue forecast in a table.
// Imports From: ../theme.js
// Exported To: ../pages/PolicyEditor.jsx
import React from 'react';
import theme from '../theme.js';

export default function RevenueSummary({ results, comparisonYear, appeals, onComparisonYearChange, applyExemptionAverage, onExemptionChange }) {
  if (!results) {
    return null;
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value) =>
    new Intl.NumberFormat('en-US').format(value);

  const styles = {
    container: {
      marginTop: '2rem',
      overflowX: 'auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1rem',
      borderBottom: `2px solid ${theme.border}`,
      paddingBottom: '0.5rem',
    },
    title: {
      color: theme.primary,
      margin: 0,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9rem',
      minWidth: '900px',
    },
    th: {
      backgroundColor: theme.secondary,
      color: theme.buttonText,
      padding: '12px 15px',
      textAlign: 'left',
      borderBottom: `2px solid ${theme.border}`,
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '12px 15px',
      borderBottom: `1px solid ${theme.border}`,
      textAlign: 'right',
    },
    tdLeft: {
      textAlign: 'left',
      fontWeight: 'bold',
    },
    tfoot: {
      fontWeight: 'bold',
      backgroundColor: theme.background,
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
    toggleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    toggleLabel: {
      color: theme.textSecondary,
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    toggleSwitch: {
      cursor: 'pointer',
    },
  };

  const { results_by_class, totals, comparison_data } = results;
  const sortedClasses = Object.keys(results_by_class).sort();
  const comparison = comparisonYear !== 'None' && comparison_data ? comparison_data[comparisonYear] : null;

  const renderRow = (className, data, totalRow = false) => {
    const comparisonRow = comparison ? (totalRow ? comparison.totals : comparison[className]) : null;
    const appealValue = totalRow ? 
      Object.values(appeals || {}).reduce((sum, val) => sum + val, 0) :
      (appeals && appeals[className]) || 0;
    const exemptionCount = data.exemption_count ?? 0;

    return (
      <tr key={className}>
        <td style={{...styles.td, ...styles.tdLeft}}>{className}</td>
        <td style={styles.td}>{formatNumber(data.parcel_count)}</td>
        <td style={{...styles.td, color: theme.textSecondary}}>{formatNumber(exemptionCount)}</td>
        <td style={{...styles.td, color: theme.error}}>{formatCurrency(appealValue)}</td>
        <td style={styles.td}>{formatCurrency(data.certified_value)}</td>
        {comparison && <td style={styles.td}>{comparisonRow ? formatCurrency(comparisonRow.certified_value) : 'N/A'}</td>}
        <td style={styles.td}>{formatCurrency(data.certified_revenue)}</td>
        {comparison && <td style={styles.td}>{comparisonRow ? formatCurrency(comparisonRow.certified_revenue) : 'N/A'}</td>}
      </tr>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Revenue Forecast {comparison ? `vs. ${comparisonYear}` : ''}</h2>
        <div style={styles.controls}>
          <div style={styles.toggleContainer}>
            <input
              type="checkbox"
              id="exemption-toggle"
              style={styles.toggleSwitch}
              checked={applyExemptionAverage}
              onChange={(e) => onExemptionChange(e.target.checked)}
            />
            <label htmlFor="exemption-toggle" style={styles.toggleLabel}>
              Apply Exemptions
            </label>
          </div>
          <div>
            <label htmlFor="comparison-year" style={styles.selectLabel}>Compare To: </label>
            <select 
              id="comparison-year"
              style={styles.select}
              value={comparisonYear}
              onChange={(e) => onComparisonYearChange(e.target.value)}
            >
              <option value="None">None</option>
              <option value="FY 2025">FY 2025</option>
              <option value="FY 2026">FY 2026</option>
            </select>
          </div>
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{...styles.th, textAlign: 'left'}}>Tax Class</th>
            <th style={{...styles.th, textAlign: 'right'}}>Parcels</th>
            <th style={{...styles.th, textAlign: 'right'}}>Exemptions</th>
            <th style={{...styles.th, textAlign: 'right'}}>Appeal Value</th>
            <th style={{...styles.th, textAlign: 'right'}}>Forecast Value (Net)</th>
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>{comparisonYear} Value</th>}
            <th style={{...styles.th, textAlign: 'right'}}>Forecast Revenue (Net)</th>
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>{comparisonYear} Revenue</th>}
          </tr>
        </thead>
        <tbody>
          {sortedClasses.map((className) => renderRow(className, results_by_class[className]))}
        </tbody>
        <tfoot style={styles.tfoot}>
          {renderRow('Total', totals, true)}
        </tfoot>
      </table>
    </div>
  );
}
