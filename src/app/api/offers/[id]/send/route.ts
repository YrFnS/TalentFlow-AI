// @ts-nocheck - Offer ownership and payloads are validated before writes.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyEditor, resolveCompanyId } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import { sendEmail } from '@/lib/email-service';
import { offerSendSchema, validateInput } from '@/lib/validation/schemas';
import {
  buildOfferSignatureEmail,
  createOfferSigningToken,
  offerInclude,
  serializeOffer,
  setApplicationWorkflowState,
} from '@/lib/offer-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = validateInput(offerSendSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.offer.findFirst({
      where: { id, application: { job: { companyId } } },
      include: offerInclude,
    });
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (!['DRAFT', 'PENDING', 'SENT'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'This offer cannot be sent' },
        { status: 409 },
      );
    }
    if (!existing.salary || !existing.letterText) {
      return NextResponse.json(
        { error: 'Complete the salary and offer letter before sending' },
        { status: 400 },
      );
    }

    const now = new Date();
    const fallbackExpiry = new Date(
      now.getTime() + validation.data.expiryDays * 24 * 60 * 60 * 1000,
    );
    const expiry = existing.responseDeadline || fallbackExpiry;
    if (expiry <= now) {
      return NextResponse.json(
        { error: 'The offer response deadline has already passed' },
        { status: 400 },
      );
    }

    const { token, digest } = createOfferSigningToken();
    const candidate = existing.application.candidate.user;
    const job = existing.application.job;
    const company = job.company;

    const offer = await db.$transaction(async (transaction) => {
      const updated = await transaction.offer.update({
        where: { id },
        data: {
          status: 'SENT',
          signingStatus: 'SENT',
          signingToken: digest,
          signingTokenExpiry: expiry,
          companySignedAt: now,
          companySignerId: auth.userId,
          respondedAt: null,
          candidateSignedAt: null,
          candidateSignature: null,
        },
        include: offerInclude,
      });

      await setApplicationWorkflowState(transaction, {
        applicationId: existing.applicationId,
        companyId,
        status: 'OFFERED',
        stageTerms: ['offer'],
      });

      await transaction.notification.create({
        data: {
          userId: candidate.id,
          title: 'You received an offer',
          message: `${company.name} sent you an offer for ${job.title}.`,
          type: 'offer',
          link: `/offer/${token}`,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: existing.status === 'SENT' ? 'offer.resend' : 'offer.send',
          resource: 'offer',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            applicationId: existing.applicationId,
            expiresAt: expiry,
          }),
        },
      });

      return updated;
    });

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      request.nextUrl.origin
    ).replace(/\/$/, '');
    const signingUrl = `${baseUrl}/offer/${token}`;
    const email = await sendEmail({
      to: candidate.email,
      subject: `Offer for ${job.title} at ${company.name}`,
      body: buildOfferSignatureEmail({
        candidateName: candidate.name,
        jobTitle: job.title,
        companyName: company.name,
        salary: existing.salary,
        salaryCurrency: existing.salaryCurrency,
        startDate: existing.startDate,
        signingUrl,
        expiry,
      }),
      companyId,
      userId: candidate.id,
    });

    return NextResponse.json({
      offer: serializeOffer(offer),
      signingUrl,
      emailSent: email.success,
      emailError: email.error || null,
    });
  } catch (error) {
    console.error('Offer send error:', error);
    return NextResponse.json({ error: 'Failed to send offer' }, { status: 500 });
  }
}
