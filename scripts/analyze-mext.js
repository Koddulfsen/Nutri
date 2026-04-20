const XLSX = require('xlsx');

// Read all three files
const mainWb = XLSX.readFile('/home/kodd/Nutri/data/mext/main_composition.xlsx');
const aminoWb = XLSX.readFile('/home/kodd/Nutri/data/mext/amino_acids_1.xlsx');
const fattyWb = XLSX.readFile('/home/kodd/Nutri/data/mext/fatty_acids_1.xlsx');

// Helper to extract component IDs from a workbook
function extractComponents(wb, idRowIndex) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const componentIds = data[idRowIndex] || [];
  const units = data[idRowIndex + 1] || [];
  const names = data[idRowIndex - 1] || [];

  const components = [];
  for (let i = 0; i < componentIds.length; i++) {
    const id = componentIds[i];
    if (id && typeof id === 'string' && id.length > 1 && id !== '成分識別子' && id !== 'WATER') {
      // Skip already seen
      if (!components.find(c => c.id === id.trim())) {
        components.push({
          id: id.trim(),
          unit: (units[i] || '').toString().trim(),
          name: (names[i] || '').toString().replace(/\r\n/g, ' ').trim()
        });
      }
    }
  }
  return components;
}

console.log('=== MEXT 2020 (8th Edition) Nutrient Analysis ===\n');

// Main composition - row 11 has IDs
const mainSheet = mainWb.Sheets[mainWb.SheetNames[0]];
const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
const mainIds = mainData[11] || [];
const mainUnits = mainData[10] || [];
const mainNames2 = mainData[2] || [];
const mainNames3 = mainData[3] || [];

console.log('=== Main Composition Table ===');
const mainComponents = [];
for (let i = 0; i < mainIds.length; i++) {
  const id = mainIds[i];
  if (id && typeof id === 'string' && id.length > 1 && id !== '成分識別子') {
    const name = mainNames2[i] || mainNames3[i] || '';
    mainComponents.push({
      id: id.trim(),
      name: name.toString().replace(/\r\n/g, ' ').trim()
    });
  }
}
console.log('Components:', mainComponents.length);
mainComponents.forEach(c => console.log('  ' + c.id + ': ' + c.name));

// Amino acids - row 4 has IDs
const aminoSheet = aminoWb.Sheets[aminoWb.SheetNames[0]];
const aminoData = XLSX.utils.sheet_to_json(aminoSheet, { header: 1 });
const aminoIds = aminoData[4] || [];
const aminoNames = aminoData[3] || [];

console.log('\n=== Amino Acid Table ===');
const aminoComponents = [];
for (let i = 0; i < aminoIds.length; i++) {
  const id = aminoIds[i];
  if (id && typeof id === 'string' && id.length > 1 && id !== '成分識別子' && !['WATER', 'PROTCAA', 'PROT-'].includes(id.trim())) {
    const name = aminoNames[i] || '';
    aminoComponents.push({
      id: id.trim(),
      name: name.toString().replace(/\r\n/g, ' ').split('；')[0].trim()
    });
  }
}
console.log('Components:', aminoComponents.length);
aminoComponents.forEach(c => console.log('  ' + c.id + ': ' + c.name));

// Fatty acids - row 3 has IDs
const fattySheet = fattyWb.Sheets[fattyWb.SheetNames[0]];
const fattyData = XLSX.utils.sheet_to_json(fattySheet, { header: 1 });
const fattyIds = fattyData[3] || [];
const fattyNames = fattyData[2] || [];

console.log('\n=== Fatty Acid Table ===');
const fattyComponents = [];
for (let i = 0; i < fattyIds.length; i++) {
  const id = fattyIds[i];
  if (id && typeof id === 'string' && id.length > 1 && id !== '成分識別子' && !['WATER', 'FATNLEA', 'FAT-'].includes(id.trim())) {
    const name = fattyNames[i] || '';
    fattyComponents.push({
      id: id.trim(),
      name: name.toString().replace(/\r\n/g, ' ').trim()
    });
  }
}
console.log('Components:', fattyComponents.length);
fattyComponents.forEach(c => console.log('  ' + c.id + ': ' + c.name));

// Summary
console.log('\n=== Summary ===');
console.log('Main components: ' + mainComponents.length);
console.log('Amino acid components: ' + aminoComponents.length);
console.log('Fatty acid components: ' + fattyComponents.length);

// Unique IDs
const allIds = new Set([
  ...mainComponents.map(c => c.id),
  ...aminoComponents.map(c => c.id),
  ...fattyComponents.map(c => c.id)
]);
console.log('Total unique component IDs: ' + allIds.size);
