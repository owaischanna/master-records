const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

export default function handler(req, res) {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing sheet name' });

    const dataDir = path.join(process.cwd(), 'data');
    let xlsxPath = path.join(dataDir, 'data.xlsx');
    if (!fs.existsSync(xlsxPath)) {
      const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx')) : [];
      if (files.length > 0) xlsxPath = path.join(dataDir, files[0]);
    }

    if (!fs.existsSync(xlsxPath)) return res.status(404).json({ data: [] });

    const wb = xlsx.readFile(xlsxPath);
    const decoded = decodeURIComponent(name);

    // Find exact or case-insensitive match
    let sheetName = wb.SheetNames.find((s) => s === decoded) || wb.SheetNames.find((s) => s.toLowerCase() === decoded.toLowerCase());
    if (!sheetName) {
      // fallback: find sheet that includes the decoded value
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
