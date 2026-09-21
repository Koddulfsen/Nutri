/**
 * Food Catalog API Endpoint
 *
 * GET /api/foods/catalog
 *
 * Returns the whole searchable food catalog — every food plus its portions
 * and compound count — in one response, so the manual-search UI can search
 * and select entirely client-side with no per-keystroke or per-selection
 * round trip. Only sensible while the catalog is small (currently ~100
 * foods, a ~20-30 KB response); revisit if it grows into the thousands.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { loadFoodCatalog } from '@/lib/services/food-catalog';
import { logger } from '@/lib/logger';

export const GET = withAuth(async ({ user }) => {
  try {
    return NextResponse.json({ foods: await loadFoodCatalog(user.id) });
  } catch (error) {
    logger.error(
      { service: 'food-catalog-api', error: error instanceof Error ? error.message : String(error) },
      'Failed to build food catalog'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
