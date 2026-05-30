/**
 * Input Sanitization - Utilities for sanitizing and validating user input
 * Prevents XSS, SQL injection, and other injection attacks
 */

// ============================================
// String sanitization
// ============================================

/**
 * Strip HTML tags and dangerous characters from a string
 * Removes <script>, event handlers, and HTML entities
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript\s*:/gi, '')
    // Remove on* event handlers (onclick, onload, etc.)
    .replace(/\bon\w+\s*=/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data\s*:\s*text\/html/gi, '')
    // Encode dangerous characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize an object recursively (for request bodies)
 * Handles nested objects, arrays, and primitives
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  // Primitives (number, boolean) pass through
  return obj;
}

// ============================================
// Email validation
// ============================================

/**
 * Validate and sanitize email address
 * Returns empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  // Trim and lowercase
  const cleaned = email.trim().toLowerCase();

  // Basic email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(cleaned)) {
    return '';
  }

  // Remove any remaining dangerous characters
  return cleaned.replace(/[<>'";&]/g, '');
}

// ============================================
// UUID validation
// ============================================

/**
 * Validate UUID format (v4)
 */
export function isValidUUID(id: string): boolean {
  if (typeof id !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(id.trim());
}

// ============================================
// Pagination validation
// ============================================

/**
 * Validate and sanitize pagination parameters
 * Returns safe defaults for invalid values
 */
export function validatePagination(params: {
  page?: string;
  limit?: string;
}): { page: number; limit: number } {
  const MAX_PAGE = 10000;
  const MAX_LIMIT = 100;
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;

  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  if (params.page) {
    const parsed = parseInt(params.page, 10);
    if (!isNaN(parsed) && parsed > 0) {
      page = Math.min(parsed, MAX_PAGE);
    }
  }

  if (params.limit) {
    const parsed = parseInt(params.limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  return { page, limit };
}

// ============================================
// SQL injection detection
// ============================================

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS: RegExp[] = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(--|\/\*|\*\/|;)/,
  /('\s*(OR|AND)\s+')/i,
  /(\bOR\s+1\s*=\s*1\b)/i,
  /(\bAND\s+1\s*=\s*1\b)/i,
  /(\bWAITFOR\b\s+\bDELAY\b)/i,
  /(\bBENCHMARK\b\s*\()/i,
  /(\bSLEEP\b\s*\()/i,
  /(CHAR\s*\(\s*\d+\s*\))/i,
  /(CONCAT\s*\()/i,
  /(\bGROUP_BY\b)/i,
  /(\bHAVING\b)/i,
];

/**
 * Check if input contains SQL injection patterns
 */
export function hasSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================
// XSS detection
// ============================================

/**
 * XSS attack patterns to detect
 */
const XSS_PATTERNS: RegExp[] = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /\bon\w+\s*=/i, // onclick=, onload=, etc.
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /<iframe\b[^>]*>/i,
  /<object\b[^>]*>/i,
  /<embed\b[^>]*>/i,
  /<link\b[^>]*>/i,
  /<meta\b[^>]*>/i,
  /expression\s*\(/i,
  /url\s*\(\s*javascript:/i,
  /data\s*:\s*text\/html/i,
  /<img\b[^>]*\bon\w+/i,
  /<svg\b[^>]*\bon\w+/i,
  /<body\b[^>]*\bon\w+/i,
  /alert\s*\(/i,
  /prompt\s*\(/i,
  /confirm\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|eval)/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /fromCharCode/i,
];

/**
 * Check if input contains XSS patterns
 */
export function hasXSSPattern(input: string): boolean {
  if (typeof input !== 'string') return false;

  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================
// File upload validation
// ============================================

/** Allowed file types for common document uploads */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

/** Allowed file types for image uploads */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/** Default max file size: 5MB */
export const DEFAULT_MAX_FILE_SIZE_MB = 5;

/**
 * Validate a file upload
 * Checks file type and size against allowed values
 */
export function validateFileUpload(
  file: File,
  options: {
    allowedTypes: string[];
    maxSizeMB: number;
  }
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (options.allowedTypes.length > 0 && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > options.maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds the maximum allowed size (${options.maxSizeMB}MB)`,
    };
  }

  // Check for double extensions (e.g., file.exe.pdf)
  const fileName = file.name.toLowerCase();
  const extensionParts = fileName.split('.');
  if (extensionParts.length > 2) {
    // Check for dangerous double extensions
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'php', 'jsp', 'asp', 'aspx', 'js'];
    const secondToLast = extensionParts[extensionParts.length - 2];
    if (dangerousExtensions.includes(secondToLast)) {
      return {
        valid: false,
        error: 'File has a suspicious double extension',
      };
    }
  }

  return { valid: true };
}

// ============================================
// Request body validation
// ============================================

/**
 * Validate a request body for common security issues
 * Returns an array of issues found (empty if clean)
 */
export function validateRequestBody(body: unknown): string[] {
  const issues: string[] = [];

  if (!body || typeof body !== 'object') {
    return issues;
  }

  const bodyStr = JSON.stringify(body);

  if (hasSQLInjection(bodyStr)) {
    issues.push('Potential SQL injection detected in request body');
  }

  if (hasXSSPattern(bodyStr)) {
    issues.push('Potential XSS pattern detected in request body');
  }

  return issues;
}
