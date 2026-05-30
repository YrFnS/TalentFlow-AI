import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * GET /api/admin/security - Security audit dashboard data
 * Returns security metrics, recent auth events, and system health
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // Auth Event Metrics
    // ============================================
    const [
      totalLoginSuccess24h,
      totalLoginFailures24h,
      totalLoginFailures7d,
      totalSocialLogins24h,
      totalRegistrations24h,
      totalAccountLockouts24h,
      totalSuspiciousActivity24h,
      recentFailedLogins,
      topFailedEmails,
    ] = await Promise.all([
      // Successful logins (24h)
      db.auditLog.count({
        where: { action: 'LOGIN_SUCCESS', createdAt: { gte: last24h } },
      }),

      // Failed logins (24h)
      db.auditLog.count({
        where: { action: 'LOGIN_FAILURE', createdAt: { gte: last24h } },
      }),

      // Failed logins (7d)
      db.auditLog.count({
        where: { action: 'LOGIN_FAILURE', createdAt: { gte: last7d } },
      }),

      // Social logins (24h)
      db.auditLog.count({
        where: { action: 'SOCIAL_LOGIN', createdAt: { gte: last24h } },
      }),

      // Registrations (24h)
      db.auditLog.count({
        where: { action: 'REGISTER', createdAt: { gte: last24h } },
      }),

      // Account lockouts (24h)
      db.auditLog.count({
        where: { action: 'ACCOUNT_LOCKED', createdAt: { gte: last24h } },
      }),

      // Suspicious activity (24h)
      db.auditLog.count({
        where: { action: 'SUSPICIOUS_ACTIVITY', createdAt: { gte: last24h } },
      }),

      // Recent failed login details (last 20)
      db.auditLog.findMany({
        where: { action: 'LOGIN_FAILURE', createdAt: { gte: last24h } },
        select: {
          id: true,
          ipAddress: true,
          details: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Top failed login emails (24h)
      db.auditLog.groupBy({
        by: ['resourceId'],
        where: {
          action: 'LOGIN_FAILURE',
          createdAt: { gte: last24h },
          resourceId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // ============================================
    // User Account Metrics
    // ============================================
    const [
      totalActiveUsers,
      totalInactiveUsers,
      totalAdminUsers,
      usersWith2FA,
      recentPasswordChanges,
    ] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } }),
      db.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] } },
      }),
      db.user.count({ where: { twoFactorEnabled: true } }),
      db.auditLog.count({
        where: { action: 'PASSWORD_CHANGE', createdAt: { gte: last7d } },
      }),
    ]);

    // ============================================
    // Data Access Metrics
    // ============================================
    const [
      totalDataExports7d,
      totalGdprRequests7d,
      totalUserDeletions7d,
    ] = await Promise.all([
      db.auditLog.count({
        where: { action: { contains: 'export' }, createdAt: { gte: last7d } },
      }),
      db.auditLog.count({
        where: { resource: 'gdpr', createdAt: { gte: last7d } },
      }),
      db.auditLog.count({
        where: { action: 'user.delete', createdAt: { gte: last7d } },
      }),
    ]);

    // ============================================
    // Security Score Calculation
    // ============================================
    let securityScore = 100;

    // Deduct for high failure rate
    const failureRate = totalLoginSuccess24h > 0
      ? totalLoginFailures24h / (totalLoginSuccess24h + totalLoginFailures24h)
      : totalLoginFailures24h > 0 ? 1 : 0;

    if (failureRate > 0.5) securityScore -= 30;
    else if (failureRate > 0.3) securityScore -= 20;
    else if (failureRate > 0.1) securityScore -= 10;

    // Deduct for account lockouts
    if (totalAccountLockouts24h > 5) securityScore -= 15;
    else if (totalAccountLockouts24h > 0) securityScore -= 5;

    // Deduct for suspicious activity
    if (totalSuspiciousActivity24h > 3) securityScore -= 20;
    else if (totalSuspiciousActivity24h > 0) securityScore -= 10;

    // Deduct for low 2FA adoption
    const twoFAPercent = totalActiveUsers > 0
      ? (usersWith2FA / totalActiveUsers) * 100
      : 0;
    if (twoFAPercent < 10) securityScore -= 10;

    securityScore = Math.max(0, securityScore);

    // ============================================
    // Build Response
    // ============================================
    return NextResponse.json({
      securityScore,
      authMetrics: {
        loginSuccess24h: totalLoginSuccess24h,
        loginFailures24h: totalLoginFailures24h,
        loginFailures7d: totalLoginFailures7d,
        socialLogins24h: totalSocialLogins24h,
        registrations24h: totalRegistrations24h,
        accountLockouts24h: totalAccountLockouts24h,
        suspiciousActivity24h: totalSuspiciousActivity24h,
        failureRate: Math.round(failureRate * 100),
      },
      userMetrics: {
        activeUsers: totalActiveUsers,
        inactiveUsers: totalInactiveUsers,
        adminUsers: totalAdminUsers,
        usersWith2FA,
        twoFAPercent: Math.round(twoFAPercent),
        recentPasswordChanges7d: recentPasswordChanges,
      },
      dataAccessMetrics: {
        dataExports7d: totalDataExports7d,
        gdprRequests7d: totalGdprRequests7d,
        userDeletions7d: totalUserDeletions7d,
      },
      recentFailedLogins: recentFailedLogins.map((entry) => {
        let details: Record<string, unknown> = {};
        try {
          details = JSON.parse(entry.details || '{}');
        } catch { /* ignore */ }
        return {
          id: entry.id,
          ip: entry.ipAddress || 'unknown',
          email: (details as Record<string, unknown>).email || 'unknown',
          reason: (details as Record<string, unknown>).reason || 'unknown',
          timestamp: entry.createdAt,
        };
      }),
      topFailedEmails: topFailedEmails.map((entry) => ({
        email: entry.resourceId || 'unknown',
        attempts: entry._count.id,
      })),
      recommendations: generateRecommendations({
        failureRate,
        accountLockouts: totalAccountLockouts24h,
        suspiciousActivity: totalSuspiciousActivity24h,
        twoFAPercent,
      }),
    });
  } catch (error) {
    console.error('Security audit error:', error);
    return NextResponse.json(
      { error: 'Failed to generate security audit report' },
      { status: 500 }
    );
  }
}

interface RecommendationInput {
  failureRate: number;
  accountLockouts: number;
  suspiciousActivity: number;
  twoFAPercent: number;
}

function generateRecommendations(input: RecommendationInput): string[] {
  const recommendations: string[] = [];

  if (input.failureRate > 0.3) {
    recommendations.push('High login failure rate detected. Consider implementing CAPTCHA or increasing rate limits.');
  }

  if (input.accountLockouts > 0) {
    recommendations.push('Account lockouts detected. Review locked accounts and consider IP-based blocking for repeat offenders.');
  }

  if (input.suspiciousActivity > 0) {
    recommendations.push('Suspicious activity detected. Review recent security events and consider blocking offending IPs.');
  }

  if (input.twoFAPercent < 10) {
    recommendations.push('Two-factor authentication adoption is very low. Consider requiring 2FA for admin accounts.');
  }

  if (recommendations.length === 0) {
    recommendations.push('No immediate security concerns detected. Continue monitoring auth events.');
  }

  return recommendations;
}
