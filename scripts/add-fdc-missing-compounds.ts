/**
 * Add Missing FDC Compounds to Nutri Database
 *
 * Adds ~124 compounds that were marked NO_MATCH in FDC mapping:
 * - New standalone compounds (organic acids, sterols, flavonoids, etc.)
 * - Forms of existing compounds (with parent_compound_id)
 * - Proanthocyanidins parent with 7 children
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

interface NewCompound {
  name: string;
  compound_type: string;
  unit: string;
  alternate_names?: string[];
  description?: string;
  fdcId?: string;      // For creating FDC mapping
  fdcNum?: string;
  fdcName?: string;
}

interface CompoundForm {
  name: string;
  parentName: string;  // Will look up parent ID
  compound_type: string;
  unit: string;
  alternate_names?: string[];
  description?: string;
  fdcId?: string;
  fdcNum?: string;
  fdcName?: string;
}

// ============================================
// NEW STANDALONE COMPOUNDS
// ============================================

const newCompounds: NewCompound[] = [
  // ORGANIC ACIDS (17)
  { name: 'Acetic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1026', fdcNum: '230', fdcName: 'Acetic acid' },
  { name: 'Aconitic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1027', fdcNum: '231', fdcName: 'Aconitic acid' },
  { name: 'Benzoic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1028', fdcNum: '232', fdcName: 'Benzoic acid' },
  { name: 'Chelidonic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1029', fdcNum: '233', fdcName: 'Chelidonic acid' },
  { name: 'Cinnamic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1031', fdcNum: '235', fdcName: 'Cinnamic acid' },
  { name: 'Citric Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1032', fdcNum: '236', fdcName: 'Citric acid', description: 'Major organic acid in citrus fruits' },
  { name: 'Fumaric Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1033', fdcNum: '237', fdcName: 'Fumaric acid' },
  { name: 'Galacturonic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1034', fdcNum: '238', fdcName: 'Galacturonic acid' },
  { name: 'Glycolic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1036', fdcNum: '240', fdcName: 'Glycolic acid' },
  { name: 'Isocitric Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1037', fdcNum: '241', fdcName: 'Isocitric acid' },
  { name: 'Lactic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1038', fdcNum: '242', fdcName: 'Lactic acid', description: 'Produced during fermentation' },
  { name: 'Malic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1039', fdcNum: '243', fdcName: 'Malic acid', description: 'Major organic acid in apples' },
  { name: 'Oxaloacetic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1040', fdcNum: '244', fdcName: 'Oxaloacetic acid' },
  { name: 'Pyruvic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1043', fdcNum: '247', fdcName: 'Pyruvic acid' },
  { name: 'Quinic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1044', fdcNum: '248', fdcName: 'Quinic acid' },
  { name: 'Salicylic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1045', fdcNum: '249', fdcName: 'Salicylic acid' },
  { name: 'Succinic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1046', fdcNum: '250', fdcName: 'Succinic acid' },
  { name: 'Tartaric Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1047', fdcNum: '251', fdcName: 'Tartaric acid', description: 'Major organic acid in grapes' },
  { name: 'Ursolic Acid', compound_type: 'ORGANIC_ACID', unit: 'mg', fdcId: '1048', fdcNum: '252', fdcName: 'Ursolic acid' },

  // CARBOHYDRATES (4)
  { name: 'Xylitol', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '1078', fdcNum: '290', fdcName: 'Xylitol', description: 'Sugar alcohol sweetener' },
  { name: 'Oligosaccharides', compound_type: 'CARBOHYDRATE', unit: 'mg', fdcId: '2064', fdcNum: '', fdcName: 'Oligosaccharides' },
  { name: 'Verbascose', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '2063', fdcNum: '', fdcName: 'Verbascose' },
  { name: 'Added Sugars', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '1235', fdcNum: '539', fdcName: 'Sugars, added', description: 'Sugars added during processing' },
  { name: 'Intrinsic Sugars', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '1236', fdcNum: '549', fdcName: 'Sugars, intrinsic', description: 'Naturally occurring sugars' },

  // RARE SATURATED FATTY ACIDS (7)
  { name: 'Valeric Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 5:0', 'Pentanoic Acid'], fdcId: '2003', fdcNum: '632', fdcName: 'SFA 5:0' },
  { name: 'Enanthic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 7:0', 'Heptanoic Acid'], fdcId: '2004', fdcNum: '633', fdcName: 'SFA 7:0' },
  { name: 'Pelargonic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 9:0', 'Nonanoic Acid'], fdcId: '2005', fdcNum: '634', fdcName: 'SFA 9:0' },
  { name: 'Undecanoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 11:0'], fdcId: '1335', fdcNum: '699', fdcName: 'SFA 11:0' },
  { name: 'Nonadecanoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 19:0'], fdcId: '1322', fdcNum: '686', fdcName: 'SFA 19:0' },
  { name: 'Heneicosanoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 21:0'], fdcId: '2006', fdcNum: '681', fdcName: 'SFA 21:0' },
  { name: 'Tricosanoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['SFA 23:0'], fdcId: '2007', fdcNum: '682', fdcName: 'SFA 23:0' },

  // OTHER FATTY ACIDS (8)
  { name: 'Vaccenic Acid (cis)', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['MUFA 18:1-11 c'], fdcId: '1413', fdcNum: '860', fdcName: 'MUFA 18:1-11 c (18:1c n-7)' },
  { name: 'Vaccenic Acid (trans)', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['MUFA 18:1-11 t'], fdcId: '1412', fdcNum: '859', fdcName: 'MUFA 18:1-11 t (18:1t n-7)' },
  { name: 'Cetoleic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['MUFA 22:1 n-11'], fdcId: '2015', fdcNum: '676.2', fdcName: 'MUFA 22:1 n-11' },
  { name: 'Hexadecadienoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['PUFA 16:2'], fdcId: '1324', fdcNum: '688', fdcName: 'PUFA 16:2' },
  { name: 'Trans Myristoleic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['TFA 14:1 t'], fdcId: '1281', fdcNum: '821', fdcName: 'TFA 14:1 t' },
  { name: 'Trans Heptadecenoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['TFA 17:1 t'], fdcId: '2011', fdcNum: '826', fdcName: 'TFA 17:1 t' },
  { name: 'Trans Eicosenoic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['TFA 20:1 t'], fdcId: '2013', fdcNum: '830', fdcName: 'TFA 20:1 t' },
  { name: 'Trans Alpha-Linolenic Acid', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['TFA 18:3 t'], fdcId: '2019', fdcNum: '834', fdcName: 'TFA 18:3 t' },
  { name: 'Eicosatetraenoic Acid (n-3)', compound_type: 'FATTY_ACID', unit: 'g', alternate_names: ['PUFA 20:4 n-3'], fdcId: '1407', fdcNum: '854', fdcName: 'PUFA 20:4 n-3' },

  // STEROLS (12)
  { name: 'Brassicasterol', compound_type: 'STEROL', unit: 'mg', fdcId: '1287', fdcNum: '640', fdcName: 'Brassicasterol' },
  { name: 'Ergosterol', compound_type: 'STEROL', unit: 'mg', fdcId: '1284', fdcNum: '637', fdcName: 'Ergosterol', description: 'Precursor to vitamin D2 in fungi' },
  { name: 'Campestanol', compound_type: 'STEROL', unit: 'mg', fdcId: '1289', fdcNum: '642', fdcName: 'Campestanol' },
  { name: 'Beta-Sitostanol', compound_type: 'STEROL', unit: 'mg', fdcId: '1294', fdcNum: '647', fdcName: 'Beta-sitostanol' },
  { name: 'Delta-7-Avenasterol', compound_type: 'STEROL', unit: 'mg', fdcId: '1295', fdcNum: '648', fdcName: 'Delta-7-avenasterol' },
  { name: 'Delta-5-Avenasterol', compound_type: 'STEROL', unit: 'mg', fdcId: '1296', fdcNum: '649', fdcName: 'Delta-5-avenasterol' },
  { name: 'Alpha-Spinasterol', compound_type: 'STEROL', unit: 'mg', fdcId: '1297', fdcNum: '650', fdcName: 'Alpha-spinasterol' },
  { name: 'Delta-7-Stigmastenol', compound_type: 'STEROL', unit: 'mg', fdcId: '2052', fdcNum: '', fdcName: 'Delta-7-Stigmastenol' },
  { name: 'Stigmastadiene', compound_type: 'STEROL', unit: 'mg', fdcId: '2053', fdcNum: '', fdcName: 'Stigmastadiene' },
  { name: 'Ergosta-7-enol', compound_type: 'STEROL', unit: 'mg', fdcId: '2060', fdcNum: '', fdcName: 'Ergosta-7-enol' },
  { name: 'Ergosta-7,22-dienol', compound_type: 'STEROL', unit: 'mg', fdcId: '2061', fdcNum: '', fdcName: 'Ergosta-7,22-dienol' },
  { name: 'Ergosta-5,7-dienol', compound_type: 'STEROL', unit: 'mg', fdcId: '2062', fdcNum: '', fdcName: 'Ergosta-5,7-dienol' },

  // AMINO ACIDS (1)
  { name: 'Cystine', compound_type: 'AMINO_ACID', unit: 'g', fdcId: '1216', fdcNum: '507', fdcName: 'Cystine', description: 'Oxidized dimer of cysteine' },

  // ISOFLAVONES (4)
  { name: 'Glycitein', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1342', fdcNum: '712', fdcName: 'Glycitein' },
  { name: 'Daidzin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '2049', fdcNum: '717', fdcName: 'Daidzin', description: 'Glycoside of daidzein' },
  { name: 'Genistin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '2050', fdcNum: '718', fdcName: 'Genistin', description: 'Glycoside of genistein' },
  { name: 'Glycitin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '2051', fdcNum: '719', fdcName: 'Glycitin', description: 'Glycoside of glycitein' },

  // ANTHOCYANIDINS (3)
  { name: 'Malvidin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1358', fdcNum: '742', fdcName: 'Malvidin' },
  { name: 'Peonidin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1360', fdcNum: '745', fdcName: 'Peonidin' },
  { name: 'Petunidin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1361', fdcNum: '746', fdcName: 'Petunidin' },

  // PROANTHOCYANIDINS - PARENT (will add children as forms)
  { name: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', description: 'Condensed tannins, polymers of flavan-3-ols' },

  // CATECHINS (2)
  { name: 'Epigallocatechin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1365', fdcNum: '750', fdcName: 'Epigallocatechin' },
  { name: 'Epicatechin-3-gallate', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1367', fdcNum: '752', fdcName: 'Epicatechin-3-gallate', alternate_names: ['ECG'] },

  // TEA COMPOUNDS (3)
  { name: 'Theaflavins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1370', fdcNum: '755', fdcName: 'Theaflavins', description: 'Oxidized catechins in black tea' },
  { name: 'Thearubigins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1371', fdcNum: '756', fdcName: 'Thearubigins', description: 'Complex polyphenols in black tea' },
  { name: 'Theogallin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1392', fdcNum: '790', fdcName: 'Theogallin' },

  // FLAVANONES (4)
  { name: 'Eriodictyol', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1373', fdcNum: '758', fdcName: 'Eriodictyol' },
  { name: 'Hesperetin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1374', fdcNum: '759', fdcName: 'Hesperetin' },
  { name: 'Isosakuranetin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1375', fdcNum: '760', fdcName: 'Isosakuranetin' },
  { name: 'Liquiritigenin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1376', fdcNum: '761', fdcName: 'Liquiritigenin' },

  // FLAVONES (5)
  { name: 'Chrysoeriol', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1380', fdcNum: '771', fdcName: 'Chrysoeriol' },
  { name: 'Diosmetin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1381', fdcNum: '772', fdcName: 'Diosmetin' },
  { name: 'Nobiletin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1383', fdcNum: '781', fdcName: 'Nobiletin' },
  { name: 'Sinensetin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1384', fdcNum: '782', fdcName: 'Sinensetin' },
  { name: 'Tangeretin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1385', fdcNum: '783', fdcName: 'Tangeretin' },

  // FLAVONOLS (2)
  { name: 'Isorhamnetin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1387', fdcNum: '785', fdcName: 'Isorhamnetin' },
  { name: 'Limocitrin', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1389', fdcNum: '787', fdcName: 'Limocitrin' },
];

// ============================================
// FORMS OF EXISTING COMPOUNDS (with parent_compound_id)
// ============================================

const compoundForms: CompoundForm[] = [
  // Fortification tracking (→ parent mineral/vitamin)
  { name: 'Calcium (added)', parentName: 'Calcium', compound_type: 'MINERAL', unit: 'mg', fdcId: '1237', fdcNum: '551', fdcName: 'Calcium, added', description: 'Calcium from fortification' },
  { name: 'Iron (added)', parentName: 'Iron', compound_type: 'MINERAL', unit: 'mg', fdcId: '1238', fdcNum: '553', fdcName: 'Iron, added', description: 'Iron from fortification' },
  { name: 'Vitamin C (added)', parentName: 'Vitamin C', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1241', fdcNum: '571', fdcName: 'Vitamin C, added' },
  { name: 'Thiamin (added)', parentName: 'Thiamin', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1243', fdcNum: '574', fdcName: 'Thiamin, added' },
  { name: 'Riboflavin (added)', parentName: 'Riboflavin', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1244', fdcNum: '575', fdcName: 'Riboflavin, added' },
  { name: 'Niacin (added)', parentName: 'Niacin', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1245', fdcNum: '576', fdcName: 'Niacin, added' },
  { name: 'Vitamin E (added)', parentName: 'Vitamin E', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1242', fdcNum: '573', fdcName: 'Vitamin E, added' },
  { name: 'Vitamin B12 (added)', parentName: 'Vitamin B12', compound_type: 'VITAMIN', unit: 'µg', fdcId: '1246', fdcNum: '578', fdcName: 'Vitamin B-12, added' },

  // Fiber subtypes
  { name: 'High Molecular Weight Dietary Fiber', parentName: 'Total Fiber', compound_type: 'CARBOHYDRATE', unit: 'g', alternate_names: ['HMWDF'], fdcId: '2038', fdcNum: '293.3', fdcName: 'High Molecular Weight Dietary Fiber (HMWDF)' },
  { name: 'Low Molecular Weight Dietary Fiber', parentName: 'Total Fiber', compound_type: 'CARBOHYDRATE', unit: 'g', alternate_names: ['LMWDF'], fdcId: '2065', fdcNum: '293.4', fdcName: 'Low Molecular Weight Dietary Fiber (LMWDF)' },
  { name: 'Soluble Fiber (SDFP)', parentName: 'Soluble Fiber', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '2036', fdcNum: '954', fdcName: 'Soluble dietary fiber (SDFP)' },
  { name: 'Soluble Fiber (SDFS)', parentName: 'Soluble Fiber', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '2037', fdcNum: '953', fdcName: 'Soluble dietary fiber (SDFS)' },
  { name: 'Beta-Glucan', parentName: 'Soluble Fiber', compound_type: 'CARBOHYDRATE', unit: 'g', fdcId: '2058', fdcNum: '', fdcName: 'Beta-glucan', description: 'Soluble fiber found in oats and barley' },

  // Choline forms
  { name: 'Phosphocholine', parentName: 'Choline', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1195', fdcNum: '451', fdcName: 'Choline, from phosphocholine' },
  { name: 'Phosphatidylcholine', parentName: 'Choline', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1196', fdcNum: '452', fdcName: 'Choline, from phosphotidyl choline' },
  { name: 'Glycerophosphocholine', parentName: 'Choline', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1197', fdcNum: '453', fdcName: 'Choline, from glycerophosphocholine' },
  { name: 'Sphingomyelin Choline', parentName: 'Choline', compound_type: 'VITAMIN', unit: 'mg', fdcId: '1199', fdcNum: '455', fdcName: 'Choline, from sphingomyelin' },

  // Carotenoid forms
  { name: 'Gamma-Carotene', parentName: 'Beta-Carotene', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '1118', fdcNum: '332', fdcName: 'Carotene, gamma' },
  { name: 'Alpha-Cryptoxanthin', parentName: 'Beta-Cryptoxanthin', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '2032', fdcNum: '335', fdcName: 'Cryptoxanthin, alpha' },
  { name: 'Phytoene', parentName: 'Beta-Carotene', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '1116', fdcNum: '330', fdcName: 'Phytoene', description: 'Carotenoid precursor' },
  { name: 'Phytofluene', parentName: 'Beta-Carotene', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '1117', fdcNum: '331', fdcName: 'Phytofluene', description: 'Carotenoid precursor' },
  { name: 'Lutein + Zeaxanthin', parentName: 'Lutein', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '1123', fdcNum: '338', fdcName: 'Lutein + zeaxanthin', description: 'Combined measurement' },
  { name: 'cis-Lutein/Zeaxanthin', parentName: 'Lutein', compound_type: 'CAROTENOID', unit: 'µg', fdcId: '1161', fdcNum: '338.3', fdcName: 'cis-Lutein/Zeaxanthin' },

  // Vitamin D metabolites
  { name: '25-Hydroxycholecalciferol', parentName: 'Vitamin D3', compound_type: 'VITAMIN', unit: 'µg', fdcId: '1113', fdcNum: '327', fdcName: '25-hydroxycholecalciferol', alternate_names: ['Calcidiol', '25(OH)D3'] },
  { name: '25-Hydroxyergocalciferol', parentName: 'Vitamin D2', compound_type: 'VITAMIN', unit: 'µg', fdcId: '1115', fdcNum: '329', fdcName: '25-hydroxyergocalciferol' },
  { name: 'Vitamin D4', parentName: 'Vitamin D', compound_type: 'VITAMIN', unit: 'µg', fdcId: '2059', fdcNum: '', fdcName: 'Vitamin D4' },

  // Vitamin K form
  { name: 'Dihydrophylloquinone', parentName: 'Vitamin K1', compound_type: 'VITAMIN', unit: 'µg', fdcId: '1184', fdcNum: '429', fdcName: 'Vitamin K (Dihydrophylloquinone)' },

  // Proanthocyanidin forms (children of Proanthocyanidins)
  { name: 'Proanthocyanidin A-type dimers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1350', fdcNum: '732', fdcName: 'Proanthocyanidin (dimer-A linkage)' },
  { name: 'Proanthocyanidin Monomers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1351', fdcNum: '733', fdcName: 'Proanthocyanidin monomers' },
  { name: 'Proanthocyanidin Dimers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1352', fdcNum: '734', fdcName: 'Proanthocyanidin dimers' },
  { name: 'Proanthocyanidin Trimers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1353', fdcNum: '735', fdcName: 'Proanthocyanidin trimers' },
  { name: 'Proanthocyanidin 4-6mers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1354', fdcNum: '736', fdcName: 'Proanthocyanidin 4-6mers' },
  { name: 'Proanthocyanidin 7-10mers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1355', fdcNum: '737', fdcName: 'Proanthocyanidin 7-10mers' },
  { name: 'Proanthocyanidin Polymers', parentName: 'Proanthocyanidins', compound_type: 'POLYPHENOL', unit: 'mg', fdcId: '1356', fdcNum: '738', fdcName: 'Proanthocyanidin polymers (>10mers)' },

  // Linoleic acid isomers
  { name: 'Linoleic Acid (cis,trans)', parentName: 'Linoleic Acid', compound_type: 'FATTY_ACID', unit: 'g', fdcId: '1309', fdcNum: '668', fdcName: 'PUFA 18:2 c,t' },
  { name: 'Linoleic Acid (trans,cis)', parentName: 'Linoleic Acid', compound_type: 'FATTY_ACID', unit: 'g', fdcId: '1308', fdcNum: '667', fdcName: 'PUFA 18:2 t,c' },
  { name: 'Linolenic Acid Isomers', parentName: 'Alpha-Linolenic Acid', compound_type: 'FATTY_ACID', unit: 'g', fdcId: '1409', fdcNum: '856', fdcName: 'PUFA 18:3i' },
];

async function main() {
  console.log('Adding missing FDC compounds to Nutri database...\n');

  // Get existing compounds for parent lookups
  const { data: existingCompounds, error: fetchError } = await supabase
    .from('compounds')
    .select('id, name');

  if (fetchError || !existingCompounds) {
    console.error('Failed to fetch existing compounds:', fetchError);
    return;
  }

  const compoundMap = new Map<string, string>();
  for (const c of existingCompounds) {
    compoundMap.set(c.name.toLowerCase(), c.id);
  }

  console.log(`Found ${existingCompounds.length} existing compounds\n`);

  // ========== ADD NEW STANDALONE COMPOUNDS ==========
  console.log('=== Adding new standalone compounds ===\n');

  let addedCount = 0;
  let skippedCount = 0;
  const addedCompounds: { name: string; id: string; fdcId?: string; fdcNum?: string; fdcName?: string }[] = [];

  for (const compound of newCompounds) {
    // Check if already exists
    if (compoundMap.has(compound.name.toLowerCase())) {
      console.log(`⏭️  ${compound.name} (already exists)`);
      skippedCount++;
      continue;
    }

    const { data, error } = await supabase
      .from('compounds')
      .insert({
        name: compound.name,
        compound_type: compound.compound_type,
        unit: compound.unit,
        alternate_names: compound.alternate_names || [],
        description: compound.description || null,
      })
      .select('id')
      .single();

    if (error) {
      console.log(`❌ ${compound.name}: ${error.message}`);
    } else {
      console.log(`✅ ${compound.name} (${compound.compound_type})`);
      addedCount++;
      compoundMap.set(compound.name.toLowerCase(), data.id);
      if (compound.fdcId) {
        addedCompounds.push({
          name: compound.name,
          id: data.id,
          fdcId: compound.fdcId,
          fdcNum: compound.fdcNum,
          fdcName: compound.fdcName
        });
      }
    }
  }

  console.log(`\nStandalone: ${addedCount} added, ${skippedCount} skipped\n`);

  // ========== ADD COMPOUND FORMS ==========
  console.log('=== Adding compound forms (with parent) ===\n');

  let formsAdded = 0;
  let formsSkipped = 0;

  for (const form of compoundForms) {
    // Check if already exists
    if (compoundMap.has(form.name.toLowerCase())) {
      console.log(`⏭️  ${form.name} (already exists)`);
      formsSkipped++;
      continue;
    }

    // Find parent
    const parentId = compoundMap.get(form.parentName.toLowerCase());
    if (!parentId) {
      console.log(`❌ ${form.name}: Parent "${form.parentName}" not found`);
      continue;
    }

    const { data, error } = await supabase
      .from('compounds')
      .insert({
        name: form.name,
        compound_type: form.compound_type,
        unit: form.unit,
        parent_compound_id: parentId,
        alternate_names: form.alternate_names || [],
        description: form.description || null,
      })
      .select('id')
      .single();

    if (error) {
      console.log(`❌ ${form.name}: ${error.message}`);
    } else {
      console.log(`✅ ${form.name} → ${form.parentName}`);
      formsAdded++;
      compoundMap.set(form.name.toLowerCase(), data.id);
      if (form.fdcId) {
        addedCompounds.push({
          name: form.name,
          id: data.id,
          fdcId: form.fdcId,
          fdcNum: form.fdcNum,
          fdcName: form.fdcName
        });
      }
    }
  }

  console.log(`\nForms: ${formsAdded} added, ${formsSkipped} skipped\n`);

  // ========== CREATE FDC MAPPINGS ==========
  console.log('=== Creating FDC source mappings ===\n');

  let mappingsCreated = 0;

  for (const compound of addedCompounds) {
    if (!compound.fdcId) continue;

    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compound.id,
        external_source: 'FDC',
        external_id: compound.fdcId,
        source_name: compound.fdcName || compound.name,
        source_unit: null, // Will be filled from FDC data
        is_canonical: true,
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`⏭️  FDC ${compound.fdcId} (mapping exists)`);
      } else {
        console.log(`❌ FDC ${compound.fdcId}: ${error.message}`);
      }
    } else {
      console.log(`✅ FDC ${compound.fdcId} → ${compound.name}`);
      mappingsCreated++;
    }
  }

  // ========== SUMMARY ==========
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`New standalone compounds: ${addedCount}`);
  console.log(`Compound forms (with parent): ${formsAdded}`);
  console.log(`FDC mappings created: ${mappingsCreated}`);

  // Final count
  const { count: totalCompounds } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  const { count: totalMappings } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal compounds in database: ${totalCompounds}`);
  console.log(`Total source mappings: ${totalMappings}`);
}

main().catch(console.error);
