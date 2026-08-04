// @ts-nocheck - Prisma aggregates are normalized for the dashboard response.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember, resolveCompanyId } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [
      company,
      activeJobs,
      totalApplications,
      interviewsToday,
      hiredThisMonth,
      recentApplications,
      jobsByStatusRaw,
      upcomingInterviews,
    ] = await Promise.all([
      db.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, logo: true },
      }),
      db.job.count({ where: { companyId, status: 'OPEN' } }),
      db.application.count({ where: { job: { companyId } } }),
      db.interview.count({
        where: {
          scheduledAt: { gte: today, lt: tomorrow },
          application: { job: { companyId } },
        },
      }),
      db.application.count({
        where: {
          status: 'HIRED',
          job: { companyId },
          updatedAt: { gte: monthStart },
        },
      }),
      db.application.findMany({
        where: { job: { companyId } },
        include: {
          candidate: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          job: { select: { id: true, title: true } },
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      }),
      db.job.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
      db.interview.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date(), lte: nextWeek },
          application: { job: { companyId } },
        },
        include: {
          application: {
            include: {
              candidate: {
                include: { user: { select: { name: true, image: true } } },
              },
              job: { select: { title: true } },
            },
          },
          assignments: {
            include: { interviewer: { select: { name: true } } },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
    ]);

    const trend = await Promise.all(
      Array.from({ length: 7 }, async (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - index));
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);

        const applications = await db.application.count({
          where: {
            job: { companyId },
            appliedAt: { gte: day, lt: nextDay },
          },
        });

        return {
          date: day.toISOString().slice(0, 10),
          applications,
        };
      }),
    );

    const funnelStages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED'];
    const funnelCounts = await Promise.all(
      funnelStages.map((status) =>
        db.application.count({
          where: { status: status as never, job: { companyId } },
        }),
      ),
    );

    return NextResponse.json({
      company,
      stats: {
        activeJobs,
        totalApplications,
        interviewsToday,
        hiredThisMonth,
      },
      trend,
      funnel: funnelStages.map((stage, index) => ({
        stage,
        count: funnelCounts[index],
      })),
      recentApplications,
      jobsByStatus: jobsByStatusRaw.map((item) => ({
        status: item.status,
        count: item._count.status,
        _count: item._count.status,
      })),
      upcomingInterviews: upcomingInterviews.map((interview) => ({
        id: interview.id,
        type: interview.type,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        candidate: interview.application.candidate.user,
        jobTitle: interview.application.job.title,
        interviewers: interview.assignments.map(
          (assignment) => assignment.interviewer.name,
        ),
      })),
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 },
    );
  }
}
