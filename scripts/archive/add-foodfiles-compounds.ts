import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds that don't exist in our database
const newCompounds = [
  // Fiber variants
  { name: 'Fiber, High Molecular Weight', type: 'CARBOHYDRATE', unit: 'g', description: 'High molecular weight fiber measured by LC method' },
  { name: 'Fiber, Low Molecular Weight', type: 'CARBOHYDRATE', unit: 'g', description: 'Low molecular weight fiber measured by LC method' },
  // Odd-chain saturated fatty acids
  { name: 'Undecanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C11:0 saturated fatty acid (undecylic acid)' },
  { name: 'Tridecanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C13:0 saturated fatty acid' },
  { name: 'Nonadecanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C19:0 saturated fatty acid' },
  { name: 'Heneicosanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C21:0 saturated fatty acid' },
  // Short-chain monounsaturated fatty acids
  { name: 'Decenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C10:1 monounsaturated fatty acid' },
  { name: 'Dodecenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C12:1 monounsaturated fatty acid (lauroleic acid)' },
  { name: 'Pentadecenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C15:1 monounsaturated fatty acid' },
  // Vitamin D metabolites
  { name: '25-Hydroxyvitamin D2', type: 'VITAMIN', unit: 'µg', description: 'Calcidiol from ergocalciferol (25-OH-D2)' },
  { name: '25-Hydroxyvitamin D3', type: 'VITAMIN', unit: 'µg', description: 'Calcidiol from cholecalciferol (25-OH-D3)' },
  // Additional sugars
  { name: 'Added Sugars', type: 'CARBOHYDRATE', unit: 'g', description: 'Sugars added during food processing' },
  { name: 'Free Sugars', type: 'CARBOHYDRATE', unit: 'g', description: 'Free sugars including added sugars and sugars naturally present in honey, syrups, fruit juices' },
  // Nitrogen
  { name: 'Nitrogen', type: 'MACRONUTRIENT', unit: 'g', description: 'Total nitrogen content' },
  // Omega-3 totals
  { name: 'Long Chain Omega-3', type: 'FATTY_ACID', unit: 'g', description: 'Sum of long chain omega-3 polyunsaturated fatty acids (EPA, DPA, DHA)' },
  // Omega-6 specific fatty acids
  { name: 'Docosapentaenoic Acid (n-6)', type: 'FATTY_ACID', unit: 'g', description: 'C22:5 omega-6 fatty acid (Osbond acid)' },
  // Compounds not yet in DB that FOODfiles tracks
  { name: 'Ash', type: 'MACRONUTRIENT', unit: 'g', description: 'Total ash (mineral residue)' },
  { name: 'Glycogen', type: 'CARBOHYDRATE', unit: 'g', description: 'Storage polysaccharide' },
  { name: 'Maltodextrin', type: 'CARBOHYDRATE', unit: 'g', description: 'Polysaccharide from starch hydrolysis' },
  { name: 'Pentadecanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C15:0 saturated fatty acid' },
  { name: 'Margaric Acid', type: 'FATTY_ACID', unit: 'g', description: 'C17:0 saturated fatty acid (heptadecanoic acid)' },
  { name: 'Tricosanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C23:0 saturated fatty acid' },
  { name: 'Myristoleic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C14:1 monounsaturated fatty acid' },
  { name: 'Heptadecenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C17:1 monounsaturated fatty acid' },
  { name: 'Gondoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C20:1 monounsaturated fatty acid' },
  { name: 'Nervonic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C24:1 monounsaturated fatty acid' },
  { name: 'Trans Monoenoic Fat', type: 'FATTY_ACID', unit: 'g', description: 'Trans monoenoic fatty acids (single trans double bond)' },
  { name: 'Trans Polyenoic Fat', type: 'FATTY_ACID', unit: 'g', description: 'Trans polyenoic fatty acids (multiple trans double bonds)' },
  { name: 'Palmitelaidic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C16:1 trans fatty acid' },
  { name: 'Elaidic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C18:1 trans fatty acid (trans-oleic acid)' },
  { name: 'Linolelaidic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C18:2 trans,trans fatty acid (trans-linoleic acid)' },
  { name: 'Trans Alpha-Linolenic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C18:3 trans omega-3 fatty acid' },
  { name: 'Polyunsaturated Fat', type: 'FATTY_ACID', unit: 'g', description: 'Total polyunsaturated fatty acids' },
  { name: 'Eicosadienoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C20:2 n-6 polyunsaturated fatty acid' },
  { name: 'Docosadienoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C22:2 n-6 polyunsaturated fatty acid' },
  { name: 'Adrenic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C22:4 n-6 polyunsaturated fatty acid' },
  { name: 'Eicosatrienoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C20:3 n-3 polyunsaturated fatty acid' },
  { name: 'Eicosatetraenoic Acid (n-3)', type: 'FATTY_ACID', unit: 'g', description: 'C20:4 n-3 polyunsaturated fatty acid' },
  { name: 'Heneicosapentaenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C21:5 n-3 polyunsaturated fatty acid (HPA)' },
  { name: 'Total Plant Sterols', type: 'STEROL', unit: 'mg', description: 'Total phytosterols' },
  { name: 'Lithium', type: 'MINERAL', unit: 'µg', description: 'Lithium trace mineral' },
  { name: 'Vanadium', type: 'MINERAL', unit: 'µg', description: 'Vanadium trace mineral' },
  { name: 'Lycopene', type: 'CAROTENOID', unit: 'µg', description: 'Red carotenoid pigment' },
  { name: 'Lutein', type: 'CAROTENOID', unit: 'µg', description: 'Yellow carotenoid pigment (xanthophyll)' },
  { name: 'Zeaxanthin', type: 'CAROTENOID', unit: 'µg', description: 'Yellow carotenoid pigment' },
  { name: 'Cystine', type: 'AMINO_ACID', unit: 'mg', description: 'Oxidized dimer of cysteine' },
  { name: 'Hydroxyproline', type: 'AMINO_ACID', unit: 'mg', description: 'Post-translationally modified amino acid in collagen' },
  { name: 'Taurine', type: 'AMINO_ACID', unit: 'mg', description: 'Sulfonic acid amino acid' },
  { name: 'Acetic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Short-chain fatty acid / organic acid' },
  { name: 'Citric Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Tricarboxylic acid (Krebs cycle)' },
  { name: 'Lactic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Alpha-hydroxy acid' },
  { name: 'Malic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Dicarboxylic acid found in fruits' },
  { name: 'Oxalic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Dicarboxylic acid (antinutrient)' },
  { name: 'Quinic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Cyclohexanecarboxylic acid found in coffee' },
  { name: 'Succinic Acid', type: 'ORGANIC_ACID', unit: 'g', description: 'Dicarboxylic acid (Krebs cycle)' },
];

