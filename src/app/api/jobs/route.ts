// @ts-nocheck - Complex Prisma types, validated at runtime
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = auth.role === 'CANDIDATE'
      ? requestedCompanyId
      : auth.companyId || requestedCompanyId;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.JobWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status as Prisma.EnumJobStatusFilter;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
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
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const companyId = auth.companyId || body.companyId;
    const createdById = auth.userId;
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      jobType,
      status,
      salaryMin,
      salaryMax,
      salaryCurrency,
      location,
      isRemote,
      experienceMin,
      experienceMax,
      skills,
      openings,
      deadline,
    } = body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
      '-' + Date.now().toString(36);

    const job = await db.job.create({
      data: {
        companyId,
        createdById,
        title,
        slug,
        description,
        requirements: requirements ? JSON.stringify(requirements) : null,
        responsibilities: responsibilities ? JSON.stringify(responsibilities) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        jobType: jobType || 'FULL_TIME',
        status: status || 'DRAFT',
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'USD',
        location: location || null,
        isRemote: isRemote || false,
        experienceMin: experienceMin ? parseInt(experienceMin) : null,
        experienceMax: experienceMax ? parseInt(experienceMax) : null,
        skills: skills ? JSON.stringify(skills) : null,
        openings: openings ? parseInt(openings) : 1,
        deadline: deadline ? new Date(deadline) : null,
        publishedAt: status === 'OPEN' ? new Date() : null,
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Jobs POST error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
