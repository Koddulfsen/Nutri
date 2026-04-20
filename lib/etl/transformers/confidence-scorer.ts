/**
 * Confidence Scorer
 *
 * Purpose: Calculate 4-layer confidence scores for nutrient data quality
 * Pattern: Multi-factor scoring algorithm with data freshness decay
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1550-1650 (Data Quality Scoring)
 */

import { logger } from '@/lib/logger';

/**
 * Confidence Score Result
 * Contains all 4 layers plus final weighted score
 */
export interface ConfidenceScore {
  l1: number; // Layer 1: Sample size (0-100)
  l2: number; // Layer 2: Method quality (0-100)
  l3: number; // Layer 3: Source priority (0-100)
  l4: number; // Layer 4: Data freshness (0-100)
  final: number; // Final weighted score (0-100)
}

/**
 * Nutrient Data Context
 * Input data for confidence scoring
 */
export interface NutrientDataContext {
  // Layer 1: Sample size
  dataPoints: number | null; // Number of samples analyzed

  // Layer 2: Method quality
  derivationCode: string | null; // USDA derivation code
  derivationDescription: string | null;

  // Layer 3: Source priority
  dataType: string; // 'Foundation', 'SR Legacy', 'Survey', 'Branded'

  // Layer 4: Data freshness
  publicationDate: string | null; // ISO date string
}

/**
 * Confidence Scorer
 * Implements 4-layer confidence algorithm for nutrient data
 */
export class ConfidenceScorer {
  /**
   * Calculate complete 4-layer confidence score
   *
   * @param context - Nutrient data context
   * @returns Confidence score with all layers
   */
  calculateConfidence(context: NutrientDataContext): ConfidenceScore {
    const l1 = this.calculateL1_SampleSize(context.dataPoints);
    const l2 = this.calculateL2_MethodQuality(context.derivationCode, context.derivationDescription);
    const l3 = this.calculateL3_SourcePriority(context.dataType);
    const l4 = this.calculateL4_DataFreshness(context.publicationDate);

    // Calculate final weighted score
    // Weights: L1=30%, L2=30%, L3=25%, L4=15%
    const final = Math.round(
      (l1 * 0.30) +
      (l2 * 0.30) +
      (l3 * 0.25) +
      (l4 * 0.15)
    );

    logger.debug(
      {
        service: 'confidence-scorer',
        l1,
        l2,
        l3,
        l4,
        final,
        dataType: context.dataType,
        dataPoints: context.dataPoints,
        derivationCode: context.derivationCode,
      },
      'Confidence score calculated'
    );

    return { l1, l2, l3, l4, final };
  }

  /**
   * Layer 1: Sample Size Confidence
   *
   * Score based on number of samples analyzed:
   * - >10 samples = 100% (highly reliable)
   * - 1-10 samples = 50% (moderate reliability)
   * - 0 samples / null = 25% (unknown reliability, calculated value)
   *
   * @param dataPoints - Number of samples
   * @returns L1 score (0-100)
   */
  private calculateL1_SampleSize(dataPoints: number | null): number {
    if (dataPoints === null || dataPoints === 0) {
      return 25; // Unknown or calculated value
    }

    if (dataPoints >= 10) {
      return 100; // High sample size
    }

    // Linear scale from 50-100 for 1-10 samples
    return 50 + Math.round((dataPoints / 10) * 50);
  }

  /**
   * Layer 2: Method Quality Confidence
   *
   * Score based on USDA derivation method:
   * - Analytical (A, AS, AR) = 100% (lab tested)
   * - Calculated (C, NC) = 75% (computed from components)
   * - Assumed (Z) = 50% (zero value assumed)
   * - Unknown/Missing = 60% (default moderate confidence)
   *
   * Reference: https://fdc.nal.usda.gov/help.html#bkmk-4
   *
   * @param derivationCode - USDA derivation code
   * @param derivationDescription - Full derivation description
   * @returns L2 score (0-100)
   */
  private calculateL2_MethodQuality(
    derivationCode: string | null,
    derivationDescription: string | null
  ): number {
    if (!derivationCode) {
      return 60; // Default for missing data
    }

    const code = derivationCode.toUpperCase();

    // Analytical methods (highest quality)
    if (code === 'A' || code === 'AS' || code === 'AR') {
      return 100;
    }

    // Calculated methods
    if (code === 'C' || code === 'NC' || code.startsWith('CALC')) {
      return 75;
    }

    // Assumed zero
    if (code === 'Z') {
      return 50;
    }

    // Borrowed from other source
    if (code === 'B' || code === 'BP') {
      return 70;
    }

    // Imputed
    if (code === 'I') {
      return 65;
    }

    // Unknown method
    logger.debug(
      {
        service: 'confidence-scorer',
        derivationCode,
        derivationDescription,
      },
      'Unknown derivation code - using default L2 score'
    );

    return 60;
  }

  /**
   * Layer 3: Source Priority Confidence
   *
   * Score based on USDA data type:
   * - Foundation = 100% (gold standard, extensively analyzed)
   * - SR Legacy = 75% (reliable but older)
   * - Survey (FNDDS) = 85% (national survey data)
   * - Branded = 60% (manufacturer provided)
   *
   * Reference: https://fdc.nal.usda.gov/data-documentation.html
   *
   * @param dataType - USDA data type
   * @returns L3 score (0-100)
   */
  private calculateL3_SourcePriority(dataType: string): number {
    switch (dataType) {
      case 'Foundation':
        return 100; // Gold standard

      case 'Survey (FNDDS)':
      case 'Survey':
        return 85; // National survey data

      case 'SR Legacy':
        return 75; // Legacy standard reference

      case 'Branded':
        return 60; // Manufacturer provided

      default:
        logger.warn(
          {
            service: 'confidence-scorer',
            dataType,
          },
          'Unknown USDA data type - using default L3 score'
        );
        return 50;
    }
  }

  /**
   * Layer 4: Data Freshness Confidence
   *
   * Score based on publication date with 5% decay per year since 2020:
   * - 2024+ = 100% (current data)
   * - 2020-2023 = 95-100% (recent data)
   * - 2015-2019 = 75-90% (aging data)
   * - 2010-2014 = 50-70% (old data)
   * - <2010 or null = 40% (very old or unknown)
   *
   * @param publicationDate - ISO date string (YYYY-MM-DD)
   * @returns L4 score (0-100)
   */
  private calculateL4_DataFreshness(publicationDate: string | null): number {
    if (!publicationDate) {
      return 40; // Unknown publication date
    }

    const pubYear = new Date(publicationDate).getFullYear();
    const currentYear = new Date().getFullYear();

    // Cap at 2024 (current year reference)
    const baselineYear = 2020;
    const yearsOld = Math.max(0, baselineYear - pubYear);

    // 5% decay per year before 2020
    const decayPercent = yearsOld * 5;
    const score = Math.max(40, 100 - decayPercent); // Floor at 40%

    return score;
  }

  /**
   * Batch calculate confidence scores
   *
   * @param contexts - Array of nutrient data contexts
   * @returns Array of confidence scores
   */
  calculateBatch(contexts: NutrientDataContext[]): ConfidenceScore[] {
    return contexts.map((context) => this.calculateConfidence(context));
  }

  /**
   * Determine if nutrient should be quarantined based on confidence
   *
   * @param score - Confidence score
   * @param threshold - Minimum acceptable final score (default: 40)
   * @returns True if should be quarantined
   */
  shouldQuarantine(score: ConfidenceScore, threshold = 40): boolean {
    return score.final < threshold;
  }
}

/**
 * Singleton scorer instance
 */
export const confidenceScorer = new ConfidenceScorer();
