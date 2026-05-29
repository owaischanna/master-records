import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import { getSupabase, getSupabaseTableName, mapReportRow, sanitizeTableName } from '../../../utils/supabaseServer';

export default async function handler(req, res) {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing sheet name' });

    const decoded = decodeURIComponent(name);
    const supabase = getSupabase();
    if (supabase) {
      const tableName = sanitizeTableName(decoded);
      if (!tableName) {
        return res.status(400).json({ error: 'Invalid sheet or table name' });
      }

      const { data: rows, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.warn(`Error querying table ${tableName}:`, error.message || error);
        const fallbackTable = getSupabaseTableName();
        if (!fallbackTable) {
          return res.status(500).json({ error: error.message });
        }

        const { data: fallbackRows, error: fallbackError } = await supabase
          .from(fallbackTable)
          .select('*')
          .ilike('month', decoded);

        if (fallbackError) {
          console.error('Error fetching monthly report from Supabase fallback table:', fallbackError);
          return res.status(500).json({ error: fallbackError.message });
        }

        const mappedFallback = (fallbackRows || []).map(mapReportRow);
        return res.status(200).json({ data: mappedFallback, sheetName: decoded });
      }

      const mapped = (rows || []).map(mapReportRow);
      return res.status(200).json({ data: mapped, sheetName: decoded });
    }

    const dataDir = path.join(process.cwd(), 'data');
    let xlsxPath = path.join(dataDir, 'data.xlsx');
    if (!fs.existsSync(xlsxPath)) {
      const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx')) : [];
      if (files.length > 0) xlsxPath = path.join(dataDir, files[0]);
    }

    if (!fs.existsSync(xlsxPath)) return res.status(404).json({ data: [] });

    const wb = xlsx.readFile(xlsxPath);
    let sheetName = wb.SheetNames.find((s) => s === decoded) || wb.SheetNames.find((s) => s.toLowerCase() === decoded.toLowerCase());
    if (!sheetName) {
      sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes(decoded.toLowerCase()));
    }
    if (!sheetName) return res.status(404).json({ data: [], sheetName: null });

    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    return res.status(200).json({ data, sheetName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
