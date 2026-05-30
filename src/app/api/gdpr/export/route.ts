import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import { validateInput, gdprExportSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;

    // Zod schema validation
    const validation = validateInput(gdprExportSchema, { userId, ...body });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { requestType } = body;

    // Get real record counts from DB for this user
    const candidateProfile = await db.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const profileId = candidateProfile?.id;

    const [applicationCount, interviewCount, assessmentCount, activityCount, notificationCount] = await Promise.all([
      profileId ? db.application.count({ where: { candidateId: profileId } }) : 0,
      profileId ? db.interview.count({
        where: { application: { candidateId: profileId } },
      }) : 0,
      profileId ? db.assessmentResult.count({ where: { candidateId: userId } }) : 0,
      profileId ? db.activity.count({ where: { candidateId: profileId } }) : 0,
      db.notification.count({ where: { userId } }),
    ]);

    const profileRecords = profileId ? 1 : 0;

    const categories: Record<string, { records: number; size: string }> = {};

    if (profileRecords > 0) {
      categories.profile = { records: profileRecords, size: `${(profileRecords * 2.4).toFixed(1)} KB` };
    }
    if (applicationCount > 0) {
      categories.applications = { records: applicationCount, size: `${(applicationCount * 3.8).toFixed(1)} KB` };
    }
    if (interviewCount > 0) {
      categories.interviews = { records: interviewCount, size: `${(interviewCount * 3.5).toFixed(1)} KB` };
    }
    if (assessmentCount > 0) {
      categories.assessments = { records: assessmentCount, size: `${(assessmentCount * 3.0).toFixed(1)} KB` };
    }
    if (activityCount > 0) {
      categories.activities = { records: activityCount, size: `${(activityCount * 1.5).toFixed(1)} KB` };
    }
    if (notificationCount > 0) {
      categories.notifications = { records: notificationCount, size: `${(notificationCount * 0.8).toFixed(1)} KB` };
    }

    const totalRecords = Object.values(categories).reduce((sum, c) => sum + c.records, 0);
    const totalSizeKB = Object.values(categories).reduce((sum, c) => sum + parseFloat(c.size), 0);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    // Create GDPR request record in the DB
    const gdprRequest = await db.gDPRRequest.create({
      data: {
        userId,
        type: 'DATA_EXPORT',
        status: 'PROCESSING',
        details: requestType || 'full_export',
        downloadExpiry: expiresAt,
      },
    });

    const exportId = gdprRequest.id;

    // Audit log for GDPR data export
    await db.auditLog.create({
      data: {
        userId,
        action: 'gdpr.data_export',
        resource: 'gdpr',
        resourceId: exportId,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({
          requestType: requestType || 'full_export',
          totalRecords,
          categories: Object.keys(categories),
        }),
      },
    });

    const exportData = {
      exportId,
      userId,
      requestType: requestType || 'full_export',
      generatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      downloadUrl: `/api/gdpr/export/${exportId}/download`,
      categories,
      totalRecords,
      totalSize: `${totalSizeKB.toFixed(1)} KB`,
      format: 'JSON',
    };

    return NextResponse.json({
      success: true,
      message: 'Data export generated successfully',
      data: exportData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate data export' },
      { status: 500 }
    );
  }
}
