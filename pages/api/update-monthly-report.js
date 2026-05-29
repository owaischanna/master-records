// import path from 'path';
// import fs from 'fs';
// import * as xlsx from 'xlsx';
// import { getSupabase, getSupabaseTableName, mapReportRow, normalizeReportPayload, sanitizeTableName } from '../../utils/supabaseServer';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { sheetName, id, updates } = req.body || {};

//   if (!sheetName || !id || !updates) {
//     return res.status(400).json({ message: 'Missing sheetName, id, or updates' });
//   }

//   const supabase = getSupabase();
//   if (supabase) {
//     let tableName = sanitizeTableName(sheetName);
//     if (!tableName) {
//       tableName = String(sheetName).trim(); 
//     }

//     try {
//       const payload = normalizeReportPayload ? normalizeReportPayload(updates) : updates;
//       const recordSerial = id ?? payload.s_no ?? payload.s ?? payload.id;
      
//       if (!recordSerial) {
//         return res.status(400).json({ message: 'Missing record identifier sequence mapping' });
//       }

//       const identifier = String(recordSerial).trim();
//       const numericId = isNaN(Number(identifier)) ? null : Number(identifier);

//       // 1. Fetch available columns for this month table dynamically to determine if it uses 's_no' or 's'
//       const { data: columnCheck, error: columnError } = await supabase
//         .from('information_schema.columns')
//         .select('column_name')
//         .eq('table_name', tableName)
//         .eq('table_schema', 'public');

//       let targetKey = 's_no'; // Default fallback for your month tables based on your schema image
//       if (!columnError && Array.isArray(columnCheck) && columnCheck.length > 0) {
//         const columns = columnCheck.map(c => c.column_name);
//         if (columns.includes('s_no')) targetKey = 's_no';
//         else if (columns.includes('s')) targetKey = 's';
//         else if (columns.includes('id')) targetKey = 'id';
//       }

//       // 2. Format payload keys safely to prevent inserting non-existent keys into table columns
//       const cleanPayload = {};
//       const fieldsToInclude = [
//         'full_name', 'beneficiary_name', 'father_husband_name', 'cnic', 
//         'village_name', 'village_name_parro', 'union_council', 'union_council_name',
//         'business_investment_plan', 'trade', 'amount', 'recovery_amount', 'total_received',
//         'receipt_no', 'date', 'deposit_slip_number', 'deposit_date', 'deposit_status', 
//         'status', 'beneficiary_status', 'gender', 'category', 'industry'
//       ];

//       // Copy only valid keys into our update payload
//       Object.keys(payload).forEach(key => {
//         if (fieldsToInclude.includes(key)) {
//           cleanPayload[key] = payload[key];
//         }
//       });

//       // Explicitly assign the correct identifier column field layout name values
//       cleanPayload[targetKey] = targetKey === 's_no' ? numericId : identifier;

//       console.log(`[Supabase Update] Targeting table "${tableName}" on column "${targetKey}" = ${identifier}`);

//       // 3. Search if row exists using our dynamically verified targetKey
//       const { data: existingRows, error: selectError } = await supabase
//         .from(tableName)
//         .select('*')
//         .eq(targetKey, cleanPayload[targetKey]);

//       if (selectError) throw selectError;

//       let savedRow;
//       if (Array.isArray(existingRows) && existingRows.length > 0) {
//         // Run update query targeting the exact verified primary key column
//         const { data: updatedRows, error: updateError } = await supabase
//           .from(tableName)
//           .update(cleanPayload)
//           .eq(targetKey, cleanPayload[targetKey])
//           .select();

//         if (updateError) throw updateError;
//         savedRow = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
//       } else {
//         // Run clean insertion statement loop instead if record is entirely fresh
//         const { data: insertedRow, error: insertError } = await supabase
//           .from(tableName)
//           .insert([cleanPayload])
//           .select();

//         if (insertError) throw insertError;
//         savedRow = Array.isArray(insertedRow) ? insertedRow[0] : insertedRow;
//       }

