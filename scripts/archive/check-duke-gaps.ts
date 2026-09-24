import { db } from '../db';
import { sql } from 'drizzle-orm';

const codes = ["ALPHATOCOTRIENOL","BETATOCOTRIENOL","BRASSICASTEROL","CALCIUMCITRATE","CALCIUMPHOSPHATE","CHLORIDE","CYANOCOBALAMIN","DELTA5AVENASTEROL","DELTA7AVENASTEROL","DELTA7STIGMASTENOL","DELTATOCOPHEROL","DELTATOCOTRIENOL","EICOSADIENOICACID","ELAIDICACID","ERUCICACID","ERYTHRITOL","FOLATE","FOLINICACID","GAMMATOCOTRIENOL","HENEICOSANOICACID","HEPTADECENOICACID","HEXADECADIENOICACID","ISOPALMITICACID","LACTOSE","MAGNESIUMOXIDE","MARGARICACID","NERVONICACID","NICOTINAMIDE","NONADECANOICACID","OLIGOSACCHARIDE","PENTACOSANOICACID","PENTADECENOICACID","RETINOICACID","THEOBROMINE","THEOPHYLLINE","TRIDECANOICACID","UNDECANOICACID"];

async function check() {
  // How does the duke-client match? Check compound_sources external_id against duke_chemicals
  for (const code of codes) {
    // The external_id in compound_sources IS the code (e.g. ALPHATOCOTRIENOL)
    // Duke chemicals have a name field. Let's see if a chemical matches.
    const chem = await db.execute(sql`
      SELECT chem_id, name FROM source_duke_chemicals
      WHERE UPPER(REPLACE(REPLACE(REPLACE(name, ' ', ''), '-', ''), '''', '')) = ${code}
    `);
    const chemRows = (chem as any).rows ?? chem;

    if (chemRows.length === 0) {
      console.log(code + ": NOT FOUND in chemicals");
      continue;
    }

    const chemId = chemRows[0].chem_id;
    const count = await db.execute(sql`
      SELECT COUNT(DISTINCT p.common_name) as fc
      FROM source_duke_farmacy f
      JOIN source_duke_plants p ON p.fnf_num = f.fnf_num
      WHERE f.chem_id = ${chemId} AND f.amount_high IS NOT NULL AND f.amount_high > 0
    `);
    const fc = ((count as any).rows ?? count)[0].fc;

    if (parseInt(fc) === 0) {
      console.log(code + " / " + chemRows[0].name + ": 0 plants with data");
      continue;
    }

    const examples = await db.execute(sql`
      SELECT p.common_name, f.plant_part, f.amount_high, f.unit
      FROM source_duke_farmacy f
      JOIN source_duke_plants p ON p.fnf_num = f.fnf_num
      WHERE f.chem_id = ${chemId} AND f.amount_high IS NOT NULL AND f.amount_high > 0
      ORDER BY f.amount_high DESC LIMIT 3
    `);
    console.log(code + " / " + chemRows[0].name + " (" + fc + " plants):");
    for (const r of ((examples as any).rows ?? examples)) {
      console.log("  " + r.amount_high + " " + r.unit + " - " + r.common_name + " (" + r.plant_part + ")");
    }
    console.log("");
  }
  process.exit(0);
}
check();
