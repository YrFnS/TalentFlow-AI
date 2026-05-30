// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import bcrypt from 'bcryptjs';
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
    const password = body.password || '';
    const token = sanitizeString(body.token || '');

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // If 2FA enabled, also require TOTP token
    if (user.twoFactorEnabled) {
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication code is required to disable 2FA' },
          { status: 400 }
        );
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: 'Invalid 2FA configuration' },
          { status: 500 }
        );
      }

      // Decrypt and verify TOTP token
      let decryptedSecret: string;
      try {
        decryptedSecret = decrypt(user.twoFactorSecret);
      } catch {
        return NextResponse.json(
          { error: 'Invalid 2FA configuration' },
          { status: 500 }
        );
      }

      const result = await totp.verify(token, { secret: decryptedSecret });

      if (!result.valid) {
        return NextResponse.json(
          { error: 'Invalid authentication code' },
          { status: 400 }
        );
      }
    }

    // Disable 2FA and clear stored secret
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    // Log 2FA disablement
    await logAuthEvent({
      eventType: 'PASSWORD_CHANGE' as any,
      userId,
      details: { action: '2fa_disabled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled',
    });
  } catch (error) {
    return handleApiError(error, '2fa-disable');
  }
}