// Complete mapping of FOODfiles codes to Nutri compound names
const foodfilesMappings: { code: string; compoundName: string; isCanonical: boolean }[] = [
  // Energy
  { code: 'ENERC', compoundName: 'Energy', isCanonical: false }, // kJ
  { code: 'ENERC_KCAL', compoundName: 'Energy', isCanonical: true }, // kcal

  // Proximates
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'NT', compoundName: 'Nitrogen', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'ALC', compoundName: 'Ethanol', isCanonical: true },
  { code: 'CHOAVL', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'CHOAVLDF', compoundName: 'Carbohydrates', isCanonical: false },
  { code: 'CHOCDF', compoundName: 'Carbohydrates', isCanonical: false },

  // Fiber
  { code: 'FIBTG', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'FIBTLC', compoundName: 'Dietary Fiber', isCanonical: false },
  { code: 'FIBSOL', compoundName: 'Soluble Fiber', isCanonical: true },
  { code: 'FIBINS', compoundName: 'Insoluble Fiber', isCanonical: true },
  { code: 'FIBHMW', compoundName: 'Fiber, High Molecular Weight', isCanonical: true },
  { code: 'FIBLMW', compoundName: 'Fiber, Low Molecular Weight', isCanonical: true },

  // Carbohydrates
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'SUGAD', compoundName: 'Added Sugars', isCanonical: true },
  { code: 'SUGFR', compoundName: 'Free Sugars', isCanonical: true },
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: 'STARES', compoundName: 'Resistant Starch', isCanonical: true },
  { code: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: 'GLYC', compoundName: 'Glycogen', isCanonical: true },
  { code: 'MALTDEX', compoundName: 'Maltodextrin', isCanonical: true },

  // Saturated Fatty Acids
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'F4D0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6D0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F8D0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10D0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F11D0', compoundName: 'Undecanoic Acid', isCanonical: true },
  { code: 'F12D0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F13D0', compoundName: 'Tridecanoic Acid', isCanonical: true },
  { code: 'F14D0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F15D0', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'F16D0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F17D0', compoundName: 'Margaric Acid', isCanonical: true },
  { code: 'F18D0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F19D0', compoundName: 'Nonadecanoic Acid', isCanonical: true },
  { code: 'F20D0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F21D0', compoundName: 'Heneicosanoic Acid', isCanonical: true },
  { code: 'F22D0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F23D0', compoundName: 'Tricosanoic Acid', isCanonical: true },
  { code: 'F24D0', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Monounsaturated Fatty Acids
  { code: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'F10D1', compoundName: 'Decenoic Acid', isCanonical: true },
  { code: 'F12D1', compoundName: 'Dodecenoic Acid', isCanonical: true },
  { code: 'F14D1', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'F15D1', compoundName: 'Pentadecenoic Acid', isCanonical: true },
  { code: 'F16D1', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F17D1', compoundName: 'Heptadecenoic Acid', isCanonical: true },
  { code: 'F18D1', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F18D1CN9', compoundName: 'Oleic Acid', isCanonical: false },
  { code: 'F18D1CN7', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'F20D1', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'F22D1', compoundName: 'Erucic Acid', isCanonical: true },
  { code: 'F24D1', compoundName: 'Nervonic Acid', isCanonical: true },

  // Trans Fatty Acids
  { code: 'FATRN', compoundName: 'Trans Fat', isCanonical: true },
  { code: 'FAMST', compoundName: 'Trans Monoenoic Fat', isCanonical: true },
  { code: 'FAPUT', compoundName: 'Trans Polyenoic Fat', isCanonical: true },
  { code: 'F16D1T', compoundName: 'Palmitelaidic Acid', isCanonical: true },
  { code: 'F18D1T', compoundName: 'Elaidic Acid', isCanonical: true },
  { code: 'F18D2T', compoundName: 'Linolelaidic Acid', isCanonical: true },
  { code: 'F18D3TN3', compoundName: 'Trans Alpha-Linolenic Acid', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-6
  { code: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6', isCanonical: true },
  { code: 'F18D2', compoundName: 'LA', isCanonical: true },
  { code: 'F18D2CN6', compoundName: 'LA', isCanonical: false },
  { code: 'F18D3N6', compoundName: 'GLA', isCanonical: true },
  { code: 'F20D2N6', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'F20D3N6', compoundName: 'DGLA', isCanonical: true },
  { code: 'F20D4N6', compoundName: 'AA', isCanonical: true },
  { code: 'F22D2N6', compoundName: 'Docosadienoic Acid', isCanonical: true },
  { code: 'F22D4N6', compoundName: 'Adrenic Acid', isCanonical: true },
  { code: 'F22D5N6', compoundName: 'Docosapentaenoic Acid (n-6)', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-3
  { code: 'FAPUN3', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FALCPUN3', compoundName: 'Long Chain Omega-3', isCanonical: true },
  { code: 'F18D3N3', compoundName: 'ALA', isCanonical: true },
  { code: 'F18D4N3', compoundName: 'SDA', isCanonical: true },
  { code: 'F20D3N3', compoundName: 'Eicosatrienoic Acid', isCanonical: true },
  { code: 'F20D4N3', compoundName: 'Eicosatetraenoic Acid (n-3)', isCanonical: true },
  { code: 'F20D5N3', compoundName: 'EPA', isCanonical: true },
  { code: 'F21D5N3', compoundName: 'Heneicosapentaenoic Acid', isCanonical: true },
  { code: 'F22D5N3', compoundName: 'DPA', isCanonical: true },
  { code: 'F22D6N3', compoundName: 'DHA', isCanonical: true },

  // Sterols
  { code: 'CHOLE', compoundName: 'Cholesterol', isCanonical: true },
  { code: 'PHYSTR', compoundName: 'Total Plant Sterols', isCanonical: true },

  // Minerals
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'CLD', compoundName: 'Chloride', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium (Total)', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },
  { code: 'FD', compoundName: 'Fluoride', isCanonical: true },
  { code: 'AL', compoundName: 'Aluminum (Al)', isCanonical: true },
  { code: 'B', compoundName: 'Boron', isCanonical: true },
  { code: 'NI', compoundName: 'Nickel (Ni)', isCanonical: true },
  { code: 'CO', compoundName: 'Cobalt (Co)', isCanonical: true },
  { code: 'LI', compoundName: 'Lithium', isCanonical: true },
  { code: 'V', compoundName: 'Vanadium', isCanonical: true },
  { code: 'S', compoundName: 'Sulfur', isCanonical: true },
  { code: 'SISOL', compoundName: 'Silicon', isCanonical: true },

  // Trace Elements (Toxic)
  { code: 'AS', compoundName: 'Arsenic (As) - Total', isCanonical: true },
  { code: 'CD', compoundName: 'Cadmium (Cd)', isCanonical: true },
  { code: 'HG', compoundName: 'Mercury (Hg) - Total', isCanonical: true },
  { code: 'PB', compoundName: 'Lead (Pb)', isCanonical: true },
  { code: 'SN', compoundName: 'Tin (Sn)', isCanonical: true },

  // Fat-Soluble Vitamins
  { code: 'VITA_RAE', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'VITA', compoundName: 'Vitamin A (RAE)', isCanonical: false },
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CARTA', compoundName: 'Alpha-Carotene', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'ERGCAL', compoundName: 'Vitamin D2 (Ergocalciferol)', isCanonical: true },
  { code: 'CHOCAL', compoundName: 'Vitamin D3 (Cholecalciferol)', isCanonical: true },
  { code: 'ERGCALOH', compoundName: '25-Hydroxyvitamin D2', isCanonical: true },
  { code: 'CHOCALOH', compoundName: '25-Hydroxyvitamin D3', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'VITK', compoundName: 'Vitamin K (Total)', isCanonical: true },

  // Tocopherols
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },

  // Water-Soluble Vitamins
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'PANTAC', compoundName: 'Pantothenic Acid (B5)', isCanonical: true },
  { code: 'VITB6A', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'FOLDFE', compoundName: 'Folate (DFE)', isCanonical: true },
  { code: 'FOLFD', compoundName: 'Intrinsic Folate', isCanonical: true },
  { code: 'FOLAC', compoundName: 'Folic Acid (Synthetic)', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin (B7)', isCanonical: true },
  { code: 'CHOLN', compoundName: 'Choline (Total)', isCanonical: true },

  // Carotenoids
  { code: 'LYCPN', compoundName: 'Lycopene', isCanonical: true },
  { code: 'LUTN', compoundName: 'Lutein', isCanonical: true },
  { code: 'ZEAX', compoundName: 'Zeaxanthin', isCanonical: true },

  // Amino Acids
  { code: 'ALA', compoundName: 'Alanine', isCanonical: true },
  { code: 'ARG', compoundName: 'Arginine', isCanonical: true },
  { code: 'ASP', compoundName: 'Aspartic Acid', isCanonical: true },
  { code: 'ASN', compoundName: 'Asparagine', isCanonical: true },
  { code: 'CYS', compoundName: 'Cystine', isCanonical: true },
  { code: 'GLU', compoundName: 'Glutamic Acid', isCanonical: true },
  { code: 'GLY', compoundName: 'Glycine', isCanonical: true },
  { code: 'HIS', compoundName: 'Histidine', isCanonical: true },
  { code: 'ILE', compoundName: 'Isoleucine', isCanonical: true },
  { code: 'LEU', compoundName: 'Leucine', isCanonical: true },
  { code: 'LYS', compoundName: 'Lysine', isCanonical: true },
  { code: 'MET', compoundName: 'Methionine', isCanonical: true },
  { code: 'PHE', compoundName: 'Phenylalanine', isCanonical: true },
  { code: 'PRO', compoundName: 'Proline', isCanonical: true },
  { code: 'SER', compoundName: 'Serine', isCanonical: true },
  { code: 'THR', compoundName: 'Threonine', isCanonical: true },
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },
  { code: 'TYR', compoundName: 'Tyrosine', isCanonical: true },
  { code: 'VAL', compoundName: 'Valine', isCanonical: true },
  { code: 'HYP', compoundName: 'Hydroxyproline', isCanonical: true },
  { code: 'TAU', compoundName: 'Taurine', isCanonical: true },

  // Organic Acids
  { code: 'OA_G', compoundName: 'Total Organic Acids', isCanonical: true },
  { code: 'ACEAC_G', compoundName: 'Acetic Acid', isCanonical: true },
  { code: 'CITAC_G', compoundName: 'Citric Acid', isCanonical: true },
  { code: 'LACAC_G', compoundName: 'Lactic Acid', isCanonical: true },
  { code: 'MALAC_G', compoundName: 'Malic Acid', isCanonical: true },
  { code: 'OXALAC_G', compoundName: 'Oxalic Acid', isCanonical: true },
  { code: 'QUINAC_G', compoundName: 'Quinic Acid', isCanonical: true },
  { code: 'SUCAC_G', compoundName: 'Succinic Acid', isCanonical: true },

  // Other
  { code: 'CAFFN', compoundName: 'Caffeine', isCanonical: true },
  { code: 'SORTL_G', compoundName: 'Sorbitol', isCanonical: true },
];

async function main() {
  console.log('=== FOODfiles 2024 Compound Integration ===\n');

  // Step 1: Add new compounds
  console.log('Step 1: Adding new compounds...');
  let newAdded = 0;

  for (const compound of newCompounds) {
    // Check if exists
    const existing = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${compound.name})
    `);

    if ((existing.rows || existing).length > 0) {
      console.log(`  ⏭️  ${compound.name} (already exists)`);
      continue;
    }

    try {
      await db.execute(sql`
        INSERT INTO compounds (name, compound_type, unit, description)
        VALUES (${compound.name}, ${compound.type}, ${compound.unit}, ${compound.description})
      `);
      console.log(`  ✅ Added: ${compound.name}`);
      newAdded++;
    } catch (err: any) {
      console.log(`  ❌ Failed: ${compound.name} - ${err.message}`);
    }
  }

  console.log(`\nNew compounds added: ${newAdded}\n`);

  // Step 2: Create mappings
  console.log('Step 2: Creating FOODFILES mappings...');
  let mapped = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of foodfilesMappings) {
    // Find the compound
    const compound = await db.execute(sql`
      SELECT id, name FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    const rows = compound.rows || compound;
    if (rows.length === 0) {
      console.log(`  ❌ Compound not found: ${mapping.compoundName} (for ${mapping.code})`);
      failed++;
      continue;
    }

    const compoundId = rows[0].id;

    // Check if mapping already exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'FOODFILES' AND external_id = ${mapping.code}
    `);

    if ((existingMapping.rows || existingMapping).length > 0) {
      skipped++;
      continue;
    }

    // Insert mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${compoundId}, 'FOODFILES', ${mapping.code}, ${mapping.compoundName}, ${mapping.isCanonical})
      `);
      mapped++;
    } catch (err: any) {
      console.log(`  ❌ Mapping failed: ${mapping.code} → ${mapping.compoundName} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMappings created: ${mapped}`);
  console.log(`Already existed: ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Step 3: Summary
  console.log('\n=== Final Summary ===');

  const totalCompounds = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);
  const totalMappings = await db.execute(sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);

  console.log(`\nTotal compounds: ${(totalCompounds.rows || totalCompounds)[0].count}`);
  console.log('\nMappings by source:');
  for (const row of (totalMappings.rows || totalMappings)) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }
}

main().catch(console.error).finally(() => process.exit());
