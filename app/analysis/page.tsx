/**
 * Analysis Page - Unified Meal Builder + Nutrient Analysis
 *
 * Purpose: Primary tracking interface (50/50 split)
 * Left: Meal builder with food search, favorites, recents
 * Right: Real-time nutrient analysis with top compounds
 *
 * Protected route: Requires authentication
 * Generated: 2025-11-17
 *
 * HYBRID APPROACH: Compound groups are fetched from DB at build time
 * and cached with revalidation, providing single source of truth
 * with fast load times.
 */

import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/permissions';
import AnalysisClient from './AnalysisClient';
import AlphaGate from '@/app/components/AlphaGate';
import { CORE_COMPOUNDS } from '@/lib/data/core-compounds';
import { db } from '@/db';
import { compoundGroups } from '@/db/schema';
import { asc, isNull } from 'drizzle-orm';

export const metadata = {
  title: 'Track Nutrition - Nutri',
  description: 'Build meals and analyze nutrients in real-time with scientific precision',
};

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

// Revalidate compound groups every hour (3600 seconds)
// This is the "hybrid" approach - data from DB, cached at build/request time
export const revalidate = 3600;

interface CompoundGroup {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  level: number;
  compoundTypes: string[];
  compoundNames: string[];
  representativeCompound: string | null;
  hasDv: boolean;
  parentGroupId: string | null;
  displayOrder: number;
}

interface GroupHierarchy extends Omit<CompoundGroup, 'parentGroupId' | 'displayOrder'> {
  children: GroupHierarchy[];
}

/**
 * Fetch compound groups from database and build hierarchy
 * This runs at build time / on revalidation, not on every request
 */
async function getCompoundGroupsHierarchy(): Promise<GroupHierarchy[]> {
  const allGroups = await db
    .select({
      id: compoundGroups.id,
      name: compoundGroups.name,
      slug: compoundGroups.slug,
      icon: compoundGroups.icon,
      level: compoundGroups.level,
      compoundTypes: compoundGroups.compoundTypes,
      compoundNames: compoundGroups.compoundNames,
      representativeCompound: compoundGroups.representativeCompound,
      hasDv: compoundGroups.hasDv,
      parentGroupId: compoundGroups.parentGroupId,
      displayOrder: compoundGroups.displayOrder,
    })
    .from(compoundGroups)
    .orderBy(asc(compoundGroups.displayOrder));

  // Build hierarchy
  const groupMap = new Map<string, GroupHierarchy>();
  const rootGroups: GroupHierarchy[] = [];

  // First pass: create all group objects
  allGroups.forEach((g) => {
    groupMap.set(g.id, {
      id: g.id,
      name: g.name,
      slug: g.slug,
      icon: g.icon,
      level: g.level,
      compoundTypes: g.compoundTypes || [],
      compoundNames: g.compoundNames || [],
      representativeCompound: g.representativeCompound,
      hasDv: g.hasDv,
      children: [],
    });
  });

  // Second pass: build hierarchy
  allGroups.forEach((g) => {
    const group = groupMap.get(g.id)!;
    if (g.parentGroupId) {
      const parent = groupMap.get(g.parentGroupId);
      if (parent) {
        parent.children.push(group);
      }
    } else {
      rootGroups.push(group);
    }
  });

  return rootGroups;
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AnalysisPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // Auth is optional — guests get a limited experience backed by localStorage
  const { data: { user } } = await supabase.auth.getUser();

  // Alpha gate: only admin users can access analysis while the project is in alpha testing
  if (!(await isAdminUser(user))) {
    return <AlphaGate />;
  }

  // Parse date from URL, default to today
  const params = await searchParams;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const initialDate = dateRegex.test(params.date || '')
    ? params.date!
    : new Date().toISOString().split('T')[0];

  // Fetch compound groups hierarchy from DB (cached)
  const compoundGroupsHierarchy = await getCompoundGroupsHierarchy();

  // Pass both compounds and groups as server-side props
  return (
    <AnalysisClient
      user={user}
      initialDate={initialDate}
      initialCompounds={[...CORE_COMPOUNDS]}
      initialCompoundGroups={compoundGroupsHierarchy}
    />
  );
}
