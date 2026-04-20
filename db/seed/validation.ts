/**
 * Compound Validation Ranges Seed Data
 *
 * Generates validation thresholds for all 280 compounds based on:
 * - Realistic dietary intake ranges from whole foods
 * - Supplement dosage standards
 * - Toxicity thresholds from scientific literature
 * - Unit-specific scaling (g, mg, µg, ng, kU)
 *
 * Validation levels:
 * - min_value: Absolute minimum (typically 0 or trace amounts)
 * - max_value: Realistic maximum from whole foods + reasonable supplementation
 * - warn_threshold: Unusually high values requiring review (flag for user)
 * - reject_threshold: Impossible values indicating data entry error
 */

import { db } from '../index';
import { compoundValidationRanges, compounds } from '../schema';
import type { NewCompoundValidationRange } from '@/lib/types/database';
import type { Compound } from '@/lib/types/database';

interface ValidationRange {
  minValue: string | null;
  maxValue: string | null;
  warnThreshold: string | null;
  rejectThreshold: string | null;
  notes: string;
}

/**
 * Generate validation range for a compound based on type, unit, and name
 */
function generateValidationRange(compound: Compound): ValidationRange {
  const { compoundType, unit, name } = compound;

  // Base ranges by compound type and unit
  switch (compoundType) {
    case 'VITAMIN':
      return generateVitaminRange(name, unit);
    case 'MINERAL':
      return generateMineralRange(name, unit);
    case 'AMINO_ACID':
      return generateAminoAcidRange(name, unit);
    case 'FATTY_ACID':
      return generateFattyAcidRange(name, unit);
    case 'POLYPHENOL':
      return generatePolyphenolRange(name, unit);
    case 'CAROTENOID':
      return generateCarotenoidRange(name, unit);
    case 'GLUCOSINOLATE':
      return generateGlucosinolateRange(name, unit);
    case 'ANTI_NUTRIENT':
      return generateAntiNutrientRange(name, unit);
    case 'PROCESSING_COMPOUND':
      return generateProcessingCompoundRange(name, unit);
    case 'SYNTHETIC_ADDITIVE':
      return generateSyntheticAdditiveRange(name, unit);
    case 'PERFORMANCE_COMPOUND':
      return generatePerformanceCompoundRange(name, unit);
    case 'NICHE_HEALTH':
      return generateNicheHealthRange(name, unit);
    default:
      // Fallback for unknown types
      return {
        minValue: '0',
        maxValue: '10000',
        warnThreshold: '50000',
        rejectThreshold: '1000000',
        notes: 'Default validation range - requires manual review',
      };
  }
}

/**
 * VITAMIN validation ranges
 */
function generateVitaminRange(name: string, unit: string): ValidationRange {
  // Water-soluble vitamins (B, C, Choline) - generally safe at high doses
  if (name.includes('Vitamin B') || name.includes('Thiamin') || name.includes('Riboflavin') ||
      name.includes('Niacin') || name.includes('Pantothenic') || name.includes('Biotin') ||
      name.includes('Folate') || name.includes('Choline') || name.includes('Inositol') || name.includes('PABA')) {
    if (unit === 'mg') {
      return {
        minValue: '0',
        maxValue: '500',
        warnThreshold: '2000',
        rejectThreshold: '10000',
        notes: 'Water-soluble B vitamin - excess excreted, safe at high doses from food',
      };
    } else if (unit === 'µg') {
      return {
        minValue: '0',
        maxValue: '5000',
        warnThreshold: '20000',
        rejectThreshold: '100000',
        notes: 'Water-soluble vitamin in micrograms - safe range',
      };
    }
  }

  // Vitamin C (Ascorbic acid)
  if (name.includes('Vitamin C') || name.includes('Ascorbic')) {
    return {
      minValue: '0',
      maxValue: '2000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Upper limit 2000mg/day (NIH), higher doses may cause GI distress',
    };
  }

  // Fat-soluble vitamins (A, D, E, K) - toxicity possible at high doses
  if (name.includes('Vitamin A') || name.includes('Retinol')) {
    return {
      minValue: '0',
      maxValue: '3000',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'Fat-soluble - UL 3000µg/day, toxicity risk above, pregnancy concern',
    };
  }

  if (name.includes('Vitamin D')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '250',
      rejectThreshold: '1000',
      notes: 'Fat-soluble - UL 100µg (4000 IU)/day, hypercalcemia risk above',
    };
  }

  if (name.includes('Vitamin E') || name.includes('Tocopherol') || name.includes('Tocotrienol')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '3000',
      rejectThreshold: '10000',
      notes: 'Fat-soluble - UL 1000mg/day, bleeding risk at high doses',
    };
  }

  if (name.includes('Vitamin K')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Fat-soluble - no UL established, warfarin interaction concern',
    };
  }

  // Beta-carotene (provitamin A)
  if (name.includes('Beta-Carotene') || name.includes('Carotene')) {
    return {
      minValue: '0',
      maxValue: '50000',
      warnThreshold: '200000',
      rejectThreshold: '1000000',
      notes: 'Provitamin A - very safe, no toxicity from food sources',
    };
  }

  // Default vitamin range
  return {
    minValue: '0',
    maxValue: '1000',
    warnThreshold: '5000',
    rejectThreshold: '20000',
    notes: 'General vitamin range - requires compound-specific review',
  };
}

