// @ts-nocheck - Complex Prisma types, validated at runtime
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.ApplicationWhereInput = {};
    if (jobId) where.jobId = jobId;
    if (status) where.status = status as Prisma.EnumApplicationStatusFilter;
    if (companyId) where.job = { companyId };
    if (search) {
      where.OR = [
        { candidate: { user: { name: { contains: search } } } },
        { candidate: { user: { email: { contains: search } } } },
        { candidate: { currentTitle: { contains: search } } },
      ];
    }

    const applications = await db.application.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, company: { select: { name: true } } } },
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        currentStage: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, status, currentStageId, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const updateData: Prisma.ApplicationUpdateInput = {};
    if (status) updateData.status = status as Prisma.EnumApplicationStatusFilter;
    if (currentStageId) updateData.currentStageId = currentStageId;
    if (notes !== undefined) updateData.notes = notes;

    const application = await db.application.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        currentStage: true,
      },
    });

    // Create application stage record if stage changed
    if (currentStageId) {
      await db.applicationStage.create({
        data: {
          applicationId: id,
          stageId: currentStageId,
        },
      });
    }

    // Audit log for application status/stage changes
    if (status || currentStageId) {
      await db.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'application.update',
          resource: 'application',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            newStatus: status || undefined,
            newStageId: currentStageId || undefined,
            jobTitle: application.job?.title,
            candidateName: application.candidate?.user?.name,
          }),
        },
      });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Applications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { jobId, candidateId, coverLetter, source } = body;

    const application = await db.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter,
        source: source || 'direct',
        status: 'APPLIED',
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Applications POST error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
