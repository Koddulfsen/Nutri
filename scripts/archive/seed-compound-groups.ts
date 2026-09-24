/**
 * Seed Compound Groups Hierarchy
 *
 * Creates the hierarchical structure for organizing compounds:
 * - Carbohydrates (TOP-LEVEL)
 * - Fats (TOP-LEVEL)
 * - Proteins (TOP-LEVEL)
 * - Vitamins
 * - Minerals
 * - Phytonutrients
 * - Other Compounds
 * - Safety Compounds
 *
 * NOTE: Energy and Water are NOT compounds - displayed as metrics in UI
 */

import { db } from '../db';
import { compoundGroups } from '../db/schema';

interface GroupSeed {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  children?: GroupSeed[];
}

const groupHierarchy: GroupSeed[] = [
  {
    name: 'Carbohydrates',
    slug: 'carbohydrates',
    icon: '🍞',
    description: 'Sugars, starches, and fiber - primary energy source',
    children: [
      {
        name: 'Sugars',
        slug: 'sugars',
        description: 'Simple carbohydrates (mono and disaccharides)',
        children: [
          { name: 'Glucose', slug: 'glucose' },
          { name: 'Fructose', slug: 'fructose' },
          { name: 'Galactose', slug: 'galactose' },
          { name: 'Sucrose', slug: 'sucrose' },
          { name: 'Lactose', slug: 'lactose' },
          { name: 'Maltose', slug: 'maltose' },
        ]
      },
      {
        name: 'Sugar Alcohols',
        slug: 'sugar-alcohols',
        description: 'Polyols used as sweeteners',
        children: [
          { name: 'Sorbitol', slug: 'sorbitol' },
          { name: 'Mannitol', slug: 'mannitol' },
        ]
      },
      {
        name: 'Fiber',
        slug: 'fiber',
        icon: '🌾',
        description: 'Indigestible carbohydrates',
        children: [
          { name: 'Soluble Fiber', slug: 'soluble-fiber' },
          { name: 'Insoluble Fiber', slug: 'insoluble-fiber' },
          { name: 'Inulin', slug: 'inulin' },
        ]
      },
      {
        name: 'Starches',
        slug: 'starches',
        description: 'Complex carbohydrates',
        children: [
          { name: 'Resistant Starch', slug: 'resistant-starch' },
        ]
      },
    ]
  },
  {
    name: 'Fats',
    slug: 'fats',
    icon: '🧈',
    description: 'Lipids and fatty acids - energy storage and cell structure',
    children: [
      {
        name: 'Saturated Fatty Acids',
        slug: 'saturated-fatty-acids',
        description: 'No double bonds in carbon chain',
        children: [
          { name: 'Butyric Acid', slug: 'butyric-acid' },
          { name: 'Caproic Acid', slug: 'caproic-acid' },
          { name: 'Caprylic Acid', slug: 'caprylic-acid' },
          { name: 'Capric Acid', slug: 'capric-acid' },
          { name: 'Lauric Acid', slug: 'lauric-acid' },
          { name: 'Myristic Acid', slug: 'myristic-acid' },
          { name: 'Palmitic Acid', slug: 'palmitic-acid' },
          { name: 'Stearic Acid', slug: 'stearic-acid' },
          { name: 'Arachidic Acid', slug: 'arachidic-acid' },
          { name: 'Behenic Acid', slug: 'behenic-acid' },
          { name: 'Lignoceric Acid', slug: 'lignoceric-acid' },
        ]
      },
      {
        name: 'Monounsaturated Fatty Acids',
        slug: 'monounsaturated-fatty-acids',
        description: 'One double bond (MUFA)',
        children: [
          { name: 'Myristoleic Acid', slug: 'myristoleic-acid' },
          { name: 'Palmitoleic Acid', slug: 'palmitoleic-acid' },
          { name: 'Oleic Acid', slug: 'oleic-acid' },
          { name: 'Eicosenoic Acid', slug: 'eicosenoic-acid' },
          { name: 'Erucic Acid', slug: 'erucic-acid' },
          { name: 'Nervonic Acid', slug: 'nervonic-acid' },
        ]
      },
      {
        name: 'Polyunsaturated Fatty Acids',
        slug: 'polyunsaturated-fatty-acids',
        description: 'Multiple double bonds (PUFA)',
        children: [
          {
            name: 'Omega-3 Fatty Acids',
            slug: 'omega-3',
            description: 'Anti-inflammatory essential fats',
            children: [
              { name: 'Alpha-Linolenic Acid (ALA)', slug: 'ala' },
              { name: 'Stearidonic Acid', slug: 'stearidonic-acid' },
              { name: 'Eicosapentaenoic Acid (EPA)', slug: 'epa' },
              { name: 'Docosapentaenoic Acid (DPA)', slug: 'dpa' },
              { name: 'Docosahexaenoic Acid (DHA)', slug: 'dha' },
            ]
          },
          {
            name: 'Omega-6 Fatty Acids',
            slug: 'omega-6',
            description: 'Essential fats, balance with omega-3',
            children: [
              { name: 'Linoleic Acid (LA)', slug: 'la' },
              { name: 'Gamma-Linolenic Acid (GLA)', slug: 'gla' },
              { name: 'Dihomo-gamma-linolenic Acid (DGLA)', slug: 'dgla' },
              { name: 'Arachidonic Acid (AA)', slug: 'aa' },
            ]
          },
        ]
      },
      {
        name: 'Trans Fatty Acids',
        slug: 'trans-fatty-acids',
        description: 'Trans configuration fats (mostly harmful)',
        children: [
          { name: 'Elaidic Acid', slug: 'elaidic-acid' },
        ]
      },
      {
        name: 'Sterols',
        slug: 'sterols',
        description: 'Steroid alcohols',
        children: [
          { name: 'Cholesterol', slug: 'cholesterol' },
        ]
      },
    ]
  },
  {
    name: 'Proteins',
    slug: 'proteins',
    icon: '🥩',
    description: 'Amino acids - building blocks for body tissues',
    children: [
      {
        name: 'Essential Amino Acids',
        slug: 'essential-amino-acids',
        description: 'Must be obtained from diet',
        children: [
          { name: 'Histidine', slug: 'histidine' },
          { name: 'Isoleucine', slug: 'isoleucine' },
          { name: 'Leucine', slug: 'leucine' },
          { name: 'Lysine', slug: 'lysine' },
          { name: 'Methionine', slug: 'methionine' },
          { name: 'Phenylalanine', slug: 'phenylalanine' },
          { name: 'Threonine', slug: 'threonine' },
          { name: 'Tryptophan', slug: 'tryptophan' },
          { name: 'Valine', slug: 'valine' },
        ]
      },
      {
        name: 'Non-Essential Amino Acids',
        slug: 'non-essential-amino-acids',
        description: 'Synthesized by the body',
        children: [
          { name: 'Alanine', slug: 'alanine' },
          { name: 'Asparagine', slug: 'asparagine' },
          { name: 'Aspartic Acid', slug: 'aspartic-acid' },
          { name: 'Glutamic Acid', slug: 'glutamic-acid' },
          { name: 'Serine', slug: 'serine' },
        ]
      },
      {
        name: 'Conditionally Essential Amino Acids',
        slug: 'conditionally-essential-amino-acids',
        description: 'May be essential under certain conditions',
        children: [
          { name: 'Arginine', slug: 'arginine' },
          { name: 'Cysteine', slug: 'cysteine' },
          { name: 'Glutamine', slug: 'glutamine' },
          { name: 'Glycine', slug: 'glycine' },
          { name: 'Proline', slug: 'proline' },
          { name: 'Tyrosine', slug: 'tyrosine' },
        ]
      },
      {
        name: 'Other Amino Compounds',
        slug: 'other-amino-compounds',
        description: 'Related amino compounds',
        children: [
          { name: 'Taurine', slug: 'taurine' },
          { name: 'Carnitine', slug: 'carnitine' },
          { name: 'Creatine', slug: 'creatine' },
          { name: 'Beta-Alanine', slug: 'beta-alanine' },
        ]
      },
    ]
  },
  {
    name: 'Vitamins',
    slug: 'vitamins',
    icon: '💊',
    description: 'Essential organic micronutrients',
    children: [
      {
        name: 'Fat-Soluble Vitamins',
        slug: 'fat-soluble-vitamins',
        description: 'Vitamins A, D, E, K - stored in body fat',
        children: [
          {
            name: 'Vitamin A',
            slug: 'vitamin-a',
            description: 'Retinol and carotenoid precursors',
            children: [
              { name: 'Retinol', slug: 'retinol' },
              { name: 'Beta-Carotene', slug: 'beta-carotene' },
            ]
          },
          {
            name: 'Vitamin D',
            slug: 'vitamin-d',
            description: 'Cholecalciferol and ergocalciferol',
            children: [
              { name: 'Vitamin D2 (Ergocalciferol)', slug: 'vitamin-d2' },
              { name: 'Vitamin D3 (Cholecalciferol)', slug: 'vitamin-d3' },
            ]
          },
          {
            name: 'Vitamin E',
            slug: 'vitamin-e',
            description: 'Tocopherols and tocotrienols',
            children: [
              { name: 'Alpha-Tocopherol', slug: 'alpha-tocopherol' },
              { name: 'Beta-Tocopherol', slug: 'beta-tocopherol' },
              { name: 'Gamma-Tocopherol', slug: 'gamma-tocopherol' },
              { name: 'Delta-Tocopherol', slug: 'delta-tocopherol' },
              { name: 'Alpha-Tocotrienol', slug: 'alpha-tocotrienol' },
              { name: 'Beta-Tocotrienol', slug: 'beta-tocotrienol' },
              { name: 'Gamma-Tocotrienol', slug: 'gamma-tocotrienol' },
              { name: 'Delta-Tocotrienol', slug: 'delta-tocotrienol' },
            ]
          },
          {
            name: 'Vitamin K',
            slug: 'vitamin-k',
            description: 'Phylloquinone and menaquinones',
            children: [
              { name: 'Vitamin K1 (Phylloquinone)', slug: 'vitamin-k1' },
              { name: 'Vitamin K2 (Menaquinone)', slug: 'vitamin-k2' },
              { name: 'Menaquinone-4', slug: 'menaquinone-4' },
              { name: 'Menaquinone-7', slug: 'menaquinone-7' },
            ]
          },
        ]
      },
      {
        name: 'Water-Soluble Vitamins',
        slug: 'water-soluble-vitamins',
        description: 'B-complex and Vitamin C - not stored in body',
        children: [
          {
            name: 'B-Complex Vitamins',
            slug: 'b-complex',
            description: 'Eight essential B vitamins',
            children: [
              { name: 'Vitamin B1 (Thiamin)', slug: 'vitamin-b1' },
              { name: 'Vitamin B2 (Riboflavin)', slug: 'vitamin-b2' },
              { name: 'Vitamin B3 (Niacin)', slug: 'vitamin-b3' },
              { name: 'Vitamin B5 (Pantothenic Acid)', slug: 'vitamin-b5' },
              { name: 'Vitamin B6 (Pyridoxine)', slug: 'vitamin-b6' },
              { name: 'Vitamin B7 (Biotin)', slug: 'vitamin-b7' },
              { name: 'Vitamin B9 (Folate)', slug: 'vitamin-b9' },
              { name: 'Vitamin B12 (Cobalamin)', slug: 'vitamin-b12' },
            ]
          },
          { name: 'Vitamin C (Ascorbic Acid)', slug: 'vitamin-c', description: 'Ascorbic acid' },
        ]
      },
      {
        name: 'Vitamin-Like Compounds',
        slug: 'vitamin-like-compounds',
        description: 'Beneficial but not essential vitamins',
        children: [
          { name: 'Choline', slug: 'choline' },
          { name: 'Inositol', slug: 'inositol' },
          { name: 'Lipoic Acid', slug: 'lipoic-acid' },
          { name: 'Coenzyme Q10 (Ubiquinone)', slug: 'coq10' },
          { name: 'PQQ (Pyrroloquinoline Quinone)', slug: 'pqq' },
        ]
      },
    ]
  },
  {
    name: 'Minerals',
    slug: 'minerals',
    icon: 'ite',
    description: 'Essential inorganic micronutrients',
    children: [
      {
        name: 'Macro Minerals',
        slug: 'macro-minerals',
        description: 'Required in larger amounts (>100mg/day)',
        children: [
          { name: 'Calcium', slug: 'calcium' },
          { name: 'Phosphorus', slug: 'phosphorus' },
          { name: 'Magnesium', slug: 'magnesium' },
          { name: 'Sodium', slug: 'sodium' },
          { name: 'Potassium', slug: 'potassium' },
          { name: 'Chloride', slug: 'chloride' },
          { name: 'Sulfur', slug: 'sulfur' },
        ]
      },
      {
        name: 'Trace Minerals',
        slug: 'trace-minerals',
        description: 'Required in smaller amounts (<100mg/day)',
        children: [
          { name: 'Iron', slug: 'iron' },
          { name: 'Zinc', slug: 'zinc' },
          { name: 'Copper', slug: 'copper' },
          { name: 'Manganese', slug: 'manganese' },
          { name: 'Selenium', slug: 'selenium' },
          { name: 'Iodine', slug: 'iodine' },
          { name: 'Molybdenum', slug: 'molybdenum' },
          { name: 'Chromium', slug: 'chromium' },
          { name: 'Fluoride', slug: 'fluoride' },
          { name: 'Boron', slug: 'boron' },
          { name: 'Silicon', slug: 'silicon' },
          { name: 'Cobalt', slug: 'cobalt' },
          { name: 'Lithium', slug: 'lithium' },
        ]
      },
    ]
  },
  {
    name: 'Phytonutrients',
    slug: 'phytonutrients',
    icon: '🌿',
    description: 'Plant-derived bioactive compounds',
    children: [
      {
        name: 'Polyphenols',
        slug: 'polyphenols',
        description: 'Antioxidant plant compounds',
        children: [
          {
            name: 'Flavonoids',
            slug: 'flavonoids',
            children: [
              { name: 'Quercetin', slug: 'quercetin' },
              { name: 'Kaempferol', slug: 'kaempferol' },
              { name: 'Myricetin', slug: 'myricetin' },
              { name: 'Apigenin', slug: 'apigenin' },
              { name: 'Luteolin', slug: 'luteolin' },
              { name: 'Catechin', slug: 'catechin' },
              { name: 'Epicatechin', slug: 'epicatechin' },
              { name: 'EGCG', slug: 'egcg' },
              { name: 'Naringenin', slug: 'naringenin' },
              { name: 'Hesperidin', slug: 'hesperidin' },
            ]
          },
          {
            name: 'Anthocyanins',
            slug: 'anthocyanins',
            description: 'Blue/purple/red pigments',
            children: [
              { name: 'Cyanidin', slug: 'cyanidin' },
              { name: 'Delphinidin', slug: 'delphinidin' },
              { name: 'Malvidin', slug: 'malvidin' },
              { name: 'Pelargonidin', slug: 'pelargonidin' },
            ]
          },
          {
            name: 'Phenolic Acids',
            slug: 'phenolic-acids',
            children: [
              { name: 'Gallic Acid', slug: 'gallic-acid' },
              { name: 'Caffeic Acid', slug: 'caffeic-acid' },
              { name: 'Ferulic Acid', slug: 'ferulic-acid' },
              { name: 'Chlorogenic Acid', slug: 'chlorogenic-acid' },
            ]
          },
          {
            name: 'Stilbenes',
            slug: 'stilbenes',
            description: 'Including resveratrol',
            children: [
              { name: 'Resveratrol', slug: 'resveratrol' },
              { name: 'Pterostilbene', slug: 'pterostilbene' },
            ]
          },
          {
            name: 'Lignans',
            slug: 'lignans',
            children: [
              { name: 'Secoisolariciresinol', slug: 'secoisolariciresinol' },
              { name: 'Matairesinol', slug: 'matairesinol' },
            ]
          },
          {
            name: 'Isoflavones',
            slug: 'isoflavones',
            description: 'Phytoestrogens from soy',
            children: [
              { name: 'Genistein', slug: 'genistein' },
              { name: 'Daidzein', slug: 'daidzein' },
            ]
          },
        ]
      },
      {
        name: 'Carotenoids',
        slug: 'carotenoids',
        description: 'Orange/yellow/red pigments',
        children: [
          { name: 'Alpha-Carotene', slug: 'alpha-carotene' },
          { name: 'Beta-Cryptoxanthin', slug: 'beta-cryptoxanthin' },
          { name: 'Lycopene', slug: 'lycopene' },
          { name: 'Lutein', slug: 'lutein' },
          { name: 'Zeaxanthin', slug: 'zeaxanthin' },
          { name: 'Astaxanthin', slug: 'astaxanthin' },
        ]
      },
      {
        name: 'Glucosinolates',
        slug: 'glucosinolates',
        description: 'Found in cruciferous vegetables',
        children: [
          { name: 'Sulforaphane', slug: 'sulforaphane' },
          { name: 'Indole-3-Carbinol', slug: 'indole-3-carbinol' },
          { name: 'Glucoraphanin', slug: 'glucoraphanin' },
          { name: 'Allicin', slug: 'allicin' },
        ]
      },
      {
        name: 'Terpenoids',
        slug: 'terpenoids',
        description: 'Aromatic compounds',
        children: [
          { name: 'Limonene', slug: 'limonene' },
          { name: 'Linalool', slug: 'linalool' },
          { name: 'Gingerol', slug: 'gingerol' },
          { name: 'Curcumin', slug: 'curcumin' },
        ]
      },
    ]
  },
  {
    name: 'Other Compounds',
    slug: 'other-compounds',
    icon: '🔬',
    description: 'Additional bioactive compounds',
    children: [
      {
        name: 'Alkaloids',
        slug: 'alkaloids',
        description: 'Nitrogen-containing compounds',
        children: [
          { name: 'Caffeine', slug: 'caffeine' },
          { name: 'Theobromine', slug: 'theobromine' },
          { name: 'Capsaicin', slug: 'capsaicin' },
          { name: 'Piperine', slug: 'piperine' },
        ]
      },
      {
        name: 'Nucleotides',
        slug: 'nucleotides',
        description: 'DNA/RNA building blocks',
        children: [
          { name: 'Adenine', slug: 'adenine' },
          { name: 'Guanine', slug: 'guanine' },
          { name: 'Uric Acid', slug: 'uric-acid' },
        ]
      },
      {
        name: 'Anti-Nutrients',
        slug: 'anti-nutrients',
        description: 'Compounds that may reduce nutrient absorption',
        children: [
          { name: 'Phytic Acid', slug: 'phytic-acid' },
          { name: 'Oxalic Acid', slug: 'oxalic-acid' },
          { name: 'Tannins', slug: 'tannins' },
          { name: 'Saponins', slug: 'saponins' },
          { name: 'Lectins', slug: 'lectins' },
        ]
      },
      {
        name: 'Biogenic Amines',
        slug: 'biogenic-amines',
        description: 'Formed during fermentation',
        children: [
          { name: 'Histamine', slug: 'histamine' },
          { name: 'Tyramine', slug: 'tyramine' },
        ]
      },
    ]
  },
  {
    name: 'Safety Compounds',
    slug: 'safety-compounds',
    icon: '⚠️',
    description: 'Compounds to monitor for health/safety',
    children: [
      {
        name: 'Processing Compounds',
        slug: 'processing-compounds',
        description: 'Formed during cooking/processing',
        children: [
          { name: 'Acrylamide', slug: 'acrylamide' },
          { name: 'Heterocyclic Amines (HCAs)', slug: 'hcas' },
          { name: 'Polycyclic Aromatic Hydrocarbons (PAHs)', slug: 'pahs' },
          { name: 'Advanced Glycation End Products (AGEs)', slug: 'ages' },
        ]
      },
      {
        name: 'Mycotoxins',
        slug: 'mycotoxins',
        description: 'Fungal contaminants',
        children: [
          { name: 'Aflatoxins', slug: 'aflatoxins' },
          { name: 'Ochratoxin A', slug: 'ochratoxin-a' },
          { name: 'Deoxynivalenol', slug: 'deoxynivalenol' },
          { name: 'Fumonisins', slug: 'fumonisins' },
        ]
      },
      {
        name: 'Pesticide Residues',
        slug: 'pesticide-residues',
        description: 'Agricultural chemical residues',
        children: [
          { name: 'Glyphosate', slug: 'glyphosate' },
          { name: 'Organophosphates', slug: 'organophosphates' },
        ]
      },
      {
        name: 'Heavy Metals',
        slug: 'heavy-metals',
        description: 'Toxic metal contaminants',
        children: [
          { name: 'Lead', slug: 'lead' },
          { name: 'Mercury', slug: 'mercury' },
          { name: 'Cadmium', slug: 'cadmium' },
          { name: 'Arsenic', slug: 'arsenic' },
        ]
      },
      {
        name: 'Plasticizers',
        slug: 'plasticizers',
        description: 'Packaging contaminants',
        children: [
          { name: 'BPA', slug: 'bpa' },
          { name: 'Phthalates', slug: 'phthalates' },
        ]
      },
      {
        name: 'Synthetic Additives',
        slug: 'synthetic-additives',
        description: 'Food additives to monitor',
        children: [
          { name: 'Artificial Sweeteners', slug: 'artificial-sweeteners' },
          { name: 'Artificial Colors', slug: 'artificial-colors' },
          { name: 'Preservatives', slug: 'preservatives' },
          { name: 'MSG', slug: 'msg' },
        ]
      },
    ]
  },
];

