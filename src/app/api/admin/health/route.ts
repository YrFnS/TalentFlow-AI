import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';
import os from 'os';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const [activeUsersThisWeek, recentAuditLogs] = await Promise.all([
      db.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Check actual service availability from DB
    const [dbCheck, aiProviderCount] = await Promise.all([
      db.$queryRaw`SELECT 1`.catch(() => null),
      db.aIProvider.count({ where: { isActive: true } }),
    ]);

    const services = [
      { name: 'Web Server', status: 'operational' as const },
      { name: 'Database', status: dbCheck ? 'operational' as const : 'degraded' as const },
      { name: 'AI Service', status: aiProviderCount > 0 ? 'operational' as const : 'degraded' as const },
      // Email, File Storage, and Cache cannot be verified - mark as degraded
      { name: 'Email Service', status: 'degraded' as const },
      { name: 'File Storage', status: 'degraded' as const },
      { name: 'Cache Layer', status: 'degraded' as const },
    ];

    const operationalCount = services.filter(s => s.status === 'operational').length;
    const uptime = `${((operationalCount / services.length) * 100).toFixed(1)}%`;

    // Real server metrics using Node.js os module
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage from load average (1-min average / CPU count, capped at 100%)
    const loadAvg = os.loadavg();
    const cpuUsage = Math.min(Math.round((loadAvg[0] / cpus.length) * 100), 100);

    const memoryUsage = Math.round((usedMem / totalMem) * 100);

    // Disk usage - approximate from os (not directly available, use heuristic based on memory)
    const diskUsage = 0; // No direct Node.js API for disk usage; would need platform-specific calls

    const serverMetrics = {
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkIO: 0,
    };

    // Fetch recent error incidents from audit logs
    const recentErrors = await db.auditLog.findMany({
      where: {
        action: { contains: 'error' },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const incidents = recentErrors.map((log) => ({
      id: log.id,
      title: log.action,
      service: log.resource,
      severity: 'warning' as const,
      timestamp: log.createdAt.toISOString(),
      resolved: false,
    }));

    return NextResponse.json({
      uptime,
      activeUsers: activeUsersThisWeek,
      errorRate: recentAuditLogs > 0 ? `${Math.min((recentAuditLogs / 100) * 100, 100).toFixed(1)}%` : '0%',
      services,
      incidents,
      serverMetrics,
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({
      uptime: 'N/A',
      activeUsers: 0,
      apiResponseTime: 'N/A',
      errorRate: 'N/A',
      services: [],
      incidents: [],
      serverMetrics: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkIO: 0 },
    });
  }
}
