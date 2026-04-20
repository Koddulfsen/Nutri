/**
 * Medication Interactions Seed Data
 *
 * Comprehensive seed data for 18 clinically significant medication-nutrient interactions
 * covering all major medication classes with varying severity and evidence levels.
 *
 * Severity Levels:
 * - SEVERE (4): Life-threatening or major clinical impact
 * - HIGH (5): Significant clinical concern requiring monitoring
 * - MODERATE (5): Notable interaction requiring awareness
 * - LOW (4): Minor interaction with preventable consequences
 *
 * Evidence Levels:
 * - TIER_1_RCT (5): Randomized controlled trials
 * - TIER_2_OBSERVATIONAL (4): Observational studies
 * - TIER_3_FDA_LABEL (5): FDA label warnings
 * - TIER_4_THEORETICAL (4): Theoretical/mechanistic basis
 */

import { db } from '../index';
import { medicationInteractions } from '../schema/interactions';
import { compounds } from '../schema/compounds';
import type { NewMedicationInteraction } from '@/lib/types/database';
import { eq } from 'drizzle-orm';

interface InteractionSeedData extends Omit<NewMedicationInteraction, 'id' | 'compoundId' | 'createdAt' | 'updatedAt'> {
  compoundName: string; // Will be resolved to UUID
}

/**
 * Helper function to resolve compound names to UUIDs
 */
async function resolveCompoundId(compoundName: string): Promise<string> {
  const compound = await db.query.compounds.findFirst({
    where: eq(compounds.name, compoundName),
    columns: { id: true },
  });

  if (!compound) {
    throw new Error(`Compound not found: ${compoundName}`);
  }

  return compound.id;
}

/**
 * Seed medication interactions in the database
 */