/**
 * MINERAL validation ranges
 */
function generateMineralRange(name: string, unit: string): ValidationRange {
  // Macrominerals (gram-level intake)
  if (name.includes('Calcium')) {
    return {
      minValue: '0',
      maxValue: '2500',
      warnThreshold: '5000',
      rejectThreshold: '15000',
      notes: 'Macromineral - UL 2500mg/day, kidney stone risk above',
    };
  }

  if (name.includes('Phosphorus')) {
    return {
      minValue: '0',
      maxValue: '4000',
      warnThreshold: '8000',
      rejectThreshold: '20000',
      notes: 'Macromineral - UL 4000mg/day, kidney disease concern',
    };
  }

  if (name.includes('Magnesium')) {
    return {
      minValue: '0',
      maxValue: '350',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Macromineral - UL 350mg/day from supplements, laxative effect above',
    };
  }

  if (name.includes('Sodium')) {
    return {
      minValue: '0',
      maxValue: '2300',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Electrolyte - recommended limit 2300mg/day, hypertension risk',
    };
  }

  if (name.includes('Potassium')) {
    return {
      minValue: '0',
      maxValue: '4700',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'Electrolyte - adequate intake 4700mg/day, hyperkalemia in kidney disease',
    };
  }

  if (name.includes('Chloride') || name.includes('Sulfur')) {
    return {
      minValue: '0',
      maxValue: '3600',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'Macromineral - typically adequate from diet',
    };
  }

  // Trace minerals - toxicity concern at high doses
  if (name.includes('Iron')) {
    return {
      minValue: '0',
      maxValue: '45',
      warnThreshold: '100',
      rejectThreshold: '500',
      notes: 'Trace mineral - UL 45mg/day, hemochromatosis and oxidative stress risk',
    };
  }

  if (name.includes('Zinc')) {
    return {
      minValue: '0',
      maxValue: '40',
      warnThreshold: '100',
      rejectThreshold: '500',
      notes: 'Trace mineral - UL 40mg/day, copper depletion at high doses',
    };
  }

  if (name.includes('Copper')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '25',
      rejectThreshold: '100',
      notes: 'Trace mineral - UL 10mg/day, Wilson\'s disease concern',
    };
  }

  if (name.includes('Manganese')) {
    return {
      minValue: '0',
      maxValue: '11',
      warnThreshold: '50',
      rejectThreshold: '200',
      notes: 'Trace mineral - UL 11mg/day, neurotoxicity at high exposure',
    };
  }

  if (name.includes('Selenium')) {
    return {
      minValue: '0',
      maxValue: '400',
      warnThreshold: '800',
      rejectThreshold: '3000',
      notes: 'Trace mineral - UL 400µg/day, selenosis (hair loss, fatigue) above',
    };
  }

  if (name.includes('Iodine')) {
    return {
      minValue: '0',
      maxValue: '1100',
      warnThreshold: '3000',
      rejectThreshold: '10000',
      notes: 'Trace mineral - UL 1100µg/day, thyroid dysfunction at excess',
    };
  }

  if (name.includes('Chromium')) {
    return {
      minValue: '0',
      maxValue: '200',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Trace mineral - adequate intake 35µg/day, supplement range to 200µg',
    };
  }

  if (name.includes('Molybdenum')) {
    return {
      minValue: '0',
      maxValue: '2000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Trace mineral - UL 2000µg/day, generally safe',
    };
  }

  if (name.includes('Fluoride')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '20',
      rejectThreshold: '50',
      notes: 'Trace mineral - UL 10mg/day, dental fluorosis above',
    };
  }

  // Ultra-trace minerals
  if (unit === 'µg') {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Ultra-trace mineral - typically adequate from varied diet',
    };
  }

  // Default mineral (mg)
  return {
    minValue: '0',
    maxValue: '100',
    warnThreshold: '500',
    rejectThreshold: '2000',
    notes: 'Trace mineral - requires compound-specific limits',
  };
}

