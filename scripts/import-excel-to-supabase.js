import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_TABLE_NAME = process.env.SUPABASE_TABLE_NAME || 'individual_records';

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[Supabase Server] Credentials missing in environment variables.');
    return null;
  }
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  return supabaseInstance;
}

export function getSupabaseTableName() {
  return SUPABASE_TABLE_NAME;
}

/**
 * 🟢 DYNAMIC MAPPER FUNCTION
 * Intelligently bridges differences between the master dashboard table schema 
 * and your separate, dedicated monthly tables (like April_2026, January_2026).
 */
export function mapReportRow(dbRow) {
  if (!dbRow) return {};

  // 1. Resolve Name Mismatch (individual_records uses beneficiary_name, monthly tables use full_name)
  const resolvedName = dbRow.beneficiary_name || dbRow.full_name || dbRow.name || '';

  // 2. Resolve Serial Number / ID Mismatch
  const resolvedSerial = dbRow.s || dbRow.s_no || dbRow.sno || dbRow.id || '';

  // 3. Resolve Village Name Mismatch (individual_records uses village_name_parro, monthly tables use village_name)
  const resolvedVillage = dbRow.village_name_parro || dbRow.village_name || '';

  // 4. Safe Helper to parse stringified/formatted numbers into actual mathematical values
  const parseNum = (val) => {
    if (val === null || val === undefined) return 0;
    const clean = String(val).replace(/[\,RsPKR\s]/g, '');
    return isNaN(Number(clean)) ? 0 : Number(clean);
  };

  // 5. Resolve Financial Column Fields
  // individual_records uses total_received & remaining_amount
  // Dedicated month tables use recovery_amount & amount
  const totalReceived = parseNum(dbRow.total_received ?? dbRow.recovery_amount ?? dbRow.amount_recovered ?? 0);
  const amount = parseNum(dbRow.amount ?? dbRow.total_due_amount ?? 0);
  
  // Calculate a safe fallback for remaining amount if it's not directly in the monthly table schema
  let remainingAmount = parseNum(dbRow.remaining_amount);
  if (!dbRow.remaining_amount && dbRow.amount !== undefined) {
    remainingAmount = Math.max(0, amount - totalReceived);
  }

  // 6. Return standard unified object structure that both Dashboard.jsx and Monthlyreport.jsx expect
  return {
    // Identity & Strings
    'S.#': resolvedSerial,
    's': resolvedSerial,
    's_no': resolvedSerial,
    'Beneficary Name': resolvedName,
    'Beneficiary Name': resolvedName,
    'beneficiary_name': resolvedName,
    'Full Name': resolvedName,
    'full_name': resolvedName,
    'CNIC': dbRow.cnic,
    'Gender': dbRow.gender || 'Unknown',
    'Village Name/Parro': resolvedVillage,
    'village_name': resolvedVillage,
    'Union Council': dbRow.union_council || dbRow.union_council_name || '',
    'Trade': dbRow.trade || '',
    'Status': dbRow.status || dbRow.beneficiary_status || 'Active',
    
    // Numbers & Percents
    'Total Received': totalReceived,
    'Remaining Amount': remainingAmount,
    'Amount': amount,
    'Recovery %': dbRow.recovery || `${amount > 0 ? Math.round((totalReceived / amount) * 100) : 0}%`,

    // Keep the raw fields untouched in the background for custom lookups
    ...dbRow
  };
}

/**
 * Cleans user URL route input parameters to ensure safety before running raw string operations
 */
export function sanitizeTableName(inputName) {
  if (!inputName) return null;
  // Strip out any suspicious formatting characters but leave safe letters, numbers, and underscores intact
  const sanitized = String(inputName).trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return sanitized || null;
}

/**
 * Formats front-end updates objects perfectly back into clean database schemas during modal entry submissions
 */
export function normalizeReportPayload(updates) {
  if (!updates) return {};
  
  const payload = { ...updates };

  // If a frontend key exists, format it to the database standard representation safely
  if (payload['Beneficiary Name'] || payload['Beneficary Name'] || payload['Full Name']) {
    payload.beneficiary_name = payload['Beneficiary Name'] ?? payload['Beneficary Name'] ?? payload['Full Name'];
    payload.full_name = payload.beneficiary_name;
  }
  if (payload['S.#'] || payload['s']) {
    const sVal = payload['S.#'] ?? payload['s'];
    payload.s = sVal;
    payload.s_no = isNaN(Number(sVal)) ? null : Number(sVal);
  }
  if (payload['Village Name/Parro'] || payload['Village Name']) {
    payload.village_name_parro = payload['Village Name/Parro'] ?? payload['Village Name'];
    payload.village_name = payload.village_name_parro;
  }

  return payload;
}


