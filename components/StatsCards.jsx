import React from 'react';

function Card({ title, value, accentColor = '#0ea5e9' }) {
  const styles = {
    card: {
      position: 'relative',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: '1',
      minWidth: '220px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    cardTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: 0,
    },
    cardValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
      lineHeight: '1',
    },
    cardAccent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: accentColor,
    }
  };

  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <h3 style={styles.cardValue}>{value}</h3>
      <div style={styles.cardAccent} />
    </div>
  );
}

export default function StatsCards({ stats = {} }) {
  const styles = {
    statsGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      padding: '20px 16px',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
    }
  };

  // Fallbacks in case stats object keys are undefined initially
  const data = {
    total: stats.total ?? '0',
    totalReceived: stats.totalReceived ?? '0',
    totalDue: stats.totalDue ?? '0',
    avgRecovery: stats.avgRecovery ?? '0%',
  };

  return (
    <div style={styles.statsGrid}>
      <Card title="Total Records" value={data.total} accentColor="#6366f1" />
      <Card title="Total Received" value={data.totalReceived} accentColor="#10b981" />
      <Card title="Total Due" value={data.totalDue} accentColor="#ef4444" />
      <Card title="Average Recovery %" value={data.avgRecovery} accentColor="#f59e0b" />
    </div>
  );
}