/**
 * AMINO ACID validation ranges
 */
function generateAminoAcidRange(name: string, unit: string): ValidationRange {
  // Amino acids measured in grams (protein intake)
  if (unit === 'g') {
    // BCAAs (Leucine, Isoleucine, Valine) - higher intake from protein
    if (name.includes('Leucine') || name.includes('Isoleucine') || name.includes('Valine')) {
      return {
        minValue: '0',
        maxValue: '15',
        warnThreshold: '50',
        rejectThreshold: '200',
        notes: 'BCAA - typical intake 2-10g/day from protein, athletes may supplement higher',
      };
    }

    // Essential amino acids
    if (name.includes('Lysine') || name.includes('Methionine') || name.includes('Phenylalanine') ||
        name.includes('Threonine') || name.includes('Tryptophan') || name.includes('Histidine')) {
      return {
        minValue: '0',
        maxValue: '10',
        warnThreshold: '30',
        rejectThreshold: '100',
        notes: 'Essential amino acid - adequate intake from complete protein (0.5-5g/day)',
      };
    }

    // Non-essential and conditionally essential
    return {
      minValue: '0',
      maxValue: '20',
      warnThreshold: '60',
      rejectThreshold: '200',
      notes: 'Amino acid - synthesized by body, supplementation possible',
    };
  }

  // Amino acids in milligrams (specialized/supplements)
  if (unit === 'mg') {
    return {
      minValue: '0',
      maxValue: '5000',
      warnThreshold: '15000',
      rejectThreshold: '50000',
      notes: 'Amino acid supplement range - typically 500-3000mg doses',
    };
  }

  // Default
  return {
    minValue: '0',
    maxValue: '10',
    warnThreshold: '50',
    rejectThreshold: '200',
    notes: 'Amino acid - protein-based intake',
  };
}

/**
 * FATTY ACID validation ranges
 */
function generateFattyAcidRange(name: string, unit: string): ValidationRange {
  // Omega-3 fatty acids
  if (name.includes('Omega-3') || name.includes('EPA') || name.includes('DHA') || name.includes('Alpha-Linolenic')) {
    return {
      minValue: '0',
      maxValue: '20',
      warnThreshold: '50',
      rejectThreshold: '200',
      notes: 'Omega-3 - adequate intake 1.1-1.6g/day, supplements to 4g, bleeding risk at very high doses',
    };
  }

  // Omega-6 fatty acids
  if (name.includes('Omega-6') || name.includes('Linoleic') || name.includes('Arachidonic')) {
    return {
      minValue: '0',
      maxValue: '30',
      warnThreshold: '80',
      rejectThreshold: '200',
      notes: 'Omega-6 - adequate intake 12-17g/day, pro-inflammatory at excess',
    };
  }

  // Saturated fat
  if (name.includes('Saturated') || name.includes('Palmitic') || name.includes('Stearic') ||
      name.includes('Lauric') || name.includes('Myristic')) {
    return {
      minValue: '0',
      maxValue: '50',
      warnThreshold: '100',
      rejectThreshold: '300',
      notes: 'Saturated fat - limit to <10% calories (~20g/day), CVD risk at excess',
    };
  }

  // Trans fats - should be minimal
  if (name.includes('Trans') || name.includes('Elaidic') || name.includes('Industrial')) {
    return {
      minValue: '0',
      maxValue: '2',
      warnThreshold: '5',
      rejectThreshold: '20',
      notes: 'Trans fat - minimize intake, <1% calories (~2g), CVD risk, banned in many countries',
    };
  }

  // Monounsaturated (Oleic acid)
  if (name.includes('Oleic') || name.includes('Omega-9')) {
    return {
      minValue: '0',
      maxValue: '60',
      warnThreshold: '120',
      rejectThreshold: '300',
      notes: 'Monounsaturated fat - heart-healthy, 15-20% calories (~30-40g)',
    };
  }

  // CLA (natural trans fat - beneficial)
  if (name.includes('Conjugated Linoleic')) {
    return {
      minValue: '0',
      maxValue: '3000',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'CLA - natural trans fat from ruminants, beneficial effects, supplement range 1-6g',
    };
  }

  // Medium-chain fatty acids
  if (name.includes('Caprylic') || name.includes('Capric')) {
    return {
      minValue: '0',
      maxValue: '20',
      warnThreshold: '50',
      rejectThreshold: '200',
      notes: 'Medium-chain fatty acid - rapidly absorbed, supplement range 5-15g',
    };
  }

  // Default fatty acid (grams)
  return {
    minValue: '0',
    maxValue: '40',
    warnThreshold: '100',
    rejectThreshold: '300',
    notes: 'Fatty acid - typical dietary fat intake 20-100g/day',
  };
}

