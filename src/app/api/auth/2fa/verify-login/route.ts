import { NextRequest, NextResponse } from 'next/server';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/security/encryption';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { handleApiError } from '@/lib/security/error-handler';
import { sanitizeString } from '@/lib/security/sanitizer';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = sanitizeString(body.userId || '');
    const token = sanitizeString(body.token || '');

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      );
    }

    // Get user with 2FA data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
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

    // First try TOTP verification
    const totpResult = await totp.verify(token, { secret: decryptedSecret });

    if (totpResult.valid) {
      await logAuthEvent({
        eventType: 'LOGIN_SUCCESS',
        userId: user.id,
        details: { action: '2fa_login_success', method: 'totp' },
      });

      return NextResponse.json({
        success: true,
        message: '2FA verification successful',
      });
    }

    // If TOTP fails, try backup codes
    if (user.backupCodes) {
      let hashedBackupCodes: string[];
      try {
        hashedBackupCodes = JSON.parse(user.backupCodes);
      } catch {
        return NextResponse.json(
          { error: 'Invalid authentication code' },
          { status: 400 }
        );
      }

      // Check each backup code
      for (let i = 0; i < hashedBackupCodes.length; i++) {
        const isMatch = await bcrypt.compare(token, hashedBackupCodes[i]);
        if (isMatch) {
          // Remove the used backup code
          hashedBackupCodes.splice(i, 1);

          await db.user.update({
            where: { id: userId },
            data: {
              backupCodes: hashedBackupCodes.length > 0
                ? JSON.stringify(hashedBackupCodes)
                : null,
            },
          });

          await logAuthEvent({
            eventType: 'LOGIN_SUCCESS',
            userId: user.id,
            details: { action: '2fa_login_success', method: 'backup_code' },
          });

          return NextResponse.json({
            success: true,
            message: '2FA verification successful (backup code used)',
            backupCodesRemaining: hashedBackupCodes.length,
          });
        }
      }
    }

    // Both TOTP and backup code failed
    await logAuthEvent({
      eventType: 'LOGIN_FAILURE',
      userId: user.id,
      details: { action: '2fa_login_failed', reason: 'invalid_code' },
    });

    return NextResponse.json(
      { error: 'Invalid authentication code' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, '2fa-verify-login');
  }
}
