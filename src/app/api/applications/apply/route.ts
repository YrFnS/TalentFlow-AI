// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';
import { applySchema, validateInput } from '@/lib/validation/schemas';
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from '@/lib/email-service';
import { getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(applySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { jobId, coverLetter, source } = validation.data;
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: auth.userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 },
      );
    }

    const job = await db.job.findFirst({
      where: {
        id: jobId,
        status: 'OPEN',
        publishedAt: { not: null },
      },
      include: {
        company: {
          include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'This job is not available for applications' },
        { status: 404 },
      );
    }

    const application = await db.$transaction(async (transaction) => {
      const created = await transaction.application.create({
        data: {
          jobId,
          candidateId: candidate.id,
          coverLetter: coverLetter?.trim() || null,
          source: source || 'direct',
          status: 'APPLIED',
          currentStageId: job.company.stages[0]?.id || null,
        },
      });

      const firstStage = job.company.stages[0];
      if (firstStage) {
        await transaction.applicationStage.create({
          data: {
            applicationId: created.id,
            stageId: firstStage.id,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'application.create',
          resource: 'application',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            jobId,
            jobTitle: job.title,
            companyId: job.companyId,
          }),
        },
      });

      return created;
    });

    try {
      if (candidate.user.email) {
        await sendEmail({
          to: candidate.user.email,
          subject: `Application received — ${job.title} at ${job.company.name}`,
          body: BUILTIN_EMAIL_TEMPLATES.applicationReceived(
            candidate.user.name,
            job.title,
            job.company.name,
          ),
          companyId: job.companyId,
          userId: candidate.userId,
        });
      }
    } catch (emailError) {
      console.error('[Apply] Confirmation email failed:', emailError);
    }

    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          appliedAt: application.appliedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 },
      );
    }

    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 },
    );
  }
}