/**
 * POLYPHENOL validation ranges
 */
function generatePolyphenolRange(name: string, unit: string): ValidationRange {
  // Curcumin - higher therapeutic doses
  if (name.includes('Curcumin')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Curcuminoid - therapeutic doses 500-2000mg, bleeding risk at very high doses',
    };
  }

  // Resveratrol - supplement range
  if (name.includes('Resveratrol') || name.includes('Pterostilbene')) {
    return {
      minValue: '0',
      maxValue: '200',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Stilbene - red wine ~5mg/glass, supplements 100-500mg',
    };
  }

  // EGCG - green tea catechin
  if (name.includes('EGCG') || name.includes('Epigallocatechin')) {
    return {
      minValue: '0',
      maxValue: '400',
      warnThreshold: '1500',
      rejectThreshold: '5000',
      notes: 'Green tea catechin - typical intake 50-200mg, liver toxicity concern at very high doses',
    };
  }

  // Quercetin and other flavonoids
  if (name.includes('Quercetin') || name.includes('Kaempferol') || name.includes('Myricetin') ||
      name.includes('Apigenin') || name.includes('Luteolin')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Flavonoid - dietary intake 10-100mg, supplements to 1000mg',
    };
  }

  // Anthocyanins
  if (name.includes('Cyanidin') || name.includes('Delphinidin') || name.includes('Malvidin') ||
      name.includes('Pelargonidin') || name.includes('Peonidin')) {
    return {
      minValue: '0',
      maxValue: '300',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Anthocyanin - berry intake 50-500mg/day, very safe',
    };
  }

  // Isoflavones (soy)
  if (name.includes('Genistein') || name.includes('Daidzein') || name.includes('Glycitein')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '300',
      rejectThreshold: '1000',
      notes: 'Isoflavone - soy intake 25-50mg/day, hormone-sensitive cancer concern at high doses',
    };
  }

  // Phenolic acids
  if (name.includes('Acid') || name.includes('Chlorogenic') || name.includes('Caffeic') || name.includes('Ferulic')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '3000',
      rejectThreshold: '10000',
      notes: 'Phenolic acid - coffee/whole grains 200-800mg/day, very safe',
    };
  }

  // Lignans
  if (name.includes('Secoisolariciresinol') || name.includes('Matairesinol')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Lignan - flaxseed intake 50-150mg/day, estrogenic activity',
    };
  }

  // Catechins
  if (name.includes('Catechin') || name.includes('Epicatechin')) {
    return {
      minValue: '0',
      maxValue: '300',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Catechin - tea/cocoa 50-200mg/day, cardiovascular benefits',
    };
  }

  // Flavanones (citrus)
  if (name.includes('Hesperidin') || name.includes('Naringenin') || name.includes('Eriodictyol')) {
    return {
      minValue: '0',
      maxValue: '200',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Flavanone - citrus intake 50-100mg/day, naringenin has CYP3A4 interaction',
    };
  }

  // Default polyphenol
  return {
    minValue: '0',
    maxValue: '500',
    warnThreshold: '2000',
    rejectThreshold: '10000',
    notes: 'Polyphenol - plant compound, generally safe at high intake',
  };
}

