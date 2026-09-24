import 'dotenv/config';
import { db } from '../db';
import { compounds, compoundSources } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

// 10 new compounds to add
const newCompounds = [
  // Carbohydrates (4)
  { name: 'Free Sugars', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'WHO metric: total sugars minus naturally occurring lactose in dairy products' },
  { name: 'Maltotriose', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Trisaccharide consisting of three glucose units' },
  { name: 'Dextrin', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Polysaccharide produced by partial hydrolysis of starch' },
  { name: 'Maltitol', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Sugar alcohol used as a sugar substitute' },

  // Organic Acids (2)
  { name: 'Propionic Acid', type: 'ORGANIC_ACID' as const, unit: 'g', description: 'Short-chain fatty acid with antimicrobial properties' },
  { name: 'Shikimic Acid', type: 'ORGANIC_ACID' as const, unit: 'g', description: 'Plant metabolite, precursor for aromatic amino acids' },

  // Minerals (1)
  { name: 'Tin', type: 'MINERAL' as const, unit: 'ug', description: 'Trace element, monitored for food safety (from canned foods)' },

  // Fatty Acids (3)
  { name: 'Pentadecenoic Acid', type: 'FATTY_ACID' as const, unit: 'g', description: 'C15:1 - Rare monounsaturated fatty acid' },
  { name: 'Heptadecenoic Acid', type: 'FATTY_ACID' as const, unit: 'g', description: 'C17:1 - Rare monounsaturated fatty acid' },
  { name: 'Eicosatrienoic Acid (n-3)', type: 'FATTY_ACID' as const, unit: 'mg', description: 'C20:3w3 - Omega-3 polyunsaturated fatty acid' },
];

// AFCD mappings - AFCD doesn't use numeric IDs, uses INFOODS tagnames
// We'll use the component name as the external_id since AFCD identifies by name
const afcdMappings: { afcdName: string; nutriCompound: string; isCanonical: boolean }[] = [
  // Core - Macros
  { afcdName: 'Energy, with dietary fibre', nutriCompound: 'Energy', isCanonical: false },
  { afcdName: 'Moisture', nutriCompound: 'Water', isCanonical: true },
  { afcdName: 'Protein', nutriCompound: 'Protein', isCanonical: true },
  { afcdName: 'Fat', nutriCompound: 'Total Fat', isCanonical: true },
  { afcdName: 'Ash', nutriCompound: 'Ash', isCanonical: true },
  { afcdName: 'Dietary fibre', nutriCompound: 'Total Fiber', isCanonical: true },
  { afcdName: 'Ethanol', nutriCompound: 'Alcohol', isCanonical: true },
  { afcdName: 'Total sugars', nutriCompound: 'Total Sugars', isCanonical: true },
  { afcdName: 'Added sugars', nutriCompound: 'Added Sugars', isCanonical: true },
  { afcdName: 'Free sugars', nutriCompound: 'Free Sugars', isCanonical: true },
  { afcdName: 'Starch', nutriCompound: 'Starch', isCanonical: true },
  { afcdName: 'Available carbohydrate, without sugar alcohols', nutriCompound: 'Total Carbohydrate', isCanonical: false },
  { afcdName: 'Available carbohydrate, with sugar alcohols', nutriCompound: 'Total Carbohydrate', isCanonical: true },

  // Core - Vitamins
  { afcdName: 'Retinol (preformed vitamin A)', nutriCompound: 'Retinol', isCanonical: true },
  { afcdName: 'Beta-carotene', nutriCompound: 'Beta-Carotene', isCanonical: true },
  { afcdName: 'Beta-carotene equivalents (provitamin A)', nutriCompound: 'Beta-Carotene', isCanonical: false },
  { afcdName: 'Vitamin A retinol equivalents', nutriCompound: 'Vitamin A', isCanonical: true },
  { afcdName: 'Thiamin (B1)', nutriCompound: 'Thiamin', isCanonical: true },
  { afcdName: 'Riboflavin (B2)', nutriCompound: 'Riboflavin', isCanonical: true },
  { afcdName: 'Niacin (B3)', nutriCompound: 'Niacin', isCanonical: true },
  { afcdName: 'Pyridoxine (B6)', nutriCompound: 'Vitamin B6', isCanonical: true },
  { afcdName: 'Cobalamin (B12)', nutriCompound: 'Vitamin B12', isCanonical: true },
  { afcdName: 'Niacin derived equivalents', nutriCompound: 'Niacin', isCanonical: false },
  { afcdName: 'Folate, natural', nutriCompound: 'Folate', isCanonical: false },
  { afcdName: 'Folic acid', nutriCompound: 'Folic Acid', isCanonical: true },
  { afcdName: 'Total folates', nutriCompound: 'Folate', isCanonical: true },
  { afcdName: 'Dietary folate equivalents', nutriCompound: 'Folate', isCanonical: false },
  { afcdName: 'Vitamin C', nutriCompound: 'Vitamin C', isCanonical: true },
  { afcdName: 'Cholecalciferol (D3)', nutriCompound: 'Vitamin D3', isCanonical: true },
  { afcdName: 'Ergocalciferol (D2)', nutriCompound: 'Vitamin D2', isCanonical: true },
  { afcdName: '25-hydroxy cholecalciferol (25-OH D3)', nutriCompound: '25-Hydroxycholecalciferol', isCanonical: true },
  { afcdName: '25-hydroxy ergocalciferol (25-OH D2)', nutriCompound: '25-Hydroxyergocalciferol', isCanonical: true },
  { afcdName: 'Vitamin D3 equivalents', nutriCompound: 'Vitamin D', isCanonical: true },
  { afcdName: 'Alpha tocopherol', nutriCompound: 'Alpha-Tocopherol', isCanonical: true },
  { afcdName: 'Vitamin E', nutriCompound: 'Vitamin E', isCanonical: true },

  // Core - Minerals
  { afcdName: 'Calcium (Ca)', nutriCompound: 'Calcium', isCanonical: true },
  { afcdName: 'Iodine (I)', nutriCompound: 'Iodine', isCanonical: true },
  { afcdName: 'Iron (Fe)', nutriCompound: 'Iron', isCanonical: true },
  { afcdName: 'Magnesium (Mg)', nutriCompound: 'Magnesium', isCanonical: true },
  { afcdName: 'Phosphorus (P)', nutriCompound: 'Phosphorus', isCanonical: true },
  { afcdName: 'Potassium (K)', nutriCompound: 'Potassium', isCanonical: true },
  { afcdName: 'Selenium (Se)', nutriCompound: 'Selenium', isCanonical: true },
  { afcdName: 'Sodium (Na)', nutriCompound: 'Sodium', isCanonical: true },
  { afcdName: 'Zinc (Zn)', nutriCompound: 'Zinc', isCanonical: true },

  // Core - Fatty Acids Summary
  { afcdName: 'Total saturated fatty acids', nutriCompound: 'Saturated Fat', isCanonical: true },
  { afcdName: 'Total monounsaturated fatty acids', nutriCompound: 'Monounsaturated Fat', isCanonical: true },
  { afcdName: 'Total polyunsaturated fatty acids', nutriCompound: 'Polyunsaturated Fat', isCanonical: true },
  { afcdName: 'Total long chain omega 3 fatty acids', nutriCompound: 'Omega-3 Fatty Acids', isCanonical: true },
  { afcdName: 'Linoleic acid', nutriCompound: 'Linoleic Acid', isCanonical: true },
  { afcdName: 'Alpha-linolenic acid', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: true },
  { afcdName: 'C20:5w3 Eicosapentaenoic', nutriCompound: 'EPA', isCanonical: true },
  { afcdName: 'C22:5w3 Docosapentaenoic', nutriCompound: 'DPA', isCanonical: true },
  { afcdName: 'C22:6w3 Docosahexaenoic', nutriCompound: 'DHA', isCanonical: true },
  { afcdName: 'Total trans fatty acids', nutriCompound: 'Trans Fat', isCanonical: true },

  // Core - Other
  { afcdName: 'Tryptophan', nutriCompound: 'Tryptophan', isCanonical: true },
  { afcdName: 'Caffeine', nutriCompound: 'Caffeine', isCanonical: true },
  { afcdName: 'Cholesterol', nutriCompound: 'Cholesterol', isCanonical: true },

  // Proximates - Sugars
  { afcdName: 'Energy, without dietary fibre', nutriCompound: 'Energy', isCanonical: false },
  { afcdName: 'Fructose', nutriCompound: 'Fructose', isCanonical: true },
  { afcdName: 'Glucose', nutriCompound: 'Glucose', isCanonical: true },
  { afcdName: 'Sucrose', nutriCompound: 'Sucrose', isCanonical: true },
  { afcdName: 'Maltose', nutriCompound: 'Maltose', isCanonical: true },
  { afcdName: 'Lactose', nutriCompound: 'Lactose', isCanonical: true },
  { afcdName: 'Galactose', nutriCompound: 'Galactose', isCanonical: true },
  { afcdName: 'Maltotriose', nutriCompound: 'Maltotriose', isCanonical: true },

  // Proximates - Starches & Carbs
  { afcdName: 'Resistant starch', nutriCompound: 'Resistant Starch', isCanonical: true },
  { afcdName: 'Dextrin', nutriCompound: 'Dextrin', isCanonical: true },
  { afcdName: 'Glycerol', nutriCompound: 'Glycerol', isCanonical: true },
  { afcdName: 'Glycogen', nutriCompound: 'Glycogen', isCanonical: true },
  { afcdName: 'Inulin', nutriCompound: 'Inulin', isCanonical: true },
  { afcdName: 'Mannitol', nutriCompound: 'Mannitol', isCanonical: true },
  { afcdName: 'Maltodextrin', nutriCompound: 'Maltodextrin', isCanonical: true },
  { afcdName: 'Oligosaccharides', nutriCompound: 'Oligosaccharides', isCanonical: true },
  { afcdName: 'Raffinose', nutriCompound: 'Raffinose', isCanonical: true },
  { afcdName: 'Stachyose', nutriCompound: 'Stachyose', isCanonical: true },

  // Proximates - Sugar Alcohols
  { afcdName: 'Sorbitol', nutriCompound: 'Sorbitol', isCanonical: true },
  { afcdName: 'Erythritol', nutriCompound: 'Erythritol', isCanonical: true },
  { afcdName: 'Maltitol', nutriCompound: 'Maltitol', isCanonical: true },
  { afcdName: 'Xylitol', nutriCompound: 'Xylitol', isCanonical: true },

  // Proximates - Organic Acids
  { afcdName: 'Acetic acid', nutriCompound: 'Acetic Acid', isCanonical: true },
  { afcdName: 'Citric acid', nutriCompound: 'Citric Acid', isCanonical: true },
  { afcdName: 'Fumaric acid', nutriCompound: 'Fumaric Acid', isCanonical: true },
  { afcdName: 'Lactic acid', nutriCompound: 'Lactic Acid', isCanonical: true },
  { afcdName: 'Malic acid', nutriCompound: 'Malic Acid', isCanonical: true },
  { afcdName: 'Oxalic acid', nutriCompound: 'Oxalic Acid', isCanonical: true },
  { afcdName: 'Propionic acid', nutriCompound: 'Propionic Acid', isCanonical: true },
  { afcdName: 'Quinic acid', nutriCompound: 'Quinic Acid', isCanonical: true },
  { afcdName: 'Shikimic acid', nutriCompound: 'Shikimic Acid', isCanonical: true },
  { afcdName: 'Succinic acid', nutriCompound: 'Succinic Acid', isCanonical: true },
  { afcdName: 'Tartaric acid', nutriCompound: 'Tartaric Acid', isCanonical: true },

  // Vitamins - Extended
  { afcdName: 'Alpha-carotene', nutriCompound: 'Alpha-Carotene', isCanonical: true },
  { afcdName: 'Cryptoxanthin', nutriCompound: 'Beta-Cryptoxanthin', isCanonical: true },
  { afcdName: 'Lutein', nutriCompound: 'Lutein', isCanonical: true },
  { afcdName: 'Lycopene', nutriCompound: 'Lycopene', isCanonical: true },
  { afcdName: 'Xanthophyl', nutriCompound: 'Zeaxanthin', isCanonical: true },
  { afcdName: 'Niacin derived from tryptophan', nutriCompound: 'Niacin', isCanonical: false },
  { afcdName: 'Pantothenic acid (B5)', nutriCompound: 'Pantothenic Acid', isCanonical: true },
  { afcdName: 'Biotin (B7)', nutriCompound: 'Biotin', isCanonical: true },
  { afcdName: 'Alpha tocotrienol', nutriCompound: 'Alpha-Tocotrienol', isCanonical: true },
  { afcdName: 'Beta tocopherol', nutriCompound: 'Beta-Tocopherol', isCanonical: true },
  { afcdName: 'Beta tocotrienol', nutriCompound: 'Beta-Tocotrienol', isCanonical: true },
  { afcdName: 'Delta tocopherol', nutriCompound: 'Delta-Tocopherol', isCanonical: true },
  { afcdName: 'Delta tocotrienol', nutriCompound: 'Delta-Tocotrienol', isCanonical: true },
  { afcdName: 'Gamma tocopherol', nutriCompound: 'Gamma-Tocopherol', isCanonical: true },
  { afcdName: 'Gamma tocotrienol', nutriCompound: 'Gamma-Tocotrienol', isCanonical: true },

  // Minerals - Extended
  { afcdName: 'Aluminium (Al)', nutriCompound: 'Aluminum', isCanonical: true },
  { afcdName: 'Antimony (Sb)', nutriCompound: 'Antimony', isCanonical: true },
  { afcdName: 'Arsenic (As)', nutriCompound: 'Arsenic', isCanonical: true },
  { afcdName: 'Cadmium (Cd)', nutriCompound: 'Cadmium', isCanonical: true },
  { afcdName: 'Chromium (Cr)', nutriCompound: 'Chromium', isCanonical: true },
  { afcdName: 'Chloride (Cl)', nutriCompound: 'Chloride', isCanonical: true },
  { afcdName: 'Cobalt (Co)', nutriCompound: 'Cobalt', isCanonical: true },
  { afcdName: 'Copper (Cu)', nutriCompound: 'Copper', isCanonical: true },
  { afcdName: 'Fluoride (F)', nutriCompound: 'Fluoride', isCanonical: true },
  { afcdName: 'Lead (Pb)', nutriCompound: 'Lead', isCanonical: true },
  { afcdName: 'Manganese (Mn)', nutriCompound: 'Manganese', isCanonical: true },
  { afcdName: 'Mercury (Hg)', nutriCompound: 'Mercury', isCanonical: true },
  { afcdName: 'Molybdenum (Mo)', nutriCompound: 'Molybdenum', isCanonical: true },
  { afcdName: 'Nickel (Ni)', nutriCompound: 'Nickel', isCanonical: true },
  { afcdName: 'Sulphur (S)', nutriCompound: 'Sulfur', isCanonical: true },
  { afcdName: 'Tin (Sn)', nutriCompound: 'Tin', isCanonical: true },

  // Fatty Acids - Saturated (using g values as canonical)
  { afcdName: 'C4FD', nutriCompound: 'Butyric Acid', isCanonical: true },
  { afcdName: 'C6FD', nutriCompound: 'Caproic Acid', isCanonical: true },
  { afcdName: 'C8FD', nutriCompound: 'Caprylic Acid', isCanonical: true },
  { afcdName: 'C10FD', nutriCompound: 'Capric Acid', isCanonical: true },
  { afcdName: 'C11FD', nutriCompound: 'Undecanoic Acid', isCanonical: true },
  { afcdName: 'C12FD', nutriCompound: 'Lauric Acid', isCanonical: true },
  { afcdName: 'C13FD', nutriCompound: 'Tridecanoic Acid', isCanonical: true },
  { afcdName: 'C14FD', nutriCompound: 'Myristic Acid', isCanonical: true },
  { afcdName: 'C15FD', nutriCompound: 'Pentadecanoic Acid', isCanonical: true },
  { afcdName: 'C16FD', nutriCompound: 'Palmitic Acid', isCanonical: true },
  { afcdName: 'C17FD', nutriCompound: 'Margaric Acid', isCanonical: true },
  { afcdName: 'C18FD', nutriCompound: 'Stearic Acid', isCanonical: true },
  { afcdName: 'C19FD', nutriCompound: 'Nonadecanoic Acid', isCanonical: true },
  { afcdName: 'C20FD', nutriCompound: 'Arachidic Acid', isCanonical: true },
  { afcdName: 'C21FD', nutriCompound: 'Heneicosanoic Acid', isCanonical: true },
  { afcdName: 'C22FD', nutriCompound: 'Behenic Acid', isCanonical: true },
  { afcdName: 'C23FD', nutriCompound: 'Tricosanoic Acid', isCanonical: true },
  { afcdName: 'C24FD', nutriCompound: 'Lignoceric Acid', isCanonical: true },

  // Fatty Acids - %T values (non-canonical)
  { afcdName: 'C4', nutriCompound: 'Butyric Acid', isCanonical: false },
  { afcdName: 'C6', nutriCompound: 'Caproic Acid', isCanonical: false },
  { afcdName: 'C8', nutriCompound: 'Caprylic Acid', isCanonical: false },
  { afcdName: 'C10', nutriCompound: 'Capric Acid', isCanonical: false },
  { afcdName: 'C11', nutriCompound: 'Undecanoic Acid', isCanonical: false },
  { afcdName: 'C12', nutriCompound: 'Lauric Acid', isCanonical: false },
  { afcdName: 'C13', nutriCompound: 'Tridecanoic Acid', isCanonical: false },
  { afcdName: 'C14', nutriCompound: 'Myristic Acid', isCanonical: false },
  { afcdName: 'C15', nutriCompound: 'Pentadecanoic Acid', isCanonical: false },
  { afcdName: 'C16', nutriCompound: 'Palmitic Acid', isCanonical: false },
  { afcdName: 'C17', nutriCompound: 'Margaric Acid', isCanonical: false },
  { afcdName: 'C18', nutriCompound: 'Stearic Acid', isCanonical: false },
  { afcdName: 'C19', nutriCompound: 'Nonadecanoic Acid', isCanonical: false },
  { afcdName: 'C20', nutriCompound: 'Arachidic Acid', isCanonical: false },
  { afcdName: 'C21', nutriCompound: 'Heneicosanoic Acid', isCanonical: false },
  { afcdName: 'C22', nutriCompound: 'Behenic Acid', isCanonical: false },
  { afcdName: 'C23', nutriCompound: 'Tricosanoic Acid', isCanonical: false },
  { afcdName: 'C24', nutriCompound: 'Lignoceric Acid', isCanonical: false },

  // Fatty Acids - Monounsaturated (g as canonical)
  { afcdName: 'C14:1FD', nutriCompound: 'Myristoleic Acid', isCanonical: true },
  { afcdName: 'C15:1FD', nutriCompound: 'Pentadecenoic Acid', isCanonical: true },
  { afcdName: 'C16:1FD', nutriCompound: 'Palmitoleic Acid', isCanonical: true },
  { afcdName: 'C17:1FD', nutriCompound: 'Heptadecenoic Acid', isCanonical: true },
  { afcdName: 'C18:1FD', nutriCompound: 'Oleic Acid', isCanonical: true },
  { afcdName: 'C20:1FD', nutriCompound: 'Gondoic Acid', isCanonical: true },
  { afcdName: 'C22:1FD', nutriCompound: 'Erucic Acid', isCanonical: true },
  { afcdName: 'C24:1FD', nutriCompound: 'Nervonic Acid', isCanonical: true },

  // Fatty Acids - Monounsaturated %T (non-canonical)
  { afcdName: 'C14:1', nutriCompound: 'Myristoleic Acid', isCanonical: false },
  { afcdName: 'C15:1', nutriCompound: 'Pentadecenoic Acid', isCanonical: false },
  { afcdName: 'C16:1', nutriCompound: 'Palmitoleic Acid', isCanonical: false },
  { afcdName: 'C17:1', nutriCompound: 'Heptadecenoic Acid', isCanonical: false },
  { afcdName: 'C18:1', nutriCompound: 'Oleic Acid', isCanonical: false },
  { afcdName: 'C20:1', nutriCompound: 'Gondoic Acid', isCanonical: false },
  { afcdName: 'C22:1', nutriCompound: 'Erucic Acid', isCanonical: false },
  { afcdName: 'C24:1', nutriCompound: 'Nervonic Acid', isCanonical: false },

  // Fatty Acids - Polyunsaturated (g/mg as canonical)
  { afcdName: 'C18:2w6FD', nutriCompound: 'Linoleic Acid', isCanonical: false }, // Already has canonical
  { afcdName: 'C18:3w3FD', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { afcdName: 'C18:3w6FD', nutriCompound: 'Gamma-Linolenic Acid', isCanonical: true },
  { afcdName: 'C18:4w3FD', nutriCompound: 'Stearidonic Acid', isCanonical: true },
  { afcdName: 'C20:2w6FD', nutriCompound: 'Eicosadienoic Acid', isCanonical: true },
  { afcdName: 'C20:3w3FD', nutriCompound: 'Eicosatrienoic Acid (n-3)', isCanonical: true },
  { afcdName: 'C20:3w6FD', nutriCompound: 'Dihomo-Gamma-Linolenic Acid', isCanonical: true },
  { afcdName: 'C20:4w3FD', nutriCompound: 'Eicosatetraenoic Acid (n-3)', isCanonical: true },
  { afcdName: 'C20:4w6FD', nutriCompound: 'Arachidonic Acid', isCanonical: true },
  { afcdName: 'C20:5w3FD', nutriCompound: 'EPA', isCanonical: false },
  { afcdName: 'C22:2w6FD', nutriCompound: 'Docosadienoic Acid', isCanonical: true },
  { afcdName: 'C22:4w6FD', nutriCompound: 'Adrenic Acid', isCanonical: true },
  { afcdName: 'C22:5w3FD', nutriCompound: 'DPA', isCanonical: false },
  { afcdName: 'C22:6w3FD', nutriCompound: 'DHA', isCanonical: false },

  // Fatty Acids - Polyunsaturated %T (non-canonical)
  { afcdName: 'C18:2w6', nutriCompound: 'Linoleic Acid', isCanonical: false },
  { afcdName: 'C18:3w3', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { afcdName: 'C18:3w6', nutriCompound: 'Gamma-Linolenic Acid', isCanonical: false },
  { afcdName: 'C18:4w3', nutriCompound: 'Stearidonic Acid', isCanonical: false },
  { afcdName: 'C20:2w6', nutriCompound: 'Eicosadienoic Acid', isCanonical: false },
  { afcdName: 'C20:3w3', nutriCompound: 'Eicosatrienoic Acid (n-3)', isCanonical: false },
  { afcdName: 'C20:3w6', nutriCompound: 'Dihomo-Gamma-Linolenic Acid', isCanonical: false },
  { afcdName: 'C20:4w3', nutriCompound: 'Eicosatetraenoic Acid (n-3)', isCanonical: false },
  { afcdName: 'C20:4w6', nutriCompound: 'Arachidonic Acid', isCanonical: false },
  { afcdName: 'C20:5w3', nutriCompound: 'EPA', isCanonical: false },
  { afcdName: 'C22:2w6', nutriCompound: 'Docosadienoic Acid', isCanonical: false },
  { afcdName: 'C22:4w6', nutriCompound: 'Adrenic Acid', isCanonical: false },
  { afcdName: 'C22:5w3', nutriCompound: 'DPA', isCanonical: false },
  { afcdName: 'C22:6w3', nutriCompound: 'DHA', isCanonical: false },

  // Amino Acids
  { afcdName: 'Alanine', nutriCompound: 'Alanine', isCanonical: true },
  { afcdName: 'Arginine', nutriCompound: 'Arginine', isCanonical: true },
  { afcdName: 'Aspartic acid', nutriCompound: 'Aspartic Acid', isCanonical: true },
  { afcdName: 'Cystine plus cysteine', nutriCompound: 'Cystine', isCanonical: true },
  { afcdName: 'Glutamic acid', nutriCompound: 'Glutamic Acid', isCanonical: true },
  { afcdName: 'Glycine', nutriCompound: 'Glycine', isCanonical: true },
  { afcdName: 'Histidine', nutriCompound: 'Histidine', isCanonical: true },
  { afcdName: 'Isoleucine', nutriCompound: 'Isoleucine', isCanonical: true },
  { afcdName: 'Leucine', nutriCompound: 'Leucine', isCanonical: true },
  { afcdName: 'Lysine', nutriCompound: 'Lysine', isCanonical: true },
  { afcdName: 'Methionine', nutriCompound: 'Methionine', isCanonical: true },
  { afcdName: 'Phenylalanine', nutriCompound: 'Phenylalanine', isCanonical: true },
  { afcdName: 'Proline', nutriCompound: 'Proline', isCanonical: true },
  { afcdName: 'Serine', nutriCompound: 'Serine', isCanonical: true },
  { afcdName: 'Threonine', nutriCompound: 'Threonine', isCanonical: true },
  { afcdName: 'Tyrosine', nutriCompound: 'Tyrosine', isCanonical: true },
  { afcdName: 'Valine', nutriCompound: 'Valine', isCanonical: true },
];

async function main() {
  console.log('=== Adding AFCD Missing Compounds ===\n');

  // Get existing compounds count
  const existingCount = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);
  const startCount = Number((existingCount as any)[0]?.count || 0);
  console.log(`Starting compound count: ${startCount}\n`);

  // Add new compounds
  let addedCount = 0;
  let skippedCount = 0;

  for (const c of newCompounds) {
    // Check if exists
    const existing = await db.execute(
      sql`SELECT id FROM compounds WHERE LOWER(name) = LOWER(${c.name})`
    );

    if ((existing as any).length > 0) {
      console.log(`⏭️  ${c.name} (already exists)`);
      skippedCount++;
      continue;
    }

    await db.execute(sql`
      INSERT INTO compounds (name, compound_type, unit, description)
      VALUES (${c.name}, ${c.type}, ${c.unit}, ${c.description})
    `);
    console.log(`✅ ${c.name} (${c.type})`);
    addedCount++;
  }

  console.log(`\nCompounds: ${addedCount} added, ${skippedCount} skipped\n`);

  // Now insert AFCD mappings
  console.log('=== Creating AFCD Mappings ===\n');

  let mappingCount = 0;
  let mappingSkipped = 0;
  let notFound = 0;

  for (const m of afcdMappings) {
    // Find compound
    const compound = await db.execute(
      sql`SELECT id FROM compounds WHERE LOWER(name) = LOWER(${m.nutriCompound})`
    );

    if ((compound as any).length === 0) {
      console.log(`❌ Compound not found: ${m.nutriCompound}`);
      notFound++;
      continue;
    }

    const compoundId = (compound as any)[0].id;

    // Check if mapping exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'AFCD' AND external_id = ${m.afcdName}
    `);

    if ((existingMapping as any).length > 0) {
      mappingSkipped++;
      continue;
    }

    // Insert mapping
    await db.execute(sql`
      INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
      VALUES (${compoundId}, 'AFCD', ${m.afcdName}, ${m.afcdName}, ${m.isCanonical})
    `);
    mappingCount++;
  }

  console.log(`\nMappings: ${mappingCount} created, ${mappingSkipped} skipped, ${notFound} not found\n`);

  // Final counts
  const finalCompoundCount = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);
  const finalMappingCount = await db.execute(sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);

  console.log('=== Final Summary ===');
  console.log(`Total compounds: ${(finalCompoundCount as any)[0]?.count}`);
  console.log('\nMappings by source:');
  (finalMappingCount as any).forEach((r: any) => {
    console.log(`  ${r.external_source}: ${r.count}`);
  });
}

main().then(() => process.exit(0)).catch(console.error);
