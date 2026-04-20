/**
 * GET /api/compounds/[id] - Get compound detail with relationships
 *
 * Feature System: 05-compound-database-system
 * Wave 2: API Layer Implementation
 * Updated: 2025-11-10
 *
 * Path Parameters:
 * - id: Compound UUID
 *
 * Response: Compound detail with citations, categories, and parent compound
 *
 * Uses Drizzle eager loading (with()) to prevent N+1 queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompoundService } from '@/lib/services/CompoundService';
import type { ApiResponse, GetCompoundByIdResponse } from '@/lib/types/api';

/**
 * GET handler - Get compound detail by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json<ApiResponse<GetCompoundByIdResponse>>(
        {
          success: false,
          error: 'Invalid compound ID format. Must be a valid UUID.',
        },
        { status: 400 }
      );
    }

    // Call service layer (uses eager loading internally)
    const compound = await CompoundService.getCompoundById(id);

    // Return success response
    return NextResponse.json<ApiResponse<GetCompoundByIdResponse>>(
      {
        success: true,
        data: compound,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse<GetCompoundByIdResponse>>(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    // Handle other errors
    console.error('Error in GET /api/compounds/[id]:', error);

    return NextResponse.json<ApiResponse<GetCompoundByIdResponse>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
