import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function validationError(zodError: z.ZodError): NextResponse<ApiError> {
  const details = zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse(
    'VALIDATION_ERROR',
    'Invalid request parameters',
    400,
    details
  );
}

/**
 * Handle not found errors
 */
export function notFoundError(resource: string): NextResponse<ApiError> {
  return errorResponse(
    'NOT_FOUND',
    `${resource} not found`,
    404
  );
}

/**
 * Handle internal server errors
 */
export function internalError(message?: string): NextResponse<ApiError> {
  return errorResponse(
    'INTERNAL_ERROR',
    message || 'An unexpected error occurred',
    500
  );
}

/**
 * Handle database errors
 */
export function databaseError(error: unknown): NextResponse<ApiError> {
  console.error('Database error:', error);

  return errorResponse(
    'DATABASE_ERROR',
    'Database operation failed',
    500,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}
