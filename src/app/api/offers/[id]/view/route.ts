// @ts-nocheck - Public response intentionally returns a reduced offer shape.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashOfferSigningToken,
  offerInclude,
  serializePublicOffer,
  setApplicationWorkflowState,
} from '@/lib/offer-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    if (!token || token.length > 512) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const digest = hashOfferSigningToken(token);
    let offer = await db.offer.findFirst({
      where: {
        OR: [{ signingToken: digest }, { signingToken: token }],
      },
      include: offerInclude,
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (['DRAFT', 'PENDING', 'WITHDRAWN'].includes(offer.status)) {
      return NextResponse.json(
        { error: 'This offer is no longer available' },
        { status: 410 },
      );
    }

    if (
      offer.signingTokenExpiry &&
      offer.signingTokenExpiry <= new Date() &&
      !['ACCEPTED', 'DECLINED', 'EXPIRED'].includes(offer.status)
    ) {
      offer = await db.$transaction(async (transaction) => {
        const expired = await transaction.offer.update({
          where: { id: offer.id },
          data: { status: 'EXPIRED', signingStatus: 'EXPIRED' },
          include: offerInclude,
        });

        await setApplicationWorkflowState(transaction, {
          applicationId: offer.applicationId,
          companyId: offer.application.job.companyId,
          status: 'INTERVIEW',
          stageTerms: ['interview'],
        });

        if (offer.companySignerId) {
          await transaction.notification.create({
            data: {
              userId: offer.companySignerId,
              title: 'Offer expired',
              message: `${offer.application.candidate.user.name}'s offer for ${offer.application.job.title} expired without a response.`,
              type: 'offer',
              link: '/company/offers',
            },
          });
        }

        await transaction.auditLog.create({
          data: {
            userId: null,
            action: 'offer.expire',
            resource: 'offer',
            resourceId: offer.id,
            details: JSON.stringify({
              applicationId: offer.applicationId,
              detectedBy: 'public_offer_view',
            }),
          },
        });

        return expired;
      });
    }

    return NextResponse.json(serializePublicOffer(offer), {
      headers: {
        'Cache-Control': 'no-store, private',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('Public offer view error:', error);
    return NextResponse.json(
      { error: 'Failed to load offer' },
      { status: 500 },
    );
  }
}
