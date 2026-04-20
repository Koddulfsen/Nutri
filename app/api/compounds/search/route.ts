/**
 * GET /api/compounds/search - Real-time autocomplete search
 *
 * Feature System: 05-compound-database-system
 * Wave 2: API Layer Implementation
 * Generated: 2025-11-10
 *
 * Query Parameters:
 * - q: string (required, min 3 characters) - Search query
 * - limit: number (optional, default 10) - Maximum results
 *
 * Response: Array of search results with match type (exact/full-text/fuzzy)
 *
 * Search Algorithm: 3-tier cascade
 * 1. Exact prefix match (ILIKE 'query%') - <10ms
 * 2. Full-text search (tsvector @@ tsquery) - 20-50ms
 * 3. Fuzzy trigram (similarity > 0.3) - 50-100ms
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/lib/services/SearchService';
import type { ApiResponse, SearchCompoundsResponse } from '@/lib/types/api';

/**
 * GET handler - Search compounds with autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    // Validate query parameter
    if (!query) {
      return NextResponse.json<ApiResponse<SearchCompoundsResponse>>(
        {
          success: false,
          error: 'Query parameter "q" is required',
        },
        { status: 400 }
      );
    }

    if (query.length < 3) {
      return NextResponse.json<ApiResponse<SearchCompoundsResponse>>(
        {
          success: false,
          error: 'Query must be at least 3 characters',
        },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json<ApiResponse<SearchCompoundsResponse>>(
        {
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 50.',
        },
        { status: 400 }
      );
    }

    // Call search service (3-tier cascade)
    const results = await SearchService.autocomplete(query, limit);

    // Return success response
    return NextResponse.json<ApiResponse<SearchCompoundsResponse>>(
      {
        success: true,
        data: {
          results,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors gracefully
    console.error('Error in GET /api/compounds/search:', error);

    return NextResponse.json<ApiResponse<SearchCompoundsResponse>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
