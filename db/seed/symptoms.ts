import { dbHttp as db } from '../drizzle-http-adapter';
import { symptomDefinitions } from '../schema/symptoms';

/**
 * Seed Default Symptom Definitions
 *
 * 22 system-defined symptoms across 3 categories:
 * - ENERGY_MENTAL (8): Mental clarity, energy, mood states
 * - DIGESTIVE (7): Gut health and digestion
 * - PHYSICAL (7): Body sensations and physical symptoms
 *
 * These are shared across all users (userId = null, isSystemDefined = true)
 */

interface SymptomSeed {
  name: string;
  slug: string;
  category: 'ENERGY_MENTAL' | 'DIGESTIVE' | 'PHYSICAL';
  description: string;
  icon: string;
  isSystemDefined: boolean;
  sortOrder: number;
}

export async function seedSymptoms() {
  console.log('🌱 Seeding default symptom definitions...');

  try {
    // ====================
    // ENERGY & MENTAL SYMPTOMS (8)
    // ====================
    console.log('  → Energy & Mental symptoms...');

    const energyMentalSymptoms: SymptomSeed[] = [
      {
        name: 'Energy Level',
        slug: 'energy-level',
        category: 'ENERGY_MENTAL',
        description: 'Overall physical and mental energy throughout the day',
        icon: '⚡',
        isSystemDefined: true,
        sortOrder: 1,
      },
      {
        name: 'Focus',
        slug: 'focus',
        category: 'ENERGY_MENTAL',
        description: 'Ability to concentrate and stay on task',
        icon: '🎯',
        isSystemDefined: true,
        sortOrder: 2,
      },
      {
        name: 'Mood',
        slug: 'mood',
        category: 'ENERGY_MENTAL',
        description: 'General emotional state and outlook',
        icon: '😊',
        isSystemDefined: true,
        sortOrder: 3,
      },
      {
        name: 'Brain Fog',
        slug: 'brain-fog',
        category: 'ENERGY_MENTAL',
        description: 'Mental cloudiness or difficulty thinking clearly',
        icon: '🌫️',
        isSystemDefined: true,
        sortOrder: 4,
      },
      {
        name: 'Sleep Quality',
        slug: 'sleep-quality',
        category: 'ENERGY_MENTAL',
        description: 'How well-rested you feel from sleep',
        icon: '😴',
        isSystemDefined: true,
        sortOrder: 5,
      },
      {
        name: 'Motivation',
        slug: 'motivation',
        category: 'ENERGY_MENTAL',
        description: 'Drive and enthusiasm to accomplish goals',
        icon: '🚀',
        isSystemDefined: true,
        sortOrder: 6,
      },
      {
        name: 'Anxiety',
        slug: 'anxiety',
        category: 'ENERGY_MENTAL',
        description: 'Feelings of worry, nervousness, or unease',
        icon: '😰',
        isSystemDefined: true,
        sortOrder: 7,
      },
      {
        name: 'Stress',
        slug: 'stress',
        category: 'ENERGY_MENTAL',
        description: 'Mental or emotional strain and pressure',
        icon: '😤',
        isSystemDefined: true,
        sortOrder: 8,
      },
    ];

    // ====================
    // DIGESTIVE SYMPTOMS (7)
    // ====================
    console.log('  → Digestive symptoms...');

    const digestiveSymptoms: SymptomSeed[] = [
      {
        name: 'Bloating',
        slug: 'bloating',
        category: 'DIGESTIVE',
        description: 'Feeling of fullness or swelling in the abdomen',
        icon: '🎈',
        isSystemDefined: true,
        sortOrder: 9,
      },
      {
        name: 'Gas',
        slug: 'gas',
        category: 'DIGESTIVE',
        description: 'Intestinal gas or flatulence',
        icon: '💨',
        isSystemDefined: true,
        sortOrder: 10,
      },
      {
        name: 'Stomach Pain',
        slug: 'stomach-pain',
        category: 'DIGESTIVE',
        description: 'Abdominal discomfort or cramping',
        icon: '🤢',
        isSystemDefined: true,
        sortOrder: 11,
      },
      {
        name: 'Nausea',
        slug: 'nausea',
        category: 'DIGESTIVE',
        description: 'Feeling of sickness or urge to vomit',
        icon: '🤮',
        isSystemDefined: true,
        sortOrder: 12,
      },
      {
        name: 'Heartburn',
        slug: 'heartburn',
        category: 'DIGESTIVE',
        description: 'Burning sensation in chest from acid reflux',
        icon: '🔥',
        isSystemDefined: true,
        sortOrder: 13,
      },
      {
        name: 'Bowel Quality',
        slug: 'bowel-quality',
        category: 'DIGESTIVE',
        description: 'Regularity and consistency of bowel movements',
        icon: '💩',
        isSystemDefined: true,
        sortOrder: 14,
      },
      {
        name: 'Appetite',
        slug: 'appetite',
        category: 'DIGESTIVE',
        description: 'Desire for food and hunger levels',
        icon: '🍽️',
        isSystemDefined: true,
        sortOrder: 15,
      },
    ];

    // ====================
    // PHYSICAL SYMPTOMS (7)
    // ====================
    console.log('  → Physical symptoms...');

    const physicalSymptoms: SymptomSeed[] = [
      {
        name: 'Headache',
        slug: 'headache',
        category: 'PHYSICAL',
        description: 'Pain in head, temples, or behind eyes',
        icon: '🤕',
        isSystemDefined: true,
        sortOrder: 16,
      },
      {
        name: 'Joint Pain',
        slug: 'joint-pain',
        category: 'PHYSICAL',
        description: 'Stiffness or pain in joints',
        icon: '🦴',
        isSystemDefined: true,
        sortOrder: 17,
      },
      {
        name: 'Muscle Soreness',
        slug: 'muscle-soreness',
        category: 'PHYSICAL',
        description: 'Aching or tenderness in muscles',
        icon: '💪',
        isSystemDefined: true,
        sortOrder: 18,
      },
      {
        name: 'Skin Condition',
        slug: 'skin-condition',
        category: 'PHYSICAL',
        description: 'Skin clarity, rashes, or irritation',
        icon: '✨',
        isSystemDefined: true,
        sortOrder: 19,
      },
      {
        name: 'Inflammation',
        slug: 'inflammation',
        category: 'PHYSICAL',
        description: 'General inflammation or swelling in body',
        icon: '🔴',
        isSystemDefined: true,
        sortOrder: 20,
      },
      {
        name: 'Congestion',
        slug: 'congestion',
        category: 'PHYSICAL',
        description: 'Nasal or sinus congestion',
        icon: '🤧',
        isSystemDefined: true,
        sortOrder: 21,
      },
      {
        name: 'Fatigue',
        slug: 'fatigue',
        category: 'PHYSICAL',
        description: 'Physical tiredness and lack of energy',
        icon: '😩',
        isSystemDefined: true,
        sortOrder: 22,
      },
    ];

    // Combine all symptoms
    const allSymptoms = [
      ...energyMentalSymptoms,
      ...digestiveSymptoms,
      ...physicalSymptoms,
    ];

    // Insert all symptoms
    const inserted = await db.insert(symptomDefinitions).values(allSymptoms).returning();

    console.log('✅ Successfully seeded default symptom definitions!');
    console.log(`   Energy & Mental: ${energyMentalSymptoms.length} symptoms`);
    console.log(`   Digestive: ${digestiveSymptoms.length} symptoms`);
    console.log(`   Physical: ${physicalSymptoms.length} symptoms`);
    console.log(`   Total: ${inserted.length} symptoms`);

    return inserted;
  } catch (error) {
    console.error('❌ Error seeding symptom definitions:', error);
    throw error;
  }
}

// Export for standalone execution
if (require.main === module) {
  seedSymptoms()
    .then(() => {
      console.log('🌟 Symptom definitions seed complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Symptom definitions seed failed:', error);
      process.exit(1);
    });
}