/**
 * CAROTENOID validation ranges
 */
function generateCarotenoidRange(name: string, unit: string): ValidationRange {
  // Carotenoids in micrograms - very safe

  // Lycopene
  if (name.includes('Lycopene')) {
    return {
      minValue: '0',
      maxValue: '50000',
      warnThreshold: '150000',
      rejectThreshold: '500000',
      notes: 'Lycopene - tomato intake 5-20mg/day, prostate health, very safe',
    };
  }

  // Lutein and Zeaxanthin (eye health)
  if (name.includes('Lutein') || name.includes('Zeaxanthin')) {
    return {
      minValue: '0',
      maxValue: '20000',
      warnThreshold: '50000',
      rejectThreshold: '200000',
      notes: 'Macular carotenoid - dietary 1-10mg/day, eye health, very safe',
    };
  }

  // Astaxanthin
  if (name.includes('Astaxanthin')) {
    return {
      minValue: '0',
      maxValue: '12000',
      warnThreshold: '50000',
      rejectThreshold: '200000',
      notes: 'Astaxanthin - seafood/supplement 4-12mg/day, powerful antioxidant',
    };
  }

  // Beta-carotene and provitamin A
  if (name.includes('Carotene') || name.includes('Cryptoxanthin')) {
    return {
      minValue: '0',
      maxValue: '50000',
      warnThreshold: '200000',
      rejectThreshold: '1000000',
      notes: 'Provitamin A carotenoid - dietary 3-10mg/day, converts to vitamin A, very safe',
    };
  }

  // Default carotenoid
  return {
    minValue: '0',
    maxValue: '30000',
    warnThreshold: '100000',
    rejectThreshold: '500000',
    notes: 'Carotenoid - plant pigment, very safe, no toxicity from food sources',
  };
}

/**
 * GLUCOSINOLATE validation ranges
 */
function generateGlucosinolateRange(name: string, unit: string): ValidationRange {
  // Sulforaphane - most studied
  if (name.includes('Sulforaphane')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Isothiocyanate - broccoli 10-50mg/day, anti-cancer properties',
    };
  }

  // Indole-3-Carbinol
  if (name.includes('Indole-3-Carbinol')) {
    return {
      minValue: '0',
      maxValue: '400',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'I3C - cruciferous vegetables 20-120mg/day, anti-cancer effects',
    };
  }

  // Progoitrin (goitrogenic)
  if (name.includes('Progoitrin') || name.includes('Goitrin')) {
    return {
      minValue: '0',
      maxValue: '50',
      warnThreshold: '200',
      rejectThreshold: '1000',
      notes: 'Goitrogenic glucosinolate - interferes with thyroid, cooking reduces',
    };
  }

  // Default glucosinolate
  return {
    minValue: '0',
    maxValue: '200',
    warnThreshold: '800',
    rejectThreshold: '3000',
    notes: 'Glucosinolate - cruciferous vegetables, generally beneficial',
  };
}

/**
 * ANTI-NUTRIENT validation ranges
 */
function generateAntiNutrientRange(name: string, unit: string): ValidationRange {
  // Phytic acid
  if (name.includes('Phytic') || name.includes('Phytate')) {
    return {
      minValue: '0',
      maxValue: '2000',
      warnThreshold: '5000',
      rejectThreshold: '15000',
      notes: 'Phytate - whole grains/legumes 200-1500mg/day, mineral binding, reduced by soaking/fermenting',
    };
  }

  // Oxalic acid
  if (name.includes('Oxalic') || name.includes('Oxalate')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Oxalate - spinach/rhubarb 50-500mg/day, kidney stone risk, calcium binding',
    };
  }

  // Lectins (should be minimal after cooking)
  if (name.includes('Lectin') || name.includes('Phytohemagglutinin')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Lectin - raw beans toxic, cooking destroys, properly cooked foods safe',
    };
  }

  // Tannins
  if (name.includes('Tannic') || name.includes('Tannin')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '3000',
      rejectThreshold: '10000',
      notes: 'Tannins - tea/wine/legumes 50-500mg/day, iron absorption inhibition',
    };
  }

  // Saponins
  if (name.includes('Saponin')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Saponins - legumes 100-400mg/day, GI irritation at high doses',
    };
  }

  // Protease inhibitors
  if (name.includes('Trypsin') || name.includes('Protease')) {
    return {
      minValue: '0',
      maxValue: '200',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Protease inhibitor - raw legumes/soy, cooking reduces, protein digestion inhibition',
    };
  }

  // Goitrogens
  if (name.includes('Goitrin') || name.includes('Thiocyanate')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Goitrogen - cruciferous vegetables, thyroid iodine uptake interference',
    };
  }

  // Default anti-nutrient
  return {
    minValue: '0',
    maxValue: '500',
    warnThreshold: '2000',
    rejectThreshold: '10000',
    notes: 'Anti-nutrient - present in plant foods, cooking/processing reduces',
  };
}

