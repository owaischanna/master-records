import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import Dashboard from '../components/Dashboard';
import MonthlyReports from '../components/Monthlyreport';
import { getUserFromToken, logout } from '../utils/auth';
import { getSupabase, getSupabaseTableName, mapReportRow } from '../utils/supabaseServer';

export default function Home({ data = [] }) {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  const total = data.length;

  // 🟢 FIXED: Internal number parsing block avoids NaN when reading formatted string keys
  const parseStrNum = (val) => {
    if (val === null || val === undefined) return 0;
    const clean = String(val).replace(/[\,RsPKR\s]/g, '');
    return isNaN(Number(clean)) ? 0 : Number(clean);
  };

  const totalReceived = data.reduce((sum, row) => {
    return sum + parseStrNum(row['Total Received'] ?? row['total_received'] ?? row['Total Received ']);
  }, 0);

  const totalDue = data.reduce((sum, row) => {
    return sum + parseStrNum(row['Total Due Amount'] ?? row['total_due_amount'] ?? row['Total Due Amount '] ?? row['Remaining Amount'] ?? row['remaining_amount']);
  }, 0);

  const avgRecovery = totalReceived + totalDue > 0 
    ? `${((totalReceived / (totalReceived + totalDue)) * 100).toFixed(1)}%` 
    : '0.0%';

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
  const supabase = getSupabase();
  let data = [];

  if (supabase) {
    const tableName = getSupabaseTableName() || 'individual_records';
    console.log(`[Supabase] Loading data from table: ${tableName}`);
    const { data: rows, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error('Error fetching dashboard data from Supabase:', error);
    } else if (rows) {
      data = rows.map(mapReportRow);
    }
  } else {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'data.json');
    try {
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        data = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Fallback data loading failed');
    }
  }

  return { props: { data } };
}