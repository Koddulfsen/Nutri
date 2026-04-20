/**
 * GET /api/compounds - List compounds with optional filtering
 *
 * Feature System: 05-compound-database-system
 * Wave 2: API Layer Implementation
 * Updated: 2025-11-10
 *
 * Query Parameters:
 * - category: CompoundType enum (VITAMIN, MINERAL, etc.)
 * - healthCondition: UUID of health condition (Phase 10)
 * - confidenceLevel: HIGH, MEDIUM, LOW, GRAY_NULL (Phase 2+)
 * - hasRDA: boolean (Phase 2+)
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 *
 * Response: Paginated list of compounds with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompoundService } from '@/lib/services/CompoundService';
import type {
  ApiResponse,
  GetCompoundsResponse,
  CompoundType,
  ConfidenceLevel,
} from '@/lib/types/api';

/**
 * GET handler - List compounds with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as CompoundType | null;
    const healthCondition = searchParams.get('healthCondition') ?? undefined;
    const confidenceLevel = searchParams.get('confidenceLevel') as ConfidenceLevel | null;
    const hasRDA = searchParams.get('hasRDA') === 'true' ? true : undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json<ApiResponse<GetCompoundsResponse>>(
        {
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json<ApiResponse<GetCompoundsResponse>>(
        {
          success: false,
          error: 'Invalid offset parameter. Must be >= 0.',
        },
        { status: 400 }
      );
    }

    // Build filters object
    const filters = {
      category: category ?? undefined,
      healthCondition,
      confidenceLevel: confidenceLevel ?? undefined,
      hasRDA,
    };

    // Call service layer
    const result = await CompoundService.getAllCompounds(filters, { limit, offset });

    // Return success response
    return NextResponse.json<ApiResponse<GetCompoundsResponse>>(
      {
        success: true,
        data: {
          compounds: result.compounds,
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors gracefully
    console.error('Error in GET /api/compounds:', error);

    return NextResponse.json<ApiResponse<GetCompoundsResponse>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
