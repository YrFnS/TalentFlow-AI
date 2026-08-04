// @ts-nocheck - Prisma result types are shaped for the candidate portal.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const APPLICATION_STATUSES = new Set([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFERED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

const candidateApplicationInclude = {
  job: {
    include: {
      company: { select: { id: true, name: true, logo: true } },
    },
  },
  currentStage: true,
  applicationStages: {
    include: { stage: { select: { name: true, color: true } } },
    orderBy: { enteredAt: 'asc' },
  },
  interviews: {
    orderBy: { scheduledAt: 'asc' },
  },
} as const;

function serializeApplication(application: any) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.job?.title || '',
    company: application.job?.company?.name || '',
    companyLogo: application.job?.company?.logo || null,
    location: application.job?.location || '',
    jobType: application.job?.jobType,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
    status: application.status,
    matchScore: application.matchScore || 0,
    currentStage: application.currentStage,
    timeline: application.applicationStages.map((history: any) => ({
      id: history.id,
      stageName: history.stage?.name || '',
      stageColor: history.stage?.color || null,
      date: history.enteredAt,
      exitedAt: history.exitedAt,
      note: history.notes || '',
    })),
    interviews: application.interviews,
  };
}

async function getCandidateProfileId(userId: string) {
  const profile = await db.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id || null;
}

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const profileId = await getCandidateProfileId(auth.userId);
    if (!profileId) return NextResponse.json([]);

    const status = request.nextUrl.searchParams.get('status');
    const applications = await db.application.findMany({
      where: {
        candidateId: profileId,
        ...(status && APPLICATION_STATUSES.has(status)
          ? { status: status as never }
          : {}),
      },
      include: candidateApplicationInclude,
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(applications.map(serializeApplication));
  } catch (error) {
    console.error('Candidate applications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const applicationId =
      typeof body.applicationId === 'string' ? body.applicationId : '';
    const action = body.action;

    if (!applicationId || action !== 'withdraw') {
      return NextResponse.json(
        { error: 'applicationId and action="withdraw" are required' },
        { status: 400 },
      );
    }

    const profileId = await getCandidateProfileId(auth.userId);
    if (!profileId) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 },
      );
    }

    const application = await db.application.findFirst({
      where: { id: applicationId, candidateId: profileId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
            company: { select: { name: true } },
          },
        },
      },
    });
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    if (application.status === 'OFFERED') {
      return NextResponse.json(
        { error: 'Respond to the active offer instead of withdrawing the application' },
        { status: 409 },
      );
    }
    if (['HIRED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
      return NextResponse.json(
        { error: 'This application can no longer be withdrawn' },
        { status: 409 },
      );
    }

    const updated = await db.$transaction(async (transaction) => {
      await transaction.applicationStage.updateMany({
        where: { applicationId, exitedAt: null },
        data: {
          exitedAt: new Date(),
          notes: 'Application withdrawn by candidate',
        },
      });

      const result = await transaction.application.update({
        where: { id: applicationId },
        data: {
          status: 'WITHDRAWN',
          currentStageId: null,
          notes: [application.notes, 'Application withdrawn by candidate']
            .filter(Boolean)
            .join('\n'),
        },
        include: candidateApplicationInclude,
      });

      const recipients = await transaction.companyMember.findMany({
        where: {
          companyId: application.job.companyId,
          role: { in: ['COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER'] },
        },
        select: { userId: true },
      });

      if (recipients.length > 0) {
        await transaction.notification.createMany({
          data: recipients.map((recipient: { userId: string }) => ({
            userId: recipient.userId,
            title: 'Application withdrawn',
            message: `A candidate withdrew their application for ${application.job.title}.`,
            type: 'application',
            link: '/company/applications',
          })),
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'application.withdraw',
          resource: 'application',
          resourceId: applicationId,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId: application.job.companyId,
            jobId: application.job.id,
            previousStatus: application.status,
          }),
        },
      });

      return result;
    });

    return NextResponse.json(serializeApplication(updated));
  } catch (error) {
    console.error('Candidate application withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 },
    );
  }
}
