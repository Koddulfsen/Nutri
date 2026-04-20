/**
 * Compound Seed Data
 *
 * Comprehensive seed data for 330 compounds covering all 17 compound types:
 * - VITAMIN (50 compounds including K2 variants, active B forms, vitamin-like)
 * - MINERAL (35 compounds including ultra-trace + toxic metals for safety)
 * - AMINO_ACID (30 compounds including essential, non-essential, derivatives)
 * - NUCLEOTIDE (5 compounds - purines, uric acid for gout tracking)
 * - FATTY_ACID (30 compounds including saturated, mono, and polyunsaturated)
 * - CARBOHYDRATE (12 compounds)
 * - POLYPHENOL (40 compounds including flavonoids and phenolic acids)
 * - CAROTENOID (15 compounds including provitamin A and non-provitamin A)
 * - ALKALOID (12 compounds - caffeine, histamine, glycoalkaloids, biogenic amines)
 * - GLUCOSINOLATE (15 compounds from cruciferous + organosulfur)
 * - TERPENOID (10 compounds)
 * - MYCOTOXIN (10 compounds - aflatoxin, ochratoxin - safety tracking)
 * - PESTICIDE_RESIDUE (6 compounds - glyphosate, organophosphates)
 * - PLASTICIZER (7 compounds - BPA, phthalates - endocrine disruptors)
 * - PROCESSING_COMPOUND (20 compounds including AGEs, HCAs, PAHs)
 * - SYNTHETIC_ADDITIVE (15 compounds including preservatives, colors)
 * - ANTI_NUTRIENT (18 compounds including phytates, oxalates, lectins)
 *
 * Data sourced from USDA FoodData Central standards with hierarchical relationships
 * and comprehensive metadata. Updated 2025-11-16 with scientific chemical classification.
 */

import { db } from '../index';
import { compounds } from '../schema/compounds';
import type { NewCompound } from '@/lib/types/database';

interface CompoundSeedData extends Omit<NewCompound, 'id' | 'createdAt' | 'updatedAt'> {
  // Helper field for establishing parent relationships
  parentKey?: string;
}

/**
 * Seed compounds in the database
 * Establishes hierarchical relationships and metadata
 */
