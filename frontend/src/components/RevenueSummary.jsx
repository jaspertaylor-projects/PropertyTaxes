// frontend/src/components/RevenueSummary.jsx
// Purpose: Displays the calculated revenue forecast in a table.
// Imports From: ../theme.js
// Exported To: ../pages/PolicyEditor.jsx
import React from 'react';
import theme from '../theme.js';

export default function RevenueSummary({ results, comparisonYear, appeals }) {
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

  const formatDifference = (current, comparison) => {
    if (comparison === undefined || comparison === null) return null;
    const diff = current - comparison;
    const percentage = comparison === 0 ? (diff > 0 ? 100 : 0) : (diff / comparison) * 100;
    const formattedDiff = formatCurrency(diff);
    const sign = diff >= 0 ? '+' : '';
    const color = diff > 0 ? theme.success : diff < 0 ? theme.error : theme.textSecondary;

    return (
      <span style={{ color, whiteSpace: 'nowrap' }}>
        {sign}{formattedDiff} ({percentage.toFixed(1)}%)
      </span>
    );
  };

  const styles = {
    container: {
      marginTop: '2rem',
      overflowX: 'auto',
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
  };

  const { results_by_class, totals, comparison_data } = results;
  const sortedClasses = Object.keys(results_by_class).sort();
  const comparison = comparisonYear !== 'None' && comparison_data ? comparison_data[comparisonYear] : null;

  const renderRow = (className, data, totalRow = false) => {
    const comparisonRow = comparison ? (totalRow ? comparison.totals : comparison[className]) : null;
    const appealValue = totalRow ? 
      Object.values(appeals || {}).reduce((sum, val) => sum + val, 0) :
      (appeals && appeals[className]) || 0;

    return (
      <tr key={className}>
        <td style={{...styles.td, ...styles.tdLeft}}>{className}</td>
        <td style={styles.td}>{formatNumber(data.parcel_count)}</td>
        <td style={{...styles.td, color: theme.error}}>{formatCurrency(appealValue)}</td>
        <td style={styles.td}>{formatCurrency(data.certified_value)}</td>
        {comparison && <td style={styles.td}>{comparisonRow ? formatCurrency(comparisonRow.certified_value) : 'N/A'}</td>}
        {comparison && <td style={styles.td}>{comparisonRow ? formatDifference(data.certified_value, comparisonRow.certified_value) : 'N/A'}</td>}
        <td style={styles.td}>{formatCurrency(data.certified_revenue)}</td>
        {comparison && <td style={styles.td}>{comparisonRow ? formatCurrency(comparisonRow.certified_revenue) : 'N/A'}</td>}
        {comparison && <td style={styles.td}>{comparisonRow ? formatDifference(data.certified_revenue, comparisonRow.certified_revenue) : 'N/A'}</td>}
      </tr>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Revenue Forecast {comparison ? `vs. ${comparisonYear}` : ''}</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{...styles.th, textAlign: 'left'}}>Tax Class</th>
            <th style={{...styles.th, textAlign: 'right'}}>Parcels</th>
            <th style={{...styles.th, textAlign: 'right'}}>Appeal Value</th>
            <th style={{...styles.th, textAlign: 'right'}}>Forecast Value (Net)</th>
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>{comparisonYear} Value</th>}
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>Value Diff.</th>}
            <th style={{...styles.th, textAlign: 'right'}}>Forecast Revenue (Net)</th>
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>{comparisonYear} Revenue</th>}
            {comparison && <th style={{...styles.th, textAlign: 'right'}}>Revenue Diff.</th>}
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
