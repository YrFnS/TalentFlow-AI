import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  // Auth: Only admins can export data
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // Rate limiting
  const clientIp = getClientIp(request.headers);
  const rateResult = checkRateLimit(`export:${clientIp}:${auth.userId}`, RATE_LIMITS.EXPORT);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { type } = await params;

    let data: Record<string, string>[] = [];

    switch (type) {
      case 'users': {
        const users = await db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });
        data = users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'Active' : 'Inactive',
          createdAt: new Date(u.createdAt).toISOString().slice(0, 10),
        }));
        break;
      }

      case 'companies': {
        const companies = await db.company.findMany({
          select: {
            id: true,
            name: true,
            industry: true,
            companySize: true,
            location: true,
            verified: true,
            isActive: true,
            createdAt: true,
          },
        });
        data = companies.map((c) => ({
          id: c.id,
          name: c.name,
          industry: c.industry || '',
          size: c.companySize || '',
          location: c.location || '',
          verified: c.verified ? 'Yes' : 'No',
          status: c.isActive ? 'Active' : 'Inactive',
          createdAt: new Date(c.createdAt).toISOString().slice(0, 10),
        }));
        break;
      }

      case 'jobs': {
        const jobs = await db.job.findMany({
          select: {
            id: true,
            title: true,
            jobType: true,
            status: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
          },
        });
        data = jobs.map((j) => ({
          id: j.id,
          title: j.title,
          type: j.jobType,
          status: j.status,
          location: j.location || '',
          salaryRange: j.salaryMin && j.salaryMax ? `$${j.salaryMin}-$${j.salaryMax}` : '',
          createdAt: new Date(j.createdAt).toISOString().slice(0, 10),
        }));
        break;
      }

      case 'applications': {
        const applications = await db.application.findMany({
          select: {
            id: true,
            status: true,
            matchScore: true,
            source: true,
            appliedAt: true,
          },
          take: 1000,
        });
        data = applications.map((a) => ({
          id: a.id,
          status: a.status,
          matchScore: a.matchScore?.toString() || '',
          source: a.source || '',
          appliedAt: new Date(a.appliedAt).toISOString().slice(0, 10),
        }));
        break;
      }

      case 'audit-logs': {
        const logs = await db.auditLog.findMany({
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            ipAddress: true,
            createdAt: true,
          },
          take: 1000,
          orderBy: { createdAt: 'desc' },
        });
        data = logs.map((l) => ({
          id: l.id,
          action: l.action,
          resource: l.resource,
          resourceId: l.resourceId || '',
          ipAddress: l.ipAddress || '',
          createdAt: new Date(l.createdAt).toISOString().slice(0, 10),
        }));
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Audit log for the export
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: `data.export.${type}`,
        resource: 'export',
        resourceId: null,
        ipAddress: clientIp,
        details: JSON.stringify({
          exportType: type,
          recordCount: data.length,
          exportedBy: auth.userId,
        }),
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
