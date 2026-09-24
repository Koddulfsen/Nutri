import * as fs from 'fs';
import * as path from 'path';

const dataDir = '/home/kodd/Nutri/data/foodfiles/extracted';

// Read the tilde-delimited file (easier to parse)
const content = fs.readFileSync(path.join(dataDir, 'UnabridgedCodes'), 'utf-8');
const lines = content.split('\n');

// Skip copyright line and header
const codes: { code: string; description: string; unit: string }[] = [];

for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split('~');
  if (parts.length >= 3) {
    codes.push({
      code: parts[0],
      description: parts[1],
      unit: parts[2],
    });
  }
}

console.log(`Total codes extracted: ${codes.length}\n`);

// Group by category based on code patterns
const categories: Record<string, typeof codes> = {
  'Energy & Proximates': [],
  'Carbohydrates': [],
  'Lipids & Fatty Acids': [],
  'Amino Acids': [],
  'Minerals': [],
  'Vitamins': [],
  'Carotenoids & Bioactives': [],
  'Organic Acids': [],
  'Other': [],
};

for (const item of codes) {
  const { code, description } = item;
  const descLower = description.toLowerCase();

  if (code.match(/^(ENERC|WATER|PROT|ASH|FAT|ALC|CHO|NIT|STARCH|SUGAR|FIB)/)) {
    categories['Energy & Proximates'].push(item);
  } else if (code.match(/^(FRUS|GALS|GLUS|LACS|MALS|SUCS|DEXTR|POLYL)/) || descLower.includes('sugar') || descLower.includes('carbohydrate')) {
    categories['Carbohydrates'].push(item);
  } else if (code.match(/^(F\d|FA|CHOLE|TG|DG|MG|PL|UNSAP|PHYSTR|STIG|CAMPE|BSIT|SITST)/)) {
    categories['Lipids & Fatty Acids'].push(item);
  } else if (code.match(/^(ALA|ARG|ASN|ASP|CYS|GLN|GLU|GLY|HIS|ILE|LEU|LYS|MET|PHE|PRO|SER|THR|TRP|TYR|VAL|HYPRO|TAU|CIT|ORN)/)) {
    categories['Amino Acids'].push(item);
  } else if (code.match(/^(CA|FE|MG|P|K|NA|ZN|CU|MN|SE|CR|MO|I|NI|AL|AS|B|CD|CL|CO|F|HG|LI|PB|SI|SN|V|BR)/)) {
    categories['Minerals'].push(item);
  } else if (code.match(/^(VIT|THIA|RIBF|NIA|PANT|FOL|RETI|TOCPH|BIOTN|CHLN)/)) {
    categories['Vitamins'].push(item);
  } else if (code.match(/^(CART|CRYP|LUT|ZEAX|LYCO)/)) {
    categories['Carotenoids & Bioactives'].push(item);
  } else if (code.match(/AC_|ACEAC|CITAC|LACAC|MALAC|OXLAC|QUINAC|SUCAC|TARAC/)) {
    categories['Organic Acids'].push(item);
  } else {
    categories['Other'].push(item);
  }
}

// Output summary
console.log('=== Components by Category ===\n');
for (const [cat, items] of Object.entries(categories)) {
  console.log(`${cat}: ${items.length} codes`);
}

// Output detailed list for each category
console.log('\n\n=== Detailed Component List ===\n');

for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n## ${cat} (${items.length} codes)\n`);
  console.log('| Code | Description | Unit |');
  console.log('|------|-------------|------|');
  for (const item of items) {
    console.log(`| ${item.code} | ${item.description} | ${item.unit} |`);
  }
}

// Also save to a JSON file for later use
fs.writeFileSync(
  path.join(dataDir, 'foodfiles-codes.json'),
  JSON.stringify({ codes, categories }, null, 2)
);
console.log('\n\nSaved codes to foodfiles-codes.json');
