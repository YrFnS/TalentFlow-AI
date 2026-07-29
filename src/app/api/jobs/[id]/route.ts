// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getOptionalAuth,
  isPlatformAdmin,
  requireCompanyEditor,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { updateJobSchema, validateInput } from '@/lib/validation/schemas';
import { getClientIp } from '@/lib/security';

const jobInclude = {
  company: {
    select: {
      id: true,
      name: true,
      logo: true,
      industry: true,
      location: true,
      verified: true,
      description: true,
      website: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { applications: true } },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getOptionalAuth();

    const where =
      !auth || auth.role === 'CANDIDATE'
        ? { id, status: 'OPEN', publishedAt: { not: null } }
        : isPlatformAdmin(auth.role)
          ? { id }
          : auth.companyId
            ? { id, companyId: auth.companyId }
            : { id: '__forbidden__' };

    const job = await db.job.findFirst({ where, include: jobInclude });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Keep the flat response used by current clients while retaining the nested
    // property for older integrations that consumed { job }.
    return NextResponse.json({ ...job, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(updateJobSchema, body);
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

    const existing = await db.job.findFirst({
      where: { id, companyId },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) data[key] = value;
    };

    assign('title', input.title);
    assign('description', input.description);
    assign('jobType', input.jobType || input.type);
    assign('status', input.status);
    assign('salaryMin', input.salaryMin);
    assign('salaryMax', input.salaryMax);
    assign('salaryCurrency', input.salaryCurrency);
    assign('location', input.location);
    assign('isRemote', input.isRemote);
    assign('experienceMin', input.experienceMin);
    assign('experienceMax', input.experienceMax);
    assign('openings', input.openings);
    if (input.deadline !== undefined) {
      data.deadline = input.deadline ? new Date(input.deadline) : null;
    }
    if (input.requirements !== undefined) {
      data.requirements = input.requirements
        ? JSON.stringify(input.requirements)
        : null;
    }
    if (input.responsibilities !== undefined) {
      data.responsibilities = input.responsibilities
        ? JSON.stringify(input.responsibilities)
        : null;
    }
    if (input.benefits !== undefined) {
      data.benefits = input.benefits ? JSON.stringify(input.benefits) : null;
    }
    if (input.skills !== undefined) {
      data.skills = input.skills ? JSON.stringify(input.skills) : null;
    }

    if (input.status === 'OPEN' && !existing.publishedAt) {
      data.publishedAt = new Date();
    } else if (input.status === 'DRAFT') {
      data.publishedAt = null;
    }

    const job = await db.job.update({
      where: { id },
      data,
      include: jobInclude,
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'job.update',
        resource: 'job',
        resourceId: id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({ companyId, changedFields: Object.keys(data) }),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.job.findFirst({
      where: { id, companyId },
      select: { id: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = await db.job.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'job.archive',
        resource: 'job',
        resourceId: id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({ companyId, title: existing.title }),
      },
    });

    return NextResponse.json({ message: 'Job archived', job });
  } catch (error) {
    console.error('Error archiving job:', error);
    return NextResponse.json({ error: 'Failed to archive job' }, { status: 500 });
  }
}
