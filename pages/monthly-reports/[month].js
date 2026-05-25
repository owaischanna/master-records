import React from 'react';
import MonthlyReports from '../../components/Monthlyreport';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

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
