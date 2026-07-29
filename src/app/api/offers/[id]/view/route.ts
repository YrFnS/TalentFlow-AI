// @ts-nocheck - Public response intentionally returns a reduced offer shape.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashOfferSigningToken,
  offerInclude,
  serializePublicOffer,
} from '@/lib/offer-service';

export async function GET(
  _request: NextRequest,
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
      offer = await db.offer.update({
        where: { id: offer.id },
        data: { status: 'EXPIRED', signingStatus: 'EXPIRED' },
        include: offerInclude,
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
