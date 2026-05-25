const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

export default function handler(req, res) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    let xlsxPath = path.join(dataDir, 'data.xlsx');
    if (!fs.existsSync(xlsxPath)) {
      const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx')) : [];
      if (files.length > 0) xlsxPath = path.join(dataDir, files[0]);
    }

    if (!fs.existsSync(xlsxPath)) return res.status(404).json({ sheets: [] });

    const wb = xlsx.readFile(xlsxPath);
    return res.status(200).json({ sheets: wb.SheetNames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
