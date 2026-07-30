import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyAdmin,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const ALLOWED_ATTRIBUTES = new Set([
  'gender',
  'ethnicity',
  'veteranStatus',
  'disabilityStatus',
]);
const ALLOWED_FREQUENCIES = new Set(['WEEKLY', 'MONTHLY', 'QUARTERLY']);

function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function serializeConfig(config: {
  id: string;
  companyId: string;
  biasDetectionEnabled: boolean;
  protectedAttributes: string;
  autoFlagThreshold: number;
  excludeFromScoring: string;
  auditFrequency: string;
  lastAuditAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...config,
    protectedAttributes: parseArray(config.protectedAttributes),
    excludeFromScoring: parseArray(config.excludeFromScoring),
  };
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

    const config = await db.fairHiringConfig.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });

    return NextResponse.json({ config: serializeConfig(config) });
  } catch (error) {
    console.error('Error getting fair hiring config:', error);
    return NextResponse.json(
      { error: 'Failed to get fair-hiring configuration' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCompanyAdmin();
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

    const updateData: {
      biasDetectionEnabled?: boolean;
      protectedAttributes?: string;
      autoFlagThreshold?: number;
      auditFrequency?: string;
    } = {};

    if (body.biasDetectionEnabled !== undefined) {
      if (typeof body.biasDetectionEnabled !== 'boolean') {
        return NextResponse.json(
          { error: 'biasDetectionEnabled must be a boolean' },
          { status: 400 },
        );
      }
      updateData.biasDetectionEnabled = body.biasDetectionEnabled;
    }

    if (body.protectedAttributes !== undefined) {
      if (!Array.isArray(body.protectedAttributes)) {
        return NextResponse.json(
          { error: 'protectedAttributes must be an array' },
          { status: 400 },
        );
      }
      const attributes = [
        ...new Set(
          body.protectedAttributes.filter(
            (attribute): attribute is string =>
              typeof attribute === 'string' &&
              ALLOWED_ATTRIBUTES.has(attribute),
          ),
        ),
      ];
      if (attributes.length === 0) {
        return NextResponse.json(
          { error: 'Select at least one supported protected attribute' },
          { status: 400 },
        );
      }
      updateData.protectedAttributes = JSON.stringify(attributes);
    }

    if (body.autoFlagThreshold !== undefined) {
      const threshold = Number(body.autoFlagThreshold);
      if (!Number.isFinite(threshold) || threshold < 0.5 || threshold > 1) {
        return NextResponse.json(
          { error: 'autoFlagThreshold must be between 0.5 and 1' },
          { status: 400 },
        );
      }
      updateData.autoFlagThreshold = Math.round(threshold * 1000) / 1000;
    }

    if (body.auditFrequency !== undefined) {
      const frequency = String(body.auditFrequency);
      if (!ALLOWED_FREQUENCIES.has(frequency)) {
        return NextResponse.json(
          { error: 'auditFrequency must be WEEKLY, MONTHLY, or QUARTERLY' },
          { status: 400 },
        );
      }
      updateData.auditFrequency = frequency;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No supported configuration fields were provided' },
        { status: 400 },
      );
    }

    const config = await db.$transaction(async (transaction) => {
      const updated = await transaction.fairHiringConfig.upsert({
        where: { companyId },
        update: updateData,
        create: {
          companyId,
          ...updateData,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'fair_hiring.config_update',
          resource: 'fair_hiring_config',
          resourceId: updated.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            changedFields: Object.keys(updateData),
          }),
        },
      });
      return updated;
    });

    return NextResponse.json({ config: serializeConfig(config) });
  } catch (error) {
    console.error('Error updating fair hiring config:', error);
    return NextResponse.json(
      { error: 'Failed to update fair-hiring configuration' },
      { status: 500 },
    );
  }
}
