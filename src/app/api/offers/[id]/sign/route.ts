import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/offers/[id]/sign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { signature, signatureType, signingToken } = body;

    if (!signature || !signatureType || !signingToken) {
      return NextResponse.json({ error: 'signature, signatureType, and signingToken are required' }, { status: 400 });
    }

    const offer = await db.offer.findUnique({ where: { id } });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Validate signing token
    if (offer.signingToken !== signingToken) {
      return NextResponse.json({ error: 'Invalid signing token' }, { status: 403 });
    }

    // Check if token is expired
    if (offer.signingTokenExpiry && new Date() > offer.signingTokenExpiry) {
      await db.offer.update({
        where: { id },
        data: { signingStatus: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Signing link has expired' }, { status: 400 });
    }

    // Check if already signed
    if (offer.signingStatus === 'COMPLETED' || offer.candidateSignedAt) {
      return NextResponse.json({ error: 'Offer already signed' }, { status: 400 });
    }

    if (offer.signingStatus === 'DECLINED') {
      return NextResponse.json({ error: 'Offer was declined' }, { status: 400 });
    }

    // Process signature
    const isDecline = signatureType === 'DECLINE';

    if (isDecline) {
      const updatedOffer = await db.offer.update({
        where: { id },
        data: {
          signingStatus: 'DECLINED',
          status: 'DECLINED',
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        signingStatus: updatedOffer.signingStatus,
        status: updatedOffer.status,
      });
    }

    // Sign the offer
    const updatedOffer = await db.offer.update({
      where: { id },
      data: {
        candidateSignature: signature,
        candidateSignedAt: new Date(),
        signingStatus: 'COMPLETED',
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      signingStatus: updatedOffer.signingStatus,
      status: updatedOffer.status,
      signedAt: updatedOffer.candidateSignedAt,
    });
  } catch (error) {
    console.error('Error signing offer:', error);
    return NextResponse.json({ error: 'Failed to sign offer' }, { status: 500 });
  }
}
