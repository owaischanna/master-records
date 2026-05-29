import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

function niceLabel(key) {
  return String(key)
    .replace(/\r|\n/g, ' ')
    .replace(/[:#]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function BarChart({ data = [] }) {
  if (!data || data.length === 0)
    return <div className="text-sm text-slate-400">No chart data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = [
    'from-violet-500 to-indigo-400',
    'from-indigo-500 to-blue-400',
    'from-blue-500 to-cyan-400',
    'from-cyan-500 to-teal-400',
    'from-teal-500 to-emerald-400',
    'from-emerald-500 to-green-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
  ];
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-24 text-xs text-slate-500 truncate">{d.key}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${colors[i % colors.length]}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-8 text-right text-xs font-bold text-slate-600">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ recovered = 0, remaining = 0 }) {
  const total = Math.max(1, recovered + remaining);
  const recoveredPct = Math.round((recovered / total) * 100);
  const size = 100;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const dash = (recovered / total) * c;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="url(#donutGradLight)" strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          />
          <defs>
            <linearGradient id="donutGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-slate-800">{recoveredPct}%</span>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Recovered</span>
          <span className="text-xs font-bold text-slate-700 ml-1">{recovered.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span className="text-xs text-slate-500">Remaining</span>
          <span className="text-xs font-bold text-slate-700 ml-1">{remaining.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, sub, icon, accent }) => {
  const styles = {
    indigo: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', val: 'text-indigo-700', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', val: 'text-emerald-700', border: 'border-emerald-100' },
    rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', val: 'text-rose-700', border: 'border-rose-100' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', val: 'text-amber-700', border: 'border-amber-100' },
  };
  const s = styles[accent] || styles.indigo;
  return (
    <div className={`relative rounded-2xl border ${s.border} ${s.bg} p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          <p className={`text-2xl font-black tabular-nums ${s.val}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
            <span className="text-base">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard({ data }) {
  const sanitizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((row) => {
      const serial = row['S.#'] ?? row['s.#'] ?? row['S'] ?? row['s'] ?? row['id'];
      const name = row['Beneficary Name'] ?? row['Beneficiary Name'] ?? row['beneficiary_name'] ?? row['name'];
      const serialStr = String(serial ?? '').toLowerCase().trim();
      const nameStr = String(name ?? '').toLowerCase().trim();
      if ((!nameStr || nameStr === 'null' || nameStr === '') &&
        (!serialStr || serialStr === 'null' || serialStr === '')) return false;
      return true;
    });
  }, [data]);

  const allColumns = useMemo(() => {
    const set = new Set();
    sanitizedData.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
    return Array.from(set);
  }, [sanitizedData]);

  const summaryKeys = ['S.#', 'Beneficary Name', 'CNIC', 'Gender', 'Village Name/Parro', 'Trade', 'Status', 'Total Received', 'Remaining Amount'];
  const normalizeKey = (key) => String(key).toLowerCase().replace(/\r|\n/g, ' ').replace(/[:#_]/g, ' ').replace(/\s+/g, ' ').trim();

  const tableColumns = useMemo(() => {
    const chosen = summaryKeys.map((key) => allColumns.find((col) => normalizeKey(col) === normalizeKey(key))).filter(Boolean);
    return chosen.length > 0 ? [...chosen, 'View'] : [...allColumns.slice(0, 10), 'View'];
  }, [allColumns]);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (tableColumns.length > 0 && !sortBy) {
      setSortBy(tableColumns[0] === 'View' ? tableColumns[1] : tableColumns[0]);
    }
  }, [tableColumns, sortBy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = sanitizedData.slice();
    if (q) rows = rows.filter((row) => allColumns.some((col) => String(row[col] ?? '').toLowerCase().includes(q)));
    if (sortBy && sortBy !== 'View') {
      rows.sort((a, b) => {
        const A = String(a[sortBy] ?? '').toLowerCase();
        const B = String(b[sortBy] ?? '').toLowerCase();
        return sortDir === 'asc'
          ? A.localeCompare(B, undefined, { numeric: true, sensitivity: 'base' })
          : B.localeCompare(A, undefined, { numeric: true, sensitivity: 'base' });
      });
    }
    return rows;
  }, [sanitizedData, query, sortBy, sortDir, allColumns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totals = useMemo(() => {
    let totalReceived = 0;
    let totalRemaining = 0;
    const parseNum = (val) => {
      if (val === null || val === undefined) return 0;
      const clean = String(val).replace(/[\,RsPKR\s]/g, '');
      return isNaN(Number(clean)) ? 0 : Number(clean);
    };
    sanitizedData.forEach((r) => {
      totalReceived += parseNum(r['Total Received'] ?? r['total_received'] ?? r['recovery_amount'] ?? r['Total Received ']);
      totalRemaining += parseNum(r['Remaining Amount'] ?? r['remaining_amount'] ?? r['Remaining Amount ']);
    });
    return { totalReceived, totalRemaining, totalRecords: sanitizedData.length };
  }, [sanitizedData]);

  const tradeCounts = useMemo(() => {
    const map = new Map();
    sanitizedData.forEach((r) => {
      const t = String(r['Trade'] ?? r['trade'] ?? 'Unknown').trim();
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries()).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [sanitizedData]);

  const clearSearch = () => { setQuery(''); setPage(1); };

  const exportXLSX = () => {
    const cols = tableColumns.filter((c) => c !== 'View');
    const rows = filtered.map((row) =>
      cols.reduce((obj, col) => {
        obj[niceLabel(col)] = row[col] ?? '';
        return obj;
      }, {})
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiaries');
    XLSX.writeFile(wb, 'master-database-summary.xlsx');
  };

  const getRecordId = (row) => String(row['S.#'] ?? row['s.#'] ?? row['S'] ?? row['s'] ?? row['id'] ?? Math.random());

  const renderCell = (col, value) => {
    const normalized = String(value ?? '').toLowerCase().trim();
    if (col === 'View') return value;
    if (/^(on-grid|eligible|yes|active)$/i.test(normalized))
      return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">{String(value)}</span>;
    if (/^(off-grid|not eligible|no|pending)$/i.test(normalized))
      return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">{String(value)}</span>;
    if (/^(unassigned|null|—|)$/i.test(normalized))
      return <span className="text-slate-300">—</span>;
    const cleanColName = normalizeKey(col);
    if ((cleanColName === 'totalreceived' || cleanColName === 'remainingamount') && !isNaN(Number(String(value).replace(/,/g, '')))) {
      return <span className="font-mono text-xs font-semibold">{Number(String(value).replace(/,/g, '')).toLocaleString()}</span>;
    }
    return String(value === 'null' ? '-' : (value ?? '-'));
  };

  const recoveryPct = Math.round((totals.totalReceived / Math.max(1, totals.totalReceived + totals.totalRemaining)) * 100);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-indigo-100 px-3 py-1 mb-3 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Master Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Beneficiary Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Tap any record to view full details.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearSearch}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-95"
          >
            Clear
          </button>
          <button
            onClick={exportXLSX}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            Export XLSX
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Records" value={totals.totalRecords.toLocaleString()} icon="📋" accent="indigo" />
        <StatCard label="Total Received" value={`₨${(totals.totalReceived / 1000).toFixed(0)}K`} sub="PKR" icon="💰" accent="emerald" />
        <StatCard label="Total Remaining" value={`₨${(totals.totalRemaining / 1000).toFixed(0)}K`} sub="PKR" icon="⏳" accent="rose" />
        <StatCard label="Recovery Rate" value={`${recoveryPct}%`} sub="of total disbursed" icon="📈" accent="amber" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800">Trade Distribution</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">Top {tradeCounts.length}</span>
          </div>
          <BarChart data={tradeCounts} />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Recovery Status</h3>
          <DonutChart recovered={totals.totalReceived} remaining={totals.totalRemaining} />
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress</span>
              <span className="font-bold text-slate-700">{recoveryPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${recoveryPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
              placeholder="Search beneficiary, CNIC, village..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
            {filtered.length} records found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {tableColumns.map((col) => (
                  <th
                    key={col}
                    onClick={() => {
                      if (col !== 'View') {
                        setSortBy(col);
                        setSortDir((prev) => (sortBy === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
                        setPage(1);
                      }
                    }}
                    className={`px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap ${col === 'View' ? 'text-center' : 'cursor-pointer hover:text-indigo-500 transition-colors'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {niceLabel(col)}
                      {col !== 'View' && (
                        <span className="text-[9px] opacity-60">{sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageData.map((row, idx) => {
                const id = getRecordId(row);
                return (
                  <tr key={id} className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    {tableColumns.map((col) => (
                      <td key={col} className={`px-4 py-3.5 text-slate-600 align-middle ${col === 'View' ? 'text-center' : ''}`}>
                        {col === 'View' ? (
                          <Link
                            href={`/record/${encodeURIComponent(id)}`}
                            className="inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition active:scale-95"
                          >
                            View →
                          </Link>
                        ) : (
                          renderCell(col, row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <p className="text-xs text-slate-400">
            Showing <span className="font-bold text-slate-700">{pageData.length}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> records
          </p>
          <div className="flex items-center gap-1.5">
            {[
              { label: '«', action: () => setPage(1), disabled: page === 1 },
              { label: '‹', action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
              { label: '›', action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages },
              { label: '»', action: () => setPage(totalPages), disabled: page === totalPages },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                disabled={btn.disabled}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {btn.label}
              </button>
            ))}
            <span className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm">
              {page} / {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}