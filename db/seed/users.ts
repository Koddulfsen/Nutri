import { db } from '@/db';
import { userProfiles, apiKeys, userConsent } from '@/db/schema/users';

/**
 * Seed Users
 * Creates 22 diverse test users with varied demographics, consent patterns, and API keys
 *
 * User Types:
 * - Health-conscious professionals
 * - Athletes (runners, bodybuilders, CrossFit)
 * - Dietary restrictions (vegan, gluten-free, keto)
 * - Biohackers and optimizers
 * - Elderly users (health monitoring)
 * - Parents tracking family nutrition
 * - Medical condition awareness (diabetes, heart disease)
 * - Casual users (beginners)
 */

interface TestUser {
  userId: string;
  profile: {
    fullName: string;
    avatarUrl: string;
    dataEncryptionKey: string;
    sessionVersion: number;
    dashboardWidgets: {
      staple: string[];
      custom: string[];
    };
  };
  consent: {
    newsletter: boolean;
    pushNotifications: boolean;
    research: boolean;
    analytics: boolean;
    thirdParty: boolean;
  };
  apiKeys?: Array<{
    keyPrefix: string;
    keyHash: string;
    name: string;
    rateLimit: number;
    lastUsedAt?: Date;
    expiresAt?: Date;
    isRevoked: boolean;
  }>;
}

