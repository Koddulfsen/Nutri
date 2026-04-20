/**
 * Insert FDC (USDA) Mappings into compound_sources
 *
 * Inserts all FDC nutrient ID mappings to Nutri compounds.
 * Uses FDC internal IDs (e.g., 1008) as the external_id.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FDCMapping {
  fdcId: string;       // FDC internal ID (1003, 1008, etc.)
  fdcNum: string;      // FDC nutrient number (often matches CNF)
  fdcName: string;     // Name in FDC
  fdcUnit: string;     // Unit in FDC
  nutriCompound: string;
  isCanonical: boolean;
  conversionFactor?: string;
}

const fdcMappings: FDCMapping[] = [
  // Category 1: Proximates & Energy
  { fdcId: '1051', fdcNum: '255', fdcName: 'Water', fdcUnit: 'G', nutriCompound: 'Water', isCanonical: true },
  { fdcId: '2047', fdcNum: '957', fdcName: 'Energy (Atwater General Factors)', fdcUnit: 'KCAL', nutriCompound: 'Energy', isCanonical: false },
  { fdcId: '2048', fdcNum: '958', fdcName: 'Energy (Atwater Specific Factors)', fdcUnit: 'KCAL', nutriCompound: 'Energy', isCanonical: false },
  { fdcId: '1008', fdcNum: '208', fdcName: 'Energy', fdcUnit: 'KCAL', nutriCompound: 'Energy', isCanonical: true },
  { fdcId: '1062', fdcNum: '268', fdcName: 'Energy', fdcUnit: 'kJ', nutriCompound: 'Energy', isCanonical: false, conversionFactor: '0.239006' },
  { fdcId: '1003', fdcNum: '203', fdcName: 'Protein', fdcUnit: 'G', nutriCompound: 'Protein', isCanonical: true },
  { fdcId: '1053', fdcNum: '257', fdcName: 'Adjusted Protein', fdcUnit: 'G', nutriCompound: 'Protein', isCanonical: false },
  { fdcId: '1004', fdcNum: '204', fdcName: 'Total lipid (fat)', fdcUnit: 'G', nutriCompound: 'Total Fat', isCanonical: true },
  { fdcId: '1085', fdcNum: '298', fdcName: 'Total fat (NLEA)', fdcUnit: 'G', nutriCompound: 'Total Fat', isCanonical: false },
  { fdcId: '1007', fdcNum: '207', fdcName: 'Ash', fdcUnit: 'G', nutriCompound: 'Ash', isCanonical: true },
  { fdcId: '2039', fdcNum: '956', fdcName: 'Carbohydrates', fdcUnit: 'G', nutriCompound: 'Total Carbohydrate', isCanonical: false },
  { fdcId: '1005', fdcNum: '205', fdcName: 'Carbohydrate, by difference', fdcUnit: 'G', nutriCompound: 'Total Carbohydrate', isCanonical: true },
  { fdcId: '1050', fdcNum: '205.2', fdcName: 'Carbohydrate, by summation', fdcUnit: 'G', nutriCompound: 'Total Carbohydrate', isCanonical: false },

  // Category 2: Carbohydrates & Fiber
  { fdcId: '1079', fdcNum: '291', fdcName: 'Fiber, total dietary', fdcUnit: 'G', nutriCompound: 'Total Fiber', isCanonical: true },
  { fdcId: '1082', fdcNum: '295', fdcName: 'Fiber, soluble', fdcUnit: 'G', nutriCompound: 'Soluble Fiber', isCanonical: true },
  { fdcId: '1084', fdcNum: '297', fdcName: 'Fiber, insoluble', fdcUnit: 'G', nutriCompound: 'Insoluble Fiber', isCanonical: true },
  { fdcId: '2033', fdcNum: '293', fdcName: 'Total dietary fiber (AOAC 2011.25)', fdcUnit: 'G', nutriCompound: 'Total Fiber', isCanonical: false },
  { fdcId: '2034', fdcNum: '293.1', fdcName: 'Insoluble dietary fiber (IDF)', fdcUnit: 'G', nutriCompound: 'Insoluble Fiber', isCanonical: false },
  { fdcId: '2035', fdcNum: '293.2', fdcName: 'Soluble dietary fiber (SDFP+SDFS)', fdcUnit: 'G', nutriCompound: 'Soluble Fiber', isCanonical: false },
  { fdcId: '1063', fdcNum: '269.3', fdcName: 'Sugars, Total NLEA', fdcUnit: 'G', nutriCompound: 'Total Sugars', isCanonical: false },
  { fdcId: '2000', fdcNum: '269', fdcName: 'Sugars, Total', fdcUnit: 'G', nutriCompound: 'Total Sugars', isCanonical: true },
  { fdcId: '1010', fdcNum: '210', fdcName: 'Sucrose', fdcUnit: 'G', nutriCompound: 'Sucrose', isCanonical: true },
  { fdcId: '1011', fdcNum: '211', fdcName: 'Glucose', fdcUnit: 'G', nutriCompound: 'Glucose', isCanonical: true },
  { fdcId: '1012', fdcNum: '212', fdcName: 'Fructose', fdcUnit: 'G', nutriCompound: 'Fructose', isCanonical: true },
  { fdcId: '1013', fdcNum: '213', fdcName: 'Lactose', fdcUnit: 'G', nutriCompound: 'Lactose', isCanonical: true },
  { fdcId: '1014', fdcNum: '214', fdcName: 'Maltose', fdcUnit: 'G', nutriCompound: 'Maltose', isCanonical: true },
  { fdcId: '1075', fdcNum: '287', fdcName: 'Galactose', fdcUnit: 'G', nutriCompound: 'Galactose', isCanonical: true },
  { fdcId: '1009', fdcNum: '209', fdcName: 'Starch', fdcUnit: 'G', nutriCompound: 'Starch', isCanonical: true },
  { fdcId: '1076', fdcNum: '288', fdcName: 'Raffinose', fdcUnit: 'G', nutriCompound: 'Raffinose', isCanonical: true },
  { fdcId: '1077', fdcNum: '289', fdcName: 'Stachyose', fdcUnit: 'G', nutriCompound: 'Stachyose', isCanonical: true },
  { fdcId: '1055', fdcNum: '260', fdcName: 'Mannitol', fdcUnit: 'G', nutriCompound: 'Mannitol', isCanonical: true },
  { fdcId: '1056', fdcNum: '261', fdcName: 'Sorbitol', fdcUnit: 'G', nutriCompound: 'Sorbitol', isCanonical: true },
  { fdcId: '1181', fdcNum: '422', fdcName: 'Inositol', fdcUnit: 'MG', nutriCompound: 'Inositol', isCanonical: true },

  // Category 3: Organic Acids
  { fdcId: '1030', fdcNum: '234', fdcName: 'Chlorogenic acid', fdcUnit: 'MG', nutriCompound: 'Chlorogenic Acid', isCanonical: true },
  { fdcId: '1035', fdcNum: '239', fdcName: 'Gallic acid', fdcUnit: 'MG', nutriCompound: 'Gallic Acid', isCanonical: true },
  { fdcId: '1041', fdcNum: '245', fdcName: 'Oxalic acid', fdcUnit: 'MG', nutriCompound: 'Oxalic Acid', isCanonical: true },
  { fdcId: '1042', fdcNum: '246', fdcName: 'Phytic acid', fdcUnit: 'MG', nutriCompound: 'Phytic Acid', isCanonical: true },

  // Category 4: Minerals
  { fdcId: '1087', fdcNum: '301', fdcName: 'Calcium, Ca', fdcUnit: 'MG', nutriCompound: 'Calcium', isCanonical: true },
  { fdcId: '1239', fdcNum: '561', fdcName: 'Calcium, intrinsic', fdcUnit: 'MG', nutriCompound: 'Calcium', isCanonical: false },
  { fdcId: '1089', fdcNum: '303', fdcName: 'Iron, Fe', fdcUnit: 'MG', nutriCompound: 'Iron', isCanonical: true },
  { fdcId: '1240', fdcNum: '563', fdcName: 'Iron, intrinsic', fdcUnit: 'MG', nutriCompound: 'Iron', isCanonical: false },
  { fdcId: '1090', fdcNum: '304', fdcName: 'Magnesium, Mg', fdcUnit: 'MG', nutriCompound: 'Magnesium', isCanonical: true },
  { fdcId: '1091', fdcNum: '305', fdcName: 'Phosphorus, P', fdcUnit: 'MG', nutriCompound: 'Phosphorus', isCanonical: true },
  { fdcId: '1092', fdcNum: '306', fdcName: 'Potassium, K', fdcUnit: 'MG', nutriCompound: 'Potassium', isCanonical: true },
  { fdcId: '1093', fdcNum: '307', fdcName: 'Sodium, Na', fdcUnit: 'MG', nutriCompound: 'Sodium', isCanonical: true },
  { fdcId: '1095', fdcNum: '309', fdcName: 'Zinc, Zn', fdcUnit: 'MG', nutriCompound: 'Zinc', isCanonical: true },
  { fdcId: '1098', fdcNum: '312', fdcName: 'Copper, Cu', fdcUnit: 'MG', nutriCompound: 'Copper', isCanonical: true },
  { fdcId: '1101', fdcNum: '315', fdcName: 'Manganese, Mn', fdcUnit: 'MG', nutriCompound: 'Manganese', isCanonical: true },
  { fdcId: '1100', fdcNum: '314', fdcName: 'Iodine, I', fdcUnit: 'UG', nutriCompound: 'Iodine', isCanonical: true },
  { fdcId: '1103', fdcNum: '317', fdcName: 'Selenium, Se', fdcUnit: 'UG', nutriCompound: 'Selenium', isCanonical: true },
  { fdcId: '1099', fdcNum: '313', fdcName: 'Fluoride, F', fdcUnit: 'UG', nutriCompound: 'Fluoride', isCanonical: true },
  { fdcId: '1094', fdcNum: '308', fdcName: 'Sulfur, S', fdcUnit: 'MG', nutriCompound: 'Sulfur', isCanonical: true },
  { fdcId: '1146', fdcNum: '371', fdcName: 'Nickel, Ni', fdcUnit: 'UG', nutriCompound: 'Nickel', isCanonical: true },
  { fdcId: '1102', fdcNum: '316', fdcName: 'Molybdenum, Mo', fdcUnit: 'UG', nutriCompound: 'Molybdenum', isCanonical: true },
  { fdcId: '1097', fdcNum: '311', fdcName: 'Cobalt, Co', fdcUnit: 'UG', nutriCompound: 'Cobalt', isCanonical: true },
  { fdcId: '1137', fdcNum: '354', fdcName: 'Boron, B', fdcUnit: 'UG', nutriCompound: 'Boron', isCanonical: true },

  // Category 5: Vitamins
  { fdcId: '1162', fdcNum: '401', fdcName: 'Vitamin C, total ascorbic acid', fdcUnit: 'MG', nutriCompound: 'Vitamin C', isCanonical: true },
  { fdcId: '1247', fdcNum: '581', fdcName: 'Vitamin C, intrinsic', fdcUnit: 'MG', nutriCompound: 'Vitamin C', isCanonical: false },
  { fdcId: '1165', fdcNum: '404', fdcName: 'Thiamin', fdcUnit: 'MG', nutriCompound: 'Thiamin', isCanonical: true },
  { fdcId: '1249', fdcNum: '584', fdcName: 'Thiamin, intrinsic', fdcUnit: 'MG', nutriCompound: 'Thiamin', isCanonical: false },
  { fdcId: '1166', fdcNum: '405', fdcName: 'Riboflavin', fdcUnit: 'MG', nutriCompound: 'Riboflavin', isCanonical: true },
  { fdcId: '1250', fdcNum: '585', fdcName: 'Riboflavin, intrinsic', fdcUnit: 'MG', nutriCompound: 'Riboflavin', isCanonical: false },
  { fdcId: '1167', fdcNum: '406', fdcName: 'Niacin', fdcUnit: 'MG', nutriCompound: 'Niacin', isCanonical: true },
  { fdcId: '1251', fdcNum: '586', fdcName: 'Niacin, intrinsic', fdcUnit: 'MG', nutriCompound: 'Niacin', isCanonical: false },
  { fdcId: '1170', fdcNum: '410', fdcName: 'Pantothenic acid', fdcUnit: 'MG', nutriCompound: 'Pantothenic Acid', isCanonical: true },
  { fdcId: '1175', fdcNum: '415', fdcName: 'Vitamin B-6', fdcUnit: 'MG', nutriCompound: 'Vitamin B6', isCanonical: true },
  { fdcId: '1176', fdcNum: '416', fdcName: 'Biotin', fdcUnit: 'UG', nutriCompound: 'Biotin', isCanonical: true },
  { fdcId: '1177', fdcNum: '417', fdcName: 'Folate, total', fdcUnit: 'UG', nutriCompound: 'Folate', isCanonical: true },
  { fdcId: '1186', fdcNum: '431', fdcName: 'Folic acid', fdcUnit: 'UG', nutriCompound: 'Folate', isCanonical: false },
  { fdcId: '1187', fdcNum: '432', fdcName: 'Folate, food', fdcUnit: 'UG', nutriCompound: 'Folate', isCanonical: false },
  { fdcId: '1190', fdcNum: '435', fdcName: 'Folate, DFE', fdcUnit: 'UG', nutriCompound: 'Folate', isCanonical: false },
  { fdcId: '1180', fdcNum: '421', fdcName: 'Choline, total', fdcUnit: 'MG', nutriCompound: 'Choline', isCanonical: true },
  { fdcId: '1194', fdcNum: '450', fdcName: 'Choline, free', fdcUnit: 'MG', nutriCompound: 'Choline', isCanonical: false },
  { fdcId: '1198', fdcNum: '454', fdcName: 'Betaine', fdcUnit: 'MG', nutriCompound: 'Betaine', isCanonical: true },
  { fdcId: '1178', fdcNum: '418', fdcName: 'Vitamin B-12', fdcUnit: 'UG', nutriCompound: 'Vitamin B12', isCanonical: true },
  { fdcId: '1252', fdcNum: '588', fdcName: 'Vitamin B-12, intrinsic', fdcUnit: 'UG', nutriCompound: 'Vitamin B12', isCanonical: false },
  { fdcId: '1106', fdcNum: '320', fdcName: 'Vitamin A, RAE', fdcUnit: 'UG', nutriCompound: 'Vitamin A', isCanonical: true },
  { fdcId: '1105', fdcNum: '319', fdcName: 'Retinol', fdcUnit: 'UG', nutriCompound: 'Retinol', isCanonical: true },
  { fdcId: '1107', fdcNum: '321', fdcName: 'Carotene, beta', fdcUnit: 'UG', nutriCompound: 'Beta-Carotene', isCanonical: true },
  { fdcId: '1159', fdcNum: '321.1', fdcName: 'cis-beta-Carotene', fdcUnit: 'UG', nutriCompound: 'Beta-Carotene', isCanonical: false },
  { fdcId: '2028', fdcNum: '321.2', fdcName: 'trans-beta-Carotene', fdcUnit: 'UG', nutriCompound: 'Beta-Carotene', isCanonical: false },
  { fdcId: '1108', fdcNum: '322', fdcName: 'Carotene, alpha', fdcUnit: 'UG', nutriCompound: 'Alpha-Carotene', isCanonical: true },
  { fdcId: '1120', fdcNum: '334', fdcName: 'Cryptoxanthin, beta', fdcUnit: 'UG', nutriCompound: 'Beta-Cryptoxanthin', isCanonical: true },
  { fdcId: '1104', fdcNum: '318', fdcName: 'Vitamin A, IU', fdcUnit: 'IU', nutriCompound: 'Vitamin A', isCanonical: false, conversionFactor: '0.3' },
  { fdcId: '1156', fdcNum: '392', fdcName: 'Vitamin A, RE', fdcUnit: 'MCG_RE', nutriCompound: 'Vitamin A', isCanonical: false },
  { fdcId: '1122', fdcNum: '337', fdcName: 'Lycopene', fdcUnit: 'UG', nutriCompound: 'Lycopene', isCanonical: true },
  { fdcId: '1160', fdcNum: '337.1', fdcName: 'cis-Lycopene', fdcUnit: 'UG', nutriCompound: 'Lycopene', isCanonical: false },
  { fdcId: '2029', fdcNum: '337.2', fdcName: 'trans-Lycopene', fdcUnit: 'UG', nutriCompound: 'Lycopene', isCanonical: false },
  { fdcId: '1121', fdcNum: '338.1', fdcName: 'Lutein', fdcUnit: 'UG', nutriCompound: 'Lutein', isCanonical: true },
  { fdcId: '1119', fdcNum: '338.2', fdcName: 'Zeaxanthin', fdcUnit: 'UG', nutriCompound: 'Zeaxanthin', isCanonical: true },
  { fdcId: '1158', fdcNum: '394', fdcName: 'Vitamin E', fdcUnit: 'MG_ATE', nutriCompound: 'Vitamin E', isCanonical: false },
  { fdcId: '1109', fdcNum: '323', fdcName: 'Vitamin E (alpha-tocopherol)', fdcUnit: 'MG', nutriCompound: 'Vitamin E', isCanonical: true },
  { fdcId: '1248', fdcNum: '583', fdcName: 'Vitamin E, intrinsic', fdcUnit: 'MG', nutriCompound: 'Vitamin E', isCanonical: false },
  { fdcId: '1125', fdcNum: '341', fdcName: 'Tocopherol, beta', fdcUnit: 'MG', nutriCompound: 'Beta-Tocopherol', isCanonical: true },
  { fdcId: '1126', fdcNum: '342', fdcName: 'Tocopherol, gamma', fdcUnit: 'MG', nutriCompound: 'Gamma-Tocopherol', isCanonical: true },
  { fdcId: '1127', fdcNum: '343', fdcName: 'Tocopherol, delta', fdcUnit: 'MG', nutriCompound: 'Delta-Tocopherol', isCanonical: true },
  { fdcId: '1128', fdcNum: '344', fdcName: 'Tocotrienol, alpha', fdcUnit: 'MG', nutriCompound: 'Alpha-Tocotrienol', isCanonical: true },
  { fdcId: '1129', fdcNum: '345', fdcName: 'Tocotrienol, beta', fdcUnit: 'MG', nutriCompound: 'Beta-Tocotrienol', isCanonical: true },
  { fdcId: '1130', fdcNum: '346', fdcName: 'Tocotrienol, gamma', fdcUnit: 'MG', nutriCompound: 'Gamma-Tocotrienol', isCanonical: true },
  { fdcId: '1131', fdcNum: '347', fdcName: 'Tocotrienol, delta', fdcUnit: 'MG', nutriCompound: 'Delta-Tocotrienol', isCanonical: true },
  { fdcId: '1110', fdcNum: '324', fdcName: 'Vitamin D (D2 + D3), International Units', fdcUnit: 'IU', nutriCompound: 'Vitamin D', isCanonical: false, conversionFactor: '0.025' },
  { fdcId: '1114', fdcNum: '328', fdcName: 'Vitamin D (D2 + D3)', fdcUnit: 'UG', nutriCompound: 'Vitamin D', isCanonical: true },
  { fdcId: '1111', fdcNum: '325', fdcName: 'Vitamin D2 (ergocalciferol)', fdcUnit: 'UG', nutriCompound: 'Vitamin D2', isCanonical: true },
  { fdcId: '1112', fdcNum: '326', fdcName: 'Vitamin D3 (cholecalciferol)', fdcUnit: 'UG', nutriCompound: 'Vitamin D3', isCanonical: true },
  { fdcId: '1185', fdcNum: '430', fdcName: 'Vitamin K (phylloquinone)', fdcUnit: 'UG', nutriCompound: 'Vitamin K1', isCanonical: true },
  { fdcId: '1183', fdcNum: '428', fdcName: 'Vitamin K (Menaquinone-4)', fdcUnit: 'UG', nutriCompound: 'Menaquinone-4', isCanonical: true },

  // Category 6: Lipids - Totals
  { fdcId: '1258', fdcNum: '606', fdcName: 'Fatty acids, total saturated', fdcUnit: 'G', nutriCompound: 'Saturated Fat', isCanonical: true },
  { fdcId: '1259', fdcNum: '607', fdcName: 'SFA 4:0', fdcUnit: 'G', nutriCompound: 'Butyric Acid', isCanonical: true },
  { fdcId: '1260', fdcNum: '608', fdcName: 'SFA 6:0', fdcUnit: 'G', nutriCompound: 'Caproic Acid', isCanonical: true },

  // Category 7: Saturated Fatty Acids
  { fdcId: '1261', fdcNum: '609', fdcName: 'SFA 8:0', fdcUnit: 'G', nutriCompound: 'Caprylic Acid', isCanonical: true },
  { fdcId: '1262', fdcNum: '610', fdcName: 'SFA 10:0', fdcUnit: 'G', nutriCompound: 'Capric Acid', isCanonical: true },
  { fdcId: '1263', fdcNum: '611', fdcName: 'SFA 12:0', fdcUnit: 'G', nutriCompound: 'Lauric Acid', isCanonical: true },
  { fdcId: '1332', fdcNum: '696', fdcName: 'SFA 13:0', fdcUnit: 'G', nutriCompound: 'Tridecanoic Acid', isCanonical: true },
  { fdcId: '1264', fdcNum: '612', fdcName: 'SFA 14:0', fdcUnit: 'G', nutriCompound: 'Myristic Acid', isCanonical: true },
  { fdcId: '1299', fdcNum: '652', fdcName: 'SFA 15:0', fdcUnit: 'G', nutriCompound: 'Pentadecanoic Acid', isCanonical: true },
  { fdcId: '1265', fdcNum: '613', fdcName: 'SFA 16:0', fdcUnit: 'G', nutriCompound: 'Palmitic Acid', isCanonical: true },
  { fdcId: '1300', fdcNum: '653', fdcName: 'SFA 17:0', fdcUnit: 'G', nutriCompound: 'Heptadecanoic Acid', isCanonical: true },
  { fdcId: '1266', fdcNum: '614', fdcName: 'SFA 18:0', fdcUnit: 'G', nutriCompound: 'Stearic Acid', isCanonical: true },
  { fdcId: '1267', fdcNum: '615', fdcName: 'SFA 20:0', fdcUnit: 'G', nutriCompound: 'Arachidic Acid', isCanonical: true },
  { fdcId: '1273', fdcNum: '624', fdcName: 'SFA 22:0', fdcUnit: 'G', nutriCompound: 'Behenic Acid', isCanonical: true },
  { fdcId: '1301', fdcNum: '654', fdcName: 'SFA 24:0', fdcUnit: 'G', nutriCompound: 'Lignoceric Acid', isCanonical: true },

  // Category 8: Monounsaturated Fatty Acids
  { fdcId: '1292', fdcNum: '645', fdcName: 'Fatty acids, total monounsaturated', fdcUnit: 'G', nutriCompound: 'Monounsaturated Fat', isCanonical: true },
  { fdcId: '2008', fdcNum: '635', fdcName: 'MUFA 12:1', fdcUnit: 'G', nutriCompound: 'Dodecenoic Acid', isCanonical: true },
  { fdcId: '1274', fdcNum: '625', fdcName: 'MUFA 14:1', fdcUnit: 'G', nutriCompound: 'Myristoleic Acid', isCanonical: true },
  { fdcId: '2009', fdcNum: '822', fdcName: 'MUFA 14:1 c', fdcUnit: 'G', nutriCompound: 'Myristoleic Acid', isCanonical: false },
  { fdcId: '1333', fdcNum: '697', fdcName: 'MUFA 15:1', fdcUnit: 'G', nutriCompound: 'Pentadecenoic Acid', isCanonical: true },
  { fdcId: '1275', fdcNum: '626', fdcName: 'MUFA 16:1', fdcUnit: 'G', nutriCompound: 'Palmitoleic Acid', isCanonical: true },
  { fdcId: '1314', fdcNum: '673', fdcName: 'MUFA 16:1 c', fdcUnit: 'G', nutriCompound: 'Palmitoleic Acid (cis)', isCanonical: true },
  { fdcId: '1323', fdcNum: '687', fdcName: 'MUFA 17:1', fdcUnit: 'G', nutriCompound: 'Heptadecenoic Acid', isCanonical: true },
  { fdcId: '2010', fdcNum: '825', fdcName: 'MUFA 17:1 c', fdcUnit: 'G', nutriCompound: 'Heptadecenoic Acid', isCanonical: false },
  { fdcId: '1268', fdcNum: '617', fdcName: 'MUFA 18:1', fdcUnit: 'G', nutriCompound: 'Oleic Acid', isCanonical: true },
  { fdcId: '1315', fdcNum: '674', fdcName: 'MUFA 18:1 c', fdcUnit: 'G', nutriCompound: 'Oleic Acid (cis)', isCanonical: true },
  { fdcId: '1277', fdcNum: '628', fdcName: 'MUFA 20:1', fdcUnit: 'G', nutriCompound: 'Eicosenoic Acid', isCanonical: true },
  { fdcId: '2012', fdcNum: '829', fdcName: 'MUFA 20:1 c', fdcUnit: 'G', nutriCompound: 'Eicosenoic Acid', isCanonical: false },
  { fdcId: '1279', fdcNum: '630', fdcName: 'MUFA 22:1', fdcUnit: 'G', nutriCompound: 'Erucic Acid', isCanonical: true },
  { fdcId: '1317', fdcNum: '676', fdcName: 'MUFA 22:1 c', fdcUnit: 'G', nutriCompound: 'Erucic Acid (cis)', isCanonical: true },
  { fdcId: '2014', fdcNum: '676.1', fdcName: 'MUFA 22:1 n-9', fdcUnit: 'G', nutriCompound: 'Erucic Acid', isCanonical: false },
  { fdcId: '1312', fdcNum: '671', fdcName: 'MUFA 24:1 c', fdcUnit: 'G', nutriCompound: 'Nervonic Acid', isCanonical: true },

  // Category 9: Polyunsaturated Fatty Acids
  { fdcId: '1293', fdcNum: '646', fdcName: 'Fatty acids, total polyunsaturated', fdcUnit: 'G', nutriCompound: 'Polyunsaturated Fat', isCanonical: true },
  { fdcId: '1269', fdcNum: '618', fdcName: 'PUFA 18:2', fdcUnit: 'G', nutriCompound: 'Linoleic Acid', isCanonical: true },
  { fdcId: '2016', fdcNum: '831', fdcName: 'PUFA 18:2 c', fdcUnit: 'G', nutriCompound: 'Linoleic Acid (cis,cis)', isCanonical: true },
  { fdcId: '1316', fdcNum: '675', fdcName: 'PUFA 18:2 n-6 c,c', fdcUnit: 'G', nutriCompound: 'Linoleic Acid', isCanonical: false },
  { fdcId: '1311', fdcNum: '670', fdcName: 'PUFA 18:2 CLAs', fdcUnit: 'G', nutriCompound: 'Conjugated Linoleic Acid', isCanonical: true },
  { fdcId: '1307', fdcNum: '666', fdcName: 'PUFA 18:2 i', fdcUnit: 'G', nutriCompound: 'Linoleic Acid (trans,trans)', isCanonical: true },
  { fdcId: '1270', fdcNum: '619', fdcName: 'PUFA 18:3', fdcUnit: 'G', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: true },
  { fdcId: '2018', fdcNum: '833', fdcName: 'PUFA 18:3 c', fdcUnit: 'G', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { fdcId: '1404', fdcNum: '851', fdcName: 'PUFA 18:3 n-3 c,c,c (ALA)', fdcUnit: 'G', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { fdcId: '1321', fdcNum: '685', fdcName: 'PUFA 18:3 n-6 c,c,c', fdcUnit: 'G', nutriCompound: 'Gamma-Linolenic Acid', isCanonical: true },
  { fdcId: '1276', fdcNum: '627', fdcName: 'PUFA 18:4', fdcUnit: 'G', nutriCompound: 'Stearidonic Acid', isCanonical: true },
  { fdcId: '2026', fdcNum: '840', fdcName: 'PUFA 20:2 c', fdcUnit: 'G', nutriCompound: 'Eicosadienoic Acid', isCanonical: true },
  { fdcId: '1313', fdcNum: '672', fdcName: 'PUFA 20:2 n-6 c,c', fdcUnit: 'G', nutriCompound: 'Eicosadienoic Acid', isCanonical: false },
  { fdcId: '1325', fdcNum: '689', fdcName: 'PUFA 20:3', fdcUnit: 'G', nutriCompound: 'Eicosatrienoic Acid', isCanonical: true },
  { fdcId: '2020', fdcNum: '835', fdcName: 'PUFA 20:3 c', fdcUnit: 'G', nutriCompound: 'Eicosatrienoic Acid', isCanonical: false },
  { fdcId: '1405', fdcNum: '852', fdcName: 'PUFA 20:3 n-3', fdcUnit: 'G', nutriCompound: 'Eicosatrienoic Acid (omega-3)', isCanonical: true },
  { fdcId: '1406', fdcNum: '853', fdcName: 'PUFA 20:4 n-6', fdcUnit: 'G', nutriCompound: 'Arachidonic Acid', isCanonical: true },
  { fdcId: '1414', fdcNum: '861', fdcName: 'PUFA 20:3 n-9', fdcUnit: 'G', nutriCompound: 'Dihomo-gamma-linolenic Acid', isCanonical: true },
  { fdcId: '2021', fdcNum: '683', fdcName: 'PUFA 22:3', fdcUnit: 'G', nutriCompound: 'Docosatrienoic Acid', isCanonical: true },
  { fdcId: '1271', fdcNum: '620', fdcName: 'PUFA 20:4', fdcUnit: 'G', nutriCompound: 'Arachidonic Acid', isCanonical: false },
  { fdcId: '2022', fdcNum: '836', fdcName: 'PUFA 20:4c', fdcUnit: 'G', nutriCompound: 'Arachidonic Acid', isCanonical: false },
  { fdcId: '2023', fdcNum: '837', fdcName: 'PUFA 20:5c', fdcUnit: 'G', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: false },
  { fdcId: '1278', fdcNum: '629', fdcName: 'PUFA 20:5 n-3 (EPA)', fdcUnit: 'G', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: true },
  { fdcId: '1334', fdcNum: '698', fdcName: 'PUFA 22:2', fdcUnit: 'G', nutriCompound: 'Docosadienoic Acid', isCanonical: true },
  { fdcId: '1410', fdcNum: '857', fdcName: 'PUFA 21:5', fdcUnit: 'G', nutriCompound: 'Heneicosapentaenoic Acid', isCanonical: true },
  { fdcId: '2024', fdcNum: '838', fdcName: 'PUFA 22:5 c', fdcUnit: 'G', nutriCompound: 'Docosapentaenoic Acid', isCanonical: false },
  { fdcId: '1411', fdcNum: '858', fdcName: 'PUFA 22:4', fdcUnit: 'G', nutriCompound: 'Docosatetraenoic Acid', isCanonical: true },
  { fdcId: '1280', fdcNum: '631', fdcName: 'PUFA 22:5 n-3 (DPA)', fdcUnit: 'G', nutriCompound: 'Docosapentaenoic Acid', isCanonical: true },
  { fdcId: '2025', fdcNum: '839', fdcName: 'PUFA 22:6 c', fdcUnit: 'G', nutriCompound: 'Docosahexaenoic Acid', isCanonical: false },
  { fdcId: '1272', fdcNum: '621', fdcName: 'PUFA 22:6 n-3 (DHA)', fdcUnit: 'G', nutriCompound: 'Docosahexaenoic Acid', isCanonical: true },

  // Category 10: Trans Fatty Acids
  { fdcId: '1257', fdcNum: '605', fdcName: 'Fatty acids, total trans', fdcUnit: 'G', nutriCompound: 'Trans Fat', isCanonical: true },
  { fdcId: '1329', fdcNum: '693', fdcName: 'Fatty acids, total trans-monoenoic', fdcUnit: 'G', nutriCompound: 'Trans Fat (Monoenoic)', isCanonical: true },
  { fdcId: '1303', fdcNum: '662', fdcName: 'TFA 16:1 t', fdcUnit: 'G', nutriCompound: 'Palmitoleic Acid (trans)', isCanonical: true },
  { fdcId: '1304', fdcNum: '663', fdcName: 'TFA 18:1 t', fdcUnit: 'G', nutriCompound: 'Elaidic Acid', isCanonical: true },
  { fdcId: '1305', fdcNum: '664', fdcName: 'TFA 22:1 t', fdcUnit: 'G', nutriCompound: 'Erucic Acid (trans)', isCanonical: true },
  { fdcId: '1306', fdcNum: '665', fdcName: 'TFA 18:2 t not further defined', fdcUnit: 'G', nutriCompound: 'Linoleic Acid (trans,trans)', isCanonical: true },
  { fdcId: '2017', fdcNum: '832', fdcName: 'TFA 18:2 t', fdcUnit: 'G', nutriCompound: 'Linoleic Acid (trans,trans)', isCanonical: false },
  { fdcId: '1310', fdcNum: '669', fdcName: 'TFA 18:2 t,t', fdcUnit: 'G', nutriCompound: 'Linoleic Acid (trans,trans)', isCanonical: false },
  { fdcId: '1331', fdcNum: '695', fdcName: 'Fatty acids, total trans-polyenoic', fdcUnit: 'G', nutriCompound: 'Trans Fat (Polyenoic)', isCanonical: true },

  // Category 11: Sterols & Phytosterols
  { fdcId: '1253', fdcNum: '601', fdcName: 'Cholesterol', fdcUnit: 'MG', nutriCompound: 'Cholesterol', isCanonical: true },
  { fdcId: '1283', fdcNum: '636', fdcName: 'Phytosterols', fdcUnit: 'MG', nutriCompound: 'Total Plant Sterols', isCanonical: true },
  { fdcId: '1285', fdcNum: '638', fdcName: 'Stigmasterol', fdcUnit: 'MG', nutriCompound: 'Stigmasterol', isCanonical: true },
  { fdcId: '1286', fdcNum: '639', fdcName: 'Campesterol', fdcUnit: 'MG', nutriCompound: 'Campesterol', isCanonical: true },
  { fdcId: '1288', fdcNum: '641', fdcName: 'Beta-sitosterol', fdcUnit: 'MG', nutriCompound: 'Beta-Sitosterol', isCanonical: true },

  // Category 12: Amino Acids
  { fdcId: '2057', fdcNum: '', fdcName: 'Ergothioneine', fdcUnit: 'MG', nutriCompound: 'Ergothioneine', isCanonical: true },
  { fdcId: '1210', fdcNum: '501', fdcName: 'Tryptophan', fdcUnit: 'G', nutriCompound: 'Tryptophan', isCanonical: true },
  { fdcId: '1211', fdcNum: '502', fdcName: 'Threonine', fdcUnit: 'G', nutriCompound: 'Threonine', isCanonical: true },
  { fdcId: '1212', fdcNum: '503', fdcName: 'Isoleucine', fdcUnit: 'G', nutriCompound: 'Isoleucine', isCanonical: true },
  { fdcId: '1213', fdcNum: '504', fdcName: 'Leucine', fdcUnit: 'G', nutriCompound: 'Leucine', isCanonical: true },
  { fdcId: '1214', fdcNum: '505', fdcName: 'Lysine', fdcUnit: 'G', nutriCompound: 'Lysine', isCanonical: true },
  { fdcId: '1215', fdcNum: '506', fdcName: 'Methionine', fdcUnit: 'G', nutriCompound: 'Methionine', isCanonical: true },
  { fdcId: '1217', fdcNum: '508', fdcName: 'Phenylalanine', fdcUnit: 'G', nutriCompound: 'Phenylalanine', isCanonical: true },
  { fdcId: '1218', fdcNum: '509', fdcName: 'Tyrosine', fdcUnit: 'G', nutriCompound: 'Tyrosine', isCanonical: true },
  { fdcId: '1219', fdcNum: '510', fdcName: 'Valine', fdcUnit: 'G', nutriCompound: 'Valine', isCanonical: true },
  { fdcId: '1220', fdcNum: '511', fdcName: 'Arginine', fdcUnit: 'G', nutriCompound: 'Arginine', isCanonical: true },
  { fdcId: '1221', fdcNum: '512', fdcName: 'Histidine', fdcUnit: 'G', nutriCompound: 'Histidine', isCanonical: true },
  { fdcId: '1222', fdcNum: '513', fdcName: 'Alanine', fdcUnit: 'G', nutriCompound: 'Alanine', isCanonical: true },
  { fdcId: '1223', fdcNum: '514', fdcName: 'Aspartic acid', fdcUnit: 'G', nutriCompound: 'Aspartic Acid', isCanonical: true },
  { fdcId: '1224', fdcNum: '515', fdcName: 'Glutamic acid', fdcUnit: 'G', nutriCompound: 'Glutamic Acid', isCanonical: true },
  { fdcId: '1225', fdcNum: '516', fdcName: 'Glycine', fdcUnit: 'G', nutriCompound: 'Glycine', isCanonical: true },
  { fdcId: '1226', fdcNum: '517', fdcName: 'Proline', fdcUnit: 'G', nutriCompound: 'Proline', isCanonical: true },
  { fdcId: '1227', fdcNum: '518', fdcName: 'Serine', fdcUnit: 'G', nutriCompound: 'Serine', isCanonical: true },
  { fdcId: '1228', fdcNum: '521', fdcName: 'Hydroxyproline', fdcUnit: 'G', nutriCompound: 'Hydroxyproline', isCanonical: true },
  { fdcId: '1232', fdcNum: '526', fdcName: 'Cysteine', fdcUnit: 'G', nutriCompound: 'Cysteine', isCanonical: true },
  { fdcId: '1018', fdcNum: '221', fdcName: 'Alcohol, ethyl', fdcUnit: 'G', nutriCompound: 'Alcohol', isCanonical: true },
  { fdcId: '1057', fdcNum: '262', fdcName: 'Caffeine', fdcUnit: 'MG', nutriCompound: 'Caffeine', isCanonical: true },
  { fdcId: '1058', fdcNum: '263', fdcName: 'Theobromine', fdcUnit: 'MG', nutriCompound: 'Theobromine', isCanonical: true },

  // Category 13: Other Compounds (Flavonoids, Polyphenols)
  { fdcId: '1340', fdcNum: '710', fdcName: 'Daidzein', fdcUnit: 'MG', nutriCompound: 'Daidzein', isCanonical: true },
  { fdcId: '1341', fdcNum: '711', fdcName: 'Genistein', fdcUnit: 'MG', nutriCompound: 'Genistein', isCanonical: true },
  { fdcId: '1349', fdcNum: '731', fdcName: 'Cyanidin', fdcUnit: 'MG', nutriCompound: 'Cyanidin', isCanonical: true },
  { fdcId: '1357', fdcNum: '741', fdcName: 'Delphinidin', fdcUnit: 'MG', nutriCompound: 'Delphinidin', isCanonical: true },
  { fdcId: '1359', fdcNum: '743', fdcName: 'Pelargonidin', fdcUnit: 'MG', nutriCompound: 'Pelargonidin', isCanonical: true },
  { fdcId: '1364', fdcNum: '749', fdcName: 'Catechin', fdcUnit: 'MG', nutriCompound: 'Catechin', isCanonical: true },
  { fdcId: '1366', fdcNum: '751', fdcName: 'Epicatechin', fdcUnit: 'MG', nutriCompound: 'Epicatechin', isCanonical: true },
  { fdcId: '1368', fdcNum: '753', fdcName: 'Epigallocatechin-3-gallate', fdcUnit: 'MG', nutriCompound: 'Epigallocatechin Gallate', isCanonical: true },
  { fdcId: '1377', fdcNum: '762', fdcName: 'Naringenin', fdcUnit: 'MG', nutriCompound: 'Naringenin', isCanonical: true },
  { fdcId: '1379', fdcNum: '770', fdcName: 'Apigenin', fdcUnit: 'MG', nutriCompound: 'Apigenin', isCanonical: true },
  { fdcId: '1382', fdcNum: '773', fdcName: 'Luteolin', fdcUnit: 'MG', nutriCompound: 'Luteolin', isCanonical: true },
  { fdcId: '1388', fdcNum: '786', fdcName: 'Kaempferol', fdcUnit: 'MG', nutriCompound: 'Kaempferol', isCanonical: true },
  { fdcId: '1390', fdcNum: '788', fdcName: 'Myricetin', fdcUnit: 'MG', nutriCompound: 'Myricetin', isCanonical: true },
  { fdcId: '1391', fdcNum: '789', fdcName: 'Quercetin', fdcUnit: 'MG', nutriCompound: 'Quercetin', isCanonical: true },
];

async function main() {
  console.log(`Inserting ${fdcMappings.length} FDC mappings into compound_sources...\n`);

  // First, get all compounds to build a name->id map
  const { data: compounds, error: fetchError } = await supabase
    .from('compounds')
    .select('id, name');

  if (fetchError || !compounds) {
    console.error('Failed to fetch compounds:', fetchError);
    return;
  }

  const compoundMap = new Map<string, string>();
  for (const c of compounds) {
    compoundMap.set(c.name.toLowerCase(), c.id);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  const notFound: string[] = [];

  for (const mapping of fdcMappings) {
    const compoundId = compoundMap.get(mapping.nutriCompound.toLowerCase());

    if (!compoundId) {
      console.log(`❌ ${mapping.fdcName} -> "${mapping.nutriCompound}" NOT FOUND`);
      notFound.push(mapping.nutriCompound);
      errorCount++;
      continue;
    }

    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'FDC',
        external_id: mapping.fdcId,
        source_name: mapping.fdcName,
        source_unit: mapping.fdcUnit,
        conversion_factor: mapping.conversionFactor || '1.0',
        is_canonical: mapping.isCanonical,
      });

    if (error) {
      if (error.code === '23505') {
        // Duplicate - already exists
        console.log(`⏭️  ${mapping.fdcId} ${mapping.fdcName} (already exists)`);
        skipCount++;
      } else {
        console.log(`❌ ${mapping.fdcName}: ${error.message}`);
        errors.push(`${mapping.fdcName}: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`✅ ${mapping.fdcId} ${mapping.fdcName} -> ${mapping.nutriCompound}`);
      successCount++;
    }
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Skipped (exists): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);

  if (notFound.length > 0) {
    console.log('\nCompounds not found:');
    [...new Set(notFound)].forEach(n => console.log(`  - ${n}`));
  }

  if (errors.length > 0) {
    console.log('\nOther errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  // Verify count
  const { count } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true })
    .eq('external_source', 'FDC');

  console.log(`\nTotal FDC mappings in database: ${count}`);
}

main().catch(console.error);
