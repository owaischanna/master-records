import React, { useMemo, useState } from 'react';
import Link from 'next/link';

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
  if (!data || data.length === 0) return <div className="text-sm text-slate-500">No chart data</div>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-28 text-xs text-slate-600 truncate">{d.key}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-indigo-500 rounded-full" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-16 text-right text-sm font-semibold text-slate-800">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ recovered = 0, remaining = 0 }) {
  const total = Math.max(1, recovered + remaining);
  const recoveredPct = Math.round((recovered / total) * 100);
  const size = 80;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const dash = (recovered / total) * c;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6e9ef" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#10b981" strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" />
      </svg>
      <div>
        <div className="text-sm font-semibold text-slate-900">{recoveredPct}%</div>
        <div className="text-xs text-slate-500">Recovered</div>
      </div>
    </div>
  );
}

export default function Dashboard({ data }) {
  const sanitizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((row) => {
      const serial = row['S.#'] ?? row['s.#'] ?? row['S'];
      const name = row['Beneficary Name'] ?? row['Beneficiary Name'] ?? row['beneficiary name'];
      const serialStr = String(serial ?? '').toLowerCase().trim();
      const nameStr = String(name ?? '').toLowerCase().trim();
      if (!serial || serialStr === 'null' || serialStr === '') return false;
      if (!name || nameStr === 'null' || nameStr === '') return false;
      return true;
    });
  }, [data]);

  const allColumns = useMemo(() => {
    const set = new Set();
    sanitizedData.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
    return Array.from(set);
  }, [sanitizedData]);

  const summaryKeys = ['S.#', 'Beneficary Name', 'CNIC', 'Gender', 'Village Name/Parro', 'Trade', 'Status', 'Total Received', 'Remaining Amount'];

  const normalizeKey = (key) => String(key).toLowerCase().replace(/\r|\n/g, ' ').replace(/[:#]/g, '').replace(/\s+/g, ' ').trim();

  const tableColumns = useMemo(() => {
    const chosen = summaryKeys.map((key) => allColumns.find((col) => normalizeKey(col) === normalizeKey(key))).filter(Boolean);
    return chosen.length > 0 ? [...chosen, 'View'] : [...allColumns.slice(0, 10), 'View'];
  }, [allColumns]);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(tableColumns[0] === 'View' ? tableColumns[1] : tableColumns[0] ?? '');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  
  // 🟢 FIXED: Changed items per page size from 12 to 10
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = sanitizedData.slice();
    if (q) rows = rows.filter((row) => allColumns.some((col) => String(row[col] ?? '').toLowerCase().includes(q)));
    if (sortBy && sortBy !== 'View') {
      rows.sort((a, b) => {
        const A = String(a[sortBy] ?? '').toLowerCase();
        const B = String(b[sortBy] ?? '').toLowerCase();
        return sortDir === 'asc' ? A.localeCompare(B, undefined, { numeric: true, sensitivity: 'base' }) : B.localeCompare(A, undefined, { numeric: true, sensitivity: 'base' });
      });
    }
    return rows;
  }, [sanitizedData, query, sortBy, sortDir, allColumns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totals = useMemo(() => {
    let totalReceived = 0;
    let totalRemaining = 0;
    sanitizedData.forEach((r) => {
      totalReceived += Number(r['Total Received'] ?? 0);
      totalRemaining += Number(r['Remaining Amount'] ?? 0);
    });
    return { totalReceived, totalRemaining, totalRecords: sanitizedData.length };
  }, [sanitizedData]);

  const tradeCounts = useMemo(() => {
    const map = new Map();
    sanitizedData.forEach((r) => {
      const t = String(r['Trade'] ?? 'Unknown').trim();
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries()).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [sanitizedData]);

  const clearSearch = () => { setQuery(''); setPage(1); };
  const exportCSV = () => {
    const header = tableColumns.filter((col) => col !== 'View').map((col) => '"' + String(niceLabel(col)).replace(/"/g, '""') + '"').join(',');
    const body = filtered.map((row) => tableColumns.filter((col) => col !== 'View').map((col) => '"' + String(row[col] ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'master-database-summary.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const getRecordId = (row) => String(row['S.#'] ?? row['s.#'] ?? row['S'] ?? row['id'] ?? Math.random());

  const renderCell = (col, value) => {
    const normalized = String(value ?? '').toLowerCase().trim();
    if (col === 'View') return value;
    if (/^(on-grid|eligible|yes)$/i.test(normalized)) return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">{String(value)}</span>;
    if (/^(off-grid|not eligible|no|pending)$/i.test(normalized)) return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">{String(value)}</span>;
    if (/^(unassigned|null|)$/i.test(normalized)) return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200">—</span>;
    return String(value === 'null' ? '-' : (value ?? '-'));
  };

  return (
    /* 🟢 DESIGN UPGRADE: Replaced standard plain box layer with a premium glassmorphic layout gradient */
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-md shadow-slate-200/40 w-full backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700 border border-indigo-100/50">Master Database</div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Beneficiary Record Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Tap any record to view full details on a separate page.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button onClick={clearSearch} className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-all duration-200 active:scale-95">Clear Search</button>
          <button onClick={exportCSV} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all duration-200 active:scale-95">Export CSV</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total Records</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{totals.totalRecords}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total Received (PKR)</p>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{totals.totalReceived.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total Remaining</p>
          <p className="mt-3 text-2xl font-bold text-rose-600">{totals.totalRemaining.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recovery %</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{Math.round((totals.totalReceived / Math.max(1, totals.totalReceived + totals.totalRemaining)) * 100)}%</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">Top Trades Distribution</h4>
          <BarChart data={tradeCounts} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">Recovered vs Remaining</h4>
          <DonutChart recovered={totals.totalReceived} remaining={totals.totalRemaining} />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
            placeholder="Search by beneficiary, CNIC, village, trade, status..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-sm font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/40">{filtered.length} matching records</div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.24em] text-slate-500 select-none">
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
                  className={`px-5 py-4 border-b border-slate-200/60 font-bold ${col === 'View' ? 'text-center' : 'cursor-pointer hover:text-slate-800 hover:bg-slate-100/50 transition-colors'}`}
                >
                  <div className={`flex items-center gap-2 ${col === 'View' ? 'justify-center' : ''}`}>
                    <span>{niceLabel(col)}</span>
                    {col !== 'View' && <span className="text-[10px] text-slate-400">{sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageData.map((row) => {
              const id = getRecordId(row);
              return (
                <tr key={id} className="hover:bg-slate-50/60 transition-colors duration-150">
                  {tableColumns.map((col) => (
                    <td key={col} className={`px-5 py-3.5 align-middle text-slate-700 ${col === 'View' ? 'text-center' : ''}`}>
                      {col === 'View' ? (
                        <Link href={`/record/${encodeURIComponent(id)}`} className="inline-flex rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm shadow-teal-500/10 transition active:scale-95">View</Link>
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

      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between select-none">
        <div>Showing <span className="font-bold text-slate-900">{pageData.length}</span> of <span className="font-bold text-slate-900">{filtered.length}</span> records</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:hover:bg-white transition" onClick={() => setPage(1)} disabled={page === 1}>First</button>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:hover:bg-white transition" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm">Page {page} of {totalPages}</span>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:hover:bg-white transition" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:hover:bg-white transition" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
        </div>
      </div>
    </div>
  );
}