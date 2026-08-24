import { analyzeCompound, SourceValue } from '../lib/food-health/outliers';

const v = (source: string, value: number, matchedName?: string): SourceValue => ({ source, value, matchedName });
let pass = 0, fail = 0;
function check(label: string, got: boolean, want: boolean, extra = '') {
  const ok = got === want; ok ? pass++ : fail++;
  process.stderr.write(`>>> ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} ${extra}\n`);
}

// 1. THE GELATIN CASE — 3 sources at 7.8, 10 at ~86. Must flag the 3.
const gelatin = analyzeCompound('Protein', 'g', [
  v('CNF', 7.8, 'Gelatin dessert mix'), v('FDC', 7.8, 'Gelatin desserts, dry mix'), v('KFCT', 7.8, 'Gelatin, For dessert'),
  v('UK_COFID', 84.4), v('AFCD', 84.4), v('BLS', 85.1), v('MEXT', 86.0), v('CIQUAL', 86.9),
  v('FRIDA', 86.9), v('FOODFILES', 87.3), v('NEVO', 88.0), v('FINELI', 96.4), v('MATVARETABELLEN', 85.0),
]);
const gelFlagged = new Set(gelatin.flags.map(f => f.source));
check('gelatin: flags CNF/FDC/KFCT', ['CNF','FDC','KFCT'].every(s => gelFlagged.has(s)), true,
      `flagged=[${[...gelFlagged].join(',')}]`);
check('gelatin: does NOT flag the 10 correct sources', ['UK_COFID','BLS','CIQUAL','NEVO'].some(s => gelFlagged.has(s)), false);
check('gelatin: detects the cluster', gelatin.cluster !== null, true,
      gelatin.cluster ? `${gelatin.cluster.minoritySources.length} vs ${gelatin.cluster.majoritySources.length}` : '');

// 2. THE CIQUAL PROTEIN CASE — 1.36 against 12 sources at ~20. Single stray.
const ciqual = analyzeCompound('Protein', 'g', [
  v('CIQUAL', 1.36), v('MEXT', 17.4), v('KFCT', 19.0), v('BLS', 19.21), v('ASEANFOODS', 20.3),
  v('FRIDA', 20.3), v('FINELI', 20.3), v('CNF', 20.36), v('FDC', 20.36), v('FOODFILES', 20.5),
  v('NEVO', 21.0), v('UK_COFID', 21.1),
]);
check('ciqual protein 1.36: flagged', ciqual.flags.some(f => f.source === 'CIQUAL'), true,
      ciqual.flags[0] ? `sev=${ciqual.flags[0].severity}` : '');
check('ciqual protein: only CIQUAL is high severity',
      ciqual.flags.filter(f => f.severity === 'high').length === 1, true,
      `high=${ciqual.flags.filter(f=>f.severity==='high').map(f=>f.source)} low=${ciqual.flags.filter(f=>f.severity==='low').map(f=>f.source)}`);
check('gelatin: only the 3 dessert-mix sources are high',
      new Set(gelatin.flags.filter(f=>f.severity==='high').map(f=>f.source)).size === 3, true,
      `high=[${gelatin.flags.filter(f=>f.severity==='high').map(f=>f.source).join(',')}]`);

// 3. KFCT RETINOL = 3 against ~5000. Wide-band nutrient, but 1000x must still flag.
const retinol = analyzeCompound('Retinol', 'μg', [
  v('KFCT', 3), v('CIQUAL', 6350), v('FDC', 4948), v('CNF', 4948), v('ASEANFOODS', 8212), v('BLS', 5000),
]);
check('kfct retinol 3 vs ~5000: flagged', retinol.flags.some(f => f.source === 'KFCT'), true);

// 4. MAD == 0 (identical majority) must not flag everyone
const madZero = analyzeCompound('Iron (Total)', 'mg', [
  v('A', 5.0), v('B', 5.0), v('C', 5.0), v('D', 5.0), v('E', 5.4),
]);
check('MAD=0: does not flag a near-identical value', madZero.flags.length === 0, true, `flags=${madZero.flags.length}`);

// 5. A source reporting 0 where others report real values
const zeroCase = analyzeCompound('Zinc', 'mg', [
  v('A', 0), v('B', 3.5), v('C', 3.6), v('D', 3.4),
]);
check('zero-against-nonzero: flagged high', zeroCase.flags.some(f => f.source==='A' && f.severity==='high'), true);

// 6. Legitimate regional variation in a wide-band nutrient must NOT flag
const selenium = analyzeCompound('Selenium', 'μg', [
  v('A', 17), v('B', 25), v('C', 39.3), v('D', 45), v('E', 52), v('F', 83),
]);
check('selenium 17-83 (real variation): no flags', selenium.flags.length === 0, true, `flags=${selenium.flags.length}`);

// 7. Proximate tight-but-wrong: protein 21 vs 28 should be caught (sensitive)
const tight = analyzeCompound('Protein', 'g', [
  v('A', 20.5), v('B', 21.0), v('C', 21.1), v('D', 28.5),
]);
check('protein 28.5 vs ~21: flagged (sensitivity)', tight.flags.some(f => f.source==='D'), true);

// 8. Only 2 sources, one double the other
const two = analyzeCompound('Protein', 'g', [v('A', 10), v('B', 22)]);
check('n=2 with 2.2x gap: flagged', two.flags.length > 0, true, `flags=${two.flags.length}`);

// 9. All identical
const same = analyzeCompound('Water', 'g', [v('A', 70), v('B', 70), v('C', 70)]);
check('identical values: no flags', same.flags.length === 0, true);

process.stderr.write(`\n>>> ${pass} passed, ${fail} failed\n`);
