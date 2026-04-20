/**
 * Seed Script: Authentication Foundation
 * Creates test users with profiles, consent records, and audit log entries
 *
 * Usage: node db/seed/auth-foundation.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🌱 Seeding Authentication Foundation Data...\n');

/**
 * Generate random 256-bit data encryption key (DEK)
 */
function generateDEK() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create test user via Supabase Auth
 */
async function createTestUser(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for test users
      user_metadata: {
        full_name: fullName
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  ⏭️  User ${email} already exists`);
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        return existingUser;
      }
      throw error;
    }

    console.log(`  ✅ Created user: ${email}`);
    return data.user;
  } catch (err) {
    console.error(`  ❌ Failed to create user ${email}:`, err.message);
    return null;
  }
}

/**
 * Create user profile
 */
async function createUserProfile(userId, fullName) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        full_name: fullName,
        avatar_url: null,
        data_encryption_key: generateDEK(),
        session_version: 1,
        dashboard_widgets: {
          staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
          custom: []
        }
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log(`  ⏭️  Profile for ${fullName} already exists`);
        return null;
      }
      throw error;
    }

    console.log(`  ✅ Created profile for: ${fullName}`);
    return data;
  } catch (err) {
    console.error(`  ❌ Failed to create profile for ${fullName}:`, err.message);
    return null;
  }
}

/**
 * Create user consent record
 */
async function createUserConsent(userId, preferences) {
  try {
    const { data, error } = await supabase
      .from('user_consent')
      .insert({
        user_id: userId,
        newsletter: preferences.newsletter,
        push_notifications: preferences.pushNotifications,
        research: preferences.research,
        analytics: preferences.analytics,
        third_party: preferences.thirdParty
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log(`  ⏭️  Consent record already exists`);
        return null;
      }
      throw error;
    }

    console.log(`  ✅ Created consent record`);
    return data;
  } catch (err) {
    console.error(`  ❌ Failed to create consent:`, err.message);
    return null;
  }
}

/**
 * Create audit log entry
 */
async function createAuditLog(userId, action, resourceType, resourceId, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Mozilla 5.0'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error(`  ❌ Failed to create audit log:`, err.message);
    return null;
  }
}

// ============================================================================
// Seed Test Users
// ============================================================================

const testUsers = [
  {
    email: 'alice@nutri.test',
    password: 'TestPassword123!',
    fullName: 'Alice Johnson',
    consent: {
      newsletter: true,
      pushNotifications: true,
      research: true,
      analytics: true,
      thirdParty: false
    }
  },
  {
    email: 'bob@nutri.test',
    password: 'TestPassword123!',
    fullName: 'Bob Smith',
    consent: {
      newsletter: false,
      pushNotifications: true,
      research: false,
      analytics: true,
      thirdParty: false
    }
  },
  {
    email: 'charlie@nutri.test',
    password: 'TestPassword123!',
    fullName: 'Charlie Davis',
    consent: {
      newsletter: true,
      pushNotifications: false,
      research: true,
      analytics: false,
      thirdParty: true
    }
  }
];

let createdCount = 0;
let skipCount = 0;

for (const testUser of testUsers) {
  console.log(`\n👤 Processing user: ${testUser.email}`);

  // 1. Create auth user
  const user = await createTestUser(testUser.email, testUser.password, testUser.fullName);
  if (!user) {
    skipCount++;
    continue;
  }

  // 2. Create user profile
  const profile = await createUserProfile(user.id, testUser.fullName);

  // 3. Create consent record
  const consent = await createUserConsent(user.id, testUser.consent);

  // 4. Create audit log entries
  if (profile) {
    await createAuditLog(user.id, 'CREATE', 'user_profile', profile.id, {
      action: 'account_creation',
      source: 'seed_script'
    });
  }

  if (consent) {
    await createAuditLog(user.id, 'CONSENT_CHANGE', 'user_consent', consent.id, {
      consents: testUser.consent
    });
  }

  createdCount++;
}

console.log('\n📊 Seed Results:');
console.log(`  ✅ Created: ${createdCount} users`);
console.log(`  ⏭️  Skipped: ${skipCount} users (already exist)`);

console.log('\n✅ Authentication foundation seed complete!');
console.log('\n📝 Test User Credentials:');
testUsers.forEach(user => {
  console.log(`  Email: ${user.email}`);
  console.log(`  Password: ${user.password}`);
  console.log('');
});

process.exit(0);
