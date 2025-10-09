// frontend/src/App.jsx
// Purpose: Provides a UI to select and inspect the first 10 rows of property tax dataframes loaded on the backend.
// Imports From: ./App.css, ./theme.js
// Exported To: ./main.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import theme from './theme.js';

function DataframeTable({ data }) {
  if (!data || data.length === 0) {
    return <p>No data to display. Select a dataframe to view its first 10 rows.</p>;
  }

  const headers = Object.keys(data[0]);

  const styles = {
    tableContainer: {
      overflowX: 'auto',
      maxWidth: '100%',
      marginTop: '1.5rem',
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: theme.cardBackground,
    },
    th: {
      backgroundColor: theme.secondary,
      color: theme.primary,
      padding: '12px 15px',
      textAlign: 'left',
      borderBottom: `2px solid ${theme.border}`,
    },
    td: {
      padding: '12px 15px',
      borderBottom: `1px solid ${theme.border}`,
      color: theme.textSecondary,
    },
    tr: {
      '&:last-child td': {
        borderBottom: 'none',
      },
    },
  };

  return (
    <div className="dataframe-table-container" style={styles.tableContainer}>
      <table className="dataframe-table" style={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={styles.th}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={styles.tr}>
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`} style={styles.td}>
                  {row[header] === null ? 'NULL' : String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [dataframes, setDataframes] = useState([]);
  const [selectedDataframe, setSelectedDataframe] = useState('');
  const [dataframeData, setDataframeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dataframes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dataframe list');
        return res.json();
      })
      .then((data) => {
        setDataframes(data);
      })
      .catch((err) => setError(`Error: ${err.message}. Is the backend running?`));
  }, []);

  const handleDataframeSelect = (e) => {
    const name = e.target.value;
    setSelectedDataframe(name);

    if (!name) {
      setDataframeData(null);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    setDataframeData(null);

    fetch(`/api/dataframes/${name}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch data for ${name}`);
        return res.json();
      })
      .then((data) => {
        setDataframeData(data);
      })
      .catch((err) => setError(`Error: ${err.message}`))
      .finally(() => setIsLoading(false));
  };

  const styles = {
    appContainer: {
      backgroundColor: theme.background,
      color: theme.textPrimary,
      minHeight: '100vh',
      padding: '2rem',
      boxSizing: 'border-box',
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
    selectorLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
    },
    selector: {
      width: '100%',
      padding: '10px',
      borderRadius: '8px',
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.background,
      color: theme.textPrimary,
      fontSize: '1em',
    },
    errorMessage: {
      color: theme.error,
      fontFamily: 'monospace',
      marginTop: '1rem',
    },
    loadingMessage: {
      color: theme.textMuted,
      marginTop: '1rem',
    },
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>Property Tax Data Inspector</h1>
        <p style={styles.subtitle}>
          Select a dataset to view the first 10 records.
        </p>
      </header>
      <main className="content-card" style={styles.contentCard}>
        <div>
          <label htmlFor="df-selector" style={styles.selectorLabel}>
            Select Dataframe:
          </label>
          <select
            id="df-selector"
            value={selectedDataframe}
            onChange={handleDataframeSelect}
            style={styles.selector}
          >
            <option value="">-- Choose a dataset --</option>
            {dataframes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={styles.errorMessage}>{error}</p>}
        {isLoading && <p style={styles.loadingMessage}>Loading data...</p>}
        
        <DataframeTable data={dataframeData} />
      </main>
    </div>
  );
}
