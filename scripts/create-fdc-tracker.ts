/**
 * Create FDC Mapping Tracker Document
 */
import fs from 'fs';

const csv = fs.readFileSync('/home/kodd/Nutri/docs/fdc-nutrients.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);

interface Nutrient {
  id: string;
  name: string;
  unit: string;
  number: string;
  rank: number;
}

const nutrients: Nutrient[] = lines.map(line => {
  const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
  if (!match) return null;
  return {
    id: match[1],
    name: match[2],
    unit: match[3],
    number: match[4],
    rank: parseFloat(match[5]) || 999999
  };
}).filter((n): n is Nutrient => n !== null);

const active = nutrients.filter(n =>
  n.rank < 999999 &&
  !n.name.includes('DO NOT USE') &&
  !n.name.includes('Archived')
).sort((a, b) => a.rank - b.rank);

const categories = [
  { name: 'Proximates & Energy', min: 0, max: 1200, id: 1 },
  { name: 'Carbohydrates & Fiber', min: 1200, max: 3000, id: 2 },
  { name: 'Organic Acids', min: 3000, max: 5200, id: 3 },
  { name: 'Minerals', min: 5200, max: 6250, id: 4 },
  { name: 'Vitamins', min: 6250, max: 9000, id: 5 },
  { name: 'Lipids - Totals', min: 9000, max: 10000, id: 6 },
  { name: 'Saturated Fatty Acids', min: 10000, max: 11400, id: 7 },
  { name: 'Monounsaturated Fatty Acids', min: 11400, max: 12900, id: 8 },
  { name: 'Polyunsaturated Fatty Acids', min: 12900, max: 15400, id: 9 },
  { name: 'Trans Fatty Acids', min: 15400, max: 15700, id: 10 },
  { name: 'Sterols & Phytosterols', min: 15700, max: 16250, id: 11 },
  { name: 'Amino Acids', min: 16250, max: 18500, id: 12 },
  { name: 'Other Compounds', min: 18500, max: 30000, id: 13 },
];

let md = `# FDC (USDA) to Nutri Compound Mapping Tracker

## Progress: 0/${active.length} mapped

## Instructions
For each FDC nutrient ID, map to the corresponding Nutri compound:
1. FDC ID = internal ID (1003, 1008, etc.)
2. FDC Num = nutrient number (often matches CNF IDs)
3. Match to our compound database
4. Mark canonical if it's the primary mapping

---

`;

let rowNum = 1;
const summary: {name: string, count: number}[] = [];

for (const cat of categories) {
  const inCat = active.filter(n => n.rank >= cat.min && n.rank < cat.max);
  if (inCat.length === 0) continue;

  summary.push({ name: cat.name, count: inCat.length });

  md += `## ${cat.id}. ${cat.name} (${inCat.length} IDs)\n\n`;
  md += `| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |\n`;
  md += `|---|--------|---------|----------|------|----------------|------------|--------|\n`;

  for (const n of inCat) {
    md += `| ${rowNum} | ${n.id} | ${n.number} | ${n.name} | ${n.unit} | | | ⬜ |\n`;
    rowNum++;
  }

  md += `\n`;
}

md += `---

## Summary

| Category | Count | Mapped |
|----------|-------|--------|
`;

for (const s of summary) {
  md += `| ${s.name} | ${s.count} | 0 |\n`;
}

md += `| **TOTAL** | **${active.length}** | **0** |\n`;

md += `
## Notes

- FDC has ${active.length} active nutrients vs CNF's 152
- FDC Num often matches CNF ID (e.g., 203 = Protein in both)
- Many nutrients already mapped via CNF can be reused
- FDC has more detailed polyphenol/flavonoid data
`;

fs.writeFileSync('/home/kodd/Nutri/docs/FDC_MAPPING_TRACKER.md', md);
console.log('Created FDC_MAPPING_TRACKER.md with ' + active.length + ' nutrients');