// Generate realistic test users with diverse demographics
function generateTestUsers(): TestUser[] {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  return [
    // 1. Health-conscious young professional - fully opted in
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Sarah Chen',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=4F46E5&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['micronutrient_balance', 'meal_timing'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
      apiKeys: [
        {
          keyPrefix: 'sk_live_sarah',
          keyHash: '$2b$10$N9qo8uLOickgx2ZoE7eNe.J6dXz0Z8K1s2kJ5nP4pM8qN5L6rN8Q2',
          name: 'Production API',
          rateLimit: 5000,
          lastUsedAt: lastWeek,
          expiresAt: nextYear,
          isRevoked: false,
        },
      ],
    },

    // 2. Marathon runner - performance focused
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Marcus Johnson',
        avatarUrl: 'https://ui-avatars.com/api/?name=Marcus+Johnson&background=10B981&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 2,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['electrolyte_tracking', 'carb_timing', 'recovery_nutrients'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: true,
      },
    },

    // 3. Vegan nutritionist - professional use with API
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Priya Sharma',
        avatarUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=F59E0B&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 3,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['b12_monitoring', 'iron_sources', 'omega3_alternatives'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: false,
        research: true,
        analytics: true,
        thirdParty: false,
      },
      apiKeys: [
        {
          keyPrefix: 'sk_live_priya_prod',
          keyHash: '$2b$10$X8qo9uLPjdkgx3ZpF8fOf.K7eYz1A9L2t3lK6oQ5qN9rO6M7sO9R3',
          name: 'Client Portal API',
          rateLimit: 5000,
          lastUsedAt: lastWeek,
          expiresAt: nextYear,
          isRevoked: false,
        },
        {
          keyPrefix: 'sk_test_priya_dev',
          keyHash: '$2b$10$Y9rp0vMQkeljy4AqG9gPg.L8fZa2B0M3u4mL7pR6rO0sP7N8tP0S4',
          name: 'Development Key',
          rateLimit: 1000,
          lastUsedAt: lastMonth,
          expiresAt: nextYear,
          isRevoked: false,
        },
      ],
    },

    // 4. Bodybuilder - macro tracking focus
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Diego Martinez',
        avatarUrl: 'https://ui-avatars.com/api/?name=Diego+Martinez&background=EF4444&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['protein_timing', 'creatine_tracking', 'amino_acid_profile'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 5. Privacy-focused biohacker - minimal consent
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Alex Kowalski',
        avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Kowalski&background=6B7280&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['nootropic_stack', 'longevity_compounds'],
        },
      },
      consent: {
        newsletter: false,
        pushNotifications: false,
        research: false,
        analytics: false,
        thirdParty: false,
      },
    },

    // 6. Elderly user - health monitoring
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Margaret Williams',
        avatarUrl: 'https://ui-avatars.com/api/?name=Margaret+Williams&background=8B5CF6&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['bone_health', 'heart_nutrients', 'medication_interactions'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 7. Type 2 Diabetic - medical focus
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Robert Thompson',
        avatarUrl: 'https://ui-avatars.com/api/?name=Robert+Thompson&background=EC4899&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['glycemic_impact', 'chromium_tracking', 'magnesium_monitoring'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 8. Keto dieter - macronutrient focus
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Jennifer Lee',
        avatarUrl: 'https://ui-avatars.com/api/?name=Jennifer+Lee&background=06B6D4&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 2,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['ketone_nutrients', 'electrolyte_balance'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: false,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 9. CrossFit athlete - performance and recovery
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Tyler Anderson',
        avatarUrl: 'https://ui-avatars.com/api/?name=Tyler+Anderson&background=14B8A6&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['recovery_window', 'inflammation_markers'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: true,
      },
      apiKeys: [
        {
          keyPrefix: 'sk_live_tyler',
          keyHash: '$2b$10$Z0sp1wNRlfmkz5BrH0hQh.M9gAb3C1N4v5nM8qS7sP1tQ8O9uQ1T5',
          name: 'Mobile App',
          rateLimit: 1000,
          lastUsedAt: lastWeek,
          expiresAt: nextYear,
          isRevoked: false,
        },
      ],
    },

    // 10. Parent tracking children's nutrition
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Emily Rodriguez',
        avatarUrl: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=F97316&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['child_development_nutrients', 'picky_eater_gaps'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 11. Gluten-free celiac patient
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Hannah O\'Connor',
        avatarUrl: 'https://ui-avatars.com/api/?name=Hannah+OConnor&background=84CC16&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['nutrient_deficiency_watch', 'iron_absorption'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 12. Biohacker with extensive tracking
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'David Kim',
        avatarUrl: 'https://ui-avatars.com/api/?name=David+Kim&background=3B82F6&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 4,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['nad_precursors', 'mitochondrial_support', 'methylation_cycle', 'autophagy_nutrients'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: true,
      },
      apiKeys: [
        {
          keyPrefix: 'sk_live_david_main',
          keyHash: '$2b$10$A1tq2xOSmgnla6CsI1iRi.N0hBc4D2O5w6oN9rT8tQ2uR9P0vR2U6',
          name: 'Quantified Self Dashboard',
          rateLimit: 5000,
          lastUsedAt: lastWeek,
          expiresAt: nextYear,
          isRevoked: false,
        },
      ],
    },

    // 13. Casual user - just starting
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Jessica Brown',
        avatarUrl: 'https://ui-avatars.com/api/?name=Jessica+Brown&background=A855F7&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: [],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: false,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 14. Heart disease awareness - monitoring cholesterol nutrients
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Michael Patterson',
        avatarUrl: 'https://ui-avatars.com/api/?name=Michael+Patterson&background=DC2626&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['omega3_ratio', 'fiber_tracking', 'plant_sterols'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 15. Pregnant woman - prenatal nutrition
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Sophia Nguyen',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sophia+Nguyen&background=FCD34D&color=000',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['folate_tracking', 'iron_monitoring', 'dha_intake'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 16. Student athlete - budget conscious
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Jamal Washington',
        avatarUrl: 'https://ui-avatars.com/api/?name=Jamal+Washington&background=059669&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['budget_nutrients', 'performance_essentials'],
        },
      },
      consent: {
        newsletter: false,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 17. Senior with multiple medications
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'William Davis',
        avatarUrl: 'https://ui-avatars.com/api/?name=William+Davis&background=7C3AED&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['medication_interactions', 'vitamin_k_consistency', 'calcium_absorption'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 18. Intermittent faster - meal timing focus
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Rachel Goldman',
        avatarUrl: 'https://ui-avatars.com/api/?name=Rachel+Goldman&background=DB2777&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 2,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['fasting_nutrients', 'refeeding_optimization'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: false,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 19. Professional chef - culinary nutrition
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Antonio Rossi',
        avatarUrl: 'https://ui-avatars.com/api/?name=Antonio+Rossi&background=0891B2&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['cooking_method_impact', 'nutrient_retention'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: false,
        research: false,
        analytics: true,
        thirdParty: false,
      },
    },

    // 20. Tech worker with revoked API key
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Kevin Patel',
        avatarUrl: 'https://ui-avatars.com/api/?name=Kevin+Patel&background=6366F1&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 2,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['focus_nutrients', 'eye_health_compounds'],
        },
      },
      consent: {
        newsletter: false,
        pushNotifications: true,
        research: false,
        analytics: true,
        thirdParty: false,
      },
      apiKeys: [
        {
          keyPrefix: 'sk_live_kevin_old',
          keyHash: '$2b$10$B2ur3yPTnholm7DtJ2jSj.O1iCd5E3P6x7pO0sU9uR3vS0Q1wS3V7',
          name: 'Old Integration (Revoked)',
          rateLimit: 500,
          lastUsedAt: lastMonth,
          expiresAt: nextYear,
          isRevoked: true,
        },
      ],
    },

    // 21. Weightlifter - strength focused
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Samantha Brooks',
        avatarUrl: 'https://ui-avatars.com/api/?name=Samantha+Brooks&background=D97706&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['leucine_tracking', 'vitamin_d_status'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },

    // 22. Menopause - hormone support nutrition
    {
      userId: crypto.randomUUID(),
      profile: {
        fullName: 'Linda Morrison',
        avatarUrl: 'https://ui-avatars.com/api/?name=Linda+Morrison&background=BE185D&color=fff',
        dataEncryptionKey: crypto.randomUUID(),
        sessionVersion: 1,
        dashboardWidgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: ['phytoestrogen_tracking', 'bone_density_nutrients', 'collagen_support'],
        },
      },
      consent: {
        newsletter: true,
        pushNotifications: true,
        research: true,
        analytics: true,
        thirdParty: false,
      },
    },
  ];
}