/**
 * PROCESSING COMPOUND validation ranges (should be minimal)
 */
function generateProcessingCompoundRange(name: string, unit: string): ValidationRange {
  // Acrylamide - carcinogen (micrograms)
  if (name.includes('Acrylamide')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Carcinogen - starchy foods >120°C, minimize exposure, IARC 2A',
    };
  }

  // AGEs (kilo units)
  if (name.includes('Carboxymethyllysine') || name.includes('CML')) {
    return {
      minValue: '0',
      maxValue: '15',
      warnThreshold: '50',
      rejectThreshold: '200',
      notes: 'AGE - high-heat cooking, inflammatory, limit to <15kU/day',
    };
  }

  if (name.includes('Methylglyoxal') || name.includes('MGO')) {
    return {
      minValue: '0',
      maxValue: '50',
      warnThreshold: '200',
      rejectThreshold: '1000',
      notes: 'AGE precursor - glycation, minimize high-temperature cooking',
    };
  }

  // HCAs (nanograms - extremely potent carcinogens)
  if (name.includes('PhIP') || name.includes('MeIQx') || name.includes('HCA')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Heterocyclic amine - cooked meat carcinogen, IARC 2B, minimize grilled/fried meat',
    };
  }

  // PAHs (nanograms - carcinogens)
  if (name.includes('Benzo[a]pyrene') || name.includes('BaP')) {
    return {
      minValue: '0',
      maxValue: '200',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'PAH - smoked/charred foods, carcinogen IARC 1, minimize exposure',
    };
  }

  if (name.includes('Pyrene') || name.includes('PAH')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'PAH - incomplete combustion, carcinogenic, minimize smoked foods',
    };
  }

  // Furan compounds (micrograms)
  if (name.includes('Furan') || name.includes('Furfural')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Furan - heat processing, hepatotoxic, IARC 2B',
    };
  }

  if (name.includes('Hydroxymethylfurfural') || name.includes('HMF')) {
    return {
      minValue: '0',
      maxValue: '50',
      warnThreshold: '200',
      rejectThreshold: '1000',
      notes: 'HMF - processed foods/honey, potential carcinogen at high levels',
    };
  }

  // Industrial trans fats (grams)
  if (name.includes('Industrial Trans')) {
    return {
      minValue: '0',
      maxValue: '1',
      warnThreshold: '3',
      rejectThreshold: '10',
      notes: 'Industrial trans fat - partial hydrogenation, CVD risk, banned many countries',
    };
  }

  // Nitrosamines (nanograms - potent carcinogens)
  if (name.includes('Nitrosamine') || name.includes('NDMA') || name.includes('NPYR')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Nitrosamine - processed meats, carcinogen IARC 2A, minimize cured meats',
    };
  }

  // Default processing compound - strict limits
  return {
    minValue: '0',
    maxValue: '100',
    warnThreshold: '500',
    rejectThreshold: '2000',
    notes: 'Processing compound - minimize exposure, potential health concern',
  };
}

/**
 * SYNTHETIC ADDITIVE validation ranges
 */
