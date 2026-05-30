// @ts-nocheck
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Active jobs count
    const activeJobs = await db.job.count({
      where: { companyId, status: 'OPEN' },
    });

    // Total applications
    const totalApplications = await db.application.count({
      where: { job: { companyId } },
    });

    // Interviews today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interviewsToday = await db.interview.count({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        application: { job: { companyId } },
      },
    });

    // Hired this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const hiredThisMonth = await db.application.count({
      where: {
        status: 'HIRED',
        job: { companyId },
        updatedAt: { gte: monthStart },
      },
    });

    // Application trend (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await db.application.count({
        where: {
          job: { companyId },
          appliedAt: { gte: day, lt: nextDay },
        },
      });

      trendData.push({
        date: day.toISOString().split('T')[0],
        applications: count,
      });
    }

    // Hiring funnel
    const funnelData = [];
    const funnelStages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED'];
    for (const stage of funnelStages) {
      const count = await db.application.count({
        where: { status: stage, job: { companyId } },
      });
      funnelData.push({ stage, count });
    }

    // Recent applications
    const recentApplications = await db.application.findMany({
      where: { job: { companyId } },
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    });

    // Jobs by status
    const jobsByStatus = await db.job.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
    });

    return NextResponse.json({
      stats: {
        activeJobs,
        totalApplications,
        interviewsToday,
        hiredThisMonth,
      },
      trend: trendData,
      funnel: funnelData,
      recentApplications,
      jobsByStatus,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
