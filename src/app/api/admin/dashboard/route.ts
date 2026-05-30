import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    // Get real counts from the database
    const [
      totalCompanies,
      totalUsers,
      totalJobSeekers,
      totalJobs,
      activeJobs,
      pendingVerifications,
    ] = await Promise.all([
      db.company.count(),
      db.user.count(),
      db.user.count({ where: { role: 'CANDIDATE' } }),
      db.job.count(),
      db.job.count({ where: { status: 'OPEN' } }),
      db.company.count({ where: { verified: false, isActive: true } }),
    ]);

    // Calculate growth rates by comparing current month vs previous month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [newUsersThisMonth, newUsersLastMonth, newCompaniesThisMonth, newCompaniesLastMonth] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      db.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      db.company.count({ where: { createdAt: { gte: thisMonthStart } } }),
      db.company.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    const userGrowth = newUsersLastMonth > 0
      ? Number((((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1))
      : 0;
    const companyGrowth = newCompaniesLastMonth > 0
      ? Number((((newCompaniesThisMonth - newCompaniesLastMonth) / newCompaniesLastMonth) * 100).toFixed(1))
      : 0;

    // Calculate monthly revenue from invoices
    const thisMonthInvoices = await db.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: thisMonthStart },
      },
      select: { amount: true },
    });
    const monthlyRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate last month revenue for growth
    const lastMonthInvoices = await db.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
      select: { amount: true },
    });
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const revenueGrowth = lastMonthRevenue > 0
      ? Number((((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      totalCompanies,
      totalUsers,
      totalJobSeekers,
      totalJobs,
      activeJobs,
      pendingVerifications,
      monthlyRevenue,
      companyGrowth,
      userGrowth,
      jobSeekerGrowth: 0,
      revenueGrowth,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({
      totalCompanies: 0,
      totalUsers: 0,
      totalJobSeekers: 0,
      totalJobs: 0,
      activeJobs: 0,
      pendingVerifications: 0,
      monthlyRevenue: 0,
      companyGrowth: 0,
      userGrowth: 0,
      jobSeekerGrowth: 0,
      revenueGrowth: 0,
    });
  }
}
