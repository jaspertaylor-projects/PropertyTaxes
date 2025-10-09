// frontend/src/components/RevenueSummary.jsx
// Purpose: Displays the calculated revenue forecast in a table.
// Imports From: ../theme.js
// Exported To: ../pages/PolicyEditor.jsx
import React from 'react';
import theme from '../theme.js';

export default function RevenueSummary({ results }) {
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
    },
    title: {
      color: theme.primary,
      marginBottom: '1rem',
      borderBottom: `2px solid ${theme.border}`,
      paddingBottom: '0.5rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9rem',
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
  };

  const { results_by_class, totals } = results;
  const sortedClasses = Object.keys(results_by_class).sort();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Revenue Forecast</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{...styles.th, textAlign: 'left'}}>Tax Class</th>
            <th style={{...styles.th, textAlign: 'right'}}>Parcels</th>
            <th style={{...styles.th, textAlign: 'right'}}>Certified Value</th>
            <th style={{...styles.th, textAlign: 'right'}}>Certified Revenue</th>
          </tr>
        </thead>
        <tbody>
          {sortedClasses.map((className) => (
            <tr key={className}>
              <td style={{...styles.td, ...styles.tdLeft}}>{className}</td>
              <td style={styles.td}>{formatNumber(results_by_class[className].parcel_count)}</td>
              <td style={styles.td}>{formatCurrency(results_by_class[className].certified_value)}</td>
              <td style={styles.td}>{formatCurrency(results_by_class[className].certified_revenue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot style={styles.tfoot}>
          <tr>
            <td style={{...styles.td, ...styles.tdLeft}}>Total</td>
            <td style={styles.td}>{formatNumber(totals.parcel_count)}</td>
            <td style={styles.td}>{formatCurrency(totals.certified_value)}</td>
            <td style={styles.td}>{formatCurrency(totals.certified_revenue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
