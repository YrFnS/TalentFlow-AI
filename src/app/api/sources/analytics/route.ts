// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sources/analytics?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const sources = await db.applicationSource.findMany({
      where: { companyId },
    });

    const analytics = [];

    for (const source of sources) {
      const applications = await db.application.findMany({
        where: { sourceId: source.id },
      });

      const total = applications.length;
      const hired = applications.filter(a => a.status === 'HIRED').length;
      const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;

      // Calculate average time to hire for hired candidates
      const hiredApps = applications.filter(a => a.status === 'HIRED');
      let avgDaysToHire = 0;
      if (hiredApps.length > 0) {
        const daysList = hiredApps.map(a => {
          const applied = new Date(a.appliedAt);
          const updated = new Date(a.updatedAt);
          return Math.max(1, Math.round((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)));
        });
        avgDaysToHire = Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length);
      }

      // Estimate cost per hire based on source type
      const costMap: Record<string, number> = {
        JOB_BOARD: 250,
        REFERRAL: 500,
        SOCIAL: 150,
        CAREER_PAGE: 50,
        AGENCY: 2000,
        DIRECT: 0,
        OTHER: 100,
      };
      const costPerHire = hired > 0 ? Math.round(costMap[source.type] || 100) : 0;

      analytics.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        applications: total,
        hired,
        conversionRate,
        avgTimeToHire: avgDaysToHire,
        costPerHire,
      });
    }

    // Sort by applications descending
    analytics.sort((a, b) => b.applications - a.applications);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching source analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source analytics' },
      { status: 500 }
    );
  }
}
