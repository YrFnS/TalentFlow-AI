// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember, requireCompanyAccess } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// GET /api/companies/fair-hiring-config — Get FairHiringConfig for company
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

    // Create default config if not exists
    const config = await db.fairHiringConfig.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        biasDetectionEnabled: true,
        protectedAttributes: JSON.stringify(['gender', 'ethnicity', 'veteranStatus', 'disabilityStatus']),
        autoFlagThreshold: 0.8,
        excludeFromScoring: JSON.stringify(['gender', 'ethnicity', 'age']),
        auditFrequency: 'MONTHLY',
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error getting fair hiring config:', error);
    const message = error instanceof Error ? error.message : 'Failed to get config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/companies/fair-hiring-config — Update FairHiringConfig
export async function PATCH(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { companyId, biasDetectionEnabled, protectedAttributes, autoFlagThreshold, auditFrequency } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const accessCheck = await requireCompanyAccess(companyId);
    if (accessCheck instanceof NextResponse) return accessCheck;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (typeof biasDetectionEnabled === 'boolean') updateData.biasDetectionEnabled = biasDetectionEnabled;
    if (protectedAttributes) updateData.protectedAttributes = JSON.stringify(protectedAttributes);
    if (typeof autoFlagThreshold === 'number') updateData.autoFlagThreshold = autoFlagThreshold;
    if (auditFrequency) updateData.auditFrequency = auditFrequency;

    const config = await db.fairHiringConfig.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        biasDetectionEnabled: biasDetectionEnabled ?? true,
        protectedAttributes: protectedAttributes ? JSON.stringify(protectedAttributes) : JSON.stringify(['gender', 'ethnicity', 'veteranStatus', 'disabilityStatus']),
        autoFlagThreshold: autoFlagThreshold ?? 0.8,
        excludeFromScoring: JSON.stringify(['gender', 'ethnicity', 'age']),
        auditFrequency: auditFrequency ?? 'MONTHLY',
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating fair hiring config:', error);
    const message = error instanceof Error ? error.message : 'Failed to update config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
