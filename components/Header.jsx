import React from 'react';

export default function Header({ children }) {
  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 32px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxSizing: 'border-box',
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      margin: '4px 0 0 0',
      fontSize: '14px',
      color: '#64748b',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }
  };

  return (
    <header style={styles.header}>
      <div>
        <h2 style={styles.title}>Dashboard</h2>
        <p style={styles.subtitle}>Master Database Overview</p>
      </div>
      <div style={styles.rightSection}>{children}</div>
    </header>
  );
}