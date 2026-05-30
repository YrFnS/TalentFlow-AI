// @ts-nocheck
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({
        overview: { totalApplications: 0, totalInterviews: 0, totalHired: 0, timeToHire: 0, conversionRate: 0, avgMatchScore: 0 },
        applicationsTrend: [],
        hiringFunnel: [
          { stage: 'Applied', count: 0 },
          { stage: 'Screening', count: 0 },
          { stage: 'Interview', count: 0 },
          { stage: 'Offered', count: 0 },
          { stage: 'Hired', count: 0 },
        ],
        sourceBreakdown: [],
        topJobs: [],
      });
    }

    // Total applications
    const totalApplications = await db.application.count({
      where: { job: { companyId } },
    });

    // Total interviews
    const totalInterviews = await db.interview.count({
      where: { application: { job: { companyId } } },
    });

    // Total hired
    const totalHired = await db.application.count({
      where: { status: 'HIRED', job: { companyId } },
    });

    // Time to hire (avg days from applied to hired)
    const hiredApps = await db.application.findMany({
      where: { status: 'HIRED', job: { companyId } },
      select: { appliedAt: true, updatedAt: true },
    });
    const timeToHire = hiredApps.length > 0
      ? Math.round(hiredApps.reduce((sum, a) => {
          const days = (new Date(a.updatedAt).getTime() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / hiredApps.length)
      : 0;

    // Avg match score
    const scoredApps = await db.application.findMany({
      where: { matchScore: { not: null }, job: { companyId } },
      select: { matchScore: true },
    });
    const avgMatchScore = scoredApps.length > 0
      ? Math.round(scoredApps.reduce((s, a) => s + (a.matchScore || 0), 0) / scoredApps.length)
      : 0;

    // Conversion rate
    const conversionRate = totalApplications > 0 ? Math.round((totalHired / totalApplications) * 1000) / 10 : 0;

    // Hiring funnel
    const funnelStages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED'];
    const hiringFunnel = [];
    for (const stage of funnelStages) {
      const count = await db.application.count({
        where: { status: stage, job: { companyId } },
      });
      hiringFunnel.push({ stage: stage.charAt(0) + stage.slice(1).toLowerCase(), count });
    }

    // Applications trend (last 8 months)
    const applicationsTrend = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const apps = await db.application.count({
        where: { job: { companyId }, appliedAt: { gte: monthStart, lt: monthEnd } },
      });
      const interviews = await db.interview.count({
        where: { application: { job: { companyId } }, scheduledAt: { gte: monthStart, lt: monthEnd } },
      });
      const hired = await db.application.count({
        where: { status: 'HIRED', job: { companyId }, updatedAt: { gte: monthStart, lt: monthEnd } },
      });
      applicationsTrend.push({
        date: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        applications: apps,
        interviews,
        hired,
      });
    }

    // Source breakdown
    const sources = await db.application.groupBy({
      by: ['source'],
      where: { job: { companyId }, source: { not: null } },
      _count: true,
    });
    const sourceColors = ['#14b8a6', '#10b981', '#06b6d4', '#0d9488'];
    const sourceBreakdown = sources.map((s, i) => ({
      name: s.source || 'Direct',
      value: Math.round(totalApplications > 0 ? (s._count / totalApplications) * 100 : 0),
      color: sourceColors[i % sourceColors.length],
    }));

    // Top performing jobs
    const jobs = await db.job.findMany({
      where: { companyId },
      include: { applications: { select: { id: true, status: true, matchScore: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const topJobs = jobs.map(j => ({
      title: j.title,
      applications: j.applications.length,
      interviews: j.applications.filter(a => a.status === 'INTERVIEW' || a.status === 'HIRED').length,
      hired: j.applications.filter(a => a.status === 'HIRED').length,
      avgMatch: j.applications.length > 0
        ? Math.round(j.applications.reduce((s, a) => s + (a.matchScore || 0), 0) / j.applications.length)
        : 0,
    }));

    return NextResponse.json({
      overview: { totalApplications, totalInterviews, totalHired, timeToHire, conversionRate, avgMatchScore },
      applicationsTrend,
      hiringFunnel,
      sourceBreakdown,
      topJobs,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
