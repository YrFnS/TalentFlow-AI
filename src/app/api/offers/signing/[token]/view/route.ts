import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/offers/signing/[token]/view - Public access (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const offer = await db.offer.findUnique({
      where: { signingToken: token },
      include: {
        application: {
          include: {
            candidate: {
              include: { user: true },
            },
            job: {
              include: { company: true },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found or invalid link' }, { status: 404 });
    }

    // Check if token is expired
    if (offer.signingTokenExpiry && new Date() > offer.signingTokenExpiry) {
      if (offer.signingStatus !== 'COMPLETED' && offer.signingStatus !== 'DECLINED') {
        await db.offer.update({
          where: { id: offer.id },
          data: { signingStatus: 'EXPIRED' },
        });
        return NextResponse.json({
          error: 'This signing link has expired',
          signingStatus: 'EXPIRED',
        }, { status: 410 });
      }
    }

    return NextResponse.json({
      id: offer.id,
      signingStatus: offer.signingStatus,
      signingTokenExpiry: offer.signingTokenExpiry,
      candidateSignedAt: offer.candidateSignedAt,
      candidateSignature: offer.candidateSignature,
      status: offer.status,
      salary: offer.salary,
      salaryCurrency: offer.salaryCurrency,
      equity: offer.equity,
      startDate: offer.startDate,
      benefits: offer.benefits,
      conditions: offer.conditions,
      letterText: offer.letterText,
      responseDeadline: offer.responseDeadline,
      candidate: {
        name: offer.application.candidate.user.name,
        email: offer.application.candidate.user.email,
      },
      job: {
        title: offer.application.job.title,
        department: offer.application.job.location,
        location: offer.application.job.location,
      },
      company: {
        name: offer.application.job.company.name,
        logo: offer.application.job.company.logo,
      },
    });
  } catch (error) {
    console.error('Error fetching offer for signing:', error);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  }
}
