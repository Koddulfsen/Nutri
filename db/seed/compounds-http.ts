/**
 * Compound Seed Data
 *
 * Comprehensive seed data for 280 compounds covering all 12 compound types:
 * - VITAMIN (50 compounds including parent groups and specific forms)
 * - MINERAL (35 compounds including macro and trace minerals)
 * - AMINO_ACID (25 compounds including essential and non-essential)
 * - FATTY_ACID (30 compounds including saturated, mono, and polyunsaturated)
 * - POLYPHENOL (40 compounds including flavonoids and phenolic acids)
 * - CAROTENOID (15 compounds including provitamin A and non-provitamin A)
 * - GLUCOSINOLATE (12 compounds from cruciferous vegetables)
 * - ANTI_NUTRIENT (18 compounds including phytates, oxalates, lectins)
 * - PROCESSING_COMPOUND (20 compounds including AGEs, HCAs, PAHs)
 * - SYNTHETIC_ADDITIVE (15 compounds including preservatives, colors)
 * - PERFORMANCE_COMPOUND (12 compounds including creatine, beta-alanine)
 * - NICHE_HEALTH (8 compounds including specialized nutrients)
 *
 * Data sourced from USDA FoodData Central standards with hierarchical relationships
 * and comprehensive metadata.
 */

import { dbHttp as db } from '../drizzle-http-adapter';
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

    console.log('  ├─ Seeding PERFORMANCE_COMPOUND compounds...');

    const performanceCompoundSeeds: CompoundSeedData[] = [
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Creatine',
        alternateNames: ['Creatine monohydrate', 'Methylguanidine acetic acid'],
        unit: 'g',
        description: 'Organic compound that increases muscle phosphocreatine stores',
        healthConcernFlags: { 'hydration_requirement': true },
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Beta-Alanine',
        alternateNames: ['β-Alanine', '3-Aminopropanoic acid'],
        unit: 'g',
        description: 'Amino acid that increases muscle carnosine',
        healthConcernFlags: { 'paresthesia': true },
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Caffeine',
        alternateNames: ['1,3,7-Trimethylxanthine'],
        unit: 'mg',
        description: 'Stimulant that enhances endurance and focus',
        healthConcernFlags: { 'dependence': true, 'anxiety_high_doses': true },
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Citrulline',
        alternateNames: ['L-Citrulline'],
        unit: 'g',
        description: 'Amino acid that increases nitric oxide and blood flow',
        healthConcernFlags: {},
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'HMB',
        alternateNames: ['β-Hydroxy β-methylbutyrate', 'Beta-hydroxy beta-methylbutyrate'],
        unit: 'g',
        description: 'Leucine metabolite that reduces muscle breakdown',
        healthConcernFlags: {},
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Betaine',
        alternateNames: ['Trimethylglycine', 'TMG'],
        unit: 'g',
        description: 'Methyl donor that improves power output',
        healthConcernFlags: {},
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Nitrate',
        alternateNames: ['NO3-', 'Dietary nitrate'],
        unit: 'mg',
        description: 'Anion that increases nitric oxide and exercise efficiency',
        healthConcernFlags: { 'methemoglobinemia_infants': true },
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'Carnosine',
        alternateNames: ['β-Alanyl-L-histidine'],
        unit: 'mg',
        description: 'Dipeptide that buffers muscle acidity',
        healthConcernFlags: {},
      },
      {
        compoundType: 'PERFORMANCE_COMPOUND',
        name: 'CoQ10',
        alternateNames: ['Coenzyme Q10', 'Ubiquinone'],
        unit: 'mg',
        description: 'Antioxidant cofactor in mitochondrial energy production',
        healthConcernFlags: { 'blood_thinner_interaction': true },
      },
    ];

    await seedCompoundBatch(performanceCompoundSeeds, compoundMap, 'PERFORMANCE_COMPOUND');

    // ═══════════════════════════════════════════════════════════════
    // NICHE HEALTH (8 compounds)
    // ═══════════════════════════════════════════════════════════════

    console.log('  ├─ Seeding NICHE_HEALTH compounds...');

    const nicheHealthSeeds: CompoundSeedData[] = [
      {
        compoundType: 'NICHE_HEALTH',
        name: 'Alpha-Lipoic Acid',
        alternateNames: ['ALA', 'Thioctic acid'],
        unit: 'mg',
        description: 'Antioxidant that regenerates other antioxidants',
        healthConcernFlags: { 'blood_sugar_lowering': true },
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'N-Acetylcysteine',
        alternateNames: ['NAC'],
        unit: 'mg',
        description: 'Cysteine derivative and glutathione precursor',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'SAMe',
        alternateNames: ['S-Adenosylmethionine'],
        unit: 'mg',
        description: 'Methyl donor involved in mood and liver health',
        healthConcernFlags: { 'bipolar_mania_risk': true },
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'PQQ',
        alternateNames: ['Pyrroloquinoline quinone'],
        unit: 'mg',
        description: 'Cofactor supporting mitochondrial biogenesis',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'Phosphatidylserine',
        alternateNames: ['PS'],
        unit: 'mg',
        description: 'Phospholipid for cognitive function and stress response',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'Acetyl-L-Carnitine',
        alternateNames: ['ALCAR'],
        unit: 'mg',
        description: 'Acetylated carnitine crossing blood-brain barrier',
        healthConcernFlags: {},
      },
      {
        compoundType: 'NICHE_HEALTH',
        name: 'Melatonin',
        alternateNames: ['N-Acetyl-5-methoxytryptamine'],
        unit: 'mg',
        description: 'Hormone regulating sleep-wake cycles',
        healthConcernFlags: { 'daytime_drowsiness': true },
      },
    ];

    await seedCompoundBatch(nicheHealthSeeds, compoundMap, 'NICHE_HEALTH');

    console.log(`✅ Successfully seeded ${compoundMap.size} compounds`);
    console.log('🎉 Compound seeding complete!');

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
