// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { requireCompanyMember, requireCompanyAccess } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// POST /api/ai/bias-audit — Run bias audit
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { companyId, auditType, dateRange } = body;

    if (!companyId || !auditType) {
      return NextResponse.json(
        { error: 'companyId and auditType are required' },
        { status: 400 }
      );
    }

    // Verify company access
    const accessCheck = await requireCompanyAccess(companyId);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { from, to } = dateRange || {};

    // 1. Query all applications in date range for the company
    const whereClause: Record<string, unknown> = {
      job: { companyId },
    };
    if (from || to) {
      whereClause.appliedAt = {};
      if (from) (whereClause.appliedAt as Record<string, unknown>).gte = new Date(from);
      if (to) (whereClause.appliedAt as Record<string, unknown>).lte = new Date(to);
    }

    const applications = await db.application.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        eeoGender: true,
        eeoEthnicity: true,
        eeoVeteran: true,
        eeoDisability: true,
        eeoDeclined: true,
      },
    });

    const totalCandidates = applications.length;

    // 2. Group by protected attributes and calculate selection rates
    const hiredStatuses = ['HIRED', 'OFFERED'];
    type AppRecord = {
      id: string;
      status: string;
      eeoGender: string | null;
      eeoEthnicity: string | null;
      eeoVeteran: string | null;
      eeoDisability: string | null;
      eeoDeclined: boolean;
    };

    function computeGroupStats(
      apps: AppRecord[],
      field: keyof Pick<AppRecord, 'eeoGender' | 'eeoEthnicity' | 'eeoVeteran' | 'eeoDisability'>
    ) {
      const groups: Record<string, { applied: number; hired: number }> = {};
      for (const app of apps) {
        if (app.eeoDeclined) continue;
        const val = app[field];
        if (!val) continue;
        const key = val;
        if (!groups[key]) groups[key] = { applied: 0, hired: 0 };
        groups[key].applied++;
        if (hiredStatuses.includes(app.status)) groups[key].hired++;
      }
      // Calculate selection rates
      const rates: Record<string, { applied: number; hired: number; rate: number }> = {};
      for (const [k, v] of Object.entries(groups)) {
        rates[k] = { ...v, rate: v.applied > 0 ? v.hired / v.applied : 0 };
      }
      return rates;
    }

    const genderStats = computeGroupStats(applications as AppRecord[], 'eeoGender');
    const ethnicityStats = computeGroupStats(applications as AppRecord[], 'eeoEthnicity');
    const veteranStats = computeGroupStats(applications as AppRecord[], 'eeoVeteran');
    const disabilityStats = computeGroupStats(applications as AppRecord[], 'eeoDisability');

    const metrics = { gender: genderStats, ethnicity: ethnicityStats, veteran: veteranStats, disability: disabilityStats };

    // 3. Apply 4/5ths rule
    function applyFourFifthsRule(
      rates: Record<string, { applied: number; hired: number; rate: number }>
    ) {
      const entries = Object.entries(rates);
      if (entries.length < 2) return { hasAdverseImpact: false, details: [] };

      const maxRate = Math.max(...entries.map(([, v]) => v.rate));
      const threshold = maxRate * 0.8;

      const details = entries.map(([group, v]) => ({
        group,
        applied: v.applied,
        hired: v.hired,
        selectionRate: Math.round(v.rate * 1000) / 10,
        fourFifthsThreshold: Math.round(threshold * 1000) / 10,
        passes: v.rate >= threshold || maxRate === 0,
      }));

      const hasAdverseImpact = details.some((d) => !d.passes);
      return { hasAdverseImpact, details };
    }

    const genderImpact = applyFourFifthsRule(genderStats);
    const ethnicityImpact = applyFourFifthsRule(ethnicityStats);
    const veteranImpact = applyFourFifthsRule(veteranStats);
    const disabilityImpact = applyFourFifthsRule(disabilityStats);

    const adverseImpact = {
      fourFifthsRule: {
        gender: genderImpact,
        ethnicity: ethnicityImpact,
        veteran: veteranImpact,
        disability: disabilityImpact,
      },
      hasAnyAdverseImpact:
        genderImpact.hasAdverseImpact ||
        ethnicityImpact.hasAdverseImpact ||
        veteranImpact.hasAdverseImpact ||
        disabilityImpact.hasAdverseImpact,
    };

    // 4. Use z-ai-web-dev-sdk to generate recommendations for flagged areas
    let recommendations: string[] = [];
    try {
      const flaggedAreas: string[] = [];
      if (genderImpact.hasAdverseImpact) flaggedAreas.push(`Gender: ${genderImpact.details.filter((d) => !d.passes).map((d) => d.group).join(', ')}`);
      if (ethnicityImpact.hasAdverseImpact) flaggedAreas.push(`Ethnicity: ${ethnicityImpact.details.filter((d) => !d.passes).map((d) => d.group).join(', ')}`);
      if (veteranImpact.hasAdverseImpact) flaggedAreas.push(`Veteran status: ${veteranImpact.details.filter((d) => !d.passes).map((d) => d.group).join(', ')}`);
      if (disabilityImpact.hasAdverseImpact) flaggedAreas.push(`Disability status: ${disabilityImpact.details.filter((d) => !d.passes).map((d) => d.group).join(', ')}`);

      if (flaggedAreas.length > 0) {
        const zai = await ZAI.create();
        const result = await zai.chat({
          messages: [
            {
              role: 'system',
              content: 'You are an HR compliance expert specializing in fair hiring and anti-bias practices. Provide actionable recommendations to address adverse impact in hiring. Respond with a JSON array of recommendation strings only.',
            },
            {
              role: 'user',
              content: `Based on a bias audit, the following adverse impact was detected using the 4/5ths rule:\n${flaggedAreas.join('\n')}\n\nTotal candidates: ${totalCandidates}\nAudit type: ${auditType}\n\nProvide 3-5 specific, actionable recommendations to address this adverse impact and ensure compliance with the EU AI Act and EEOC guidelines.`,
            },
          ],
        });

        const content = result.content || result.text || '';
        const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        const parsed = JSON.parse(jsonStr);
        recommendations = Array.isArray(parsed) ? parsed : [String(parsed)];
      }
    } catch {
      // Fallback recommendations
      if (adverseImpact.hasAnyAdverseImpact) {
        recommendations = [
          'Review job descriptions for biased language that may discourage diverse applicants',
          'Implement blind resume screening to remove demographic identifiers in initial review',
          'Ensure diverse interview panels for all candidate evaluations',
          'Set measurable diversity hiring goals and track progress quarterly',
          'Conduct regular bias training for all hiring managers and interviewers',
        ];
      }
    }

    // 5. Determine audit status
    const auditStatus = adverseImpact.hasAnyAdverseImpact ? 'FLAGGED' : 'COMPLETED';

    // 6. Create BiasAudit record
    const audit = await db.biasAudit.create({
      data: {
        companyId,
        auditType,
        dateRange: JSON.stringify(dateRange || {}),
        totalCandidates,
        metrics: JSON.stringify(metrics),
        adverseImpact: JSON.stringify(adverseImpact),
        recommendations: JSON.stringify(recommendations),
        status: auditStatus,
      },
    });

    // 7. Update FairHiringConfig.lastAuditAt
    await db.fairHiringConfig.upsert({
      where: { companyId },
      update: { lastAuditAt: new Date() },
      create: {
        companyId,
        lastAuditAt: new Date(),
      },
    });

    // Compute compliance score (0-100)
    const allImpacts = [
      genderImpact, ethnicityImpact, veteranImpact, disabilityImpact,
    ];
    const totalGroups = allImpacts.reduce(
      (sum, imp) => sum + imp.details.length,
      0
    );
    const passingGroups = allImpacts.reduce(
      (sum, imp) => sum + imp.details.filter((d) => d.passes).length,
      0
    );
    const complianceScore = totalGroups > 0
      ? Math.round((passingGroups / totalGroups) * 100)
      : 100;

    return NextResponse.json({
      audit: {
        ...audit,
        complianceScore,
      },
    });
  } catch (error) {
    console.error('Error running bias audit:', error);
    const message = error instanceof Error ? error.message : 'Bias audit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/ai/bias-audit — List audits
export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const accessCheck = await requireCompanyAccess(companyId);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const audits = await db.biasAudit.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // Compute compliance score for each audit
    const auditsWithScore = audits.map((audit) => {
      let complianceScore = 100;
      try {
        const impact = JSON.parse(audit.adverseImpact as string);
        if (impact?.fourFifthsRule) {
          const allImpacts = Object.values(impact.fourFifthsRule) as Array<{
            details: Array<{ passes: boolean }>;
          }>;
          const totalGroups = allImpacts.reduce(
            (sum, imp) => sum + (imp.details?.length || 0),
            0
          );
          const passingGroups = allImpacts.reduce(
            (sum, imp) => sum + (imp.details?.filter((d) => d.passes).length || 0),
            0
          );
          complianceScore = totalGroups > 0
            ? Math.round((passingGroups / totalGroups) * 100)
            : 100;
        }
      } catch {
        // keep default 100
      }
      return { ...audit, complianceScore };
    });

    return NextResponse.json({ audits: auditsWithScore });
  } catch (error) {
    console.error('Error listing bias audits:', error);
    const message = error instanceof Error ? error.message : 'Failed to list audits';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
