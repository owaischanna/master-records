import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sheetName, id, updates } = req.body || {};

  if (!sheetName || !id || !updates) {
    return res.status(400).json({ message: 'Missing sheetName, id, or updates' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    let xlsxPath = path.join(dataDir, 'data.xlsx');

    if (!fs.existsSync(xlsxPath)) {
      const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx')) : [];
      if (files.length > 0) {
        xlsxPath = path.join(dataDir, files[0]);
      }
    }

    if (!fs.existsSync(xlsxPath)) {
      return res.status(404).json({ message: 'Excel file not found' });
    }

    // Read the Excel file
    const wb = xlsx.readFile(xlsxPath);
    const sheet = wb.Sheets[sheetName];

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    // Find and update the row
    const rowIndex = data.findIndex((row) => {
      const rowId = String(row['S.#'] ?? row['s.#'] ?? row['id'] ?? '');
      return rowId === String(id);
    });

    if (rowIndex === -1) {
      data.push({ ...(String(id) ? { 'S.#': id } : {}), ...updates });
    } else {
      data[rowIndex] = { ...data[rowIndex], ...updates };
    }

    // Write back to Excel
    const newSheet = xlsx.utils.json_to_sheet(data, { skipHeader: false });
    wb.Sheets[sheetName] = newSheet;
    xlsx.writeFile(wb, xlsxPath);

    const savedRow = rowIndex === -1 ? data[data.length - 1] : data[rowIndex];

    // Try to sync to data.json so dashboard can use updated values
    const jsonPath = path.join(process.cwd(), 'data', 'data.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const rawJson = fs.readFileSync(jsonPath, 'utf8');
        const jsonData = JSON.parse(rawJson);
        if (Array.isArray(jsonData)) {
          const jsonIndex = jsonData.findIndex((row) => {
            const rowId = String(row['S.#'] ?? row['s.#'] ?? row['id'] ?? row['CNIC'] ?? row['cnic'] ?? '');
            return rowId === String(id);
          });
          if (jsonIndex === -1) {
            jsonData.push({ ...(String(id) ? { 'S.#': id } : {}), ...updates });
          } else {
            jsonData[jsonIndex] = { ...jsonData[jsonIndex], ...updates };
          }
          fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
        }
      } catch (e) {
        console.warn('Unable to sync data.json:', e.message);
      }
    }

    return res.status(200).json({ message: 'Record saved successfully', data: savedRow });
  } catch (error) {
    console.error('Error updating monthly report:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
