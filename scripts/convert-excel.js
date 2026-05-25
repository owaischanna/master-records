const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dataDir = path.join(__dirname, '..', 'data');
let xlsxPath = path.join(dataDir, 'data.xlsx');
// If data.xlsx is not present, pick the first .xlsx file in the folder
if (!fs.existsSync(xlsxPath)) {
  const files = fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith('.xlsx'));
  if (files.length > 0) xlsxPath = path.join(dataDir, files[0]);
}
const outPath = path.join(dataDir, 'data.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

if (fs.existsSync(xlsxPath)) {
  console.log('Reading', xlsxPath);
    const wb = xlsx.readFile(xlsxPath);

    // Prefer sheet named exactly 'Master databse' (user-provided spelling),
    // then 'Master database', then any sheet containing 'master'.
    const preferredNames = ['Master databse', 'Master database'];
    let sheetName = null;

    for (const name of preferredNames) {
      if (wb.SheetNames.includes(name)) {
        sheetName = name;
        break;
      }
    }
    if (!sheetName) {
      const found = wb.SheetNames.find((n) => /master/i.test(n));
      if (found) sheetName = found;
    }
    if (!sheetName) sheetName = wb.SheetNames[0];

    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    console.log('Using sheet:', sheetName);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote', outPath);
} else if (fs.existsSync(path.join(dataDir, 'sample-data.json'))) {
  fs.copyFileSync(path.join(dataDir, 'sample-data.json'), outPath);
  console.log('No data.xlsx — copied sample-data.json to data.json');
} else {
  fs.writeFileSync(outPath, '[]', 'utf8');
  console.log('No data.xlsx or sample; wrote empty array to data.json');
}
