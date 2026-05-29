import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, User } from 'lucide-react';

function niceLabel(key) {
  return String(key)
    .replace(/\r|\n/g, ' ')
    .replace(/[:#]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getRecordValue(record, label) {
  const normalizedTarget = String(label).trim().toLowerCase();
  const exactKey = Object.keys(record).find((key) => String(key).trim().toLowerCase() === normalizedTarget);
  if (exactKey) return record[exactKey];
  const fuzzyKey = Object.keys(record).find((key) => String(key).trim().toLowerCase().includes(normalizedTarget));
  return fuzzyKey ? record[fuzzyKey] : '';
}

const summaryLabels = [
  'Beneficary Name', 'CNIC', 'Gender', 'Village Name/Parro',
  'Trade', 'Status', 'Total Received', 'Remaining Amount',
];

export default function RecordDetail({ record, id }) {

  const renderValueBadge = (key, val) => {
    const normalizedKey = key.toLowerCase();
    const normalizedVal = String(val ?? '').toLowerCase().trim();

    if (normalizedKey.includes('status')) {
      if (/^(on-grid|eligible|yes|active)$/i.test(normalizedVal))
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">{String(val)}</span>;
      if (/^(off-grid|not eligible|no|pending)$/i.test(normalizedVal))
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">{String(val)}</span>;
    }

    if (normalizedKey.includes('received') || normalizedKey.includes('amount')) {
      const num = Number(String(val).replace(/,/g, ''));
      if (!isNaN(num) && val !== '')
        return <span className="font-mono font-bold text-slate-800">Rs {num.toLocaleString()}</span>;
    }

    if (/^(unassigned|null|)$/i.test(normalizedVal))
      return <span className="text-slate-300">—</span>;

    return String(val === 'null' ? '—' : (val ?? '—'));
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl max-w-md w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Record Not Found</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            The requested beneficiary ID could not be found. Please return to the dashboard.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fields = Object.entries(record);
  const summaryItems = summaryLabels.map((label) => ({ label, value: getRecordValue(record, label) }));
  const beneficiaryName =
    getRecordValue(record, 'Beneficary Name') ||
    getRecordValue(record, 'Beneficiary Name') ||
    'Unnamed Beneficiary';

  const initials = beneficiaryName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Nav */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Beneficiary Record</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Details</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Hero Profile Card */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Top accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-6 sm:p-8">
            {/* Avatar + Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                <span className="text-xl font-black text-white">{initials}</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{beneficiaryName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-[11px] font-bold text-indigo-600">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    ID: {id}
                  </span>
                  {(() => {
                    const status = getRecordValue(record, 'Status');
                    if (!status || String(status).toLowerCase() === 'null') return null;
                    const isActive = /^(on-grid|eligible|yes|active)$/i.test(String(status));
                    return (
                      <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {String(status)}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {summaryItems.slice(1).map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-slate-50 border border-slate-100 p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all duration-150"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate mb-1.5">
                    {niceLabel(item.label)}
                  </p>
                  <div className="text-sm text-slate-800 font-medium break-words">
                    {renderValueBadge(item.label, item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Record Grid */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Full Record Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">All fields from the source spreadsheet</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(([key, value]) => {
              const isHighlight = summaryLabels.some((lbl) => lbl.toLowerCase() === key.toLowerCase());
              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border transition-all duration-150 ${
                    isHighlight
                      ? 'border-indigo-100 bg-indigo-50/40'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest truncate mb-1.5 ${isHighlight ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {niceLabel(key)}
                  </p>
                  <div className="text-sm font-medium text-slate-700 break-words">
                    {renderValueBadge(key, value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}