function generateSyntheticAdditiveRange(name: string, unit: string): ValidationRange {
  // Preservatives
  if (name.includes('Benzoate') || name.includes('Sorbate')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Preservative - regulatory ADI ~5mg/kg body weight, benzene formation concern with vitamin C',
    };
  }

  if (name.includes('BHA') || name.includes('BHT')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Antioxidant preservative - BHA IARC 2B, endocrine disruption concern',
    };
  }

  // Artificial sweeteners
  if (name.includes('Aspartame')) {
    return {
      minValue: '0',
      maxValue: '3000',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'Artificial sweetener - ADI 40mg/kg body weight, PKU contraindication',
    };
  }

  if (name.includes('Sucralose')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Artificial sweetener - ADI 5mg/kg body weight, gut microbiome concerns',
    };
  }

  if (name.includes('Saccharin') || name.includes('Acesulfame')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Artificial sweetener - regulatory ADI established, generally recognized as safe',
    };
  }

  // Artificial colors
  if (name.includes('Tartrazine') || name.includes('Yellow') || name.includes('Red') || name.includes('Sunset')) {
    return {
      minValue: '0',
      maxValue: '100',
      warnThreshold: '500',
      rejectThreshold: '2000',
      notes: 'Azo dye - hyperactivity concern in children, allergic reactions possible',
    };
  }

  // MSG
  if (name.includes('Monosodium Glutamate') || name.includes('MSG')) {
    return {
      minValue: '0',
      maxValue: '5000',
      warnThreshold: '15000',
      rejectThreshold: '50000',
      notes: 'Flavor enhancer - typical intake 0.4-3g/day, MSG sensitivity in some individuals',
    };
  }

  // Default synthetic additive
  return {
    minValue: '0',
    maxValue: '500',
    warnThreshold: '2000',
    rejectThreshold: '10000',
    notes: 'Synthetic additive - regulatory limits apply, minimize exposure',
  };
}

/**
 * PERFORMANCE COMPOUND validation ranges
 */
function generatePerformanceCompoundRange(name: string, unit: string): ValidationRange {
  // Creatine
  if (name.includes('Creatine')) {
    return {
      minValue: '0',
      maxValue: '20',
      warnThreshold: '50',
      rejectThreshold: '200',
      notes: 'Performance supplement - typical dose 3-5g/day, loading 20g/day, hydration important',
    };
  }

  // Beta-Alanine
  if (name.includes('Beta-Alanine')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '30',
      rejectThreshold: '100',
      notes: 'Performance supplement - typical dose 2-5g/day, paresthesia (tingling) common',
    };
  }

  // Caffeine
  if (name.includes('Caffeine')) {
    return {
      minValue: '0',
      maxValue: '400',
      warnThreshold: '800',
      rejectThreshold: '2000',
      notes: 'Stimulant - safe intake <400mg/day, dependence and anxiety at high doses',
    };
  }

  // Citrulline
  if (name.includes('Citrulline')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '30',
      rejectThreshold: '100',
      notes: 'Nitric oxide booster - typical dose 3-6g/day, blood flow enhancement',
    };
  }

  // HMB
  if (name.includes('HMB')) {
    return {
      minValue: '0',
      maxValue: '6',
      warnThreshold: '20',
      rejectThreshold: '50',
      notes: 'Leucine metabolite - typical dose 3g/day, anti-catabolic',
    };
  }

  // Betaine
  if (name.includes('Betaine') || name.includes('TMG')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '30',
      rejectThreshold: '100',
      notes: 'Methyl donor - typical dose 2.5-6g/day, power output improvement',
    };
  }

  // Nitrate
  if (name.includes('Nitrate')) {
    return {
      minValue: '0',
      maxValue: '1000',
      warnThreshold: '3000',
      rejectThreshold: '10000',
      notes: 'Dietary nitrate - beet juice ~300-600mg, exercise efficiency, infant methemoglobinemia concern',
    };
  }

  // Carnosine
  if (name.includes('Carnosine')) {
    return {
      minValue: '0',
      maxValue: '2000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Dipeptide - muscle buffering, synthesized from beta-alanine + histidine',
    };
  }

  // CoQ10
  if (name.includes('CoQ10') || name.includes('Ubiquinone')) {
    return {
      minValue: '0',
      maxValue: '300',
      warnThreshold: '1000',
      rejectThreshold: '5000',
      notes: 'Mitochondrial cofactor - typical dose 100-300mg/day, blood thinner interaction',
    };
  }

  // Default performance compound
  return {
    minValue: '0',
    maxValue: '5000',
    warnThreshold: '15000',
    rejectThreshold: '50000',
    notes: 'Performance supplement - athletic/ergogenic use, follow product guidelines',
  };
}

/**
 * NICHE HEALTH validation ranges
 */
