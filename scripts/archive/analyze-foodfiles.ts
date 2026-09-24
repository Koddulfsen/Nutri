import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const dataDir = '/home/kodd/Nutri/data/foodfiles/extracted';

// Analyze the UnabridgedCodes file to understand nutrient structure
console.log('=== FOODfiles 2024 Structure Analysis ===\n');

// 1. Unabridged Codes (434 components)
const codesPath = path.join(dataDir, 'UnabridgedCodes.xlsx');
const codesWb = XLSX.readFile(codesPath);

console.log('UnabridgedCodes.xlsx sheets:', codesWb.SheetNames);

for (const sheetName of codesWb.SheetNames) {
  const sheet = codesWb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log(`\n--- Sheet: ${sheetName} ---`);
  console.log(`Rows: ${data.length}`);

  // Show headers
  if (data.length > 0) {
    console.log('Headers:', data[0]);
  }

  // Show first 5 rows
  console.log('\nFirst 5 data rows:');
  for (let i = 1; i < Math.min(6, data.length); i++) {
    console.log(`  ${i}:`, data[i]);
  }

  // Show last 5 rows
  if (data.length > 10) {
    console.log('\nLast 5 data rows:');
    for (let i = Math.max(6, data.length - 5); i < data.length; i++) {
      console.log(`  ${i}:`, data[i]);
    }
  }
}

// 2. Standard Codes (87 components)
console.log('\n\n=== Standard Codes (87 components) ===');
const stdCodesPath = path.join(dataDir, 'StandardCodes.xlsx');
const stdCodesWb = XLSX.readFile(stdCodesPath);

console.log('StandardCodes.xlsx sheets:', stdCodesWb.SheetNames);

for (const sheetName of stdCodesWb.SheetNames) {
  const sheet = stdCodesWb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log(`\n--- Sheet: ${sheetName} ---`);
  console.log(`Rows: ${data.length}`);

  if (data.length > 0) {
    console.log('Headers:', data[0]);
  }

  console.log('\nFirst 10 data rows:');
  for (let i = 1; i < Math.min(11, data.length); i++) {
    console.log(`  ${i}:`, data[i]);
  }
}

// 3. Look at tilde-delimited text file for codes (might have more detail)
console.log('\n\n=== Text-based Codes File ===');
const textCodesPath = path.join(dataDir, 'UnabridgedCodes');
if (fs.existsSync(textCodesPath)) {
  const content = fs.readFileSync(textCodesPath, 'utf-8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  console.log('\nFirst 20 lines:');
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    console.log(`  ${i}: ${lines[i]}`);
  }
}
