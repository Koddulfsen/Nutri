/**
 * Compound Groups API
 *
 * GET /api/compound-groups - Get hierarchical compound groups
 *
 * Returns nested structure for UI display
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { compoundGroups, compounds } from '@/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface GroupWithChildren {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  level: number;
  path: string;
  compoundCount: number;
  compoundTypes: string[];
  compoundNames: string[];
  representativeCompound: string | null;
  hasDv: boolean;
  children: GroupWithChildren[];
}

/**
 * GET /api/compound-groups
 * Returns hierarchical compound groups with nested children
 */
export async function GET() {
  try {
    logger.debug(
      { service: 'compound-groups-api', endpoint: 'GET /api/compound-groups' },
      'Fetching compound groups hierarchy'
    );

    // Fetch all groups ordered by path for proper hierarchy building
    const allGroups = await db
      .select({
        id: compoundGroups.id,
        name: compoundGroups.name,
        slug: compoundGroups.slug,
        parentGroupId: compoundGroups.parentGroupId,
        level: compoundGroups.level,
        displayOrder: compoundGroups.displayOrder,
        description: compoundGroups.description,
        icon: compoundGroups.icon,
        path: compoundGroups.path,
        compoundTypes: compoundGroups.compoundTypes,
        compoundNames: compoundGroups.compoundNames,
        representativeCompound: compoundGroups.representativeCompound,
        hasDv: compoundGroups.hasDv,
      })
      .from(compoundGroups)
      .orderBy(asc(compoundGroups.path), asc(compoundGroups.displayOrder));

    // Count compounds per group (including those assigned to child groups)
    // For now, simple count of directly assigned compounds
    const compoundCounts = await db
      .select({
        groupId: compounds.groupId,
      })
      .from(compounds)
      .where(eq(compounds.groupId, compounds.groupId)); // Just to get groupId

    // Build count map
    const countMap = new Map<string, number>();
    compoundCounts.forEach((c) => {
      if (c.groupId) {
        countMap.set(c.groupId, (countMap.get(c.groupId) || 0) + 1);
      }
    });

    // Build nested structure
    const groupMap = new Map<string, GroupWithChildren>();
    const rootGroups: GroupWithChildren[] = [];

    // First pass: create all group objects
    allGroups.forEach((g) => {
      groupMap.set(g.id, {
        id: g.id,
        name: g.name,
        slug: g.slug,
        icon: g.icon,
        description: g.description,
        level: g.level,
        path: g.path,
        compoundCount: countMap.get(g.id) || 0,
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

    logger.info(
      {
        service: 'compound-groups-api',
        endpoint: 'GET /api/compound-groups',
        totalGroups: allGroups.length,
        rootGroups: rootGroups.length,
      },
      'Compound groups fetched successfully'
    );

    return NextResponse.json({
      groups: rootGroups,
      totalGroups: allGroups.length,
    });
  } catch (error) {
    logger.error(
      {
        service: 'compound-groups-api',
        endpoint: 'GET /api/compound-groups',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to fetch compound groups'
    );

    return NextResponse.json(
      { error: 'Failed to fetch compound groups' },
      { status: 500 }
    );
  }
}
