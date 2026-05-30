// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;

    const templates = await db.jobTemplate.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        description: t.description,
        department: '',
        jobType: t.jobType.toLowerCase().replace('_', '-'),
        requirements: t.requirements ? JSON.parse(t.requirements) : [],
        responsibilities: t.responsibilities || '',
        benefits: t.benefits ? JSON.parse(t.benefits) : [],
        salaryMin: t.salaryMin || 0,
        salaryMax: t.salaryMax || 0,
        location: t.location || '',
        remote: t.isRemote,
        skills: t.skills ? JSON.parse(t.skills) : [],
        usageCount: 0,
        active: true,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, title, description, requirements, responsibilities, benefits, jobType, salaryMin, salaryMax, location, remote, skills } = body;
    const companyId = auth.companyId;

    if (!companyId || !name || !title || !description) {
      return NextResponse.json(
        { error: 'companyId, name, title, and description are required' },
        { status: 400 }
      );
    }

    const newTemplate = await db.jobTemplate.create({
      data: {
        companyId,
        name,
        title,
        description,
        requirements: requirements ? JSON.stringify(requirements) : null,
        responsibilities: responsibilities || null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        jobType: (jobType || 'full_time').toUpperCase().replace('-', '_'),
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        location: location || null,
        isRemote: remote ?? false,
        skills: skills ? JSON.stringify(skills) : null,
      },
    });

    const templateResponse = {
      id: newTemplate.id,
      name: newTemplate.name,
      title: newTemplate.title,
      description: newTemplate.description,
      department: '',
      jobType: newTemplate.jobType.toLowerCase().replace('_', '-'),
      requirements: newTemplate.requirements ? JSON.parse(newTemplate.requirements) : [],
      responsibilities: newTemplate.responsibilities || '',
      benefits: newTemplate.benefits ? JSON.parse(newTemplate.benefits) : [],
      salaryMin: newTemplate.salaryMin || 0,
      salaryMax: newTemplate.salaryMax || 0,
      location: newTemplate.location || '',
      remote: newTemplate.isRemote,
      skills: newTemplate.skills ? JSON.parse(newTemplate.skills) : [],
      usageCount: 0,
      active: true,
      createdAt: newTemplate.createdAt.toISOString(),
      updatedAt: newTemplate.updatedAt.toISOString(),
    };

    return NextResponse.json({ template: templateResponse }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, requirements, benefits, skills, jobType, remote, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Check template exists
    const existing = await db.jobTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = { ...updates };
    if (requirements !== undefined) data.requirements = JSON.stringify(requirements);
    if (benefits !== undefined) data.benefits = JSON.stringify(benefits);
    if (skills !== undefined) data.skills = JSON.stringify(skills);
    if (jobType !== undefined) data.jobType = jobType.toUpperCase().replace('-', '_');
    if (remote !== undefined) data.isRemote = remote;

    const updated = await db.jobTemplate.update({
      where: { id },
      data,
    });

    const templateResponse = {
      id: updated.id,
      name: updated.name,
      title: updated.title,
      description: updated.description,
      department: '',
      jobType: updated.jobType.toLowerCase().replace('_', '-'),
      requirements: updated.requirements ? JSON.parse(updated.requirements) : [],
      responsibilities: updated.responsibilities || '',
      benefits: updated.benefits ? JSON.parse(updated.benefits) : [],
      salaryMin: updated.salaryMin || 0,
      salaryMax: updated.salaryMax || 0,
      location: updated.location || '',
      remote: updated.isRemote,
      skills: updated.skills ? JSON.parse(updated.skills) : [],
      usageCount: 0,
      active: true,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ template: templateResponse });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Check template exists
    const existing = await db.jobTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.jobTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
