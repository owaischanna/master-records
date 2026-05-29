import React from 'react';
import MonthlyReports from '../../components/Monthlyreport';
import { getSupabase, getSupabaseTableName, mapReportRow, sanitizeTableName } from '../../utils/supabaseServer';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

export default function MonthPage({ data = [], sheetName }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Monthly Report — {sheetName}</h1>
        </div>
        <MonthlyReports data={data} sheetName={sheetName} />
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const { month } = ctx.params || {};
  const decoded = decodeURIComponent(month || '');
  const supabase = getSupabase();

  if (supabase) {
    const tableName = sanitizeTableName(decoded);
    if (!tableName) {
      console.error('Invalid month/table name provided:', decoded);
      return { props: { data: [], sheetName: decoded } };
    }

    try {
      let rows, error;
      ({ data: rows, error } = await supabase.from(tableName).select('*'));

      if (error) {
        console.warn(`Querying table ${tableName} failed, falling back to shared table logic:`, error.message || error);
      } else {
        const mapped = (rows || []).map(mapReportRow);
        return { props: { data: mapped, sheetName: decoded } };
      }

      const fallbackTable = getSupabaseTableName();
      if (fallbackTable) {
        ({ data: rows, error } = await supabase.from(fallbackTable).select('*'));
        if (error) {
          console.error('Error fetching monthly report from fallback Supabase table:', error);
          return { props: { data: [], sheetName: decoded } };
        }

        const monthKey = (rows && rows.length > 0)
          ? Object.keys(rows[0]).find((k) => k && k.toLowerCase().includes('month'))
          : null;

        const filtered = monthKey
          ? (rows || []).filter((r) => String(r[monthKey] ?? '').toLowerCase() === decoded.toLowerCase())
          : [];

        const mapped = (filtered || []).map(mapReportRow);
        return { props: { data: mapped, sheetName: decoded } };
      }

      return { props: { data: [], sheetName: decoded } };
    } catch (error) {
      console.error('Error fetching monthly report from Supabase:', error);
      return { props: { data: [], sheetName: decoded } };
    }
  }

  const dataDir = path.join(process.cwd(), 'data');
  let xlsxPath = path.join(dataDir, 'data.xlsx');
  if (!fs.existsSync(xlsxPath)) {
    const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx')) : [];
    if (files.length > 0) xlsxPath = path.join(dataDir, files[0]);
  }

  if (!fs.existsSync(xlsxPath)) {
    return { props: { data: [], sheetName: decoded } };
  }

  const wb = xlsx.readFile(xlsxPath);
  let sheetName = wb.SheetNames.find((s) => s === decoded) || wb.SheetNames.find((s) => s.toLowerCase() === decoded.toLowerCase());
  if (!sheetName) sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes(decoded.toLowerCase()));
  if (!sheetName) return { props: { data: [], sheetName: decoded } };

  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
  return { props: { data, sheetName } };
}
