import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;

    // Get reference checks for applications belonging to the company's jobs
    const referenceChecks = await db.referenceCheck.findMany({
      where: companyId
        ? {
            application: {
              job: { companyId },
            },
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      referenceChecks: referenceChecks.map((rc) => ({
        id: rc.id,
        applicationId: rc.applicationId,
        candidateName: rc.candidateName,
        referenceName: rc.referenceName,
        referenceEmail: rc.referenceEmail,
        referencePhone: rc.referencePhone,
        referenceTitle: rc.referenceTitle,
        relationship: rc.relationship,
        company: rc.company,
        questions: rc.questions ? JSON.parse(rc.questions) : [],
        responses: rc.responses ? JSON.parse(rc.responses) : null,
        rating: rc.rating,
        status: rc.status,
        sentAt: rc.sentAt?.toISOString() || null,
        completedAt: rc.completedAt?.toISOString() || null,
        expiresAt: rc.expiresAt?.toISOString() || null,
        token: rc.token,
        createdAt: rc.createdAt.toISOString(),
        updatedAt: rc.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reference checks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      applicationId,
      candidateName,
      referenceName,
      referenceEmail,
      referencePhone,
      referenceTitle,
      relationship,
      company,
      questions,
      expiresAt,
    } = body;

    if (!applicationId || !candidateName || !referenceName || !referenceEmail) {
      return NextResponse.json(
        { error: 'applicationId, candidateName, referenceName, and referenceEmail are required' },
        { status: 400 }
      );
    }

    // Generate unique token for the reference to access the form
    const token = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Calculate expiry date (default 14 days)
    const expiryDate = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const newReferenceCheck = await db.referenceCheck.create({
      data: {
        applicationId,
        candidateName,
        referenceName,
        referenceEmail,
        referencePhone: referencePhone || null,
        referenceTitle: referenceTitle || null,
        relationship: relationship || null,
        company: company || null,
        questions: questions ? JSON.stringify(questions) : '[]',
        token,
        status: 'PENDING',
        expiresAt: expiryDate,
      },
    });

    return NextResponse.json(
      {
        referenceCheck: {
          id: newReferenceCheck.id,
          applicationId: newReferenceCheck.applicationId,
          candidateName: newReferenceCheck.candidateName,
          referenceName: newReferenceCheck.referenceName,
          referenceEmail: newReferenceCheck.referenceEmail,
          referencePhone: newReferenceCheck.referencePhone,
          referenceTitle: newReferenceCheck.referenceTitle,
          relationship: newReferenceCheck.relationship,
          company: newReferenceCheck.company,
          questions: newReferenceCheck.questions ? JSON.parse(newReferenceCheck.questions) : [],
          rating: newReferenceCheck.rating,
          status: newReferenceCheck.status,
          token: newReferenceCheck.token,
          expiresAt: newReferenceCheck.expiresAt?.toISOString() || null,
          createdAt: newReferenceCheck.createdAt.toISOString(),
          updatedAt: newReferenceCheck.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to create reference check' }, { status: 500 });
  }
}
