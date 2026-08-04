import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { sendEmail } from '@/lib/email-service';
import { getClientIp } from '@/lib/security';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const companyId = resolveCompanyId(
      auth,
      typeof body.companyId === 'string' ? body.companyId : null,
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const candidateId =
      typeof body.candidateId === 'string' ? body.candidateId.trim() : '';
    const jobId =
      typeof body.jobId === 'string' && body.jobId.trim()
        ? body.jobId.trim()
        : null;
    const campaignId =
      typeof body.campaignId === 'string' && body.campaignId.trim()
        ? body.campaignId.trim()
        : null;
    const customMessage =
      typeof body.message === 'string'
        ? body.message.trim().slice(0, 4000)
        : '';

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required' },
        { status: 400 },
      );
    }

    const candidate = await db.candidateProfile.findFirst({
      where: {
        id: candidateId,
        applications: { some: { job: { companyId } } },
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
    if (!candidate || !candidate.user.isActive) {
      return NextResponse.json(
        { error: 'Candidate not found for this company' },
        { status: 404 },
      );
    }

    const job = jobId
      ? await db.job.findFirst({
          where: {
            id: jobId,
            companyId,
            status: 'OPEN',
            publishedAt: { not: null },
          },
          select: { id: true, title: true },
        })
      : null;
    if (jobId && !job) {
      return NextResponse.json(
        { error: 'Open job not found for this company' },
        { status: 404 },
      );
    }

    const campaign = campaignId
      ? await db.sourcingCampaign.findFirst({
          where: { id: campaignId, companyId },
          select: { id: true, name: true },
        })
      : null;
    if (campaignId && !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found for this company' },
        { status: 404 },
      );
    }

    const companyName = auth.companyName || 'A company you previously applied to';
    const opportunity = job ? ` for ${job.title}` : '';
    const message =
      customMessage ||
      `${companyName} would like to reconnect with you${opportunity}. Sign in to review the opportunity and update your availability.`;
    const link = job ? `/candidate/jobs/${job.id}` : '/candidate/jobs';

    const email = await sendEmail({
      to: candidate.user.email,
      subject: job
        ? `${companyName} would like to reconnect about ${job.title}`
        : `${companyName} would like to reconnect`,
      body: `
        <p>Hello ${escapeHtml(candidate.user.name)},</p>
        <p>${escapeHtml(message)}</p>
        <p><a href="${escapeHtml(
          `${process.env.NEXT_PUBLIC_APP_URL || ''}${link}`,
        )}">Review this opportunity in TalentFlow AI</a></p>
      `,
      companyId,
      userId: candidate.userId,
    });

    const engagement = await db.$transaction(async (transaction) => {
      await transaction.notification.create({
        data: {
          userId: candidate.userId,
          title: job ? `New opportunity: ${job.title}` : 'A recruiter reconnected with you',
          message,
          type: 'opportunity',
          link,
        },
      });

      const created = await transaction.candidateEngagement.create({
        data: {
          candidateId: candidate.id,
          companyId,
          type: email.success ? 'EMAIL_SENT' : 'VIEWED_PROFILE',
          campaignId: campaign?.id || null,
          details: JSON.stringify({
            message,
            jobId: job?.id || null,
            jobTitle: job?.title || null,
            deliveryStatus: email.success ? 'SENT' : 'FAILED',
            emailLogId: email.logId || null,
          }),
        },
      });

      if (campaign && email.success) {
        await transaction.sourcingCampaign.update({
          where: { id: campaign.id },
          data: { contactedCount: { increment: 1 } },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'candidate.reengage',
          resource: 'candidate_profile',
          resourceId: candidate.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            jobId: job?.id || null,
            campaignId: campaign?.id || null,
            emailSent: email.success,
          }),
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      engagement,
      emailSent: email.success,
      emailError: email.success ? null : email.error || 'Email delivery failed',
    });
  } catch (error) {
    console.error('Candidate re-engagement error:', error);
    return NextResponse.json(
      { error: 'Failed to re-engage candidate' },
      { status: 500 },
    );
  }
}