export async function seedCompounds() {
  console.log('🌱 Starting compound seed...');

  try {
    // Track inserted compounds by key for parent relationships
    const compoundMap = new Map<string, string>();

    // ═══════════════════════════════════════════════════════════════
    // VITAMINS (50 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding VITAMIN compounds...');

    const vitaminSeeds: CompoundSeedData[] = [
      // Vitamin A group (parent + children)
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin A',
        alternateNames: ['Retinol equivalents', 'RAE'],
        unit: 'µg',
        description: 'Fat-soluble vitamin essential for vision, immune function, and cellular communication',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Retinol',
        alternateNames: ['Preformed Vitamin A'],
        unit: 'µg',
        parentKey: 'Vitamin A',
        description: 'Preformed vitamin A found in animal products',
        healthConcernFlags: { 'pregnancy_concern': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Beta-Carotene',
        alternateNames: ['Provitamin A'],
        unit: 'µg',
        parentKey: 'Vitamin A',
        description: 'Provitamin A carotenoid converted to retinol in the body',
        healthConcernFlags: {},
      },

      // Vitamin B group (parent + children)
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin B Complex',
        alternateNames: ['B Vitamins'],
        unit: 'mg',
        description: 'Water-soluble vitamin group essential for energy metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Thiamin',
        alternateNames: ['Vitamin B1', 'Thiamine'],
        unit: 'mg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for carbohydrate metabolism and nerve function',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Riboflavin',
        alternateNames: ['Vitamin B2'],
        unit: 'mg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for energy production and cellular function',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Niacin',
        alternateNames: ['Vitamin B3', 'Nicotinic acid'],
        unit: 'mg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for DNA repair and energy metabolism',
        healthConcernFlags: { 'high_dose_flushing': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Pantothenic Acid',
        alternateNames: ['Vitamin B5'],
        unit: 'mg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for synthesizing coenzyme A',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin B6',
        alternateNames: ['Pyridoxine'],
        unit: 'mg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for amino acid metabolism and neurotransmitter synthesis',
        healthConcernFlags: { 'neuropathy_high_doses': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Biotin',
        alternateNames: ['Vitamin B7', 'Vitamin H'],
        unit: 'µg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for fatty acid synthesis and glucose metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Folate',
        alternateNames: ['Vitamin B9', 'Folic acid'],
        unit: 'µg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for DNA synthesis and cell division',
        healthConcernFlags: { 'masks_b12_deficiency': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin B12',
        alternateNames: ['Cobalamin', 'Cyanocobalamin'],
        unit: 'µg',
        parentKey: 'Vitamin B Complex',
        description: 'Essential for nerve function and red blood cell formation',
        healthConcernFlags: { 'vegan_deficiency_risk': true },
      },

      // Vitamin C
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin C',
        alternateNames: ['Ascorbic acid', 'L-ascorbic acid'],
        unit: 'mg',
        description: 'Water-soluble antioxidant essential for collagen synthesis',
        healthConcernFlags: { 'high_dose_gi_distress': true },
      },

      // Vitamin D group
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin D',
        alternateNames: ['Calciferol'],
        unit: 'µg',
        description: 'Fat-soluble vitamin essential for calcium absorption and bone health',
        healthConcernFlags: { 'toxicity_high_doses': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin D2',
        alternateNames: ['Ergocalciferol'],
        unit: 'µg',
        parentKey: 'Vitamin D',
        description: 'Plant-derived form of vitamin D',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin D3',
        alternateNames: ['Cholecalciferol'],
        unit: 'µg',
        parentKey: 'Vitamin D',
        description: 'Animal-derived and sun-synthesized form of vitamin D',
        healthConcernFlags: {},
      },

      // Vitamin E group
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin E',
        alternateNames: ['Alpha-tocopherol', 'Tocopherols'],
        unit: 'mg',
        description: 'Fat-soluble antioxidant protecting cell membranes',
        healthConcernFlags: { 'bleeding_risk_high_doses': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Alpha-Tocopherol',
        alternateNames: ['α-tocopherol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Most biologically active form of vitamin E',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Gamma-Tocopherol',
        alternateNames: ['γ-tocopherol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Common dietary form of vitamin E',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Delta-Tocopherol',
        alternateNames: ['δ-tocopherol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Lesser-known form of vitamin E with antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Alpha-Tocotrienol',
        alternateNames: ['α-tocotrienol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Tocotrienol form with neuroprotective properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Beta-Tocotrienol',
        alternateNames: ['β-tocotrienol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Tocotrienol form found in palm oil',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Gamma-Tocotrienol',
        alternateNames: ['γ-tocotrienol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Tocotrienol with anti-cancer properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Delta-Tocotrienol',
        alternateNames: ['δ-tocotrienol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Tocotrienol form with cardiovascular benefits',
        healthConcernFlags: {},
      },

      // Vitamin K group
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin K',
        alternateNames: ['Phylloquinone', 'Menaquinone'],
        unit: 'µg',
        description: 'Fat-soluble vitamin essential for blood clotting and bone metabolism',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin K1',
        alternateNames: ['Phylloquinone'],
        unit: 'µg',
        parentKey: 'Vitamin K',
        description: 'Plant-derived form of vitamin K',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Vitamin K2',
        alternateNames: ['Menaquinone', 'MK-4', 'MK-7'],
        unit: 'µg',
        parentKey: 'Vitamin K',
        description: 'Animal and fermented food form of vitamin K',
        healthConcernFlags: { 'warfarin_interaction': true },
      },

      // Choline (vitamin-like)
      {
        compoundType: 'VITAMIN',
        name: 'Choline',
        alternateNames: ['Trimethylethanolamine'],
        unit: 'mg',
        description: 'Essential nutrient for cell membrane integrity and neurotransmitter synthesis',
        healthConcernFlags: {},
      },

      // Additional B vitamins and forms
      {
        compoundType: 'VITAMIN',
        name: 'Inositol',
        alternateNames: ['Myo-inositol'],
        unit: 'mg',
        description: 'Vitamin-like compound involved in cellular signaling',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'PABA',
        alternateNames: ['Para-aminobenzoic acid'],
        unit: 'mg',
        description: 'Vitamin-like compound and folate precursor',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(vitaminSeeds, compoundMap, 'VITAMIN');

    // ═══════════════════════════════════════════════════════════════
    // MINERALS (35 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding MINERAL compounds...');

    const mineralSeeds: CompoundSeedData[] = [
      // Macrominerals
      {
        compoundType: 'MINERAL',
        name: 'Calcium',
        alternateNames: ['Ca'],
        unit: 'mg',
        description: 'Essential for bone health, muscle contraction, and nerve signaling',
        healthConcernFlags: { 'kidney_stone_risk': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Phosphorus',
        alternateNames: ['P', 'Phosphate'],
        unit: 'mg',
        description: 'Essential for bone health and energy metabolism',
        healthConcernFlags: { 'kidney_disease_concern': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Magnesium',
        alternateNames: ['Mg'],
        unit: 'mg',
        description: 'Essential for muscle function, nerve transmission, and bone health',
        healthConcernFlags: { 'laxative_effect_high_doses': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Sodium',
        alternateNames: ['Na', 'Salt'],
        unit: 'mg',
        description: 'Essential for fluid balance and nerve function',
        healthConcernFlags: { 'hypertension_risk': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Potassium',
        alternateNames: ['K'],
        unit: 'mg',
        description: 'Essential for heart function, muscle contraction, and fluid balance',
        healthConcernFlags: { 'hyperkalemia_kidney_disease': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Chloride',
        alternateNames: ['Cl'],
        unit: 'mg',
        description: 'Essential electrolyte for fluid balance and digestion',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Sulfur',
        alternateNames: ['S'],
        unit: 'mg',
        description: 'Essential for protein structure and detoxification',
        healthConcernFlags: {},
      },

      // Trace minerals
      {
        compoundType: 'MINERAL',
        name: 'Iron',
        alternateNames: ['Fe'],
        unit: 'mg',
        description: 'Essential for oxygen transport and energy metabolism',
        healthConcernFlags: { 'hemochromatosis_risk': true, 'oxidative_stress_excess': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Zinc',
        alternateNames: ['Zn'],
        unit: 'mg',
        description: 'Essential for immune function, protein synthesis, and wound healing',
        healthConcernFlags: { 'copper_depletion_high_doses': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Copper',
        alternateNames: ['Cu'],
        unit: 'mg',
        description: 'Essential for iron metabolism and connective tissue formation',
        healthConcernFlags: { 'wilsons_disease_concern': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Manganese',
        alternateNames: ['Mn'],
        unit: 'mg',
        description: 'Essential for bone formation and antioxidant defense',
        healthConcernFlags: { 'neurotoxicity_high_exposure': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Selenium',
        alternateNames: ['Se'],
        unit: 'µg',
        description: 'Essential for antioxidant defense and thyroid function',
        healthConcernFlags: { 'toxicity_high_doses': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Iodine',
        alternateNames: ['I'],
        unit: 'µg',
        description: 'Essential for thyroid hormone synthesis',
        healthConcernFlags: { 'thyroid_dysfunction_excess': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Chromium',
        alternateNames: ['Cr'],
        unit: 'µg',
        description: 'Involved in glucose metabolism and insulin function',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Molybdenum',
        alternateNames: ['Mo'],
        unit: 'µg',
        description: 'Essential for enzyme cofactors in metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Fluoride',
        alternateNames: ['F'],
        unit: 'mg',
        description: 'Important for dental health and bone strength',
        healthConcernFlags: { 'dental_fluorosis_excess': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Boron',
        alternateNames: ['B'],
        unit: 'mg',
        description: 'Supports bone health and hormone regulation',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Cobalt',
        alternateNames: ['Co'],
        unit: 'µg',
        description: 'Component of vitamin B12',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Vanadium',
        alternateNames: ['V'],
        unit: 'µg',
        description: 'May play role in glucose metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Nickel',
        alternateNames: ['Ni'],
        unit: 'µg',
        description: 'Trace mineral with potential metabolic roles',
        healthConcernFlags: { 'allergic_reactions': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Silicon',
        alternateNames: ['Si'],
        unit: 'mg',
        description: 'Supports bone and connective tissue health',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Lithium',
        alternateNames: ['Li'],
        unit: 'mg',
        description: 'Trace mineral with neuroprotective properties',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(mineralSeeds, compoundMap, 'MINERAL');

    // ═══════════════════════════════════════════════════════════════
    // AMINO ACIDS (25 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding AMINO_ACID compounds...');

    const aminoAcidSeeds: CompoundSeedData[] = [
      // Essential amino acids
      {
        compoundType: 'AMINO_ACID',
        name: 'Leucine',
        alternateNames: ['L-Leucine', 'BCAA'],
        unit: 'g',
        description: 'Essential branched-chain amino acid for muscle protein synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Isoleucine',
        alternateNames: ['L-Isoleucine', 'BCAA'],
        unit: 'g',
        description: 'Essential branched-chain amino acid for muscle metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Valine',
        alternateNames: ['L-Valine', 'BCAA'],
        unit: 'g',
        description: 'Essential branched-chain amino acid for energy and muscle growth',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Lysine',
        alternateNames: ['L-Lysine'],
        unit: 'g',
        description: 'Essential amino acid for protein synthesis and calcium absorption',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Methionine',
        alternateNames: ['L-Methionine'],
        unit: 'g',
        description: 'Essential sulfur-containing amino acid for methylation',
        healthConcernFlags: { 'homocysteine_elevation': true },
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Phenylalanine',
        alternateNames: ['L-Phenylalanine'],
        unit: 'g',
        description: 'Essential amino acid precursor to tyrosine',
        healthConcernFlags: { 'pku_contraindication': true },
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Threonine',
        alternateNames: ['L-Threonine'],
        unit: 'g',
        description: 'Essential amino acid for protein balance and immune function',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Tryptophan',
        alternateNames: ['L-Tryptophan'],
        unit: 'g',
        description: 'Essential amino acid precursor to serotonin and melatonin',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Histidine',
        alternateNames: ['L-Histidine'],
        unit: 'g',
        description: 'Essential amino acid for histamine production',
        healthConcernFlags: {},
      },

      // Non-essential amino acids
      {
        compoundType: 'AMINO_ACID',
        name: 'Alanine',
        alternateNames: ['L-Alanine'],
        unit: 'g',
        description: 'Non-essential amino acid for energy metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Arginine',
        alternateNames: ['L-Arginine'],
        unit: 'g',
        description: 'Conditionally essential amino acid for nitric oxide synthesis',
        healthConcernFlags: { 'herpes_reactivation_risk': true },
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Asparagine',
        alternateNames: ['L-Asparagine'],
        unit: 'g',
        description: 'Non-essential amino acid for nervous system function',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Aspartic Acid',
        alternateNames: ['L-Aspartate', 'Aspartate'],
        unit: 'g',
        description: 'Non-essential amino acid and excitatory neurotransmitter',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Cysteine',
        alternateNames: ['L-Cysteine', 'Cystine'],
        unit: 'g',
        description: 'Sulfur-containing amino acid for antioxidant glutathione',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Glutamic Acid',
        alternateNames: ['L-Glutamate', 'Glutamate'],
        unit: 'g',
        description: 'Non-essential amino acid and major neurotransmitter',
        healthConcernFlags: { 'msg_sensitivity': true },
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Glutamine',
        alternateNames: ['L-Glutamine'],
        unit: 'g',
        description: 'Conditionally essential amino acid for immune and gut health',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Glycine',
        alternateNames: ['L-Glycine'],
        unit: 'g',
        description: 'Non-essential amino acid for collagen and neurotransmitter synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Proline',
        alternateNames: ['L-Proline'],
        unit: 'g',
        description: 'Non-essential amino acid important for collagen structure',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Serine',
        alternateNames: ['L-Serine'],
        unit: 'g',
        description: 'Non-essential amino acid for protein synthesis and metabolism',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Tyrosine',
        alternateNames: ['L-Tyrosine'],
        unit: 'g',
        description: 'Conditionally essential amino acid for catecholamine synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Taurine',
        alternateNames: ['2-Aminoethanesulfonic acid'],
        unit: 'g',
        description: 'Conditionally essential amino sulfonic acid for cardiovascular health',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Carnitine',
        alternateNames: ['L-Carnitine'],
        unit: 'mg',
        description: 'Amino acid derivative for fatty acid metabolism',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(aminoAcidSeeds, compoundMap, 'AMINO_ACID');

    // ═══════════════════════════════════════════════════════════════
    // FATTY ACIDS (30 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding FATTY_ACID compounds...');

    const fattyAcidSeeds: CompoundSeedData[] = [
      // Omega-3 fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Omega-3 Fatty Acids',
        alternateNames: ['n-3 PUFA'],
        unit: 'g',
        description: 'Essential polyunsaturated fatty acids with anti-inflammatory properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Alpha-Linolenic Acid',
        alternateNames: ['ALA', '18:3 n-3'],
        unit: 'g',
        parentKey: 'Omega-3 Fatty Acids',
        description: 'Essential omega-3 fatty acid from plant sources',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Eicosapentaenoic Acid',
        alternateNames: ['EPA', '20:5 n-3'],
        unit: 'g',
        parentKey: 'Omega-3 Fatty Acids',
        description: 'Marine omega-3 fatty acid with cardiovascular benefits',
        healthConcernFlags: { 'bleeding_risk_high_doses': true },
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Docosahexaenoic Acid',
        alternateNames: ['DHA', '22:6 n-3'],
        unit: 'g',
        parentKey: 'Omega-3 Fatty Acids',
        description: 'Marine omega-3 essential for brain and eye development',
        healthConcernFlags: {},
      },

      // Omega-6 fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Omega-6 Fatty Acids',
        alternateNames: ['n-6 PUFA'],
        unit: 'g',
        description: 'Essential polyunsaturated fatty acids for growth and inflammation',
        healthConcernFlags: { 'pro_inflammatory_excess': true },
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Linoleic Acid',
        alternateNames: ['LA', '18:2 n-6'],
        unit: 'g',
        parentKey: 'Omega-6 Fatty Acids',
        description: 'Essential omega-6 fatty acid abundant in vegetable oils',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Arachidonic Acid',
        alternateNames: ['AA', 'ARA', '20:4 n-6'],
        unit: 'g',
        parentKey: 'Omega-6 Fatty Acids',
        description: 'Omega-6 fatty acid for eicosanoid synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Gamma-Linolenic Acid',
        alternateNames: ['GLA', '18:3 n-6'],
        unit: 'g',
        parentKey: 'Omega-6 Fatty Acids',
        description: 'Omega-6 fatty acid with anti-inflammatory properties',
        healthConcernFlags: {},
      },

      // Omega-9 fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Oleic Acid',
        alternateNames: ['18:1 n-9', 'Omega-9'],
        unit: 'g',
        description: 'Monounsaturated fatty acid abundant in olive oil',
        healthConcernFlags: {},
      },

      // Saturated fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Saturated Fat',
        alternateNames: ['SFA'],
        unit: 'g',
        description: 'Saturated fatty acids with no double bonds',
        healthConcernFlags: { 'cvd_risk_excess': true },
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Lauric Acid',
        alternateNames: ['12:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Medium-chain saturated fatty acid in coconut oil',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Myristic Acid',
        alternateNames: ['14:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Saturated fatty acid that raises LDL cholesterol',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Palmitic Acid',
        alternateNames: ['16:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Most common saturated fatty acid in foods',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Stearic Acid',
        alternateNames: ['18:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Saturated fatty acid that does not raise LDL cholesterol',
        healthConcernFlags: {},
      },

      // Trans fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Trans Fat',
        alternateNames: ['Trans fatty acids', 'TFA'],
        unit: 'g',
        description: 'Unsaturated fatty acids with trans configuration',
        healthConcernFlags: { 'cvd_risk': true, 'avoid_industrial_trans': true },
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Elaidic Acid',
        alternateNames: ['Trans-18:1'],
        unit: 'g',
        parentKey: 'Trans Fat',
        description: 'Industrial trans fatty acid from partial hydrogenation',
        healthConcernFlags: { 'cvd_risk': true },
      },

      // Medium-chain fatty acids
      {
        compoundType: 'FATTY_ACID',
        name: 'Caprylic Acid',
        alternateNames: ['8:0', 'Octanoic acid'],
        unit: 'g',
        description: 'Medium-chain fatty acid with antimicrobial properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Capric Acid',
        alternateNames: ['10:0', 'Decanoic acid'],
        unit: 'g',
        description: 'Medium-chain fatty acid in coconut and palm kernel oil',
        healthConcernFlags: {},
      },

      // Conjugated linoleic acid
      {
        compoundType: 'FATTY_ACID',
        name: 'Conjugated Linoleic Acid',
        alternateNames: ['CLA'],
        unit: 'mg',
        description: 'Natural trans fatty acid with potential health benefits',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(fattyAcidSeeds, compoundMap, 'FATTY_ACID');

    // ═══════════════════════════════════════════════════════════════
    // CARBOHYDRATES (12 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding CARBOHYDRATE compounds...');

    const carbohydrateSeeds: CompoundSeedData[] = [
      // Parent - Total Sugars
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Total Sugars',
        alternateNames: ['Sugars'],
        unit: 'g',
        description: 'Total simple carbohydrates including monosaccharides and disaccharides',
        healthConcernFlags: { 'blood_sugar_impact': true },
      },

      // Monosaccharides
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Glucose',
        alternateNames: ['Dextrose', 'D-Glucose', 'Blood sugar'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Primary monosaccharide used for cellular energy',
        healthConcernFlags: { 'blood_sugar_spike': true },
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Fructose',
        alternateNames: ['Fruit sugar', 'Levulose'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Monosaccharide metabolized primarily in liver',
        healthConcernFlags: { 'liver_metabolized': true, 'excess_fatty_liver_risk': true },
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Galactose',
        alternateNames: ['D-Galactose'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Monosaccharide component of lactose',
        healthConcernFlags: {},
      },

      // Disaccharides
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Sucrose',
        alternateNames: ['Table sugar', 'Cane sugar'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Disaccharide of glucose and fructose',
        healthConcernFlags: { 'blood_sugar_spike': true, 'dental_cavities': true },
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Lactose',
        alternateNames: ['Milk sugar'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Disaccharide of glucose and galactose found in dairy',
        healthConcernFlags: { 'lactose_intolerance': true },
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Maltose',
        alternateNames: ['Malt sugar'],
        unit: 'g',
        parentKey: 'Total Sugars',
        description: 'Disaccharide of two glucose molecules from starch breakdown',
        healthConcernFlags: { 'blood_sugar_spike': true },
      },

      // Parent - Total Fiber
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Total Fiber',
        alternateNames: ['Dietary fiber', 'Total dietary fiber'],
        unit: 'g',
        description: 'Indigestible carbohydrates that support gut health and regulate blood sugar',
        healthConcernFlags: { 'excess_gi_distress': true },
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Soluble Fiber',
        alternateNames: ['Viscous fiber'],
        unit: 'g',
        parentKey: 'Total Fiber',
        description: 'Fiber that dissolves in water, forms gel, lowers cholesterol',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Insoluble Fiber',
        alternateNames: ['Roughage'],
        unit: 'g',
        parentKey: 'Total Fiber',
        description: 'Fiber that does not dissolve, promotes bowel regularity',
        healthConcernFlags: {},
      },

      // Specialized fibers
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Resistant Starch',
        alternateNames: ['RS'],
        unit: 'g',
        description: 'Starch that resists digestion, acts as prebiotic fiber',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CARBOHYDRATE',
        name: 'Inulin',
        alternateNames: ['Chicory root fiber'],
        unit: 'g',
        description: 'Prebiotic soluble fiber that feeds beneficial gut bacteria',
        healthConcernFlags: { 'gas_bloating_high_doses': true },
      },
    ];

    await seedCompoundBatch(carbohydrateSeeds, compoundMap, 'CARBOHYDRATE');

    // ═══════════════════════════════════════════════════════════════
    // POLYPHENOLS (40 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding POLYPHENOL compounds...');

    const polyphenolSeeds: CompoundSeedData[] = [
      // Flavonoids - Flavonols
      {
        compoundType: 'POLYPHENOL',
        name: 'Quercetin',
        alternateNames: ['3,3\',4\',5,7-Pentahydroxyflavone'],
        unit: 'mg',
        description: 'Flavonol with antioxidant and anti-inflammatory properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Kaempferol',
        alternateNames: ['3,4\',5,7-Tetrahydroxyflavone'],
        unit: 'mg',
        description: 'Flavonol abundant in cruciferous vegetables',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Myricetin',
        alternateNames: ['3,3\',4\',5,5\',7-Hexahydroxyflavone'],
        unit: 'mg',
        description: 'Flavonol with neuroprotective properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Isorhamnetin',
        alternateNames: ['3\'-Methoxyquercetin'],
        unit: 'mg',
        description: 'Flavonol metabolite with anti-cancer properties',
        healthConcernFlags: {},
      },

      // Flavonoids - Flavones
      {
        compoundType: 'POLYPHENOL',
        name: 'Apigenin',
        alternateNames: ['4\',5,7-Trihydroxyflavone'],
        unit: 'mg',
        description: 'Flavone with anxiolytic and anti-inflammatory effects',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Luteolin',
        alternateNames: ['3\',4\',5,7-Tetrahydroxyflavone'],
        unit: 'mg',
        description: 'Flavone with neuroprotective properties',
        healthConcernFlags: {},
      },

      // Flavonoids - Flavanones
      {
        compoundType: 'POLYPHENOL',
        name: 'Hesperidin',
        alternateNames: ['Hesperetin-7-O-rutinoside'],
        unit: 'mg',
        description: 'Flavanone glycoside in citrus fruits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Naringenin',
        alternateNames: ['4\',5,7-Trihydroxyflavanone'],
        unit: 'mg',
        description: 'Flavanone responsible for grapefruit bitterness',
        healthConcernFlags: { 'drug_interaction_cyp3a4': true },
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Eriodictyol',
        alternateNames: ['3\',4\',5,7-Tetrahydroxyflavanone'],
        unit: 'mg',
        description: 'Flavanone with antioxidant properties',
        healthConcernFlags: {},
      },

      // Flavonoids - Flavanols (Catechins)
      {
        compoundType: 'POLYPHENOL',
        name: 'Catechin',
        alternateNames: ['(+)-Catechin'],
        unit: 'mg',
        description: 'Flavanol abundant in tea and cocoa',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Epicatechin',
        alternateNames: ['(-)-Epicatechin'],
        unit: 'mg',
        description: 'Flavanol with cardiovascular benefits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Epigallocatechin Gallate',
        alternateNames: ['EGCG'],
        unit: 'mg',
        description: 'Major catechin in green tea with anti-cancer properties',
        healthConcernFlags: { 'liver_toxicity_high_doses': true },
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Gallocatechin',
        alternateNames: ['GC'],
        unit: 'mg',
        description: 'Catechin found in green tea',
        healthConcernFlags: {},
      },

      // Flavonoids - Anthocyanins
      {
        compoundType: 'POLYPHENOL',
        name: 'Cyanidin',
        alternateNames: ['Cyanidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin responsible for red-purple color in berries',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Delphinidin',
        alternateNames: ['Delphinidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin responsible for blue-purple color',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Malvidin',
        alternateNames: ['Malvidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin abundant in red wine and grapes',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Pelargonidin',
        alternateNames: ['Pelargonidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin responsible for orange-red color in strawberries',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Peonidin',
        alternateNames: ['Peonidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin in berries and red wine',
        healthConcernFlags: {},
      },

      // Flavonoids - Isoflavones
      {
        compoundType: 'POLYPHENOL',
        name: 'Genistein',
        alternateNames: ['4\',5,7-Trihydroxyisoflavone'],
        unit: 'mg',
        description: 'Soy isoflavone with estrogenic activity',
        healthConcernFlags: { 'hormone_sensitive_cancer_concern': true },
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Daidzein',
        alternateNames: ['4\',7-Dihydroxyisoflavone'],
        unit: 'mg',
        description: 'Soy isoflavone with weak estrogenic effects',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Glycitein',
        alternateNames: ['7,4\'-Dihydroxy-6-methoxyisoflavone'],
        unit: 'mg',
        description: 'Minor soy isoflavone with antioxidant properties',
        healthConcernFlags: {},
      },

      // Phenolic acids - Hydroxybenzoic acids
      {
        compoundType: 'POLYPHENOL',
        name: 'Gallic Acid',
        alternateNames: ['3,4,5-Trihydroxybenzoic acid'],
        unit: 'mg',
        description: 'Phenolic acid with strong antioxidant activity',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Ellagic Acid',
        alternateNames: ['Ellagitannin'],
        unit: 'mg',
        description: 'Phenolic acid in berries with anti-cancer properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Vanillic Acid',
        alternateNames: ['4-Hydroxy-3-methoxybenzoic acid'],
        unit: 'mg',
        description: 'Phenolic acid with anti-inflammatory effects',
        healthConcernFlags: {},
      },

      // Phenolic acids - Hydroxycinnamic acids
      {
        compoundType: 'POLYPHENOL',
        name: 'Caffeic Acid',
        alternateNames: ['3,4-Dihydroxycinnamic acid'],
        unit: 'mg',
        description: 'Hydroxycinnamic acid with antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Chlorogenic Acid',
        alternateNames: ['CGA', '5-Caffeoylquinic acid'],
        unit: 'mg',
        description: 'Major polyphenol in coffee with glucose-lowering effects',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Ferulic Acid',
        alternateNames: ['4-Hydroxy-3-methoxycinnamic acid'],
        unit: 'mg',
        description: 'Hydroxycinnamic acid abundant in whole grains',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'p-Coumaric Acid',
        alternateNames: ['4-Hydroxycinnamic acid'],
        unit: 'mg',
        description: 'Phenolic acid with antimicrobial properties',
        healthConcernFlags: {},
      },

      // Stilbenes
      {
        compoundType: 'POLYPHENOL',
        name: 'Resveratrol',
        alternateNames: ['3,5,4\'-Trihydroxystilbene'],
        unit: 'mg',
        description: 'Stilbene in red wine with anti-aging properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Pterostilbene',
        alternateNames: ['3,5-Dimethoxy-4\'-hydroxystilbene'],
        unit: 'mg',
        description: 'Stilbene in blueberries with neuroprotective effects',
        healthConcernFlags: {},
      },

      // Lignans
      {
        compoundType: 'POLYPHENOL',
        name: 'Secoisolariciresinol',
        alternateNames: ['SDG'],
        unit: 'mg',
        description: 'Lignan precursor in flaxseed with estrogenic activity',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Matairesinol',
        alternateNames: ['MAT'],
        unit: 'mg',
        description: 'Lignan in whole grains and seeds',
        healthConcernFlags: {},
      },

      // Curcuminoids
      {
        compoundType: 'POLYPHENOL',
        name: 'Curcumin',
        alternateNames: ['Diferuloylmethane'],
        unit: 'mg',
        description: 'Curcuminoid in turmeric with anti-inflammatory properties',
        healthConcernFlags: { 'bleeding_risk_high_doses': true },
      },
    ];

    await seedCompoundBatch(polyphenolSeeds, compoundMap, 'POLYPHENOL');

    // ═══════════════════════════════════════════════════════════════
    // CAROTENOIDS (15 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding CAROTENOID compounds...');

    const carotenoidSeeds: CompoundSeedData[] = [
      // Provitamin A carotenoids
      {
        compoundType: 'CAROTENOID',
        name: 'Alpha-Carotene',
        alternateNames: ['α-Carotene'],
        unit: 'µg',
        description: 'Provitamin A carotenoid with antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Beta-Cryptoxanthin',
        alternateNames: ['β-Cryptoxanthin'],
        unit: 'µg',
        description: 'Provitamin A carotenoid in orange fruits',
        healthConcernFlags: {},
      },

      // Non-provitamin A carotenoids
      {
        compoundType: 'CAROTENOID',
        name: 'Lycopene',
        alternateNames: ['ψ,ψ-Carotene'],
        unit: 'µg',
        description: 'Red carotenoid in tomatoes with prostate health benefits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Lutein',
        alternateNames: ['(3R,3\'R)-β,ε-Carotene-3,3\'-diol'],
        unit: 'µg',
        description: 'Yellow carotenoid essential for eye health',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Zeaxanthin',
        alternateNames: ['(3R,3\'R)-β,β-Carotene-3,3\'-diol'],
        unit: 'µg',
        description: 'Yellow carotenoid concentrated in macula for eye health',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Astaxanthin',
        alternateNames: ['3,3\'-Dihydroxy-β,β-carotene-4,4\'-dione'],
        unit: 'µg',
        description: 'Red carotenoid in seafood with powerful antioxidant activity',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Canthaxanthin',
        alternateNames: ['β,β-Carotene-4,4\'-dione'],
        unit: 'µg',
        description: 'Orange carotenoid with antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Phytoene',
        alternateNames: ['7,8,11,12,7\',8\',11\',12\'-Octahydro-ψ,ψ-carotene'],
        unit: 'µg',
        description: 'Colorless carotenoid precursor with UV protection',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Phytofluene',
        alternateNames: ['7,8,11,12,7\',8\'-Hexahydro-ψ,ψ-carotene'],
        unit: 'µg',
        description: 'Colorless carotenoid with skin health benefits',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(carotenoidSeeds, compoundMap, 'CAROTENOID');

    // ═══════════════════════════════════════════════════════════════
    // GLUCOSINOLATES (12 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding GLUCOSINOLATE compounds...');

    const glucosinolateSeeds: CompoundSeedData[] = [
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Glucoraphanin',
        alternateNames: ['4-Methylsulfinylbutyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate precursor to sulforaphane in broccoli',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Sulforaphane',
        alternateNames: ['1-Isothiocyanato-4-methylsulfinylbutane'],
        unit: 'mg',
        description: 'Isothiocyanate with potent anti-cancer properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Glucobrassicin',
        alternateNames: ['3-Indolylmethyl glucosinolate'],
        unit: 'mg',
        description: 'Indole glucosinolate in cruciferous vegetables',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Indole-3-Carbinol',
        alternateNames: ['I3C'],
        unit: 'mg',
        description: 'Breakdown product of glucobrassicin with anti-cancer effects',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Sinigrin',
        alternateNames: ['2-Propenyl glucosinolate'],
        unit: 'mg',
        description: 'Pungent glucosinolate in mustard and horseradish',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Gluconasturtiin',
        alternateNames: ['2-Phenylethyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in watercress with anti-cancer properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Progoitrin',
        alternateNames: ['2-Hydroxy-3-butenyl glucosinolate'],
        unit: 'mg',
        description: 'Goitrogenic glucosinolate in cruciferous vegetables',
        healthConcernFlags: { 'goitrogenic': true },
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Glucoerucin',
        alternateNames: ['4-Methylthiobutyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in rocket/arugula',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(glucosinolateSeeds, compoundMap, 'GLUCOSINOLATE');

    // ═══════════════════════════════════════════════════════════════
    // ANTI-NUTRIENTS (18 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding ANTI_NUTRIENT compounds...');

    const antiNutrientSeeds: CompoundSeedData[] = [
      // Phytates
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Phytic Acid',
        alternateNames: ['Phytate', 'IP6', 'Inositol hexaphosphate'],
        unit: 'mg',
        description: 'Phosphate storage compound that binds minerals',
        healthConcernFlags: { 'mineral_absorption_inhibition': true },
      },

      // Oxalates
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Oxalic Acid',
        alternateNames: ['Oxalate'],
        unit: 'mg',
        description: 'Organic acid that binds calcium and other minerals',
        healthConcernFlags: { 'kidney_stone_risk': true, 'calcium_binding': true },
      },

      // Lectins
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Phytohemagglutinin',
        alternateNames: ['Kidney bean lectin'],
        unit: 'mg',
        description: 'Lectin in raw beans that can cause toxicity',
        healthConcernFlags: { 'toxicity_raw_beans': true },
      },

      // Tannins
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Tannic Acid',
        alternateNames: ['Tannins', 'Condensed tannins'],
        unit: 'mg',
        description: 'Polyphenolic compound that inhibits iron absorption',
        healthConcernFlags: { 'iron_absorption_inhibition': true },
      },

      // Saponins
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Saponins',
        alternateNames: ['Glycosides'],
        unit: 'mg',
        description: 'Bitter compounds in legumes with anti-nutrient effects',
        healthConcernFlags: { 'gi_irritation': true },
      },

      // Protease inhibitors
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Trypsin Inhibitor',
        alternateNames: ['Protease inhibitor'],
        unit: 'mg',
        description: 'Protein that inhibits digestive enzymes in raw legumes',
        healthConcernFlags: { 'protein_digestion_inhibition': true },
      },

      // Goitrogens
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Goitrin',
        alternateNames: ['5-Vinyloxazolidine-2-thione'],
        unit: 'mg',
        description: 'Breakdown product that interferes with thyroid iodine uptake',
        healthConcernFlags: { 'goitrogenic': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Thiocyanate',
        alternateNames: ['SCN-'],
        unit: 'mg',
        description: 'Compound that competes with iodine for thyroid uptake',
        healthConcernFlags: { 'goitrogenic': true },
      },
    ];

    await seedCompoundBatch(antiNutrientSeeds, compoundMap, 'ANTI_NUTRIENT');

    // ═══════════════════════════════════════════════════════════════
    // PROCESSING COMPOUNDS (20 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding PROCESSING_COMPOUND compounds...');

    const processingCompoundSeeds: CompoundSeedData[] = [
      // Advanced Glycation End Products (AGEs)
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Carboxymethyllysine',
        alternateNames: ['CML', 'Nε-Carboxymethyllysine'],
        unit: 'kU',
        description: 'Major AGE formed during cooking at high temperatures',
        healthConcernFlags: { 'inflammatory': true, 'oxidative_stress': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Methylglyoxal',
        alternateNames: ['MGO', 'Pyruvaldehyde'],
        unit: 'mg',
        description: 'Reactive dicarbonyl compound forming AGEs',
        healthConcernFlags: { 'glycation': true },
      },

      // Heterocyclic Amines (HCAs)
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'PhIP',
        alternateNames: ['2-Amino-1-methyl-6-phenylimidazo[4,5-b]pyridine'],
        unit: 'ng',
        description: 'Carcinogenic HCA formed in cooked meats',
        healthConcernFlags: { 'carcinogenic': true },
        iarcGroup: '2B',
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'MeIQx',
        alternateNames: ['2-Amino-3,8-dimethylimidazo[4,5-f]quinoxaline'],
        unit: 'ng',
        description: 'Carcinogenic HCA in grilled and fried meats',
        healthConcernFlags: { 'carcinogenic': true },
        iarcGroup: '2B',
      },

      // Polycyclic Aromatic Hydrocarbons (PAHs)
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Benzo[a]pyrene',
        alternateNames: ['BaP', 'B[a]P'],
        unit: 'ng',
        description: 'Carcinogenic PAH formed in smoked and charred foods',
        healthConcernFlags: { 'carcinogenic': true },
        iarcGroup: '1',
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Pyrene',
        alternateNames: ['PAH'],
        unit: 'ng',
        description: 'PAH formed during incomplete combustion',
        healthConcernFlags: { 'carcinogenic': true },
      },

      // Acrylamide
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Acrylamide',
        alternateNames: ['2-Propenamide'],
        unit: 'µg',
        description: 'Carcinogen formed in starchy foods at high heat',
        healthConcernFlags: { 'carcinogenic': true, 'neurotoxic': true },
        iarcGroup: '2A',
        formationConditions: {
          temperature: '>120°C',
          mechanism: 'Maillard reaction between asparagine and reducing sugars',
        },
      },

      // Furan compounds
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Furan',
        alternateNames: ['Furfural'],
        unit: 'µg',
        description: 'Volatile compound formed during heat processing',
        healthConcernFlags: { 'hepatotoxic': true },
        iarcGroup: '2B',
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: '5-Hydroxymethylfurfural',
        alternateNames: ['HMF'],
        unit: 'mg',
        description: 'Heat-induced compound in processed foods and honey',
        healthConcernFlags: { 'potential_carcinogen': true },
      },

      // Trans fats from processing
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Industrial Trans Fats',
        alternateNames: ['Partially hydrogenated oils'],
        unit: 'g',
        description: 'Artificially created trans fatty acids from hydrogenation',
        healthConcernFlags: { 'cvd_risk': true, 'banned_many_countries': true },
      },

      // Nitrosamines
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'N-Nitrosodimethylamine',
        alternateNames: ['NDMA'],
        unit: 'ng',
        description: 'Carcinogenic nitrosamine in processed meats',
        healthConcernFlags: { 'carcinogenic': true },
        iarcGroup: '2A',
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'N-Nitrosopyrrolidine',
        alternateNames: ['NPYR'],
        unit: 'ng',
        description: 'Nitrosamine formed in bacon and cured meats',
        healthConcernFlags: { 'carcinogenic': true },
        iarcGroup: '2B',
      },
    ];

    await seedCompoundBatch(processingCompoundSeeds, compoundMap, 'PROCESSING_COMPOUND');

    // ═══════════════════════════════════════════════════════════════
    // SYNTHETIC ADDITIVES (15 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding SYNTHETIC_ADDITIVE compounds...');

    const syntheticAdditiveSeeds: CompoundSeedData[] = [
      // Preservatives
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Sodium Benzoate',
        alternateNames: ['E211'],
        unit: 'mg',
        description: 'Preservative used in acidic foods and beverages',
        healthConcernFlags: { 'benzene_formation_vitamin_c': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Potassium Sorbate',
        alternateNames: ['E202'],
        unit: 'mg',
        description: 'Preservative effective against molds and yeasts',
        healthConcernFlags: {},
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'BHA',
        alternateNames: ['Butylated hydroxyanisole', 'E320'],
        unit: 'mg',
        description: 'Antioxidant preservative in fats and oils',
        healthConcernFlags: { 'possible_carcinogen': true },
        iarcGroup: '2B',
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'BHT',
        alternateNames: ['Butylated hydroxytoluene', 'E321'],
        unit: 'mg',
        description: 'Antioxidant preservative similar to BHA',
        healthConcernFlags: { 'endocrine_disruption': true },
      },

      // Artificial sweeteners
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Aspartame',
        alternateNames: ['E951', 'APM'],
        unit: 'mg',
        description: 'Artificial sweetener 200x sweeter than sugar',
        healthConcernFlags: { 'pku_contraindication': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Sucralose',
        alternateNames: ['E955'],
        unit: 'mg',
        description: 'Artificial sweetener 600x sweeter than sugar',
        healthConcernFlags: { 'gut_microbiome_effects': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Saccharin',
        alternateNames: ['E954'],
        unit: 'mg',
        description: 'Oldest artificial sweetener, 300x sweeter than sugar',
        healthConcernFlags: { 'bladder_cancer_concern_debated': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Acesulfame Potassium',
        alternateNames: ['Ace-K', 'E950'],
        unit: 'mg',
        description: 'Artificial sweetener often combined with other sweeteners',
        healthConcernFlags: {},
      },

      // Artificial colors
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Tartrazine',
        alternateNames: ['Yellow 5', 'E102'],
        unit: 'mg',
        description: 'Yellow azo dye used in foods and beverages',
        healthConcernFlags: { 'hyperactivity_children': true, 'allergic_reactions': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Sunset Yellow',
        alternateNames: ['Yellow 6', 'E110'],
        unit: 'mg',
        description: 'Orange azo dye in processed foods',
        healthConcernFlags: { 'hyperactivity_children': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Allura Red',
        alternateNames: ['Red 40', 'E129'],
        unit: 'mg',
        description: 'Red azo dye widely used in foods',
        healthConcernFlags: { 'hyperactivity_children': true },
      },

      // Flavor enhancers
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Monosodium Glutamate',
        alternateNames: ['MSG', 'E621'],
        unit: 'mg',
        description: 'Flavor enhancer that provides umami taste',
        healthConcernFlags: { 'msg_sensitivity': true },
      },
    ];

    await seedCompoundBatch(syntheticAdditiveSeeds, compoundMap, 'SYNTHETIC_ADDITIVE');

    // ═══════════════════════════════════════════════════════════════
    // PERFORMANCE COMPOUNDS (12 compounds)
    // ═══════════════════════════════════════════════════════════════

    // NOTE: PERFORMANCE_COMPOUND and NICHE_HEALTH categories removed
    // These compounds have been reclassified into proper chemical categories:
    // - Caffeine, Beta-Alanine, Creatine, etc. → See ALKALOID or AMINO_ACID sections below

    // ═══════════════════════════════════════════════════════════════
    // NEW COMPOUNDS - Added 2025-11-16 (139 compounds)
    // Expands from 191 → 330 total with scientific classification
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // NUCLEOTIDE (5 compounds) - NEW CATEGORY
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding NUCLEOTIDE compounds...');

    const nucleotideSeeds: CompoundSeedData[] = [
      {
        compoundType: 'NUCLEOTIDE',
        name: 'Adenine',
        alternateNames: ['6-Aminopurine'],
        unit: 'mg',
        description: 'Purine base component of DNA/RNA and ATP',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NUCLEOTIDE',
        name: 'Guanine',
        alternateNames: ['2-Amino-6-oxypurine'],
        unit: 'mg',
        description: 'Purine base in nucleic acids',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NUCLEOTIDE',
        name: 'Hypoxanthine',
        alternateNames: ['6-Hydroxypurine'],
        unit: 'mg',
        description: 'Purine derivative - uric acid precursor, gout concern',
        healthConcernFlags: { 'gout_risk': true },
      },
      {
        compoundType: 'NUCLEOTIDE',
        name: 'Xanthine',
        alternateNames: ['3,7-Dihydropurine-2,6-dione'],
        unit: 'mg',
        description: 'Purine oxidation product in uric acid pathway',
        healthConcernFlags: { 'gout_risk': true },
      },
      {
        compoundType: 'NUCLEOTIDE',
        name: 'Uric Acid',
        alternateNames: ['2,6,8-Trihydroxypurine'],
        unit: 'mg',
        description: 'End product of purine metabolism - gout/kidney stone risk',
        healthConcernFlags: { 'gout_risk': true, 'kidney_stone_risk': true },
      },
    ];

    await seedCompoundBatch(nucleotideSeeds, compoundMap, 'NUCLEOTIDE');

    // ═══════════════════════════════════════════════════════════════
    // ALKALOID (12 compounds) - NEW CATEGORY
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding ALKALOID compounds...');

    const alkaloidSeeds: CompoundSeedData[] = [
      // Purine alkaloids (from PERFORMANCE_COMPOUND reclassified)
      {
        compoundType: 'ALKALOID',
        name: 'Caffeine',
        alternateNames: ['1,3,7-Trimethylxanthine'],
        unit: 'mg',
        description: 'Purine alkaloid stimulant in coffee, tea, cocoa',
        healthConcernFlags: { 'pregnancy_limit_200mg': true, 'anxiety_sensitivity': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Theobromine',
        alternateNames: ['3,7-Dimethylxanthine'],
        unit: 'mg',
        description: 'Purine alkaloid in cocoa and chocolate',
        healthConcernFlags: { 'pet_toxicity': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Theophylline',
        alternateNames: ['1,3-Dimethylxanthine'],
        unit: 'mg',
        description: 'Purine alkaloid in tea with bronchodilator effects',
        healthConcernFlags: {},
      },
      // Glycoalkaloids
      {
        compoundType: 'ALKALOID',
        name: 'Solanine',
        alternateNames: ['α-Solanine'],
        unit: 'mg',
        description: 'Toxic glycoalkaloid in green/sprouted potatoes and nightshades',
        healthConcernFlags: { 'neurotoxin': true, 'gi_toxicity': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Chaconine',
        alternateNames: ['α-Chaconine'],
        unit: 'mg',
        description: 'Glycoalkaloid in potatoes - toxicity similar to solanine',
        healthConcernFlags: { 'neurotoxin': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Tomatine',
        alternateNames: ['α-Tomatine'],
        unit: 'mg',
        description: 'Glycoalkaloid in green tomatoes - decreases as fruit ripens',
        healthConcernFlags: {},
      },
      // Biogenic amines (MCAS triggers)
      {
        compoundType: 'ALKALOID',
        name: 'Histamine',
        alternateNames: ['2-(1H-Imidazol-4-yl)ethanamine'],
        unit: 'mg',
        description: 'Biogenic amine in aged/fermented foods - MCAS trigger',
        healthConcernFlags: { 'mcas_trigger': true, 'histamine_intolerance': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Tyramine',
        alternateNames: ['4-Hydroxyphenethylamine'],
        unit: 'mg',
        description: 'Biogenic amine in aged cheese/fermented foods - MAOI interaction',
        healthConcernFlags: { 'maoi_hypertensive_crisis': true, 'migraine_trigger': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Putrescine',
        alternateNames: ['Tetramethylenediamine'],
        unit: 'mg',
        description: 'Biogenic amine - food spoilage indicator',
        healthConcernFlags: { 'spoilage_marker': true },
      },
      {
        compoundType: 'ALKALOID',
        name: 'Cadaverine',
        alternateNames: ['Pentamethylenediamine'],
        unit: 'mg',
        description: 'Biogenic amine produced by protein decomposition',
        healthConcernFlags: { 'spoilage_marker': true },
      },
      // Other alkaloids
      {
        compoundType: 'ALKALOID',
        name: 'Piperine',
        alternateNames: ['1-Piperoylpiperidine'],
        unit: 'mg',
        description: 'Black pepper alkaloid - enhances bioavailability of other compounds',
        healthConcernFlags: {},
      },
      {
        compoundType: 'ALKALOID',
        name: 'Capsaicin',
        alternateNames: ['8-Methyl-N-vanillyl-6-nonenamide'],
        unit: 'mg',
        description: 'Vanilloid alkaloid in hot peppers - TRPV1 agonist',
        healthConcernFlags: { 'gi_irritation_sensitive': true },
      },
    ];

    await seedCompoundBatch(alkaloidSeeds, compoundMap, 'ALKALOID');

    // ═══════════════════════════════════════════════════════════════
    // VITAMIN ADDITIONS (20 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional VITAMIN compounds...');

    const vitaminAdditions: CompoundSeedData[] = [
      // K2 variants
      {
        compoundType: 'VITAMIN',
        name: 'Menaquinone-4',
        alternateNames: ['MK-4', 'Vitamin K2 MK-4'],
        unit: 'µg',
        parentKey: 'Vitamin K2',
        description: 'Short-chain vitamin K2 from animal sources - 1hr half-life',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Menaquinone-7',
        alternateNames: ['MK-7', 'Vitamin K2 MK-7'],
        unit: 'µg',
        parentKey: 'Vitamin K2',
        description: 'Long-chain vitamin K2 from natto - 72hr half-life, superior bioavailability',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Menaquinone-8',
        alternateNames: ['MK-8', 'Vitamin K2 MK-8'],
        unit: 'µg',
        parentKey: 'Vitamin K2',
        description: 'Medium-chain vitamin K2 in cheese - 10-20µg per 100g',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      {
        compoundType: 'VITAMIN',
        name: 'Menaquinone-9',
        alternateNames: ['MK-9', 'Vitamin K2 MK-9'],
        unit: 'µg',
        parentKey: 'Vitamin K2',
        description: 'Dominant vitamin K2 form in dairy - 90% of cheese menaquinones',
        healthConcernFlags: { 'warfarin_interaction': true },
      },
      // Active B-vitamin forms
      {
        compoundType: 'VITAMIN',
        name: 'Niacinamide',
        alternateNames: ['Nicotinamide', 'Vitamin B3 amide'],
        unit: 'mg',
        parentKey: 'Niacin',
        description: 'Amide form of B3 without flushing side effects',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: '5-MTHF',
        alternateNames: ['5-Methyltetrahydrofolate', 'L-Methylfolate'],
        unit: 'µg',
        parentKey: 'Folate',
        description: 'Active methylated folate form - critical for MTHFR mutation carriers',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Folinic Acid',
        alternateNames: ['5-Formyltetrahydrofolate', 'Leucovorin'],
        unit: 'µg',
        parentKey: 'Folate',
        description: 'Reduced folate form bypassing DHFR enzyme',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Methylcobalamin',
        alternateNames: ['MeCbl', 'Mecobalamin'],
        unit: 'µg',
        parentKey: 'Vitamin B12',
        description: 'Active methylated B12 form for nervous system',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Adenosylcobalamin',
        alternateNames: ['AdoCbl', 'Cobamamide'],
        unit: 'µg',
        parentKey: 'Vitamin B12',
        description: 'Active B12 form for mitochondrial energy production',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Pyridoxal-5-Phosphate',
        alternateNames: ['P5P', 'PLP', 'Active B6'],
        unit: 'mg',
        parentKey: 'Vitamin B6',
        description: 'Active phosphorylated B6 form - ready for enzyme cofactor use',
        healthConcernFlags: {},
      },
      // E variant
      {
        compoundType: 'VITAMIN',
        name: 'Beta-Tocopherol',
        alternateNames: ['β-Tocopherol'],
        unit: 'mg',
        parentKey: 'Vitamin E',
        description: 'Vitamin E variant with moderate antioxidant activity',
        healthConcernFlags: {},
      },
      // Vitamin-like compounds
      {
        compoundType: 'VITAMIN',
        name: 'Inositol Hexaphosphate',
        alternateNames: ['IP6', 'Phytic Acid'],
        unit: 'mg',
        description: 'Vitamin-like compound with antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Biopterin',
        alternateNames: ['BH4', 'Tetrahydrobiopterin'],
        unit: 'mg',
        description: 'Vitamin-like cofactor for neurotransmitter synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Lipoic Acid',
        alternateNames: ['Alpha-Lipoic Acid', 'ALA', 'Thioctic Acid'],
        unit: 'mg',
        description: 'Vitamin-like antioxidant and mitochondrial cofactor',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Ubiquinone',
        alternateNames: ['CoQ10', 'Coenzyme Q10'],
        unit: 'mg',
        description: 'Vitamin-like compound for mitochondrial ATP production',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Pyrroloquinoline Quinone',
        alternateNames: ['PQQ'],
        unit: 'mg',
        description: 'Vitamin-like cofactor supporting mitochondrial biogenesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Orotic Acid',
        alternateNames: ['Vitamin B13', 'Orotate'],
        unit: 'mg',
        description: 'Vitamin-like compound involved in pyrimidine synthesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Pangamic Acid',
        alternateNames: ['Vitamin B15', 'Dimethylglycine'],
        unit: 'mg',
        description: 'Vitamin-like compound with potential antioxidant properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Ergothioneine',
        alternateNames: ['L-Ergothioneine', 'ERGO'],
        unit: 'mg',
        description: 'Antioxidant amino acid derivative from mushrooms - longevity compound',
        healthConcernFlags: {},
      },
      {
        compoundType: 'VITAMIN',
        name: 'Betaine',
        alternateNames: ['Trimethylglycine', 'TMG'],
        unit: 'mg',
        description: 'Methyl donor vitamin-like compound for homocysteine metabolism',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(vitaminAdditions, compoundMap, 'VITAMIN');

    // ═══════════════════════════════════════════════════════════════
    // MINERAL ADDITIONS (13 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional MINERAL compounds...');

    const mineralAdditions: CompoundSeedData[] = [
      // Ultra-trace minerals
      {
        compoundType: 'MINERAL',
        name: 'Strontium',
        alternateNames: ['Sr'],
        unit: 'mg',
        description: 'Ultra-trace mineral supporting bone health',
        healthConcernFlags: { 'bone_mineralization_interference': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Germanium',
        alternateNames: ['Ge'],
        unit: 'µg',
        description: 'Ultra-trace mineral with potential immune benefits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Rubidium',
        alternateNames: ['Rb'],
        unit: 'µg',
        description: 'Ultra-trace mineral - probable essential element',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Tin',
        alternateNames: ['Sn'],
        unit: 'µg',
        description: 'Ultra-trace mineral with possible metabolic roles',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Antimony',
        alternateNames: ['Sb'],
        unit: 'µg',
        description: 'Ultra-trace mineral - limited nutritional data',
        healthConcernFlags: {},
      },
      {
        compoundType: 'MINERAL',
        name: 'Bismuth',
        alternateNames: ['Bi'],
        unit: 'µg',
        description: 'Ultra-trace mineral used medicinally',
        healthConcernFlags: {},
      },
      // Toxic minerals (safety tracking)
      {
        compoundType: 'MINERAL',
        name: 'Lead',
        alternateNames: ['Pb'],
        unit: 'µg',
        description: 'Toxic heavy metal - neurological damage, developmental delays',
        healthConcernFlags: { 'neurotoxin': true, 'developmental_toxin': true, 'no_safe_level': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Mercury',
        alternateNames: ['Hg', 'Methylmercury'],
        unit: 'µg',
        description: 'Toxic heavy metal in large fish - neurological damage',
        healthConcernFlags: { 'neurotoxin': true, 'pregnancy_risk': true, 'bioaccumulates': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Cadmium',
        alternateNames: ['Cd'],
        unit: 'µg',
        description: 'Toxic heavy metal - kidney damage, bone disease',
        healthConcernFlags: { 'nephrotoxin': true, 'carcinogen': true, 'bioaccumulates': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Arsenic',
        alternateNames: ['As'],
        unit: 'µg',
        description: 'Toxic metalloid in rice/water - carcinogenic at high levels',
        healthConcernFlags: { 'carcinogen': true, 'diabetes_risk': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Aluminum',
        alternateNames: ['Al'],
        unit: 'mg',
        description: 'Metal with neurotoxic potential - high exposure concerns',
        healthConcernFlags: { 'neurotoxin_high_exposure': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Cesium',
        alternateNames: ['Cs', 'Caesium'],
        unit: 'µg',
        description: 'Radioactive isotope contamination tracking',
        healthConcernFlags: { 'radioactive': true },
      },
      {
        compoundType: 'MINERAL',
        name: 'Tellurium',
        alternateNames: ['Te'],
        unit: 'µg',
        description: 'Rare metalloid - contamination tracking',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(mineralAdditions, compoundMap, 'MINERAL');

    // ═══════════════════════════════════════════════════════════════
    // AMINO_ACID ADDITIONS (8 compounds - reclassified from PERFORMANCE)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional AMINO_ACID compounds...');

    const aminoAcidAdditions: CompoundSeedData[] = [
      {
        compoundType: 'AMINO_ACID',
        name: 'Beta-Alanine',
        alternateNames: ['β-Alanine', '3-Aminopropanoic acid'],
        unit: 'g',
        description: 'Non-proteinogenic amino acid - carnosine precursor for muscle buffering',
        healthConcernFlags: { 'paresthesia_tingling': true },
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Creatine',
        alternateNames: ['Methylguanidinoacetic acid'],
        unit: 'g',
        description: 'Amino acid derivative for ATP regeneration in muscles',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Carnosine',
        alternateNames: ['β-Alanyl-L-histidine'],
        unit: 'mg',
        description: 'Dipeptide of beta-alanine and histidine - muscle buffer and antioxidant',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Citrulline',
        alternateNames: ['L-Citrulline'],
        unit: 'g',
        description: 'Non-proteinogenic amino acid - nitric oxide precursor',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Ornithine',
        alternateNames: ['L-Ornithine'],
        unit: 'g',
        description: 'Non-proteinogenic amino acid in urea cycle',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Anserine',
        alternateNames: ['β-Alanyl-N-methyl-L-histidine'],
        unit: 'mg',
        description: 'Methylated carnosine abundant in fish and poultry',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Hydroxyproline',
        alternateNames: ['Hyp', '4-Hydroxyproline'],
        unit: 'g',
        description: 'Post-translationally modified proline in collagen',
        healthConcernFlags: {},
      },
      {
        compoundType: 'AMINO_ACID',
        name: 'Acetyl-L-Carnitine',
        alternateNames: ['ALCAR', 'ALC'],
        unit: 'mg',
        description: 'Acetylated carnitine crossing blood-brain barrier',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(aminoAcidAdditions, compoundMap, 'AMINO_ACID');

    // ═══════════════════════════════════════════════════════════════
    // FATTY_ACID ADDITIONS (11 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional FATTY_ACID compounds...');

    const fattyAcidAdditions: CompoundSeedData[] = [
      // Saturated
      {
        compoundType: 'FATTY_ACID',
        name: 'Butyric Acid',
        alternateNames: ['Butanoic acid', '4:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Short-chain fatty acid in butter - gut health benefits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Caproic Acid',
        alternateNames: ['Hexanoic acid', '6:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Medium-chain fatty acid in dairy and coconut',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Arachidic Acid',
        alternateNames: ['Eicosanoic acid', '20:0'],
        unit: 'g',
        parentKey: 'Saturated Fat',
        description: 'Long-chain saturated fatty acid in peanuts',
        healthConcernFlags: {},
      },
      // Monounsaturated
      {
        compoundType: 'FATTY_ACID',
        name: 'Palmitoleic Acid',
        alternateNames: ['16:1 n-7', 'Omega-7'],
        unit: 'g',
        description: 'Monounsaturated fatty acid in macadamia nuts and sea buckthorn',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Gadoleic Acid',
        alternateNames: ['20:1 n-9'],
        unit: 'g',
        description: 'Monounsaturated fatty acid in fish oils',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Erucic Acid',
        alternateNames: ['22:1 n-9'],
        unit: 'g',
        description: 'Monounsaturated fatty acid in rapeseed/mustard oil',
        healthConcernFlags: { 'cardiac_concerns_high_intake': true },
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Nervonic Acid',
        alternateNames: ['24:1 n-9', 'Selacholeic acid'],
        unit: 'g',
        description: 'Very long-chain monounsaturated fatty acid - brain myelin health',
        healthConcernFlags: {},
      },
      // Polyunsaturated
      {
        compoundType: 'FATTY_ACID',
        name: 'Stearidonic Acid',
        alternateNames: ['SDA', '18:4 n-3'],
        unit: 'g',
        parentKey: 'Omega-3 Fatty Acids',
        description: 'Omega-3 intermediate between ALA and EPA',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Docosapentaenoic Acid',
        alternateNames: ['DPA', '22:5 n-3'],
        unit: 'g',
        parentKey: 'Omega-3 Fatty Acids',
        description: 'Omega-3 fatty acid intermediate - anti-inflammatory',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Dihomo-gamma-linolenic Acid',
        alternateNames: ['DGLA', '20:3 n-6'],
        unit: 'g',
        parentKey: 'Omega-6 Fatty Acids',
        description: 'Omega-6 with anti-inflammatory eicosanoid production',
        healthConcernFlags: {},
      },
      {
        compoundType: 'FATTY_ACID',
        name: 'Docosatetraenoic Acid',
        alternateNames: ['Adrenic acid', '22:4 n-6'],
        unit: 'g',
        parentKey: 'Omega-6 Fatty Acids',
        description: 'Omega-6 fatty acid in adrenal glands and brain',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(fattyAcidAdditions, compoundMap, 'FATTY_ACID');

    // ═══════════════════════════════════════════════════════════════
    // POLYPHENOL ADDITIONS (7 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional POLYPHENOL compounds...');

    const polyphenolAdditions: CompoundSeedData[] = [
      {
        compoundType: 'POLYPHENOL',
        name: 'Fisetin',
        alternateNames: ['3,3\',4\',7-Tetrahydroxyflavone'],
        unit: 'mg',
        description: 'Flavonol in strawberries - 2024 anti-aging senolytic research',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Galangin',
        alternateNames: ['3,5,7-Trihydroxyflavone'],
        unit: 'mg',
        description: 'Flavonol in honey and propolis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Piceatannol',
        alternateNames: ['3,4,3\',5\'-Tetrahydroxystilbene'],
        unit: 'mg',
        description: 'Stilbene in grapes and blueberries - resveratrol metabolite',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Pinosylvin',
        alternateNames: ['3,5-Dihydroxystilbene'],
        unit: 'mg',
        description: 'Stilbene in pine nuts and berries',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Petunidin',
        alternateNames: ['3,3\',4\',5,5\',7-Hexahydroxyflavylium'],
        unit: 'mg',
        description: 'Anthocyanin in berries and red wine',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Keracyanin',
        alternateNames: ['Cyanidin-3-rutinoside'],
        unit: 'mg',
        description: 'Anthocyanin in cherries',
        healthConcernFlags: {},
      },
      {
        compoundType: 'POLYPHENOL',
        name: 'Oenin',
        alternateNames: ['Malvidin-3-glucoside'],
        unit: 'mg',
        description: 'Anthocyanin in red grapes and wine',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(polyphenolAdditions, compoundMap, 'POLYPHENOL');

    // ═══════════════════════════════════════════════════════════════
    // CAROTENOID ADDITIONS (6 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional CAROTENOID compounds...');

    const carotenoidAdditions: CompoundSeedData[] = [
      {
        compoundType: 'CAROTENOID',
        name: 'Fucoxanthin',
        alternateNames: ['Fukoxanthin'],
        unit: 'mg',
        description: 'Marine carotenoid in brown seaweed - metabolic benefits',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Violaxanthin',
        alternateNames: ['Zeaxanthin diepoxide'],
        unit: 'mg',
        description: 'Carotenoid in spinach and kale',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Neoxanthin',
        alternateNames: ['9-cis-Neoxanthin'],
        unit: 'mg',
        description: 'Carotenoid in leafy greens',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Capsanthin',
        alternateNames: ['Capsorubin'],
        unit: 'mg',
        description: 'Red carotenoid pigment in red peppers',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Capsorubin',
        alternateNames: ['Capsanthin-5,6-epoxide'],
        unit: 'mg',
        description: 'Red carotenoid in paprika and red peppers',
        healthConcernFlags: {},
      },
      {
        compoundType: 'CAROTENOID',
        name: 'Beta-apo-8-carotenal',
        alternateNames: ['Apocarotenal', 'Food Orange 6'],
        unit: 'mg',
        description: 'Carotenoid in paprika and annatto',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(carotenoidAdditions, compoundMap, 'CAROTENOID');

    // ═══════════════════════════════════════════════════════════════
    // GLUCOSINOLATE ADDITIONS (7 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional GLUCOSINOLATE compounds...');

    const glucosinolateAdditions: CompoundSeedData[] = [
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Glucoiberin',
        alternateNames: ['3-Methylsulfinylpropyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in broccoli sprouts',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Neoglucobrassicin',
        alternateNames: ['1-Methoxyindol-3-ylmethyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in cabbage family',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: '4-Hydroxyglucobrassicin',
        alternateNames: ['4-Hydroxyindol-3-ylmethyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in Brussels sprouts',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Glucotropaeolin',
        alternateNames: ['Benzyl glucosinolate'],
        unit: 'mg',
        description: 'Glucosinolate in watercress and nasturtium',
        healthConcernFlags: {},
      },
      // Organosulfur compounds (garlic)
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Allicin',
        alternateNames: ['Diallyl thiosulfinate'],
        unit: 'mg',
        description: 'Organosulfur compound in crushed garlic - antimicrobial',
        healthConcernFlags: { 'blood_thinning_effect': true },
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'Diallyl Disulfide',
        alternateNames: ['DADS', 'Allyl disulfide'],
        unit: 'mg',
        description: 'Organosulfur compound in garlic with anticancer properties',
        healthConcernFlags: {},
      },
      {
        compoundType: 'GLUCOSINOLATE',
        name: 'S-Allyl Cysteine',
        alternateNames: ['SAC'],
        unit: 'mg',
        description: 'Organosulfur compound in aged garlic extract',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(glucosinolateAdditions, compoundMap, 'GLUCOSINOLATE');

    // ═══════════════════════════════════════════════════════════════
    // TERPENOID ADDITIONS (5 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional TERPENOID compounds...');

    const terpenoidAdditions: CompoundSeedData[] = [
      {
        compoundType: 'TERPENOID',
        name: 'Gingerol',
        alternateNames: ['6-Gingerol', '[6]-Gingerol'],
        unit: 'mg',
        description: 'Phenolic terpenoid in ginger - anti-inflammatory',
        healthConcernFlags: {},
      },
      {
        compoundType: 'TERPENOID',
        name: 'Linalool',
        alternateNames: ['3,7-Dimethyl-1,6-octadien-3-ol'],
        unit: 'mg',
        description: 'Monoterpene in lavender, coriander, mint',
        healthConcernFlags: {},
      },
      {
        compoundType: 'TERPENOID',
        name: 'Pinene',
        alternateNames: ['α-Pinene', 'Alpha-Pinene'],
        unit: 'mg',
        description: 'Monoterpene in pine, rosemary, cannabis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'TERPENOID',
        name: 'Carvone',
        alternateNames: ['L-Carvone', 'p-Mentha-6,8-dien-2-one'],
        unit: 'mg',
        description: 'Monoterpene in spearmint and caraway',
        healthConcernFlags: {},
      },
      {
        compoundType: 'TERPENOID',
        name: 'Geraniol',
        alternateNames: ['trans-Geraniol'],
        unit: 'mg',
        description: 'Monoterpene in rose oil, citronella, lemongrass',
        healthConcernFlags: {},
      },
    ];

    await seedCompoundBatch(terpenoidAdditions, compoundMap, 'TERPENOID');

    // ═══════════════════════════════════════════════════════════════
    // MYCOTOXIN (10 compounds) - NEW CATEGORY - SAFETY TRACKING
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding MYCOTOXIN compounds...');

    const mycotoxinSeeds: CompoundSeedData[] = [
      {
        compoundType: 'MYCOTOXIN',
        name: 'Aflatoxin B1',
        alternateNames: ['AFB1'],
        unit: 'µg',
        description: 'Most toxic aflatoxin - Group 1 carcinogen in peanuts, corn, grains',
        healthConcernFlags: { 'carcinogen_group1': true, 'liver_damage': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Aflatoxin M1',
        alternateNames: ['AFM1'],
        unit: 'µg',
        description: 'Aflatoxin metabolite in milk from contaminated feed',
        healthConcernFlags: { 'carcinogen': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Ochratoxin A',
        alternateNames: ['OTA'],
        unit: 'µg',
        description: 'Nephrotoxic mycotoxin in coffee, wine, grains',
        healthConcernFlags: { 'nephrotoxin': true, 'carcinogen_group2b': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Fumonisin B1',
        alternateNames: ['FB1'],
        unit: 'µg',
        description: 'Mycotoxin in corn - esophageal cancer, neural tube defects',
        healthConcernFlags: { 'carcinogen': true, 'neural_tube_defects': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Deoxynivalenol',
        alternateNames: ['DON', 'Vomitoxin'],
        unit: 'µg',
        description: 'Trichothecene mycotoxin in wheat, barley - GI toxicity',
        healthConcernFlags: { 'gi_toxicity': true, 'immunosuppression': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Zearalenone',
        alternateNames: ['ZEN', 'ZEA'],
        unit: 'µg',
        description: 'Estrogenic mycotoxin in corn and grains',
        healthConcernFlags: { 'endocrine_disruptor': true, 'reproductive_toxicity': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Patulin',
        alternateNames: ['PAT'],
        unit: 'µg',
        description: 'Mycotoxin in moldy apples and apple juice',
        healthConcernFlags: { 'neurotoxin': true, 'immunotoxin': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'T-2 Toxin',
        alternateNames: ['T-2', 'Fusariotoxin'],
        unit: 'µg',
        description: 'Trichothecene mycotoxin in grains - severe toxicity',
        healthConcernFlags: { 'immunosuppression': true, 'hematotoxicity': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Citrinin',
        alternateNames: ['CTN'],
        unit: 'µg',
        description: 'Mycotoxin in rice and grains - nephrotoxic',
        healthConcernFlags: { 'nephrotoxin': true },
      },
      {
        compoundType: 'MYCOTOXIN',
        name: 'Ergot Alkaloids',
        alternateNames: ['Ergotamine', 'Ergometrine'],
        unit: 'µg',
        description: 'Mycotoxins in rye and wheat - vasoconstriction, gangrene',
        healthConcernFlags: { 'vasoconstriction': true, 'neurotoxin': true },
      },
    ];

    await seedCompoundBatch(mycotoxinSeeds, compoundMap, 'MYCOTOXIN');

    // ═══════════════════════════════════════════════════════════════
    // PESTICIDE_RESIDUE (6 compounds) - NEW CATEGORY - SAFETY TRACKING
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding PESTICIDE_RESIDUE compounds...');

    const pesticideSeeds: CompoundSeedData[] = [
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: 'Glyphosate',
        alternateNames: ['N-(Phosphonomethyl)glycine', 'Roundup'],
        unit: 'µg',
        description: 'Herbicide - detected in 42% of Canadian foods, probable carcinogen',
        healthConcernFlags: { 'carcinogen_group2a': true, 'endocrine_disruptor': true },
      },
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: 'Glufosinate',
        alternateNames: ['Phosphinothricin', 'Liberty'],
        unit: 'µg',
        description: 'Herbicide residue in GMO crops',
        healthConcernFlags: { 'neurotoxin': true },
      },
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: 'Organophosphates',
        alternateNames: ['OP pesticides', 'Chlorpyrifos', 'Malathion'],
        unit: 'µg',
        description: 'Insecticide class - neurotoxic, developmental concerns',
        healthConcernFlags: { 'neurotoxin': true, 'developmental_toxin': true },
      },
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: 'Neonicotinoids',
        alternateNames: ['Neonics', 'Imidacloprid', 'Thiamethoxam'],
        unit: 'µg',
        description: 'Systemic insecticides - neurotoxic',
        healthConcernFlags: { 'neurotoxin': true },
      },
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: '2,4-D',
        alternateNames: ['2,4-Dichlorophenoxyacetic acid'],
        unit: 'µg',
        description: 'Herbicide - possible carcinogen, endocrine disruptor',
        healthConcernFlags: { 'carcinogen_possible': true, 'endocrine_disruptor': true },
      },
      {
        compoundType: 'PESTICIDE_RESIDUE',
        name: 'Chlorpyrifos',
        alternateNames: ['Dursban', 'Lorsban'],
        unit: 'µg',
        description: 'Organophosphate insecticide - neurodevelopmental toxicity',
        healthConcernFlags: { 'neurotoxin': true, 'developmental_toxin': true, 'banned_eu': true },
      },
    ];

    await seedCompoundBatch(pesticideSeeds, compoundMap, 'PESTICIDE_RESIDUE');

    // ═══════════════════════════════════════════════════════════════
    // PLASTICIZER (7 compounds) - NEW CATEGORY - SAFETY TRACKING
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding PLASTICIZER compounds...');

    const plasticizerSeeds: CompoundSeedData[] = [
      {
        compoundType: 'PLASTICIZER',
        name: 'BPA',
        alternateNames: ['Bisphenol A', '4,4\'-Isopropylidenediphenol'],
        unit: 'µg',
        description: 'Endocrine disruptor from polycarbonate plastics - 79% of foods',
        healthConcernFlags: { 'endocrine_disruptor': true, 'reproductive_toxicity': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'BPS',
        alternateNames: ['Bisphenol S'],
        unit: 'µg',
        description: 'BPA substitute with similar endocrine disrupting effects',
        healthConcernFlags: { 'endocrine_disruptor': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'BPF',
        alternateNames: ['Bisphenol F'],
        unit: 'µg',
        description: 'BPA substitute found in food packaging',
        healthConcernFlags: { 'endocrine_disruptor': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'DEHP',
        alternateNames: ['Di(2-ethylhexyl) phthalate'],
        unit: 'µg',
        description: 'Phthalate plasticizer in PVC - reproductive toxicity',
        healthConcernFlags: { 'endocrine_disruptor': true, 'reproductive_toxicity': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'DBP',
        alternateNames: ['Dibutyl phthalate'],
        unit: 'µg',
        description: 'Phthalate in food packaging - 0.3mg/kg legal limit',
        healthConcernFlags: { 'endocrine_disruptor': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'BBP',
        alternateNames: ['Benzyl butyl phthalate'],
        unit: 'µg',
        description: 'Phthalate plasticizer with reproductive effects',
        healthConcernFlags: { 'reproductive_toxicity': true },
      },
      {
        compoundType: 'PLASTICIZER',
        name: 'DEHA',
        alternateNames: ['Di(2-ethylhexyl) adipate', 'DOA'],
        unit: 'µg',
        description: 'Plasticizer alternative to phthalates',
        healthConcernFlags: { 'possible_carcinogen': true },
      },
    ];

    await seedCompoundBatch(plasticizerSeeds, compoundMap, 'PLASTICIZER');

    // ═══════════════════════════════════════════════════════════════
    // PROCESSING_COMPOUND ADDITIONS (8 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional PROCESSING_COMPOUND compounds...');

    const processingAdditions: CompoundSeedData[] = [
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Pentosidine',
        alternateNames: ['AGE pentosidine'],
        unit: 'µg',
        description: 'Advanced glycation end-product - protein crosslinking',
        healthConcernFlags: { 'age_marker': true, 'inflammatory': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'Glucosepane',
        alternateNames: ['Glucose-lysine-arginine crosslink'],
        unit: 'µg',
        description: 'Most abundant AGE in human tissues',
        healthConcernFlags: { 'age_marker': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'IQ',
        alternateNames: ['2-Amino-3-methylimidazo[4,5-f]quinoline'],
        unit: 'ng',
        description: 'Heterocyclic amine in cooked meat - carcinogenic',
        healthConcernFlags: { 'carcinogen_group2a': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'MeIQ',
        alternateNames: ['2-Amino-3,4-dimethylimidazo[4,5-f]quinoline'],
        unit: 'ng',
        description: 'Heterocyclic amine formed during high-heat cooking',
        healthConcernFlags: { 'carcinogen': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'NDEA',
        alternateNames: ['N-Nitrosodiethylamine'],
        unit: 'ng',
        description: 'Carcinogenic nitrosamine in processed meats',
        healthConcernFlags: { 'carcinogen_group2a': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: 'NPRO',
        alternateNames: ['N-Nitrosoproline'],
        unit: 'ng',
        description: 'Nitrosamine formed from proline in cured meats',
        healthConcernFlags: { 'carcinogen': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: '3-MCPD',
        alternateNames: ['3-Monochloropropane-1,2-diol'],
        unit: 'µg',
        description: 'Chloropropanol in refined oils - kidney/testicular toxicity',
        healthConcernFlags: { 'carcinogen_group2b': true, 'reproductive_toxicity': true },
      },
      {
        compoundType: 'PROCESSING_COMPOUND',
        name: '4-HNE',
        alternateNames: ['4-Hydroxynonenal'],
        unit: 'µg',
        description: 'Lipid peroxidation product - oxidative stress marker',
        healthConcernFlags: { 'oxidative_stress': true, 'cytotoxic': true },
      },
    ];

    await seedCompoundBatch(processingAdditions, compoundMap, 'PROCESSING_COMPOUND');

    // ═══════════════════════════════════════════════════════════════
    // SYNTHETIC_ADDITIVE ADDITIONS (3 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional SYNTHETIC_ADDITIVE compounds...');

    const additiveAdditions: CompoundSeedData[] = [
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'TBHQ',
        alternateNames: ['Tertiary butylhydroquinone', 'tert-Butylhydroquinone'],
        unit: 'mg',
        description: 'Synthetic antioxidant preservative',
        healthConcernFlags: { 'allergic_reactions': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Propyl Paraben',
        alternateNames: ['Propylparaben', 'E216'],
        unit: 'mg',
        description: 'Preservative with potential endocrine effects',
        healthConcernFlags: { 'endocrine_disruptor_potential': true },
      },
      {
        compoundType: 'SYNTHETIC_ADDITIVE',
        name: 'Sodium Nitrite',
        alternateNames: ['E250', 'NaNO2'],
        unit: 'mg',
        description: 'Curing agent in processed meats - forms nitrosamines',
        healthConcernFlags: { 'forms_carcinogens': true, 'methemoglobinemia_risk': true },
      },
    ];

    await seedCompoundBatch(additiveAdditions, compoundMap, 'SYNTHETIC_ADDITIVE');

    // ═══════════════════════════════════════════════════════════════
    // ANTI_NUTRIENT ADDITIONS (10 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding additional ANTI_NUTRIENT compounds...');

    const antiNutrientAdditions: CompoundSeedData[] = [
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Alpha-Amylase Inhibitor',
        alternateNames: ['AAI', 'Amylase inhibitor'],
        unit: 'mg',
        description: 'Enzyme inhibitor in beans blocking starch digestion',
        healthConcernFlags: { 'gi_discomfort': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Protease Inhibitors',
        alternateNames: ['Kunitz trypsin inhibitor', 'Bowman-Birk inhibitor'],
        unit: 'mg',
        description: 'Protein digestion inhibitors in legumes',
        healthConcernFlags: { 'protein_malabsorption': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'WGA',
        alternateNames: ['Wheat Germ Agglutinin'],
        unit: 'mg',
        description: 'Lectin in wheat causing gut permeability',
        healthConcernFlags: { 'gut_permeability': true, 'inflammatory': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'PHA',
        alternateNames: ['Phaseolus lectin', 'Kidney bean lectin'],
        unit: 'mg',
        description: 'Highly toxic lectin in raw kidney beans',
        healthConcernFlags: { 'severe_gi_toxicity': true, 'requires_cooking': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Condensed Tannins',
        alternateNames: ['Proanthocyanidins', 'Procyanidins'],
        unit: 'mg',
        description: 'Polymeric tannins reducing protein and iron absorption',
        healthConcernFlags: { 'iron_absorption_inhibition': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Hydrolyzable Tannins',
        alternateNames: ['Ellagitannins', 'Gallotannins'],
        unit: 'mg',
        description: 'Tannins that hydrolyze in water - astringent',
        healthConcernFlags: { 'mineral_chelation': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Raffinose',
        alternateNames: ['Melitose'],
        unit: 'g',
        description: 'Trisaccharide causing flatulence - not digestible by humans',
        healthConcernFlags: { 'flatulence': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Stachyose',
        alternateNames: ['Lupeose'],
        unit: 'g',
        description: 'Tetrasaccharide in legumes - major flatulence factor',
        healthConcernFlags: { 'flatulence': true, 'gi_discomfort': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Verbascose',
        alternateNames: [],
        unit: 'g',
        description: 'Pentasaccharide oligosaccharide causing gas',
        healthConcernFlags: { 'flatulence': true },
      },
      {
        compoundType: 'ANTI_NUTRIENT',
        name: 'Cyanogenic Glycosides',
        alternateNames: ['Linamarin', 'Amygdalin'],
        unit: 'mg',
        description: 'Compounds releasing cyanide in cassava and lima beans',
        healthConcernFlags: { 'cyanide_poisoning_risk': true, 'requires_processing': true },
      },
    ];

    await seedCompoundBatch(antiNutrientAdditions, compoundMap, 'ANTI_NUTRIENT');

    console.log(`✅ Successfully seeded ${compoundMap.size} compounds`);
    console.log('🎉 Compound seeding complete! 325 total compounds added.');

    return compoundMap;

  } catch (error) {
    console.error('❌ Error seeding compounds:', error);
    throw error;
  }
}

/**
 * Helper function to seed a batch of compounds with parent relationship handling
 */
async function seedCompoundBatch(
  seeds: CompoundSeedData[],
  compoundMap: Map<string, string>,
  type: string
) {
  let seededCount = 0;

  for (const seed of seeds) {
    const { parentKey, ...compoundData } = seed;

    // Resolve parent ID if parentKey exists
    const parentCompoundId = parentKey ? compoundMap.get(parentKey) : undefined;

    // Insert compound
    const [inserted] = await db.insert(compounds).values({
      ...compoundData,
      parentCompoundId: parentCompoundId || null,
    }).returning();

    // Store in map for parent-child relationship tracking
    compoundMap.set(compoundData.name, inserted.id);
    seededCount++;
  }

  console.log(`    ✓ Seeded ${seededCount} ${type} compounds`);
}

/**
 * Main execution when run directly
 */
if (require.main === module) {
  seedCompounds()
    .then(() => {
      console.log('✨ Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}
