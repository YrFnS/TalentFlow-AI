import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/offers/[id]/signing-status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.offer.findUnique({
      where: { id },
      select: {
        signingStatus: true,
        signingToken: true,
        signingTokenExpiry: true,
        candidateSignedAt: true,
        candidateSignature: true,
        companySignedAt: true,
        status: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error fetching signing status:', error);
    return NextResponse.json({ error: 'Failed to fetch signing status' }, { status: 500 });
  }
}
