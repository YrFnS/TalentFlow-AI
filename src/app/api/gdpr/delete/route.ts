import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import { validateInput, gdprDeleteSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;

    // Zod schema validation
    const validation = validateInput(gdprDeleteSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { requestId, confirmed } = validation.data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Determine real data categories for this user from DB
    const candidateProfile = await db.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const profileId = candidateProfile?.id;

    const categoriesMarkedForDeletion: string[] = [];

    if (profileId) {
      categoriesMarkedForDeletion.push('profile');

      const [applicationCount, interviewCount, assessmentCount, activityCount] = await Promise.all([
        db.application.count({ where: { candidateId: profileId } }),
        db.interview.count({ where: { application: { candidateId: profileId } } }),
        db.assessmentResult.count({ where: { candidateId: userId } }),
        db.activity.count({ where: { candidateId: profileId } }),
      ]);

      if (applicationCount > 0) categoriesMarkedForDeletion.push('applications');
      if (interviewCount > 0) categoriesMarkedForDeletion.push('interviews');
      if (assessmentCount > 0) categoriesMarkedForDeletion.push('assessments');
      if (activityCount > 0) categoriesMarkedForDeletion.push('activities');
    }

    const notificationCount = await db.notification.count({ where: { userId } });
    if (notificationCount > 0) categoriesMarkedForDeletion.push('notifications');

    // Schedule deletion with 30-day grace period
    const scheduledAt = new Date();
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30); // 30-day grace period
    const permanentDeletionDate = new Date(gracePeriodEnd);

    // Create GDPR request record in the DB with type DATA_DELETION
    const gdprRequest = await db.gDPRRequest.create({
      data: {
        userId,
        type: 'DATA_DELETION',
        status: 'PENDING',
        details: JSON.stringify({
          requestId,
          categoriesMarkedForDeletion,
          gracePeriodEnd: gracePeriodEnd.toISOString(),
          permanentDeletionDate: permanentDeletionDate.toISOString(),
        }),
        completedAt: null,
      },
    });

    // Audit log for GDPR data deletion request
    await db.auditLog.create({
      data: {
        userId,
        action: 'gdpr.data_deletion',
        resource: 'gdpr',
        resourceId: gdprRequest.id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({
          categoriesMarkedForDeletion,
          gracePeriodEnd: gracePeriodEnd.toISOString(),
          permanentDeletionDate: permanentDeletionDate.toISOString(),
        }),
      },
    });

    const deletionData = {
      requestId,
      userId,
      status: 'scheduled',
      scheduledAt: scheduledAt.toISOString(),
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      permanentDeletionDate: permanentDeletionDate.toISOString(),
      canCancel: true,
      categoriesMarkedForDeletion,
      message: `Data deletion scheduled. The user has until ${gracePeriodEnd.toLocaleDateString()} to cancel this request.`,
    };

    return NextResponse.json({
      success: true,
      message: 'Deletion scheduled successfully with 30-day grace period',
      data: deletionData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to schedule data deletion' },
      { status: 500 }
    );
  }
}
