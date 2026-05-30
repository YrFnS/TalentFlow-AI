import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// POST /api/offers/[id]/send-for-signature
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: {
              include: { user: true },
            },
            job: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.signingStatus === 'COMPLETED') {
      return NextResponse.json({ error: 'Offer already signed' }, { status: 400 });
    }

    if (offer.signingStatus === 'DECLINED') {
      return NextResponse.json({ error: 'Offer was declined' }, { status: 400 });
    }

    // Generate signing token
    const signingToken = randomBytes(32).toString('hex');
    const signingTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updatedOffer = await db.offer.update({
      where: { id },
      data: {
        signingToken,
        signingTokenExpiry,
        signingStatus: 'SENT',
        status: 'SENT',
      },
    });

    return NextResponse.json({
      success: true,
      signingToken: updatedOffer.signingToken,
      signingTokenExpiry: updatedOffer.signingTokenExpiry,
      signingStatus: updatedOffer.signingStatus,
    });
  } catch (error) {
    console.error('Error sending offer for signature:', error);
    return NextResponse.json({ error: 'Failed to send offer for signature' }, { status: 500 });
  }
}
