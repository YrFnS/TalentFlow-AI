/**
 * Brute Force Protection - Prevents brute force login attacks
 * Uses in-memory Map for tracking failed attempts with automatic cleanup
 */

import { logAccountLocked, logSuspiciousActivity } from './auth-logger';

export interface BruteForceCheck {
  /** Whether the login attempt is allowed */
  allowed: boolean;
  /** Number of attempts remaining before lockout */
  attemptsRemaining: number;
  /** When the lockout expires (if currently locked out) */
  lockoutExpiresAt?: Date;
}

interface FailedAttemptEntry {
  /** Number of failed attempts */
  count: number;
  /** Timestamp of the first failed attempt in current window */
  firstAttemptAt: number;
  /** When the lockout expires (if locked out) */
  lockoutExpiresAt?: number;
}

// ============================================
// Configuration
// ============================================

/** Max failed attempts per email before lockout */
const MAX_EMAIL_ATTEMPTS = 5;

/** Max failed attempts per IP before lockout */
const MAX_IP_ATTEMPTS = 10;

/** Time window for tracking attempts (15 minutes) */
const WINDOW_MS = 15 * 60 * 1000;

/** Lockout duration (30 minutes) */
const LOCKOUT_MS = 30 * 60 * 1000;

// ============================================
// In-memory stores
// ============================================

/** Track failed attempts per email */
const emailAttempts: Map<string, FailedAttemptEntry> = new Map();

/** Track failed attempts per IP */
const ipAttempts: Map<string, FailedAttemptEntry> = new Map();

// ============================================
// Core functions
// ============================================

/**
 * Check if a login attempt is allowed for this email/IP combination
 */
export async function checkLoginAttempt(
  email: string,
  ip: string
): Promise<BruteForceCheck> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Check email-based lockout
  const emailEntry = emailAttempts.get(email.toLowerCase());
  if (emailEntry) {
    // If locked out, check if lockout has expired
    if (emailEntry.lockoutExpiresAt) {
      if (now < emailEntry.lockoutExpiresAt) {
        return {
          allowed: false,
          attemptsRemaining: 0,
          lockoutExpiresAt: new Date(emailEntry.lockoutExpiresAt),
        };
      }
      // Lockout expired - reset the entry
      emailAttempts.delete(email.toLowerCase());
    }

    // Clean up expired entries
    if (emailEntry.firstAttemptAt < windowStart) {
      emailAttempts.delete(email.toLowerCase());
    }
  }

  // Check IP-based lockout
  const ipEntry = ipAttempts.get(ip);
  if (ipEntry) {
    // If locked out, check if lockout has expired
    if (ipEntry.lockoutExpiresAt) {
      if (now < ipEntry.lockoutExpiresAt) {
        return {
          allowed: false,
          attemptsRemaining: 0,
          lockoutExpiresAt: new Date(ipEntry.lockoutExpiresAt),
        };
      }
      // Lockout expired - reset the entry
      ipAttempts.delete(ip);
    }

    // Clean up expired entries
    if (ipEntry.firstAttemptAt < windowStart) {
      ipAttempts.delete(ip);
    }
  }

  // Calculate remaining attempts
  const emailCount = emailAttempts.get(email.toLowerCase())?.count ?? 0;
  const ipCount = ipAttempts.get(ip)?.count ?? 0;

  const emailRemaining = Math.max(0, MAX_EMAIL_ATTEMPTS - emailCount);
  const ipRemaining = Math.max(0, MAX_IP_ATTEMPTS - ipCount);

  const attemptsRemaining = Math.min(emailRemaining, ipRemaining);

  return {
    allowed: attemptsRemaining > 0,
    attemptsRemaining,
  };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  email: string,
  ip: string
): Promise<void> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const normalizedEmail = email.toLowerCase();

  // Update email-based tracking
  let emailEntry = emailAttempts.get(normalizedEmail);
  if (!emailEntry || emailEntry.firstAttemptAt < windowStart) {
    emailEntry = { count: 0, firstAttemptAt: now };
  }
  emailEntry.count++;

  // Check if email lockout threshold reached
  if (emailEntry.count >= MAX_EMAIL_ATTEMPTS && !emailEntry.lockoutExpiresAt) {
    emailEntry.lockoutExpiresAt = now + LOCKOUT_MS;
    // Log account lockout event
    try {
      await logAccountLocked(email, { headers: new Headers() } as Request);
    } catch {
      // Non-critical - don't block on logging failure
    }
  }

  emailAttempts.set(normalizedEmail, emailEntry);

  // Update IP-based tracking
  let ipEntry = ipAttempts.get(ip);
  if (!ipEntry || ipEntry.firstAttemptAt < windowStart) {
    ipEntry = { count: 0, firstAttemptAt: now };
  }
  ipEntry.count++;

  // Check if IP lockout threshold reached
  if (ipEntry.count >= MAX_IP_ATTEMPTS && !ipEntry.lockoutExpiresAt) {
    ipEntry.lockoutExpiresAt = now + LOCKOUT_MS;
    // Log suspicious activity
    try {
      await logSuspiciousActivity(
        email,
        { headers: new Headers() } as Request,
        `IP ${ip} exceeded ${MAX_IP_ATTEMPTS} failed login attempts`
      );
    } catch {
      // Non-critical
    }
  }

  ipAttempts.set(ip, ipEntry);
}

