// frontend/src/pages/DataInspector.jsx
// Purpose: Provides a UI to inspect raw data files and perform data validation checks.
// Imports From: ../theme.js, ../components/Spinner.jsx
// Exported To: ../App.jsx
import React, { useState, useEffect } from 'react';
import theme from '../theme.js';
import Spinner from '../components/Spinner.jsx';

export default function DataInspector() {
  const [dataframes, setDataframes] = useState([]);
  const [selectedDataframe, setSelectedDataframe] = useState('');
  const [dataframeHead, setDataframeHead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flagCounts, setFlagCounts] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagError, setFlagError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/dataframes')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dataframe list');
        return res.json();
      })
      .then(data => {
        setDataframes(data);
        if (data.length > 0) {
          setSelectedDataframe(data[0]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDataframe) return;
    setLoading(true);
    setDataframeHead(null);
    setError(null);
    fetch(`/api/dataframes/${selectedDataframe}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch data for ${selectedDataframe}`);
        return res.json();
      })
      .then(data => setDataframeHead(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDataframe]);

  const handleFetchFlagCounts = () => {
    setLoadingFlags(true);
    setFlagCounts(null);
    setFlagError(null);
    fetch('/api/dataframes/fullpardat25/multiple-class-flag-counts')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch multiple class flag counts.');
        return res.json();
      })
      .then(data => setFlagCounts(data))
      .catch(err => setFlagError(err.message))
      .finally(() => setLoadingFlags(false));
  };

  const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    title: { color: theme.primary, borderBottom: `2px solid ${theme.border}`, paddingBottom: '0.5rem' },
    select: { padding: '8px', margin: '1rem 0', fontSize: '1rem' },
    tableContainer: { overflowX: 'auto', maxHeight: '500px', border: `1px solid ${theme.border}` },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: theme.secondary, color: theme.buttonText, padding: '8px', textAlign: 'left', position: 'sticky', top: 0 },
    td: { padding: '8px', borderBottom: `1px solid ${theme.border}` },
    error: { color: theme.error, marginTop: '1rem' },
    validationSection: { marginTop: '2rem', borderTop: `2px solid ${theme.border}`, paddingTop: '1rem' },
    button: {
      padding: '10px 15px',
      backgroundColor: theme.primary,
      color: theme.buttonText,
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      marginRight: '1rem',
    },
    resultsContainer: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: theme.background,
      border: `1px solid ${theme.border}`,
      borderRadius: '4px',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Data Inspector</h1>
      
      <p>Select a dataframe to view its first 10 rows.</p>
      <select
        value={selectedDataframe}
        onChange={(e) => setSelectedDataframe(e.target.value)}
        style={styles.select}
        disabled={loading}
      >
        {dataframes.map(df => <option key={df} value={df}>{df}</option>)}
      </select>

      {loading && <Spinner />}
      {error && <p style={styles.error}>{error}</p>}

      {dataframeHead && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(dataframeHead[0] || {}).map(key => <th style={styles.th} key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataframeHead.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((val, colIndex) => (
                    <td style={styles.td} key={colIndex}>{val === null ? 'NULL' : String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.validationSection}>
        <h2>Data Validation Checks</h2>
        <p>Run checks to inspect data integrity.</p>
        <button onClick={handleFetchFlagCounts} disabled={loadingFlags} style={styles.button}>
          Count Multiple Class Flags
        </button>
        {loadingFlags && <Spinner />}
        {flagError && <p style={styles.error}>{flagError}</p>}
        {flagCounts && (
          <div style={styles.resultsContainer}>
            <h3>Multiple Class Flag Counts (from fullpardat25)</h3>
            <pre>{JSON.stringify(flagCounts, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
