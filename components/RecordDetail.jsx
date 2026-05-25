import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, IdentificationCard, Landmark, Briefcase, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';

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
  'Beneficary Name',
  'CNIC',
  'Gender',
  'Village Name/Parro',
  'Trade',
  'Status',
  'Total Received',
  'Remaining Amount'
];

export default function RecordDetail({ record, id }) {
  
  // Custom Dynamic Value Renderer to keep table styling consistent across details views
  const renderValueBadge = (key, val) => {
    const normalizedKey = key.toLowerCase();
    const normalizedVal = String(val ?? '').toLowerCase().trim();

    if (normalizedKey.includes('status')) {
      if (/^(on-grid|eligible|yes)$/i.test(normalizedVal)) {
        return <span className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">{String(val)}</span>;
      }
      if (/^(off-grid|not eligible|no|pending)$/i.test(normalizedVal)) {
        return <span className="inline-flex items-center rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">{String(val)}</span>;
      }
    }
    
    if (normalizedKey.includes('received') || normalizedKey.includes('amount')) {
      const num = Number(val);
      if (!isNaN(num) && val !== '') {
        return <span className="font-mono font-bold text-slate-900">Rs {num.toLocaleString()}</span>;
      }
    }

    if (/^(unassigned|null|)$/i.test(normalizedVal)) {
      return <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-400">—</span>;
    }

    return String(val === 'null' ? '—' : (val ?? '—'));
  };

  // --- RECORD EMPTY / NOT FOUND FALLBACK VIEW ---
  if (!record) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 min-h-[80vh] flex flex-col justify-center items-center select-none">
        <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-10 shadow-xl shadow-slate-200/50 max-w-md w-full text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-6">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Record Not Found</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Please verify the beneficiary system parameter ID reference or return to the main dashboard module screen.
          </p>
          <div className="mt-8">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fields = Object.entries(record);
  const summaryItems = summaryLabels.map((label) => ({
    label,
    value: getRecordValue(record, label),
  }));

  const beneficiaryName = getRecordValue(record, 'Beneficary Name') || getRecordValue(record, 'Beneficiary Name') || 'Unnamed Beneficiary';

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      
      {/* HEADER ACTION NAV */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Record Details</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50/60 inline-block px-2.5 py-0.5 rounded-lg border border-indigo-100/40">
            Beneficiary ID: {id}
          </p>
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all duration-150 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* CORE TOP PROFILE HERO BLOCK */}
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-md shadow-slate-200/40 backdrop-blur-sm">
        <div className="border-b border-slate-200/60 pb-5 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <User className="h-3 w-3" />
            <span>Beneficiary Profile</span>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">{beneficiaryName}</h3>
          <p className="mt-1 text-sm text-slate-500">A polished detailing matrix viewport rendering structured identity criteria fields.</p>
        </div>

        {/* HIGHLIGHTED TARGET FIELD METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.slice(1).map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                {niceLabel(item.label)}
              </div>
              <div className="mt-2 text-sm text-slate-800 break-words">
                {renderValueBadge(item.label, item.value)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXTENDED COMPLETE METADATA MATRIX GRID */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/40">
        <div className="border-b border-slate-200/60 pb-4 mb-6">
          <h4 className="text-lg font-bold text-slate-800 tracking-tight">Full Record Details</h4>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive array compiling all data keys imported from the main system schema spreadsheet.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {fields.map(([key, value]) => {
            const isLabelHighlight = summaryLabels.some(lbl => lbl.toLowerCase() === key.toLowerCase());
            return (
              <div 
                key={key} 
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isLabelHighlight 
                    ? 'border-indigo-100 bg-indigo-50/10 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 hover:border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {niceLabel(key)}
                </div>
                <div className="mt-1.5 text-sm font-medium text-slate-800 break-words">
                  {renderValueBadge(key, value)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}