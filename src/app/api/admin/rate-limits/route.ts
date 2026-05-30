import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllRateLimiterStats, RATE_LIMIT_CONFIG } from '@/lib/security/rate-limiter';

/**
 * GET /api/admin/rate-limits
 * Admin-only endpoint to view current rate limit configuration and usage stats.
 * Returns both the configured limits and live usage data per limiter.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = getAllRateLimiterStats();

    // Format configuration for display
    const config = {
      auth: {
        description: 'Authentication endpoints (login, etc.)',
        windowMs: RATE_LIMIT_CONFIG.auth.login.windowMs,
        windowHuman: `${RATE_LIMIT_CONFIG.auth.login.windowMs / 60000} minutes`,
        endpoints: Object.entries(RATE_LIMIT_CONFIG.auth).map(([key, val]) => ({
          name: key,
          max: val.max,
          windowMs: val.windowMs,
          windowHuman: val.windowMs >= 3600000
            ? `${val.windowMs / 3600000} hour(s)`
            : `${val.windowMs / 60000} minutes`,
        })),
      },
      api: {
        description: 'General API endpoints',
        windowMs: RATE_LIMIT_CONFIG.api.default.windowMs,
        windowHuman: `${RATE_LIMIT_CONFIG.api.default.windowMs / 60000} minutes`,
        endpoints: Object.entries(RATE_LIMIT_CONFIG.api).map(([key, val]) => ({
          name: key,
          max: val.max,
          windowMs: val.windowMs,
          windowHuman: val.windowMs >= 3600000
            ? `${val.windowMs / 3600000} hour(s)`
            : `${val.windowMs / 60000} minutes`,
        })),
      },
      ai: {
        description: 'AI-powered endpoints (cost-sensitive)',
        windowMs: RATE_LIMIT_CONFIG.ai.chat.windowMs,
        windowHuman: `${RATE_LIMIT_CONFIG.ai.chat.windowMs / 60000} minutes`,
        endpoints: Object.entries(RATE_LIMIT_CONFIG.ai).map(([key, val]) => ({
          name: key,
          max: val.max,
          windowMs: val.windowMs,
          windowHuman: val.windowMs >= 3600000
            ? `${val.windowMs / 3600000} hour(s)`
            : `${val.windowMs / 60000} minutes`,
        })),
      },
      strict: {
        description: 'Sensitive operations (GDPR, billing, seeding)',
        windowMs: RATE_LIMIT_CONFIG.strict.gdprDelete.windowMs,
        windowHuman: RATE_LIMIT_CONFIG.strict.gdprDelete.windowMs >= 86400000
          ? `${RATE_LIMIT_CONFIG.strict.gdprDelete.windowMs / 86400000} day(s)`
          : `${RATE_LIMIT_CONFIG.strict.gdprDelete.windowMs / 60000} minutes`,
        endpoints: Object.entries(RATE_LIMIT_CONFIG.strict).map(([key, val]) => ({
          name: key,
          max: val.max,
          windowMs: val.windowMs,
          windowHuman: val.windowMs >= 86400000
            ? `${val.windowMs / 86400000} day(s)`
            : val.windowMs >= 3600000
              ? `${val.windowMs / 3600000} hour(s)`
              : `${val.windowMs / 60000} minutes`,
        })),
      },
    };

    // Format live stats with utilization percentages
    const liveStats = Object.entries(stats).map(([name, data]) => ({
      name,
      totalUniqueKeys: data.totalKeys,
      totalActiveRequests: data.totalRequests,
      maxRequests: data.maxRequests,
      windowMs: data.windowMs,
      windowHuman: data.windowMs >= 86400000
        ? `${data.windowMs / 86400000} day(s)`
        : data.windowMs >= 3600000
          ? `${data.windowMs / 3600000} hour(s)`
          : `${data.windowMs / 60000} minutes`,
      utilization: data.totalRequests > 0
        ? `${Math.min((data.totalRequests / data.maxRequests) * 100, 100).toFixed(1)}%`
        : '0%',
      topKeys: data.topKeys.map((entry) => ({
        key: entry.key,
        requestCount: entry.count,
        remaining: Math.max(0, data.maxRequests - entry.count),
        utilizationPercent: `${Math.min((entry.count / data.maxRequests) * 100, 100).toFixed(1)}%`,
      })),
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      configuration: config,
      liveStats,
      keyStrategy: {
        description: 'Rate limit keys are generated with the following priority:',
        priority: [
          { level: 1, key: 'user:{userId}', description: 'Authenticated user ID from JWT token (most accurate)' },
          { level: 2, key: 'ip:{address}', description: 'Client IP from x-forwarded-for or x-real-ip headers' },
          { level: 3, key: 'anon:{hash}', description: 'SHA-256 hash of User-Agent + Accept-Language (prevents shared buckets)' },
          { level: 4, key: 'anon:no-headers', description: 'Fallback when no identification is possible (extremely rare)' },
        ],
        note: 'The old "unknown" fallback has been eliminated. Each client now gets a unique rate limit bucket.',
      },
    });
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit statistics' },
      { status: 500 }
    );
  }
}