/**
 * Record a successful login (clears failed attempts for the email/IP)
 */
export async function recordSuccessfulLogin(
  email: string,
  ip: string
): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  // Clear email-based tracking
  emailAttempts.delete(normalizedEmail);

  // Reset IP counter (but don't delete - other emails might have failed from this IP)
  const ipEntry = ipAttempts.get(ip);
  if (ipEntry) {
    // Only reset if this IP is not locked out from too many different accounts
    if (!ipEntry.lockoutExpiresAt || Date.now() > ipEntry.lockoutExpiresAt) {
      ipEntry.count = Math.max(0, ipEntry.count - 1);
      if (ipEntry.count === 0) {
        ipAttempts.delete(ip);
      }
    }
  }
}

/**
 * Clean up expired entries from both stores
 * Should be called periodically to prevent memory leaks
 */
export function cleanup(): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Clean email entries
  for (const [key, entry] of emailAttempts.entries()) {
    // Remove entries where window has expired AND lockout has expired
    const isExpired =
      entry.firstAttemptAt < windowStart &&
      (!entry.lockoutExpiresAt || entry.lockoutExpiresAt < now);

    if (isExpired) {
      emailAttempts.delete(key);
    }
  }

  // Clean IP entries
  for (const [key, entry] of ipAttempts.entries()) {
    const isExpired =
      entry.firstAttemptAt < windowStart &&
      (!entry.lockoutExpiresAt || entry.lockoutExpiresAt < now);

    if (isExpired) {
      ipAttempts.delete(key);
    }
  }
}

/**
 * Get current status for an email/IP (for admin/debugging)
 */
export function getBruteForceStatus(
  email: string,
  ip: string
): {
  emailAttempts: number;
  ipAttempts: number;
  emailLocked: boolean;
  ipLocked: boolean;
  emailLockoutExpires?: Date;
  ipLockoutExpires?: Date;
} {
  const normalizedEmail = email.toLowerCase();
  const emailEntry = emailAttempts.get(normalizedEmail);
  const ipEntry = ipAttempts.get(ip);
  const now = Date.now();

  return {
    emailAttempts: emailEntry?.count ?? 0,
    ipAttempts: ipEntry?.count ?? 0,
    emailLocked:
      emailEntry?.lockoutExpiresAt !== undefined &&
      emailEntry.lockoutExpiresAt > now,
    ipLocked:
      ipEntry?.lockoutExpiresAt !== undefined &&
      ipEntry.lockoutExpiresAt > now,
    emailLockoutExpires:
      emailEntry?.lockoutExpiresAt && emailEntry.lockoutExpiresAt > now
        ? new Date(emailEntry.lockoutExpiresAt)
        : undefined,
    ipLockoutExpires:
      ipEntry?.lockoutExpiresAt && ipEntry.lockoutExpiresAt > now
        ? new Date(ipEntry.lockoutExpiresAt)
        : undefined,
  };
}

/**
 * Manually unlock an email or IP (for admin use)
 */
export function unlock(email?: string, ip?: string): void {
  if (email) {
    emailAttempts.delete(email.toLowerCase());
  }
  if (ip) {
    ipAttempts.delete(ip);
  }
}

// ============================================
// Periodic cleanup scheduler
// ============================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic cleanup of expired brute force entries
 */
export function startBruteForceCleanup(intervalMs: number = 10 * 60 * 1000): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanup();
  }, intervalMs);

  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

/**
 * Stop periodic cleanup
 */
export function stopBruteForceCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