export async function seedInteractions() {
  console.log('🌱 Starting medication interactions seed...');

  try {
    const interactionSeeds: InteractionSeedData[] = [
      // ═══════════════════════════════════════════════════════════════
      // SEVERE INTERACTIONS (4)
      // ═══════════════════════════════════════════════════════════════

      {
        compoundName: 'Vitamin K',
        medicationName: 'Warfarin',
        severity: 'SEVERE',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'Vitamin K directly antagonizes warfarin\'s anticoagulant effects by promoting blood clotting factors. Sudden increases or decreases in dietary vitamin K can cause dangerous fluctuations in INR (International Normalized Ratio), leading to either inadequate anticoagulation (thrombosis risk) or excessive anticoagulation (bleeding risk).',
        clinicalNote: 'CRITICAL: Maintain consistent daily vitamin K intake (do not avoid, but keep stable). Foods high in vitamin K include leafy greens, broccoli, and Brussels sprouts. Consult your healthcare provider before making significant dietary changes. INR monitoring is essential.',
      },

      {
        compoundName: 'Tyramine',
        medicationName: 'MAOIs (Monoamine Oxidase Inhibitors)',
        severity: 'SEVERE',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'MAOIs prevent the breakdown of tyramine, a compound found in aged, fermented, and processed foods. Accumulated tyramine can trigger sudden, dangerous spikes in blood pressure (hypertensive crisis), potentially leading to stroke, heart attack, or death.',
        clinicalNote: 'CRITICAL: Strictly avoid high-tyramine foods including aged cheeses, cured meats, fermented foods, draft beer, and overripe fruits. Seek immediate medical attention if you experience severe headache, chest pain, rapid heartbeat, or vision changes.',
      },

      {
        compoundName: 'Calcium',
        medicationName: 'Levothyroxine',
        severity: 'SEVERE',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'Calcium binds to levothyroxine in the gastrointestinal tract, forming insoluble complexes that significantly reduce thyroid hormone absorption. This can lead to inadequate thyroid replacement therapy, resulting in persistent hypothyroid symptoms and potential cardiovascular complications.',
        clinicalNote: 'CRITICAL: Take levothyroxine on an empty stomach at least 4 hours before or after calcium supplements or calcium-rich foods (dairy, fortified foods). Consistent spacing is essential for maintaining stable thyroid hormone levels. Do not adjust timing without consulting your healthcare provider.',
      },

      {
        compoundName: 'Folate',
        medicationName: 'Methotrexate',
        severity: 'SEVERE',
        evidenceLevel: 'TIER_1_RCT',
        interactionDescription: 'Methotrexate is a folate antagonist that inhibits dihydrofolate reductase, blocking folate metabolism to suppress cell division in cancer and autoimmune conditions. High-dose folate supplementation can directly counteract methotrexate\'s therapeutic effects, reducing treatment efficacy.',
        clinicalNote: 'CRITICAL: Do NOT take folic acid or folate supplements during methotrexate therapy unless specifically prescribed by your oncologist or rheumatologist. Low-dose folate may be prescribed 24-48 hours after methotrexate to reduce side effects without compromising efficacy. Never self-supplement.',
      },

      // ═══════════════════════════════════════════════════════════════
      // HIGH SEVERITY INTERACTIONS (5)
      // ═══════════════════════════════════════════════════════════════

      {
        compoundName: 'Naringenin',
        medicationName: 'Statins (Atorvastatin, Simvastatin, Lovastatin)',
        severity: 'HIGH',
        evidenceLevel: 'TIER_1_RCT',
        interactionDescription: 'Grapefruit compounds (naringenin, bergamottin) inhibit CYP3A4 intestinal enzymes responsible for metabolizing statins. This inhibition can increase statin blood levels by 300-500%, dramatically raising the risk of muscle toxicity (rhabdomyolysis), liver damage, and kidney failure.',
        clinicalNote: 'IMPORTANT: Avoid grapefruit and grapefruit juice entirely while taking atorvastatin, simvastatin, or lovastatin. Effects can persist for 24-72 hours. Consider switching to pravastatin or rosuvastatin if grapefruit is important to your diet. Report any unexplained muscle pain, weakness, or dark urine immediately.',
      },

      {
        compoundName: 'Calcium',
        medicationName: 'Tetracycline Antibiotics',
        severity: 'HIGH',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'Tetracycline antibiotics form chelation complexes with divalent cations (calcium, magnesium, iron), creating insoluble compounds that cannot be absorbed. This reduces antibiotic bioavailability by up to 90%, potentially leading to treatment failure and antibiotic resistance.',
        clinicalNote: 'IMPORTANT: Take tetracycline antibiotics 2 hours before or 4-6 hours after consuming dairy products, calcium supplements, antacids, or multivitamins containing minerals. Complete the full antibiotic course even if symptoms improve. Inadequate dosing contributes to antibiotic resistance.',
      },

      {
        compoundName: 'Magnesium',
        medicationName: 'Digoxin',
        severity: 'HIGH',
        evidenceLevel: 'TIER_2_OBSERVATIONAL',
        interactionDescription: 'Low magnesium levels increase cardiac sensitivity to digoxin, amplifying both therapeutic and toxic effects. Magnesium depletion (common with diuretics) can trigger life-threatening arrhythmias, nausea, visual disturbances, and confusion even at normal digoxin doses.',
        clinicalNote: 'IMPORTANT: Monitor serum magnesium levels regularly if taking digoxin, especially with concurrent diuretic therapy. Maintain adequate dietary magnesium (nuts, seeds, whole grains, leafy greens). Report irregular heartbeat, severe nausea, yellow-green vision changes, or confusion immediately.',
      },

      {
        compoundName: 'Potassium',
        medicationName: 'ACE Inhibitors (Lisinopril, Enalapril)',
        severity: 'HIGH',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'ACE inhibitors reduce potassium excretion by suppressing aldosterone, leading to potassium retention. Concurrent high potassium intake or supplementation can cause dangerous hyperkalemia, resulting in cardiac arrhythmias, muscle weakness, and potentially fatal heart rhythm disturbances.',
        clinicalNote: 'IMPORTANT: Avoid potassium supplements and salt substitutes (potassium chloride) unless prescribed. Limit high-potassium foods (bananas, oranges, potatoes, tomatoes, spinach). Regular blood tests are essential to monitor potassium levels. Report muscle weakness, irregular heartbeat, or tingling sensations immediately.',
      },

      {
        compoundName: 'Sodium',
        medicationName: 'Lithium',
        severity: 'HIGH',
        evidenceLevel: 'TIER_2_OBSERVATIONAL',
        interactionDescription: 'Sodium and lithium share kidney reabsorption mechanisms. Low sodium intake causes the kidneys to retain more lithium, increasing lithium blood levels and toxicity risk. Conversely, sudden high sodium intake can reduce lithium levels, destabilizing mood.',
        clinicalNote: 'IMPORTANT: Maintain consistent daily sodium intake (2,300-3,000 mg/day). Avoid crash diets, extreme low-sodium diets, or excessive sweating without electrolyte replacement. Monitor for lithium toxicity signs: tremor, confusion, excessive thirst, frequent urination. Regular lithium level monitoring is essential.',
      },

      // ═══════════════════════════════════════════════════════════════
      // MODERATE SEVERITY INTERACTIONS (5)
      // ═══════════════════════════════════════════════════════════════

      {
        compoundName: 'Vitamin B12',
        medicationName: 'Metformin',
        severity: 'MODERATE',
        evidenceLevel: 'TIER_1_RCT',
        interactionDescription: 'Long-term metformin use (especially doses >2000 mg/day) interferes with vitamin B12 absorption in the terminal ileum by altering calcium-dependent membrane action. This leads to gradual B12 depletion over months to years, potentially causing irreversible neurological damage if left untreated.',
        clinicalNote: 'Monitor vitamin B12 levels annually if taking metformin long-term (>3 months). Symptoms of deficiency include fatigue, numbness/tingling in extremities, memory problems, and balance issues. Consider B12 supplementation (oral or sublingual 500-1000 mcg daily, or periodic injections if malabsorption is severe).',
      },

      {
        compoundName: 'Magnesium',
        medicationName: 'Proton Pump Inhibitors (Omeprazole, Lansoprazole)',
        severity: 'MODERATE',
        evidenceLevel: 'TIER_2_OBSERVATIONAL',
        interactionDescription: 'Long-term PPI use (>1 year) reduces gastric acid needed for magnesium absorption from food, potentially leading to hypomagnesemia. Low magnesium increases risk of muscle spasms, irregular heartbeat, and osteoporosis (combined with calcium malabsorption).',
        clinicalNote: 'If using PPIs long-term, monitor magnesium levels annually. Consider magnesium supplementation (200-400 mg daily of magnesium glycinate or citrate). Report persistent muscle cramps, tremors, irregular heartbeat, or seizures. Discuss with your doctor whether PPI therapy can be reduced or discontinued.',
      },

      {
        compoundName: 'Potassium',
        medicationName: 'Loop Diuretics (Furosemide, Bumetanide)',
        severity: 'MODERATE',
        evidenceLevel: 'TIER_3_FDA_LABEL',
        interactionDescription: 'Loop diuretics increase urinary potassium excretion, leading to gradual depletion. Low potassium causes muscle weakness, fatigue, constipation, and increases risk of dangerous heart arrhythmias, especially in patients taking digoxin or with heart disease.',
        clinicalNote: 'Monitor potassium levels regularly. Your doctor may prescribe potassium supplements or recommend potassium-rich foods (bananas, oranges, potatoes, spinach). Report muscle weakness, leg cramps, irregular heartbeat, or severe fatigue. Adequate potassium is critical for heart health.',
      },

      {
        compoundName: 'Calcium',
        medicationName: 'Bisphosphonates (Alendronate, Risedronate)',
        severity: 'MODERATE',
        evidenceLevel: 'TIER_4_THEORETICAL',
        interactionDescription: 'Calcium binds to bisphosphonates in the gastrointestinal tract, forming chelation complexes that reduce bisphosphonate absorption by up to 60%. This diminishes the medication\'s effectiveness in preventing bone loss and fractures.',
        clinicalNote: 'Take bisphosphonates on an empty stomach with plain water at least 30-60 minutes before breakfast. Avoid calcium supplements, dairy products, and fortified foods during this period. Adequate calcium intake is still important for bone health - just time it properly (consume calcium 2+ hours after bisphosphonate).',
      },

      {
        compoundName: 'Vitamin E',
        medicationName: 'NSAIDs (Ibuprofen, Naproxen, Aspirin)',
        severity: 'MODERATE',
        evidenceLevel: 'TIER_4_THEORETICAL',
        interactionDescription: 'Both vitamin E (especially doses >400 IU/day) and NSAIDs inhibit platelet aggregation through different mechanisms. Combined use may have additive antiplatelet effects, potentially increasing bleeding risk, particularly during surgery or with concurrent anticoagulant therapy.',
        clinicalNote: 'Use caution when combining high-dose vitamin E supplements with NSAIDs. Avoid vitamin E supplements >400 IU daily. Discontinue vitamin E 2 weeks before planned surgery. Report unusual bruising, prolonged bleeding from cuts, or blood in urine/stool. Dietary vitamin E from food is generally safe.',
      },

      // ═══════════════════════════════════════════════════════════════
      // LOW SEVERITY INTERACTIONS (4)
      // ═══════════════════════════════════════════════════════════════

      {
        compoundName: 'Vitamin K',
        medicationName: 'Broad-Spectrum Antibiotics',
        severity: 'LOW',
        evidenceLevel: 'TIER_4_THEORETICAL',
        interactionDescription: 'Broad-spectrum antibiotics can disrupt intestinal microbiota that synthesize vitamin K2 (menaquinone), potentially reducing endogenous vitamin K production. Short-term antibiotic courses rarely cause clinically significant deficiency in healthy adults with adequate dietary intake.',
        clinicalNote: 'Maintain vitamin K-rich foods (leafy greens, broccoli, Brussels sprouts) during and after antibiotic treatment. Consider probiotic supplementation during extended antibiotic courses to support gut flora recovery. Vitamin K deficiency is rare with normal diet and brief antibiotic use.',
      },

      {
        compoundName: 'Calcium',
        medicationName: 'Corticosteroids (Prednisone, Methylprednisolone)',
        severity: 'LOW',
        evidenceLevel: 'TIER_2_OBSERVATIONAL',
        interactionDescription: 'Long-term corticosteroid use (>3 months) reduces calcium absorption in the intestine and increases urinary calcium excretion, while also directly suppressing bone formation. This combination significantly increases osteoporosis risk, especially in postmenopausal women and elderly patients.',
        clinicalNote: 'If taking corticosteroids long-term, ensure adequate calcium (1200-1500 mg/day) and vitamin D (800-1000 IU/day) intake through diet and supplements. Weight-bearing exercise is crucial. Discuss bone density monitoring with your healthcare provider. This is preventive rather than an acute interaction.',
      },

      {
        compoundName: 'Ubiquinone',
        medicationName: 'Beta-Blockers (Metoprolol, Atenolol)',
        severity: 'LOW',
        evidenceLevel: 'TIER_4_THEORETICAL',
        interactionDescription: 'Beta-blockers may inhibit CoQ10-dependent enzymes involved in cellular energy production, potentially reducing endogenous CoQ10 synthesis. Some patients report increased fatigue, though clinical significance remains debated and effects are generally mild.',
        clinicalNote: 'Consider CoQ10 supplementation (100-200 mg daily) if experiencing persistent fatigue or muscle weakness while taking beta-blockers. CoQ10 is well-tolerated and may support cardiovascular health. Discuss with your healthcare provider, especially if you have heart failure.',
      },

      {
        compoundName: 'Vitamin D',
        medicationName: 'Anticonvulsants (Phenytoin, Carbamazepine, Phenobarbital)',
        severity: 'LOW',
        evidenceLevel: 'TIER_1_RCT',
        interactionDescription: 'Enzyme-inducing anticonvulsants accelerate vitamin D metabolism via CYP450 enzymes, increasing conversion to inactive metabolites. Long-term use can lead to vitamin D deficiency, reduced calcium absorption, and increased risk of osteomalacia and fractures.',
        clinicalNote: 'Monitor vitamin D levels annually if taking enzyme-inducing anticonvulsants. Supplement with vitamin D3 (1000-2000 IU daily or as advised based on blood levels). Ensure adequate calcium intake. Consider bone density screening for long-term users. Regular monitoring prevents complications.',
      },
    ];

    console.log(`  ├─ Resolving compound names to UUIDs...`);

    // Resolve all compound IDs
    const resolvedInteractions: NewMedicationInteraction[] = [];

    for (const seed of interactionSeeds) {
      try {
        const compoundId = await resolveCompoundId(seed.compoundName);
        resolvedInteractions.push({
          compoundId,
          medicationName: seed.medicationName,
          interactionDescription: seed.interactionDescription,
          severity: seed.severity,
          evidenceLevel: seed.evidenceLevel,
          clinicalNote: seed.clinicalNote,
        });
        console.log(`    ├─ Resolved: ${seed.compoundName} -> ${compoundId.substring(0, 8)}...`);
      } catch (error) {
        console.error(`    ├─ ERROR: Failed to resolve compound "${seed.compoundName}":`, error);
        throw error;
      }
    }

    console.log(`  ├─ Inserting ${resolvedInteractions.length} medication interactions...`);

    const inserted = await db.insert(medicationInteractions).values(resolvedInteractions).returning();

    console.log(`  └─ Successfully seeded ${inserted.length} medication interactions`);
    console.log(`     ├─ SEVERE: ${inserted.filter(i => i.severity === 'SEVERE').length}`);
    console.log(`     ├─ HIGH: ${inserted.filter(i => i.severity === 'HIGH').length}`);
    console.log(`     ├─ MODERATE: ${inserted.filter(i => i.severity === 'MODERATE').length}`);
    console.log(`     ├─ LOW: ${inserted.filter(i => i.severity === 'LOW').length}`);
    console.log(`     ├─ TIER_1_RCT: ${inserted.filter(i => i.evidenceLevel === 'TIER_1_RCT').length}`);
    console.log(`     ├─ TIER_2_OBSERVATIONAL: ${inserted.filter(i => i.evidenceLevel === 'TIER_2_OBSERVATIONAL').length}`);
    console.log(`     ├─ TIER_3_FDA_LABEL: ${inserted.filter(i => i.evidenceLevel === 'TIER_3_FDA_LABEL').length}`);
    console.log(`     └─ TIER_4_THEORETICAL: ${inserted.filter(i => i.evidenceLevel === 'TIER_4_THEORETICAL').length}`);

    return inserted;
  } catch (error) {
    console.error('❌ Failed to seed medication interactions:', error);
    throw error;
  }
}
