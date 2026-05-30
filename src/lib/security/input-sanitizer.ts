/**
 * Input sanitization utilities for API routes.
 * Prevents XSS, injection, and malformed data.
 */

/**
 * Strip HTML tags from a string.
 * Removes anything between < and > characters.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a name field:
 * - Trim whitespace
 * - Strip HTML tags
 * - Limit length
 */
export function sanitizeName(name: string, maxLength: number = 100): string {
  const sanitized = stripHtml(name.trim());
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitize an email field:
 * - Trim whitespace
 * - Convert to lowercase
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate password strength.
 * Requires:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate name field.
 * - Must be 1-100 characters after trimming
 * - Must not contain HTML tags
 */
export function validateName(name: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    errors.push('Name is required');
  }
  if (trimmed.length > 100) {
    errors.push('Name must be 100 characters or fewer');
  }
  if (/<[^>]*>/.test(trimmed)) {
    errors.push('Name must not contain HTML tags');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * General-purpose string sanitizer for free-text fields.
 * - Trims whitespace
 * - Strips HTML tags
 * - Limits length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return stripHtml(input.trim()).slice(0, maxLength);
}
