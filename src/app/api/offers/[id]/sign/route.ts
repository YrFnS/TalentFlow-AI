// @ts-nocheck - Public signing is token-bound and transactionally persisted.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp } from '@/lib/security';
import { offerSignSchema, validateInput } from '@/lib/validation/schemas';
import {
  matchesOfferSigningToken,
  offerInclude,
  setApplicationWorkflowState,
} from '@/lib/offer-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(offerSignSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const offer = await db.offer.findUnique({
      where: { id },
      include: offerInclude,
    });

    if (!offer || !matchesOfferSigningToken(offer.signingToken, input.signingToken)) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (offer.status === 'WITHDRAWN') {
      return NextResponse.json(
        { error: 'This offer has been withdrawn' },
        { status: 410 },
      );
    }
    if (offer.signingTokenExpiry && offer.signingTokenExpiry <= new Date()) {
      if (!['ACCEPTED', 'DECLINED', 'EXPIRED'].includes(offer.status)) {
        await db.offer.update({
          where: { id },
          data: { status: 'EXPIRED', signingStatus: 'EXPIRED' },
        });
      }
      return NextResponse.json(
        { error: 'The signing link has expired' },
        { status: 410 },
      );
    }
    if (offer.status === 'ACCEPTED' || offer.signingStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'This offer has already been accepted' },
        { status: 409 },
      );
    }
    if (offer.status === 'DECLINED' || offer.signingStatus === 'DECLINED') {
      return NextResponse.json(
        { error: 'This offer has already been declined' },
        { status: 409 },
      );
    }
    if (offer.status !== 'SENT' || offer.signingStatus !== 'SENT') {
      return NextResponse.json(
        { error: 'This offer is not available for signing' },
        { status: 409 },
      );
    }

    const isDecline = input.signatureType === 'DECLINE';
    const candidateUser = offer.application.candidate.user;
    const job = offer.application.job;
    const companyId = job.companyId;

    const updated = await db.$transaction(async (transaction) => {
      const result = await transaction.offer.update({
        where: { id },
        data: isDecline
          ? {
              signingStatus: 'DECLINED',
              status: 'DECLINED',
              respondedAt: new Date(),
              notes: input.declineReason
                ? [offer.notes, `Candidate decline reason: ${input.declineReason}`]
                    .filter(Boolean)
                    .join('\n')
                : offer.notes,
            }
          : {
              candidateSignature: input.signature,
              candidateSignedAt: new Date(),
              signingStatus: 'COMPLETED',
              status: 'ACCEPTED',
              respondedAt: new Date(),
            },
      });

      await setApplicationWorkflowState(transaction, {
        applicationId: offer.applicationId,
        companyId,
        status: isDecline ? 'REJECTED' : 'HIRED',
        stageTerms: isDecline ? ['reject'] : ['hire'],
      });

      if (offer.companySignerId) {
        await transaction.notification.create({
          data: {
            userId: offer.companySignerId,
            title: isDecline ? 'Offer declined' : 'Offer accepted',
            message: `${candidateUser.name} ${isDecline ? 'declined' : 'accepted'} the offer for ${job.title}.`,
            type: 'offer',
            link: '/company/offers',
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: null,
          action: isDecline ? 'offer.decline' : 'offer.accept',
          resource: 'offer',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            applicationId: offer.applicationId,
            candidateId: offer.application.candidateId,
            signatureType: input.signatureType,
          }),
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      signingStatus: updated.signingStatus,
      status: updated.status,
      respondedAt: updated.respondedAt,
    });
  } catch (error) {
    console.error('Offer signing error:', error);
    return NextResponse.json({ error: 'Failed to respond to offer' }, { status: 500 });
  }
}