function generateNicheHealthRange(name: string, unit: string): ValidationRange {
  // Alpha-Lipoic Acid
  if (name.includes('Alpha-Lipoic') || name.includes('ALA') || name.includes('Thioctic')) {
    return {
      minValue: '0',
      maxValue: '600',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Antioxidant - typical dose 300-600mg/day, blood sugar lowering effect',
    };
  }

  // NAC
  if (name.includes('N-Acetylcysteine') || name.includes('NAC')) {
    return {
      minValue: '0',
      maxValue: '2000',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Glutathione precursor - typical dose 600-1800mg/day, mucolytic',
    };
  }

  // SAMe
  if (name.includes('SAMe') || name.includes('S-Adenosylmethionine')) {
    return {
      minValue: '0',
      maxValue: '1600',
      warnThreshold: '5000',
      rejectThreshold: '20000',
      notes: 'Methyl donor - typical dose 400-1600mg/day, mood/liver health, bipolar mania risk',
    };
  }

  // PQQ
  if (name.includes('PQQ') || name.includes('Pyrroloquinoline')) {
    return {
      minValue: '0',
      maxValue: '40',
      warnThreshold: '100',
      rejectThreshold: '500',
      notes: 'Mitochondrial cofactor - typical dose 10-20mg/day, biogenesis support',
    };
  }

  // Phosphatidylserine
  if (name.includes('Phosphatidylserine')) {
    return {
      minValue: '0',
      maxValue: '500',
      warnThreshold: '2000',
      rejectThreshold: '10000',
      notes: 'Phospholipid - typical dose 100-300mg/day, cognitive function',
    };
  }

  // ALCAR
  if (name.includes('Acetyl-L-Carnitine') || name.includes('ALCAR')) {
    return {
      minValue: '0',
      maxValue: '3000',
      warnThreshold: '10000',
      rejectThreshold: '50000',
      notes: 'Acetylated carnitine - typical dose 500-2000mg/day, crosses BBB',
    };
  }

  // Melatonin
  if (name.includes('Melatonin')) {
    return {
      minValue: '0',
      maxValue: '10',
      warnThreshold: '30',
      rejectThreshold: '100',
      notes: 'Sleep hormone - typical dose 0.5-5mg/day, daytime drowsiness possible',
    };
  }

  // Default niche health
  return {
    minValue: '0',
    maxValue: '1000',
    warnThreshold: '5000',
    rejectThreshold: '20000',
    notes: 'Specialized health compound - follow practitioner guidance',
  };
}

/**
 * Seed validation ranges for all compounds
 */
export async function seedValidationRanges() {
  console.log('🌱 Starting validation ranges seed...');

  try {
    // Fetch all compounds from database
    console.log('  ├─ Fetching all compounds...');
    const allCompounds = await db.query.compounds.findMany({
      columns: {
        id: true,
        compoundType: true,
        name: true,
        unit: true,
      },
    });

    console.log(`  ├─ Found ${allCompounds.length} compounds`);

    if (allCompounds.length === 0) {
      throw new Error('No compounds found in database. Run compound seed first.');
    }

    // Generate validation ranges for each compound
    console.log('  ├─ Generating validation ranges...');
    const validationRanges: (NewCompoundValidationRange & { compoundId: string })[] = [];

    for (const compound of allCompounds) {
      const range = generateValidationRange(compound);
      validationRanges.push({
        compoundId: compound.id,
        minValue: range.minValue,
        maxValue: range.maxValue,
        warnThreshold: range.warnThreshold,
        rejectThreshold: range.rejectThreshold,
        notes: range.notes,
      });
    }

    // Batch insert validation ranges with progress logging
    console.log('  ├─ Inserting validation ranges...');
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < validationRanges.length; i += batchSize) {
      const batch = validationRanges.slice(i, i + batchSize);
      await db.insert(compoundValidationRanges).values(batch);
      insertedCount += batch.length;
      console.log(`    ✓ Inserted ${insertedCount}/${validationRanges.length} validation ranges`);
    }

    console.log(`✅ Successfully seeded ${insertedCount} validation ranges`);
    console.log('🎉 Validation ranges seeding complete!');

    return insertedCount;

  } catch (error) {
    console.error('❌ Error seeding validation ranges:', error);
    throw error;
  }
}

/**
 * Main execution when run directly
 */
if (require.main === module) {
  seedValidationRanges()
    .then((count) => {
      console.log(`✨ Seed script completed successfully - ${count} ranges seeded`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}