//       return res.status(200).json({ 
//         message: 'Record saved successfully to Supabase', 
//         data: mapReportRow ? mapReportRow(savedRow) : savedRow 
//       });

//     } catch (error) {
//       console.error('[API CRASH] Supabase execution error context, falling back to local storage:', error.message);
//     }
//   }

//   // Local Static Excel backup processing path logic loop
//   try {
//     const dataDir = path.join(process.cwd(), 'data');
//     let xlsxPath = path.join(dataDir, 'data.xlsx');
//     if (fs.existsSync(xlsxPath)) {
//       const wb = xlsx.readFile(xlsxPath);
//       const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
//       const rowIndex = data.findIndex((row) => String(row['S.#'] ?? row['s.#'] ?? '') === String(id));

//       if (rowIndex === -1) data.push({ 'S.#': id, ...updates });
//       else data[rowIndex] = { ...data[rowIndex], ...updates };

//       wb.Sheets[sheetName] = xlsx.utils.json_to_sheet(data);
//       xlsx.writeFile(wb, xlsxPath);
//       return res.status(200).json({ message: 'Record saved safely to local storage backup fallback route ledger' });
//     }
//     return res.status(404).json({ message: 'Excel file path ledger reference missing locally' });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal Server Error', error: error.message });
//   }
// }

import { getSupabase, mapReportRow, normalizeReportPayload } from '../../utils/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sheetName, id, updates, mode } = req.body || {};

  if (!sheetName || !updates) {
    return res.status(400).json({ message: 'Missing sheetName or updates' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel.' });
  }

  const tableName = String(sheetName).trim().replace(/[^A-Za-z0-9_]/g, '');
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid table name' });
  }

  const payload = normalizeReportPayload(updates, null);

  console.log(`[update-monthly-report] table=${tableName} mode=${mode} id=${id}`);
  console.log(`[update-monthly-report] payload=`, JSON.stringify(payload));

  try {
    if (mode === 'new') {
      const { data, error } = await supabase
        .from(tableName)
        .insert([payload])
        .select();

      if (error) {
        console.error('[Supabase insert error]', error);
        return res.status(400).json({ message: error.message, details: error });
      }

      return res.status(200).json({
        message: 'Record created successfully',
        data: data?.[0] ? mapReportRow(data[0]) : data,
      });

    } else {
      if (!id) {
        return res.status(400).json({ message: 'Missing record ID for update' });
      }

      const identifier = String(id).trim();

      // Try s_no first
      let { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('s_no', identifier)
        .select();

      if (error) {
        console.error('[Supabase update s_no error]', error);
        return res.status(400).json({ message: error.message, details: error });
      }

      // No rows matched s_no — try 's' column
      if (!data || data.length === 0) {
        console.warn(`No rows matched s_no="${identifier}", trying "s" column`);
        const result2 = await supabase
          .from(tableName)
          .update(payload)
          .eq('s', identifier)
          .select();

        if (result2.error) {
          console.error('[Supabase update s error]', result2.error);
          return res.status(400).json({ message: result2.error.message, details: result2.error });
        }

        data = result2.data;
      }

      // Still no rows — insert as new
      if (!data || data.length === 0) {
        console.warn(`Row not found by id="${identifier}", inserting as new`);
        const { data: inserted, error: insertError } = await supabase
          .from(tableName)
          .insert([payload])
          .select();

        if (insertError) {
          console.error('[Supabase insert fallback error]', insertError);
          return res.status(400).json({ message: insertError.message, details: insertError });
        }

        return res.status(200).json({
          message: 'Record inserted successfully',
          data: inserted?.[0] ? mapReportRow(inserted[0]) : inserted,
        });
      }

      return res.status(200).json({
        message: 'Record updated successfully',
        data: data?.[0] ? mapReportRow(data[0]) : data,
      });
    }

  } catch (err) {
    console.error('[update-monthly-report] Unexpected error:', err);
    return res.status(500).json({ message: err.message });
  }
}