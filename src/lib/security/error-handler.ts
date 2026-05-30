/**
 * Error Handler - Sanitizes error responses to prevent information leakage
 * In production, never expose internal error details, stack traces, or database errors
 */

import { NextResponse } from 'next/server';

/**
 * Common error messages that are safe to return to clients
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'Invalid email or password': 'Invalid email or password',
  'Email and password are required': 'Email and password are required',
  'Account is deactivated': 'Account is deactivated',
  'Authentication required': 'Authentication required',
  'Admin access required': 'Admin access required',
  'Company member access required': 'Company member access required',
  'Candidate access required': 'Candidate access required',

  // Validation errors
  'Name, email, password, and role are required': 'Name, email, password, and role are required',
  'Invalid email format': 'Invalid email format',
  'Password must be at least': 'Password does not meet security requirements',
  'Only candidate registration is available': 'Only candidate registration is available',
  'An account with this email already exists': 'An account with this email already exists',

  // Resource errors
  'Job not found': 'Job not found',
  'User not found': 'User not found',
  'Application not found': 'Application not found',
  'Company not found': 'Company not found',
};

/**
 * Patterns that indicate sensitive information that should never be leaked
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /connection[_-]?string/i,
  /database[_-]?url/i,
  /stack[_-]?trace/i,
  /prisma/i,
  /sqlite/i,
  /syntaxerror/i,
  /typeerror/i,
  /referenceerror/i,
  /rangeerror/i,
  /enoent/i,
  /econnrefused/i,
  /etimedout/i,
  /syscall/i,
  /errno/i,
  /code:\s*\d+/i,
  /at\s+\w+\s*\(/i,  // stack trace lines
  /\\?\w+:\s*\\?\w+/i, // file paths
];

/**
 * Sanitize an error message to remove sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An unexpected error occurred';
  }

  // Check if this is a known safe message
  for (const [key, safeMsg] of Object.entries(SAFE_ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return safeMsg;
    }
  }

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return 'An internal error occurred. Please try again later.';
    }
  }

  // If message is too long (could contain stack trace), truncate
  if (message.length > 200) {
    return 'An error occurred. Please try again.';
  }

  return message;
}

/**
 * Create a safe error response that doesn't leak sensitive information
 */
export function createSafeErrorResponse(
  error: unknown,
  options?: {
    status?: number;
    publicMessage?: string;
    logContext?: string;
  }
): NextResponse {
  const status = options?.status ?? 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Get error message
  let errorMessage = 'An unexpected error occurred';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Log the full error server-side (never sent to client)
  if (options?.logContext) {
    console.error(`[${options.logContext}]`, error);
  } else {
    console.error('[API Error]', error);
  }

  // Create safe public message
  const publicMessage = options?.publicMessage ?? sanitizeErrorMessage(errorMessage);

  // In development, include more detail for debugging
  const responseBody: Record<string, unknown> = {
    error: publicMessage,
  };

  if (isDev && status >= 500) {
    responseBody.debug = {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : 'Unknown',
    };
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Handle Prisma-specific errors with safe messages
 */
export function handlePrismaError(error: unknown): NextResponse {
  // Prisma errors have a 'code' property
  const prismaError = error as { code?: string; meta?: Record<string, unknown> };

  if (prismaError.code) {
    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        return NextResponse.json(
          { error: 'A record with this information already exists' },
          { status: 409 }
        );
      case 'P2025':
        // Record not found
        return NextResponse.json(
          { error: 'Record not found' },
          { status: 404 }
        );
      case 'P2003':
        // Foreign key constraint failure
        return NextResponse.json(
          { error: 'Referenced record not found' },
          { status: 400 }
        );
      case 'P2014':
        // Required relation violation
        return NextResponse.json(
          { error: 'Invalid relation data provided' },
          { status: 400 }
        );
      case 'P2021':
        // Table does not exist
        console.error('[DB] Table does not exist - schema may need migration');
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      default:
        // Unknown Prisma error - don't leak details
        console.error(`[DB] Prisma error ${prismaError.code}:`, prismaError.meta);
        return NextResponse.json(
          { error: 'A database error occurred. Please try again.' },
          { status: 500 }
        );
    }
  }

  // Not a Prisma error - use generic handler
  return createSafeErrorResponse(error, { logContext: 'Prisma' });
}

/**
 * Check if an error is a Prisma error
 */
export function isPrismaError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('P')
  );
}

/**
 * Universal error handler - automatically detects error type and returns safe response
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse {
  if (isPrismaError(error)) {
    return handlePrismaError(error);
  }

  if (error instanceof Error) {
    // Check for common HTTP error patterns
    const msg = error.message.toLowerCase();

    if (msg.includes('unauthorized') || msg.includes('authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (msg.includes('forbidden') || msg.includes('access required')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (msg.includes('not found')) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error.message) },
        { status: 404 }
      );
    }

    if (msg.includes('already exists') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error.message) },
        { status: 409 }
      );
    }

    if (msg.includes('validation') || msg.includes('invalid')) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error.message) },
        { status: 400 }
      );
    }

    if (msg.includes('rate limit') || msg.includes('too many')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  return createSafeErrorResponse(error, { logContext: context });
}
