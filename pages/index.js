import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import Dashboard from '../components/Dashboard';
import MonthlyReports from '../components/Monthlyreport';
import { getUserFromToken, logout } from '../utils/auth';

export default function Home({ data }) {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  const total = data.length;
  const totalReceived = data.reduce((sum, row) => sum + (Number(row['Total Received'] ?? row['Total Received '] ?? 0) || 0), 0);
  const totalDue = data.reduce((sum, row) => sum + (Number(row['Total Due Amount'] ?? row['Total Due Amount '] ?? 0) || 0), 0);
  const avgRecovery = total > 0 ? `${(data.reduce((sum, row) => sum + (Number(row['Recovery %'] ?? row['Recovery % '] ?? 0) || 0), 0) / total * 100).toFixed(1)}%` : '0%';

  const stats = {
    total,
    totalReceived: `Rs ${totalReceived.toLocaleString()}`,
    totalDue: `Rs ${totalDue.toLocaleString()}`,
    avgRecovery,
  };

  const renderMainContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return (
          <div className="space-y-6">
            <StatsCards stats={stats} />
            <Dashboard data={data} />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <MonthlyReports reportType={activeItem} data={data} />
          </div>
        );
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <>
      <Header>
        <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          Mode: {activeItem} View
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Welcome, {user.name}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl shadow-sm hover:bg-rose-700 transition"
          >
            Logout
          </button>
        </div>
      </Header>

      <div className="px-0 py-6 sm:px-2 md:px-3 lg:px-4">{renderMainContent()}</div>
    </>
  );
}

export async function getServerSideProps() {
  const fs = require('fs');
  const path = require('path');
  const dataPath = path.join(process.cwd(), 'data', 'data.json');
  let data = [];
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.warn('No data.json found, using empty array');
  }

  return { props: { data } };
}