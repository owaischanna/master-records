import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLIC_KEY;
export const SUPABASE_TABLE_NAME = process.env.SUPABASE_TABLE_NAME || 'individual_records';

let supabase = null;

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }

  return supabase;
}

export function getSupabaseTableName() {
  return SUPABASE_TABLE_NAME;
}

export function sanitizeTableName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!/^[A-Za-z0-9_]+$/.test(trimmed)) return null;
  return trimmed;
}

export function mapReportRow(row) {
  if (!row) return null;

  const toNumber = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const cleaned = s.replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const s_no = row.s_no ?? row.sno ?? row.s ?? row.id ?? row['S.#'] ?? row['s.#'] ?? null;
  const full_name = row.full_name ?? row.fullname ?? row.beneficiary_name ?? row['Beneficiary Name'] ?? row['Beneficary Name'] ?? row.name ?? null;
  const father_husband_name = row.father_husband_name ?? row.father_name ?? row.husband_name ?? row["Father's/Husband's Name"] ?? row['Father Husband Name'] ?? null;
  const cnic = row.cnic ?? row.cnic_number ?? row['CNIC'] ?? row['CNIC Number'] ?? null;
  const village_name = row.village_name ?? row.village_name_parro ?? row.village ?? row['Village Name'] ?? null;
  const union_council = row.union_council ?? row.union_council_name ?? row['Union Council Name'] ?? row['Union Council'] ?? null;
  const business_plan = row.business_plan ?? row.investment_business_plan ?? row.investment ?? row['Investment (Business Plan)'] ?? row['Investment'] ?? null;
  const amount = toNumber(row.amount ?? row.total_amount ?? row['Amount'] ?? row['Total Amount'] ?? null);
  const recovery_amount = toNumber(row.recovery_amount ?? row.total_received ?? row['Total Received'] ?? row['Recovery Amount'] ?? null);
  const deposit_amount = toNumber(row.deposit_amount ?? row['Deposit Amount'] ?? null);
  const receipt_no = row.receipt_no ?? row.receipt_number ?? row.receipt ?? row['Receipt #'] ?? row['Receipt'] ?? null;
  const date = row.date ?? row.receipt_date ?? row['Date'] ?? row['Receipt Date'] ?? null;
  const deposit_slip_number = row.deposit_slip_number ?? row['Deposit Slip Number'] ?? row['Deposit Slip'] ?? null;
  const deposit_date = row.deposit_date ?? row['Deposit Date'] ?? row['Deposit date'] ?? null;
  const beneficiary_status = row.beneficiary_status ?? row['Beneficiary Status'] ?? row.beneficary_status ?? row.Status ?? row.status ?? null;
  const dueAmount = (amount != null && recovery_amount != null)
    ? Number((amount - recovery_amount).toFixed(2))
    : toNumber(row.total_due_amount ?? row.remaining_amount ?? row['Remaining Amount'] ?? null);
  const recoveryPct = (amount != null && recovery_amount != null && amount !== 0)
    ? Number(((recovery_amount / amount) * 100).toFixed(1))
    : null;

  return {
    ...row,
    s_no,
    full_name,
    father_husband_name,
    cnic,
    village_name,
    union_council,
    business_plan,
    amount,
    recovery_amount,
    deposit_amount,
    receipt_no,
    date,
    deposit_slip_number,
    deposit_date,
    beneficiary_status,
    'S.#': s_no,
    'Beneficary Name': full_name,
    'Beneficiary Name': full_name,
    "Father's/Husband's Name": father_husband_name,
    'CNIC Number': cnic,
    'CNIC': cnic,
    'Village Name': village_name,
    'Union Council Name': union_council,
    'Investment (Business Plan)': business_plan,
    'Amount': amount,
    'Recovery Amount': recovery_amount,
    'Receipt #': receipt_no,
    'Date': date,
    'Deposit Slip Number': deposit_slip_number,
    'Deposit Date': deposit_date,
    'Deposit Amount': deposit_amount,
    'Beneficiary Status': beneficiary_status,
    'Status': beneficiary_status,
    'Total Received': recovery_amount,
    'Total Due Amount': dueAmount,
    'Remaining Amount': dueAmount,
    'Recovery %': recoveryPct,
    'Month': row.month ?? null,
  };
}

export function normalizeReportPayload(updates, month) {
  const normalized = {
    ...(month ? { month } : {}),
    s_no: updates.s_no ?? updates['S.#'] ?? updates.sno ?? updates.s ?? updates.id ?? null,
    full_name: updates.full_name ?? updates['Full Name'] ?? updates['Beneficary Name'] ?? updates['Beneficiary Name'] ?? updates.name ?? null,
    father_husband_name: updates.father_husband_name ?? updates["Father's/Husband's Name"] ?? updates['Father Husband Name'] ?? updates['Father Name'] ?? updates['Husband Name'] ?? null,
    cnic: updates.cnic ?? updates.cnic_number ?? updates['CNIC'] ?? updates['CNIC Number'] ?? updates['cnic'] ?? null,
    village_name: updates.village_name ?? updates['Village Name'] ?? updates['Village Name/Parro'] ?? updates['Village'] ?? null,
    union_council: updates.union_council ?? updates['Union Council'] ?? updates['Union Council Name'] ?? null,
    business_plan: updates.business_plan ?? updates['Investment (Business Plan)'] ?? updates['Investment'] ?? updates.investment_business_plan ?? null,
    amount: updates.amount ?? updates['Amount'] ?? updates.total_amount ?? null,
    recovery_amount: updates.recovery_amount ?? updates['Recovery Amount'] ?? updates.total_received ?? updates['Total Received'] ?? null,
    receipt_no: updates.receipt_no ?? updates['Receipt #'] ?? updates.receipt_number ?? updates.Receipt ?? null,
    date: updates.date ?? updates['Date'] ?? updates.receipt_date ?? updates['Receipt Date'] ?? null,
    deposit_slip_number: updates.deposit_slip_number ?? updates['Deposit Slip Number'] ?? updates['Deposit Slip'] ?? null,
    deposit_date: updates.deposit_date ?? updates['Deposit Date'] ?? updates['Deposit date'] ?? null,
    deposit_amount: updates.deposit_amount ?? updates['Deposit Amount'] ?? null,
    beneficiary_status: updates.beneficiary_status ?? updates['Beneficiary Status'] ?? updates['Beneficary Status'] ?? updates.Status ?? updates.status ?? null,
  };

  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === null || normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
}