export async function seedUsers() {
  console.log('🌱 Starting user seed...');

  const testUsers = generateTestUsers();
  let profileCount = 0;
  let consentCount = 0;
  let apiKeyCount = 0;

  try {
    // Insert all user profiles
    console.log(`📝 Inserting ${testUsers.length} user profiles...`);
    for (const user of testUsers) {
      await db.insert(userProfiles).values({
        userId: user.userId,
        fullName: user.profile.fullName,
        avatarUrl: user.profile.avatarUrl,
        dataEncryptionKey: user.profile.dataEncryptionKey,
        sessionVersion: user.profile.sessionVersion,
        dashboardWidgets: user.profile.dashboardWidgets,
      });
      profileCount++;
    }
    console.log(`✅ Inserted ${profileCount} user profiles`);

    // Insert all user consent records
    console.log(`📝 Inserting ${testUsers.length} user consent records...`);
    for (const user of testUsers) {
      await db.insert(userConsent).values({
        userId: user.userId,
        newsletter: user.consent.newsletter,
        pushNotifications: user.consent.pushNotifications,
        research: user.consent.research,
        analytics: user.consent.analytics,
        thirdParty: user.consent.thirdParty,
      });
      consentCount++;
    }
    console.log(`✅ Inserted ${consentCount} user consent records`);

    // Insert API keys for users that have them
    const usersWithApiKeys = testUsers.filter(u => u.apiKeys && u.apiKeys.length > 0);
    console.log(`📝 Inserting API keys for ${usersWithApiKeys.length} users...`);
    for (const user of usersWithApiKeys) {
      if (!user.apiKeys) continue;

      for (const apiKey of user.apiKeys) {
        await db.insert(apiKeys).values({
          userId: user.userId,
          keyPrefix: apiKey.keyPrefix,
          keyHash: apiKey.keyHash,
          name: apiKey.name,
          rateLimit: apiKey.rateLimit,
          lastUsedAt: apiKey.lastUsedAt,
          expiresAt: apiKey.expiresAt,
          isRevoked: apiKey.isRevoked,
        });
        apiKeyCount++;
      }
    }
    console.log(`✅ Inserted ${apiKeyCount} API keys`);

    console.log(`\n✨ User seed complete!`);
    console.log(`   ${profileCount} user profiles`);
    console.log(`   ${consentCount} consent records`);
    console.log(`   ${apiKeyCount} API keys`);
    console.log(`   ${usersWithApiKeys.length} users with API access`);

    return {
      success: true,
      counts: {
        profiles: profileCount,
        consents: consentCount,
        apiKeys: apiKeyCount,
      },
    };

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}
