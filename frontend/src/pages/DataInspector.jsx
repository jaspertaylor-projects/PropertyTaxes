// frontend/src/pages/DataInspector.jsx
// Purpose: Provides a UI to inspect raw data files, perform validation checks, and surface how multi-class parcels are handled in forecasts.
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

  const [flagCountsPardat, setFlagCountsPardat] = useState(null);
  const [flagCountsLndar, setFlagCountsLndar] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagError, setFlagError] = useState(null);

  const [multiclassPolicy, setMulticlassPolicy] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/dataframes')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dataframe list');
        return res.json();
      })
      .then(data => {
        setDataframes(data);
        if (data.length > 0) setSelectedDataframe(data[0]);
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
    setFlagCountsPardat(null);
    setFlagCountsLndar(null);
    setFlagError(null);

    const p1 = fetch('/api/dataframes/fullpardat25/multiple-class-flag-counts').then(r => {
      if (!r.ok) throw new Error('Failed to fetch MULTIPLE_CLASS_FLAG counts (PARDAT).');
      return r.json();
    });

    const p2 = fetch('/api/dataframes/fulllndarclass25/multiple-class-flag-counts').then(r => {
      if (!r.ok) throw new Error('Failed to fetch MULTIPLE_CLASS_FLAG counts (LNDARCLASS).');
      return r.json();
    });

    Promise.all([p1, p2])
      .then(([pardat, lndar]) => {
        setFlagCountsPardat(pardat);
        setFlagCountsLndar(lndar);
      })
      .catch(err => setFlagError(err.message))
      .finally(() => setLoadingFlags(false));
  };

  const handleFetchMulticlassPolicy = () => {
    setLoadingPolicy(true);
    setMulticlassPolicy(null);
    setPolicyError(null);
    fetch('/api/policy/multiclass-behavior')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch multi-class behavior.');
        return res.json();
      })
      .then(data => setMulticlassPolicy(data))
      .catch(err => setPolicyError(err.message))
      .finally(() => setLoadingPolicy(false));
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
    section: { marginTop: '2rem', borderTop: `2px solid ${theme.border}`, paddingTop: '1rem' },
    button: {
      padding: '10px 15px',
      backgroundColor: theme.primary,
      color: theme.buttonText,
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      marginRight: '1rem'
    },
    resultsContainer: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: theme.background,
      border: `1px solid ${theme.border}`,
      borderRadius: '4px'
    },
    codeBlock: {
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      padding: '12px',
      borderRadius: '6px',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
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

      <div style={styles.section}>
        <h2>Data Validation Checks</h2>
        <p>Run checks to inspect data integrity.</p>
        <button onClick={handleFetchFlagCounts} disabled={loadingFlags} style={styles.button}>
          Count MULTIPLE_CLASS_FLAG (PARDAT & LNDAR)
        </button>
        {loadingFlags && <Spinner />}
        {flagError && <p style={styles.error}>{flagError}</p>}
        {(flagCountsPardat || flagCountsLndar) && (
          <div style={styles.resultsContainer}>
            <h3>Multiple Class Flag Counts</h3>
            {flagCountsPardat && (
              <>
                <h4>Source: fullpardat25</h4>
                <pre style={styles.codeBlock}>{JSON.stringify(flagCountsPardat, null, 2)}</pre>
              </>
            )}
            {flagCountsLndar && (
              <>
                <h4>Source: fulllndarclass25</h4>
                <pre style={styles.codeBlock}>{JSON.stringify(flagCountsLndar, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2>How Multi-Class Parcels Are Treated in Forecasts</h2>
        <p>
          This explains exactly what happens when <code>MULTIPLE_CLASS_FLAG</code> is <code>"X"</code>.
          Click the button to fetch the backend’s declared behavior and quick counts.
        </p>
        <button onClick={handleFetchMulticlassPolicy} disabled={loadingPolicy} style={styles.button}>
          Show Multi-Class Behavior
        </button>
        {loadingPolicy && <Spinner />}
        {policyError && <p style={styles.error}>{policyError}</p>}
        {multiclassPolicy && (
          <div style={styles.resultsContainer}>
            <h3>Declared Behavior</h3>
            <p><strong>Strategy:</strong> {multiclassPolicy.strategy}</p>
            <p className="data-inspector-multiclass-desc">{multiclassPolicy.description}</p>
            <h4>Data Sources</h4>
            <pre style={styles.codeBlock}>{JSON.stringify(multiclassPolicy.data_sources, null, 2)}</pre>
            {multiclassPolicy.counts && (
              <>
                <h4>Flag Counts</h4>
                <pre style={styles.codeBlock}>{JSON.stringify(multiclassPolicy.counts, null, 2)}</pre>
              </>
            )}
            {multiclassPolicy.notes && (
              <>
                <h4>Notes</h4>
                <pre style={styles.codeBlock}>{JSON.stringify(multiclassPolicy.notes, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
