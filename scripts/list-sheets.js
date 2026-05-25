const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.xlsx')) : [];
console.log('xlsx files:', files);
if (files.length === 0) process.exit(0);
const wb = xlsx.readFile(path.join(dataDir, files[0]));
console.log('sheets:', wb.SheetNames);
