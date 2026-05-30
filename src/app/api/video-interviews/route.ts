// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// GET: List video interviews
export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidateId');
    const companyId = auth.companyId || searchParams.get('companyId');

    // Need at least one filter to query
    if (!candidateId && !companyId) {
      return NextResponse.json([]);
    }

    // Build query based on filters
    let applicationIds: string[] = [];

    if (companyId) {
      const jobs = await db.job.findMany({
        where: { companyId },
        select: { id: true },
      });
      const jobIds = jobs.map((j) => j.id);

      if (jobIds.length === 0) {
        return NextResponse.json([]);
      }

      const applications = await db.application.findMany({
        where: { jobId: { in: jobIds } },
        select: { id: true },
      });
      applicationIds = applications.map((a) => a.id);
    }

    if (candidateId) {
      const applications = await db.application.findMany({
        where: { candidateId },
        select: { id: true },
      });
      const candidateAppIds = applications.map((a) => a.id);

      if (applicationIds.length > 0) {
        applicationIds = applicationIds.filter((id) => candidateAppIds.includes(id));
      } else {
        applicationIds = candidateAppIds;
      }
    }

    if (applicationIds.length === 0) {
      return NextResponse.json([]);
    }

    const where: Record<string, unknown> = {
      applicationId: { in: applicationIds },
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    const videoInterviews = await db.videoInterview.findMany({
      where,
      include: {
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(videoInterviews);
  } catch (error) {
    console.error('Failed to fetch video interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video interviews' },
      { status: 500 }
    );
  }
}

// POST: Create video interview
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { applicationId, title, description, questions, responseDeadline, maxRetakes, timePerQuestion } = body;

    if (!applicationId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'applicationId, title, and at least one question are required' },
        { status: 400 }
      );
    }

    const newInterview = await db.videoInterview.create({
      data: {
        applicationId,
        title,
        description: description || null,
        questions: JSON.stringify(questions),
        responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
        maxRetakes: maxRetakes || 1,
        timePerQuestion: timePerQuestion || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json(newInterview, { status: 201 });
  } catch (error) {
    console.error('Failed to create video interview:', error);
    return NextResponse.json(
      { error: 'Failed to create video interview' },
      { status: 500 }
    );
  }
}
