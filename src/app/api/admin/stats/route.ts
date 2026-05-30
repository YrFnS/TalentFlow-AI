import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const [
      totalCompanies,
      totalUsers,
      totalJobSeekers,
      verifiedCompanies,
      activeJobs,
      recentUsers,
    ] = await Promise.all([
      db.company.count(),
      db.user.count(),
      db.user.count({ where: { role: 'CANDIDATE' } }),
      db.company.count({ where: { verified: true } }),
      db.job.count({ where: { status: 'OPEN' } }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      }),
    ]);

    // Get users from last month for growth calculation
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const lastMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const userGrowth = lastMonthUsers > 0
      ? Number((((recentUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1))
      : 0;

    // Get companies from last month
    const recentCompanies = await db.company.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const lastMonthCompanies = await db.company.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const companyGrowth = lastMonthCompanies > 0
      ? Number((((recentCompanies - lastMonthCompanies) / lastMonthCompanies) * 100).toFixed(1))
      : 0;

    // Get job seekers growth
    const recentJobSeekers = await db.user.count({
      where: {
        role: 'CANDIDATE',
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const lastMonthJobSeekers = await db.user.count({
      where: {
        role: 'CANDIDATE',
        createdAt: {
          gte: twoMonthsAgo,
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const jobSeekerGrowth = lastMonthJobSeekers > 0
      ? Number((((recentJobSeekers - lastMonthJobSeekers) / lastMonthJobSeekers) * 100).toFixed(1))
      : 0;

    const pendingVerifications = await db.company.count({
      where: { verified: false, isActive: true },
    });

    // Calculate monthly revenue from invoices
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthInvoices, lastMonthInvoices] = await Promise.all([
      db.invoice.findMany({
        where: { status: 'PAID', paidAt: { gte: thisMonthStart } },
        select: { amount: true },
      }),
      db.invoice.findMany({
        where: { status: 'PAID', paidAt: { gte: lastMonthStart, lt: thisMonthStart } },
        select: { amount: true },
      }),
    ]);

    const monthlyRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const revenueGrowth = lastMonthRevenue > 0
      ? Number((((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
      : 0;

    // Get user growth data by month (last 12 months)
    const userGrowthData: { month: string; users: number; companies: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [monthUsers, monthCompanies] = await Promise.all([
        db.user.count({ where: { createdAt: { lt: monthEnd } } }),
        db.company.count({ where: { createdAt: { lt: monthEnd } } }),
      ]);

      userGrowthData.push({
        month: monthStart.toLocaleString('en', { month: 'short' }),
        users: monthUsers,
        companies: monthCompanies,
      });
    }

    // Role distribution
    const [candidateCount, recruiterCount, adminCount] = await Promise.all([
      db.user.count({ where: { role: 'CANDIDATE' } }),
      db.user.count({ where: { role: { in: ['RECRUITER', 'HR_MANAGER', 'COMPANY_ADMIN'] } } }),
      db.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] } } }),
    ]);

    const roleDistribution = [
      { name: 'Candidates', value: candidateCount, color: '#14b8a6' },
      { name: 'Recruiters', value: recruiterCount, color: '#06b6d4' },
      { name: 'Admins', value: adminCount, color: '#f59e0b' },
    ];

    // Recent activities from audit logs
    const recentLogs = await db.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });

    const recentActivities = recentLogs.map((log) => ({
      id: log.id,
      user: log.user?.name || 'System',
      action: log.action,
      target: log.resource + (log.resourceId ? ` ${log.resourceId.slice(0, 8)}` : ''),
      time: getRelativeTime(new Date(log.createdAt)),
      type: getActivityType(log.action),
    }));

    // Pending verification companies
    const pendingCompanies = await db.company.findMany({
      where: { verified: false, isActive: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { members: true },
    });

    const verificationRequests = pendingCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry || 'N/A',
      location: c.location || 'N/A',
      members: c.members.length,
      submittedAt: getRelativeTime(new Date(c.createdAt)),
    }));

    return NextResponse.json({
      totalCompanies,
      totalUsers,
      totalJobSeekers,
      monthlyRevenue,
      companyGrowth,
      userGrowth,
      jobSeekerGrowth,
      revenueGrowth,
      pendingVerifications,
      totalJobs: activeJobs,
      verifiedCompanies,
      userGrowthData,
      roleDistribution,
      recentActivities,
      verificationRequests,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      totalCompanies: 0,
      totalUsers: 0,
      totalJobSeekers: 0,
      monthlyRevenue: 0,
      companyGrowth: 0,
      userGrowth: 0,
      jobSeekerGrowth: 0,
      revenueGrowth: 0,
      pendingVerifications: 0,
      totalJobs: 0,
      verifiedCompanies: 0,
      userGrowthData: [],
      roleDistribution: [],
      recentActivities: [],
      verificationRequests: [],
    });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getActivityType(action: string): 'company' | 'user' | 'job' | 'system' {
  if (action.startsWith('company')) return 'company';
  if (action.startsWith('user')) return 'user';
  if (action.startsWith('job')) return 'job';
  return 'system';
}
