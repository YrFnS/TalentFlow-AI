import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const [userCount, companyCount, jobCount, applicationCount, auditLogCount] = await Promise.all([
      db.user.count(),
      db.company.count(),
      db.job.count(),
      db.application.count(),
      db.auditLog.count(),
    ]);

    return NextResponse.json({
      categories: [
        { id: 'users', recordCount: userCount },
        { id: 'companies', recordCount: companyCount },
        { id: 'jobs', recordCount: jobCount },
        { id: 'applications', recordCount: applicationCount },
        { id: 'audit-logs', recordCount: auditLogCount },
      ],
    });
  } catch (error) {
    console.error('Error fetching export counts:', error);
    return NextResponse.json({
      categories: [
        { id: 'users', recordCount: 0 },
        { id: 'companies', recordCount: 0 },
        { id: 'jobs', recordCount: 0 },
        { id: 'applications', recordCount: 0 },
        { id: 'audit-logs', recordCount: 0 },
      ],
    });
  }
}
