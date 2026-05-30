// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { handleApiError } from '@/lib/security/error-handler';
import { sanitizeString } from '@/lib/security/sanitizer';

/**
 * GET /api/auth/sessions - List active sessions for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;

    // Get all sessions for the user
    const sessions = await db.session.findMany({
      where: { userId },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
      },
      orderBy: { expires: 'desc' },
    });

    // Determine which session is current (by matching token - we can't easily do this
    // from the server side, so we'll just return all sessions with metadata)
    const now = new Date();
    const activeSessions = sessions
      .filter((s) => new Date(s.expires) > now)
      .map((s) => ({
        id: s.id,
        // Don't expose full session token - just last 8 chars
        tokenSuffix: s.sessionToken.slice(-8),
        expiresAt: s.expires,
        // We can't determine device/IP from the session model alone
        // These would need additional fields in a production app
        device: 'Current Browser',
        isCurrent: false, // Frontend can determine this
      }));

    return NextResponse.json({ sessions: activeSessions });
  } catch (error) {
    return handleApiError(error, 'sessions-list');
  }
}

/**
 * DELETE /api/auth/sessions - Revoke a specific session or all other sessions
 * Body: { sessionId?: string, revokeAll?: boolean }
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;
    const body = await req.json();
    const sessionId = sanitizeString(body.sessionId || '');
    const revokeAll = body.revokeAll === true;

    if (revokeAll) {
      // Revoke all sessions except current (we need to keep at least one)
      // In a production app, we'd know the current session token
      // For now, we'll delete all but the most recent
      const sessions = await db.session.findMany({
        where: { userId },
        orderBy: { expires: 'desc' },
      });

      if (sessions.length > 1) {
        // Keep the most recent session, delete the rest
        const sessionsToDelete = sessions.slice(1).map((s) => s.id);
        await db.session.deleteMany({
          where: {
            id: { in: sessionsToDelete },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'All other sessions have been revoked',
      });
    }

    if (sessionId) {
      // Revoke a specific session
      const session = await db.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      await db.session.delete({
        where: { id: sessionId },
      });

      return NextResponse.json({
        success: true,
        message: 'Session has been revoked',
      });
    }

    return NextResponse.json(
      { error: 'Provide sessionId or revokeAll parameter' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, 'sessions-revoke');
  }
}
