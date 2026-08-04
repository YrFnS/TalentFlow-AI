import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const AUDIT_TYPES = new Set([
  'SCREENING',
  'MATCH_SCORING',
  'RISK_ANALYSIS',
  'OVERALL',
]);
const ATTRIBUTE_FIELDS = {
  gender: 'eeoGender',
  ethnicity: 'eeoEthnicity',
  veteranStatus: 'eeoVeteran',
  disabilityStatus: 'eeoDisability',
} as const;

type AttributeName = keyof typeof ATTRIBUTE_FIELDS;
type ApplicationRecord = {
  id: string;
  status: string;
  eeoGender: string | null;
  eeoEthnicity: string | null;
  eeoVeteran: string | null;
  eeoDisability: string | null;
  eeoDeclined: boolean;
};
type GroupRates = Record<
  string,
  { applied: number; selected: number; rate: number }
>;
type ImpactDetail = {
  group: string;
  applied: number;
  selected: number;
  selectionRate: number;
  thresholdRate: number;
  ratio: number;
  passes: boolean;
};
type AttributeImpact = {
  hasAdverseImpact: boolean;
  referenceRate: number;
  thresholdRatio: number;
  details: ImpactDetail[];
};
type StoredAdverseImpact = {
  selectionRateRule?: Record<string, AttributeImpact>;
  hasAnyAdverseImpact?: boolean;
  disclaimer?: string;
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseProtectedAttributes(value: string): AttributeName[] {
  const parsed = parseJson<unknown[]>(value, []);
  return parsed.filter(
    (attribute): attribute is AttributeName =>
      typeof attribute === 'string' && attribute in ATTRIBUTE_FIELDS,
  );
}

function normalizeDateRange(value: unknown): {
  from?: Date;
  to?: Date;
  stored: { from?: string; to?: string };
} {
  const input =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const fromValue = typeof input.from === 'string' ? input.from : '';
  const toValue = typeof input.to === 'string' ? input.to : '';
  const from = fromValue ? new Date(fromValue) : undefined;
  const to = toValue ? new Date(toValue) : undefined;

  if (from && Number.isNaN(from.getTime())) {
    throw new Error('The audit start date is invalid');
  }
  if (to && Number.isNaN(to.getTime())) {
    throw new Error('The audit end date is invalid');
  }
  if (to) to.setHours(23, 59, 59, 999);
  if (from && to && from > to) {
    throw new Error('The audit start date must be before the end date');
  }

  return {
    from,
    to,
    stored: {
      ...(from ? { from: from.toISOString() } : {}),
      ...(to ? { to: to.toISOString() } : {}),
    },
  };
}

function groupStats(
  applications: ApplicationRecord[],
  field: (typeof ATTRIBUTE_FIELDS)[AttributeName],
): GroupRates {
  const groups: Record<string, { applied: number; selected: number }> = {};
  for (const application of applications) {
    if (application.eeoDeclined) continue;
    const value = application[field];
    if (!value) continue;
    if (!groups[value]) groups[value] = { applied: 0, selected: 0 };
    groups[value].applied += 1;
    if (application.status === 'OFFERED' || application.status === 'HIRED') {
      groups[value].selected += 1;
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([group, totals]) => [
      group,
      {
        ...totals,
        rate: totals.applied > 0 ? totals.selected / totals.applied : 0,
      },
    ]),
  );
}

function applySelectionRateRule(
  rates: GroupRates,
  thresholdRatio: number,
): AttributeImpact {
  const entries = Object.entries(rates);
  if (entries.length < 2) {
    return {
      hasAdverseImpact: false,
      referenceRate: 0,
      thresholdRatio,
      details: [],
    };
  }

  const referenceRate = Math.max(...entries.map(([, value]) => value.rate));
  const threshold = referenceRate * thresholdRatio;
  const details = entries.map(([group, value]) => ({
    group,
    applied: value.applied,
    selected: value.selected,
    selectionRate: Math.round(value.rate * 1000) / 10,
    thresholdRate: Math.round(threshold * 1000) / 10,
    ratio:
      referenceRate > 0
        ? Math.round((value.rate / referenceRate) * 1000) / 1000
        : 1,
    passes: referenceRate === 0 || value.rate >= threshold,
  }));

  return {
    hasAdverseImpact: details.some((detail) => !detail.passes),
    referenceRate: Math.round(referenceRate * 1000) / 10,
    thresholdRatio,
    details,
  };
}

function complianceScore(
  impacts: Record<string, { details: Array<{ passes: boolean }> }>,
): number {
  const details = Object.values(impacts).flatMap((impact) => impact.details);
  if (details.length === 0) return 100;
  const passing = details.filter((detail) => detail.passes).length;
  return Math.round((passing / details.length) * 100);
}

function buildRecommendations(params: {
  impacts: Record<
    string,
    {
      hasAdverseImpact: boolean;
      details: Array<{ group: string; passes: boolean }>;
    }
  >;
  totalCandidates: number;
}) {
  const recommendations: string[] = [];
  if (params.totalCandidates < 20) {
    recommendations.push(
      'Treat these results as an early signal only: the audit contains fewer than 20 applications and may be statistically unstable.',
    );
  }

  for (const [attribute, impact] of Object.entries(params.impacts)) {
    const flaggedGroups = impact.details
      .filter((detail) => !detail.passes)
      .map((detail) => detail.group);
    if (impact.hasAdverseImpact && flaggedGroups.length > 0) {
      recommendations.push(
        `Review ${attribute} outcomes for ${flaggedGroups.join(', ')} and compare job-source, screening, interview, and offer decisions before changing the process.`,
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'No adverse-impact signal was detected in the available groups. Continue monitoring selection rates as the sample grows.',
    );
  } else {
    recommendations.push(
      'Use structured scorecards and documented role criteria so reviewers evaluate the same job-related evidence.',
      'Review job descriptions, sourcing channels, screening questions, and interview panels for avoidable barriers.',
      'Have qualified HR or legal professionals review material employment decisions; this statistical screen is not a legal determination.',
    );
  }

  return [...new Set(recommendations)].slice(0, 6);
}

function serializeAudit(audit: {
  id: string;
  companyId: string;
  auditType: string;
  dateRange: string;
  totalCandidates: number;
  metrics: string;
  adverseImpact: string;
  recommendations: string;
  status: string;
  createdAt: Date;
}) {
  const adverseImpact = parseJson<StoredAdverseImpact>(audit.adverseImpact, {});
  const selectionRateRule = adverseImpact.selectionRateRule || {};
  return {
    ...audit,
    dateRange: parseJson<Record<string, string>>(audit.dateRange, {}),
    metrics: parseJson<Record<string, unknown>>(audit.metrics, {}),
    adverseImpact: {
      ...adverseImpact,
      selectionRateRule,
    },
    recommendations: parseJson<string[]>(audit.recommendations, []),
    complianceScore: complianceScore(selectionRateRule),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const companyId = resolveCompanyId(
      auth,
      typeof body.companyId === 'string' ? body.companyId : null,
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const auditType = typeof body.auditType === 'string' ? body.auditType : '';
    if (!AUDIT_TYPES.has(auditType)) {
      return NextResponse.json(
        { error: 'Invalid audit type' },
        { status: 400 },
      );
    }

    const dateRange = normalizeDateRange(body.dateRange);
    const config = await db.fairHiringConfig.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });
    if (!config.biasDetectionEnabled) {
      return NextResponse.json(
        { error: 'Fair-hiring audits are disabled in company settings' },
        { status: 409 },
      );
    }

    const where: Prisma.ApplicationWhereInput = {
      job: { companyId },
      ...(dateRange.from || dateRange.to
        ? {
            appliedAt: {
              ...(dateRange.from ? { gte: dateRange.from } : {}),
              ...(dateRange.to ? { lte: dateRange.to } : {}),
            },
          }
        : {}),
    };
    const applications = await db.application.findMany({
      where,
      select: {
        id: true,
        status: true,
        eeoGender: true,
        eeoEthnicity: true,
        eeoVeteran: true,
        eeoDisability: true,
        eeoDeclined: true,
      },
      take: 10000,
    });

    const protectedAttributes = parseProtectedAttributes(
      config.protectedAttributes,
    );
    const metrics: Record<string, GroupRates> = {};
    const impacts: Record<string, AttributeImpact> = {};

    for (const attribute of protectedAttributes) {
      const rates = groupStats(
        applications as ApplicationRecord[],
        ATTRIBUTE_FIELDS[attribute],
      );
      metrics[attribute] = rates;
      impacts[attribute] = applySelectionRateRule(
        rates,
        config.autoFlagThreshold,
      );
    }

    const hasAnyAdverseImpact = Object.values(impacts).some(
      (impact) => impact.hasAdverseImpact,
    );
    const adverseImpact: StoredAdverseImpact = {
      selectionRateRule: impacts,
      hasAnyAdverseImpact,
      disclaimer:
        'This is a statistical monitoring signal, not a legal finding or compliance certification.',
    };
    const recommendations = buildRecommendations({
      impacts,
      totalCandidates: applications.length,
    });

    const audit = await db.$transaction(async (transaction) => {
      const created = await transaction.biasAudit.create({
        data: {
          companyId,
          auditType,
          dateRange: JSON.stringify(dateRange.stored),
          totalCandidates: applications.length,
          metrics: JSON.stringify(metrics),
          adverseImpact: JSON.stringify(adverseImpact),
          recommendations: JSON.stringify(recommendations),
          status: hasAnyAdverseImpact ? 'FLAGGED' : 'COMPLETED',
        },
      });
      await transaction.fairHiringConfig.update({
        where: { companyId },
        data: { lastAuditAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'fair_hiring.audit_run',
          resource: 'bias_audit',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            auditType,
            totalCandidates: applications.length,
            flagged: hasAnyAdverseImpact,
          }),
        },
      });
      return created;
    });

    return NextResponse.json({ audit: serializeAudit(audit) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bias audit failed';
    console.error('Error running bias audit:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
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

    const audits = await db.biasAudit.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ audits: audits.map(serializeAudit) });
  } catch (error) {
    console.error('Error listing bias audits:', error);
    return NextResponse.json(
      { error: 'Failed to list audits' },
      { status: 500 },
    );
  }
}
