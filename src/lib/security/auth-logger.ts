/**
 * Auth Event Logger - Logs authentication events to the AuditLog table
 * Tracks login attempts, failures, and suspicious activity for security auditing
 */

export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'SOCIAL_LOGIN'
  | 'TOKEN_REFRESH'
  | 'ACCOUNT_LOCKED'
  | 'SUSPICIOUS_ACTIVITY';

export interface AuthLogEntry {
  eventType: AuthEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

/**
 * Log an authentication event to the AuditLog table
 */
export async function logAuthEvent(entry: AuthLogEntry): Promise<void> {
  try {
    const { db } = await import('@/lib/db');

    // Build details JSON
    const detailsObj: Record<string, unknown> = {
      eventType: entry.eventType,
      timestamp: new Date().toISOString(),
    };

    if (entry.email) {
      detailsObj.email = entry.email;
    }

    if (entry.userAgent) {
      detailsObj.userAgent = entry.userAgent;
    }

    if (entry.details) {
      detailsObj.details = entry.details;
    }

    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.eventType,
        resource: 'auth',
        resourceId: entry.userId ?? entry.email ?? 'unknown',
        details: JSON.stringify(detailsObj),
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Don't throw - logging should never break the application
    console.error('[AuthLogger] Failed to log auth event:', error);
  }
}

/**
 * Extract IP address from request headers.
 * Falls back to a User-Agent fingerprint instead of 'unknown' when no IP headers are present.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback: generate a fingerprint from User-Agent + Accept-Language
  const ua = req.headers.get('user-agent') || '';
  const lang = req.headers.get('accept-language') || '';
  if (ua || lang) {
    let hash = 0;
    const str = `${ua}:${lang}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `anon-${Math.abs(hash).toString(36)}`;
  }

  return 'anon-no-headers';
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') ?? 'unknown';
}

/**
 * Log a login success event
 */
export async function logLoginSuccess(
  userId: string,
  email: string,
  req: Request
): Promise<void> {
  await logAuthEvent({
    eventType: 'LOGIN_SUCCESS',
    userId,
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

/**
 * Log a login failure event
 */
export async function logLoginFailure(
  email: string,
  req: Request,
  reason?: string
): Promise<void> {
  await logAuthEvent({
    eventType: 'LOGIN_FAILURE',
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: reason ?? 'Invalid credentials',
  });
}

/**
 * Log a logout event
 */
export async function logLogout(userId: string, req: Request): Promise<void> {
  await logAuthEvent({
    eventType: 'LOGOUT',
    userId,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

/**
 * Log a registration event
 */
export async function logRegister(
  userId: string,
  email: string,
  req: Request
): Promise<void> {
  await logAuthEvent({
    eventType: 'REGISTER',
    userId,
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

/**
 * Log a password change event
 */
export async function logPasswordChange(
  userId: string,
  req: Request
): Promise<void> {
  await logAuthEvent({
    eventType: 'PASSWORD_CHANGE',
    userId,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

/**
 * Log a social login event
 */
export async function logSocialLogin(
  userId: string,
  email: string,
  provider: string,
  req: Request
): Promise<void> {
  await logAuthEvent({
    eventType: 'SOCIAL_LOGIN',
    userId,
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: `Provider: ${provider}`,
  });
}

/**
 * Log a suspicious activity event
 */
export async function logSuspiciousActivity(
  email: string,
  req: Request,
  reason: string
): Promise<void> {
  await logAuthEvent({
    eventType: 'SUSPICIOUS_ACTIVITY',
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: reason,
  });
}

/**
 * Log an account locked event
 */
export async function logAccountLocked(
  email: string,
  req: Request,
  reason?: string
): Promise<void> {
  await logAuthEvent({
    eventType: 'ACCOUNT_LOCKED',
    email,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: reason ?? 'Too many failed login attempts',
  });
}

/**
 * Get recent failed login attempts for an email or IP
 * Useful for detecting brute force attacks
 */
export async function getRecentFailedAttempts(
  email?: string,
  ip?: string,
  withinMinutes: number = 15
): Promise<number> {
  try {
    const { db } = await import('@/lib/db');

    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    const where: Record<string, unknown> = {
      action: 'LOGIN_FAILURE',
      createdAt: { gte: since },
    };

    if (email) {
      where.resourceId = email;
    }

    if (ip) {
      where.ipAddress = ip;
    }

    return db.auditLog.count({ where });
  } catch (error) {
    console.error('[AuthLogger] Failed to get failed attempts count:', error);
    return 0;
  }
}
