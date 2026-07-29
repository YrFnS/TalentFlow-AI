// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  getOptionalAuth,
  isPlatformAdmin,
  requireCompanyEditor,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { createJobSchema, validateInput } from '@/lib/validation/schemas';
import { getClientIp } from '@/lib/security';

const JOB_STATUSES = new Set(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'ARCHIVED']);

export async function GET(request: NextRequest) {
  const auth = await getOptionalAuth();

  try {
    const { searchParams } = request.nextUrl;
    const requestedCompanyId = searchParams.get('companyId');
    const requestedStatus = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const where: Prisma.JobWhereInput = {};

    if (!auth || auth.role === 'CANDIDATE') {
      where.status = 'OPEN';
      where.publishedAt = { not: null };
      if (requestedCompanyId) where.companyId = requestedCompanyId;
    } else if (isPlatformAdmin(auth.role)) {
      if (requestedCompanyId) where.companyId = requestedCompanyId;
      if (requestedStatus && JOB_STATUSES.has(requestedStatus)) {
        where.status = requestedStatus as never;
      }
    } else {
      const companyId = resolveCompanyId(auth, requestedCompanyId);
      if (!companyId) {
        return NextResponse.json(
          { error: 'A valid company context is required' },
          { status: 403 },
        );
      }
      where.companyId = companyId;
      if (requestedStatus && JOB_STATUSES.has(requestedStatus)) {
        where.status = requestedStatus as never;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logo: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(createJobSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const companyId = resolveCompanyId(auth, input.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const companyExists = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!companyExists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const slugBase = input.title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'job';
    const slug = `${slugBase}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const job = await db.job.create({
      data: {
        companyId,
        createdById: auth.userId,
        title: input.title,
        slug,
        description: input.description,
        requirements: input.requirements
          ? JSON.stringify(input.requirements)
          : null,
        responsibilities: input.responsibilities
          ? JSON.stringify(input.responsibilities)
          : null,
        benefits: input.benefits ? JSON.stringify(input.benefits) : null,
        jobType: input.jobType || input.type || 'FULL_TIME',
        status: input.status || 'DRAFT',
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        salaryCurrency: input.salaryCurrency || 'USD',
        location: input.location || null,
        isRemote: input.isRemote || false,
        experienceMin: input.experienceMin ?? null,
        experienceMax: input.experienceMax ?? null,
        skills: input.skills ? JSON.stringify(input.skills) : null,
        openings: input.openings || 1,
        deadline: input.deadline ? new Date(input.deadline) : null,
        publishedAt: input.status === 'OPEN' ? new Date() : null,
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'job.create',
        resource: 'job',
        resourceId: job.id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({ companyId, title: job.title, status: job.status }),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Jobs POST error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
