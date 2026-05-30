import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCandidate } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;

    // Find a candidate user - use auth userId
    let user;
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
        include: {
          candidateProfile: {
            include: {
              applications: {
                include: {
                  job: {
                    include: {
                      company: { select: { id: true, name: true, logo: true, industry: true } },
                    },
                  },
                  currentStage: true,
                },
                orderBy: { appliedAt: 'desc' },
              },
              savedJobs: {
                include: {
                  job: {
                    include: {
                      company: { select: { id: true, name: true, logo: true } },
                    },
                  },
                },
              },
              experiences: { orderBy: { startDate: 'desc' } },
              educations: true,
              certifications: true,
              videoInterviewResponses: {
                include: {
                  videoInterview: true,
                },
              },
            },
          },
        },
      });
    }

    if (!user) {
      // Try finding first candidate user
      user = await db.user.findFirst({
        where: { role: 'CANDIDATE' },
        include: {
          candidateProfile: {
            include: {
              applications: {
                include: {
                  job: {
                    include: {
                      company: { select: { id: true, name: true, logo: true, industry: true } },
                    },
                  },
                  currentStage: true,
                },
                orderBy: { appliedAt: 'desc' },
              },
              savedJobs: {
                include: {
                  job: {
                    include: {
                      company: { select: { id: true, name: true, logo: true } },
                    },
                  },
                },
              },
              experiences: { orderBy: { startDate: 'desc' } },
              educations: true,
              certifications: true,
              videoInterviewResponses: {
                include: {
                  videoInterview: true,
                },
              },
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({
        user: null,
        stats: { applicationsSent: 0, interviewsScheduled: 0, savedJobs: 0, profileViews: 0 },
        applicationPipeline: [],
        recentActivity: [],
        recommendedJobs: [],
        profileCompleteness: 0,
        profileSteps: [],
      });
    }

    const profile = user.candidateProfile;
    const applications = profile?.applications || [];
    const savedJobs = profile?.savedJobs || [];

    // Calculate stats
    const applicationsSent = applications.length;
    const interviewsScheduled = applications.filter(
      (a: { status: string }) => a.status === 'INTERVIEW'
    ).length;
    const savedJobsCount = savedJobs.length;
    const profileViews = 0;

    // Application pipeline
    const pipelineStatuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'REJECTED'];
    const applicationPipeline = pipelineStatuses.map((status) => ({
      statusKey: status.toLowerCase(),
      count: applications.filter((a: { status: string }) => a.status === status).length,
    }));

    // Recent activity (from applications)
    const recentActivity = applications.slice(0, 5).map((app: any) => ({
      type: app.status === 'INTERVIEW' ? 'interview' : app.status === 'APPLIED' ? 'applied' : 'screening',
      title: `${app.status === 'APPLIED' ? 'Applied to' : app.status === 'INTERVIEW' ? 'Interview for' : 'Application moved to ' + app.status}`,
      jobTitle: app.job?.title || '',
      company: app.job?.company?.name || '',
      time: new Date(app.appliedAt).toLocaleDateString(),
      status: app.status,
    }));

    // Recommended jobs - fetch open jobs not yet applied to
    const appliedJobIds = applications.map((a: { jobId: string }) => a.jobId);
    const recommendedJobs = await db.job.findMany({
      where: {
        status: 'OPEN',
        id: { notIn: appliedJobIds },
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // Profile completeness calculation
    let completeness = 0;
    const steps = [
      { label: 'Personal info added', done: !!(user.name && user.email) },
      { label: 'Experience added', done: !!(profile?.experiences?.length) },
      { label: 'Upload resume', done: !!(profile?.resumeUrl) },
      { label: 'Add certifications', done: !!(profile?.certifications?.length) },
    ];
    completeness = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      profile: profile
        ? {
            id: profile.id,
            phone: profile.phone,
            location: profile.location,
            bio: profile.bio,
            currentTitle: profile.currentTitle,
            skills: profile.skills ? JSON.parse(profile.skills) : [],
            experienceYears: profile.experienceYears,
            resumeUrl: profile.resumeUrl,
          }
        : null,
      stats: {
        applicationsSent,
        interviewsScheduled,
        savedJobs: savedJobsCount,
        profileViews,
      },
      applicationPipeline,
      recentActivity,
      recommendedJobs: recommendedJobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || '',
        location: job.location || '',
        type: job.jobType,
        salary: job.salaryMin && job.salaryMax ? `$${Math.round(job.salaryMin / 1000)}K - $${Math.round(job.salaryMax / 1000)}K` : '',
        match: 0, // No match score available without application
        posted: job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '',
        skills: job.skills ? JSON.parse(job.skills) : [],
        applicants: job._count?.applications || 0,
      })),
      profileCompleteness: completeness,
      profileSteps: steps,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