async function seedGroup(
  group: GroupSeed,
  parentId: string | null,
  level: number,
  path: string,
  displayOrder: number
): Promise<void> {
  const groupPath = path ? `${path}/${group.slug}` : group.slug;

  // Insert the group
  const [inserted] = await db
    .insert(compoundGroups)
    .values({
      name: group.name,
      slug: group.slug,
      parentGroupId: parentId,
      level,
      displayOrder,
      description: group.description || null,
      icon: group.icon || null,
      path: groupPath,
    })
    .onConflictDoUpdate({
      target: compoundGroups.slug,
      set: {
        name: group.name,
        parentGroupId: parentId,
        level,
        displayOrder,
        description: group.description || null,
        icon: group.icon || null,
        path: groupPath,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`  ${'  '.repeat(level)}${group.icon || '•'} ${group.name}`);

  // Recursively insert children
  if (group.children) {
    for (let i = 0; i < group.children.length; i++) {
      await seedGroup(group.children[i], inserted.id, level + 1, groupPath, i);
    }
  }
}

async function main() {
  console.log('🌱 Seeding Compound Groups Hierarchy...\n');

  for (let i = 0; i < groupHierarchy.length; i++) {
    await seedGroup(groupHierarchy[i], null, 0, '', i);
  }

  console.log('\n✅ Compound groups seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
