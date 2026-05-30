import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Platform stats for landing page
export async function GET() {
  try {
    const [candidates, companies, jobs] = await Promise.all([
      db.candidateProfile.count(),
      db.company.count({ where: { isActive: true } }),
      db.job.count({ where: { status: 'OPEN' } }),
    ]);

    return NextResponse.json({
      candidates,
      companies,
      jobs,
    });
  } catch (error) {
    console.error('Failed to fetch platform stats:', error);
    return NextResponse.json(
      { candidates: 0, companies: 0, jobs: 0 },
      { status: 200 }
    );
  }
}
