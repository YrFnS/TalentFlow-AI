import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const surveys = await db.eEOSurvey.findMany({
      include: {
        candidate: {
          include: {
            user: { select: { name: true, email: true } },
            applications: {
              take: 1,
              orderBy: { appliedAt: 'desc' },
              include: {
                job: { select: { title: true, company: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const applicants = surveys.map((s) => {
      const latestApp = s.candidate?.applications?.[0];
      return {
        id: s.id,
        name: s.candidate?.user?.name || 'Unknown',
        job: latestApp?.job?.title || 'N/A',
        company: latestApp?.job?.company?.name || 'N/A',
        gender: s.gender || 'N/A',
        ethnicity: s.ethnicity || 'N/A',
        veteranStatus: s.veteranStatus || 'N/A',
        disabilityStatus: s.disabilityStatus || 'N/A',
        selfIdentified: !s.declinedToSelfIdentify,
        date: new Date(s.createdAt).toISOString().slice(0, 10),
      };
    });

    return NextResponse.json({ applicants });
  } catch (error) {
    console.error('Error fetching EEO data:', error);
    return NextResponse.json({ applicants: [] });
  }
}
