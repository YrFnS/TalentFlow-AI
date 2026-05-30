import { NextRequest, NextResponse } from 'next/server';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/security/encryption';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { handleApiError } from '@/lib/security/error-handler';
import { requireAuth } from '@/lib/auth-guard';
import { sanitizeString } from '@/lib/security/sanitizer';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;
    const body = await req.json();
    const token = sanitizeString(body.token || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get user with 2FA secret
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA setup not initiated. Please set up 2FA first.' },
        { status: 400 }
      );
    }

    // Decrypt the secret
    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(user.twoFactorSecret);
    } catch {
      return NextResponse.json(
        { error: 'Invalid 2FA configuration' },
        { status: 500 }
      );
    }

    // Verify TOTP token
    const result = await totp.verify(token, { secret: decryptedSecret });

    if (!result.valid) {
      await logAuthEvent({
        eventType: 'LOGIN_FAILURE',
        userId,
        details: { action: '2fa_verify_failed', reason: 'invalid_token' },
      });

      return NextResponse.json(
        { error: 'Invalid authentication code' },
        { status: 400 }
      );
    }

    // Enable 2FA on the user
    await db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Log successful 2FA enablement
    await logAuthEvent({
      eventType: 'PASSWORD_CHANGE' as any,
      userId,
      details: { action: '2fa_enabled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled',
    });
  } catch (error) {
    return handleApiError(error, '2fa-verify');
  }
}
