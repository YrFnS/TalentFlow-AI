import { NextRequest, NextResponse } from 'next/server';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/security/encryption';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { handleApiError } from '@/lib/security/error-handler';
import { requireAuth } from '@/lib/auth-guard';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate TOTP secret
    const secret = totp.generateSecret();

    // Generate backup codes (8 one-time codes)
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push(code);
    }

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Encrypt and store the secret (but don't enable 2FA yet)
    const encryptedSecret = encrypt(secret);

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        backupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    // Generate QR code URI
    const otpauth = totp.toURI({
      secret,
      label: user.email,
      issuer: 'TalentFlow AI',
    });

    const qrCode = await QRCode.toDataURL(otpauth);

    // Log the setup attempt
    await logAuthEvent({
      eventType: 'PASSWORD_CHANGE' as any,
      userId,
      details: { action: '2fa_setup_initiated' },
    });

    return NextResponse.json({
      secret,
      qrCode,
      backupCodes,
    });
  } catch (error) {
    return handleApiError(error, '2fa-setup');
  }
}
