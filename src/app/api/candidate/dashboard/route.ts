// @ts-nocheck - Prisma result types are shaped for the candidate portal.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: {
        candidateProfile: {
          include: {
            applications: {
              include: {
                job: {
                  include: {
                    company: {
                      select: { id: true, name: true, logo: true, industry: true },
                    },
                  },
                },
                currentStage: true,
              },
              orderBy: { appliedAt: 'desc' },
            },
            savedJobs: { select: { id: true, jobId: true } },
            experiences: { orderBy: { startDate: 'desc' } },
            educations: true,
            certifications: true,
          },
        },
      },
    });

    if (!user || !user.candidateProfile) {
      return NextResponse.json({
        user: user
          ? { id: user.id, name: user.name, email: user.email, image: user.image }
          : null,
        profile: null,
        stats: {
          applicationsSent: 0,
          interviewsScheduled: 0,
          savedJobs: 0,
          profileViews: 0,
        },
        applicationPipeline: [],
        recentActivity: [],
        recommendedJobs: [],
        profileCompleteness: 0,
        profileSteps: [],
      });
    }

    const profile = user.candidateProfile;
    const applications = profile.applications;
    const appliedJobIds = applications.map((application) => application.jobId);

    const recommendedJobs = await db.job.findMany({
      where: {
        status: 'OPEN',
        publishedAt: { not: null },
        ...(appliedJobIds.length > 0 ? { id: { notIn: appliedJobIds } } : {}),
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    const profileSteps = [
      { label: 'Personal info added', done: Boolean(user.name && user.email) },
      { label: 'Experience added', done: profile.experiences.length > 0 },
      { label: 'Upload resume', done: Boolean(profile.resumeUrl) },
      { label: 'Add certifications', done: profile.certifications.length > 0 },
    ];

    const pipelineStatuses = [
      'APPLIED',
      'SCREENING',
      'INTERVIEW',
      'OFFERED',
      'REJECTED',
    ];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      profile: {
        id: profile.id,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        currentTitle: profile.currentTitle,
        skills: profile.skills ? JSON.parse(profile.skills) : [],
        experienceYears: profile.experienceYears,
        resumeUrl: profile.resumeUrl,
      },
      stats: {
        applicationsSent: applications.length,
        interviewsScheduled: applications.filter(
          (application) => application.status === 'INTERVIEW',
        ).length,
        savedJobs: profile.savedJobs.length,
        profileViews: 0,
      },
      applicationPipeline: pipelineStatuses.map((status) => ({
        statusKey: status.toLowerCase(),
        count: applications.filter((application) => application.status === status)
          .length,
      })),
      recentActivity: applications.slice(0, 5).map((application) => ({
        type:
          application.status === 'INTERVIEW'
            ? 'interview'
            : application.status === 'APPLIED'
              ? 'applied'
              : 'screening',
        title:
          application.status === 'APPLIED'
            ? 'Applied to'
            : application.status === 'INTERVIEW'
              ? 'Interview for'
              : `Application moved to ${application.status}`,
        jobTitle: application.job?.title || '',
        company: application.job?.company?.name || '',
        time: application.updatedAt,
        status: application.status,
      })),
      recommendedJobs: recommendedJobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || '',
        location: job.location || '',
        type: job.jobType,
        salary:
          job.salaryMin && job.salaryMax
            ? `$${Math.round(job.salaryMin / 1000)}K - $${Math.round(job.salaryMax / 1000)}K`
            : '',
        match: 0,
        posted: job.publishedAt,
        skills: job.skills ? JSON.parse(job.skills) : [],
        applicants: job._count?.applications || 0,
      })),
      profileCompleteness: Math.round(
        (profileSteps.filter((step) => step.done).length / profileSteps.length) * 100,
      ),
      profileSteps,
    });
  } catch (error) {
    console.error('Candidate dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 },
    );
  }
}
