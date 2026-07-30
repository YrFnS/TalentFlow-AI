// @ts-nocheck - Security helpers provide runtime validation and rate limiting.
import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  sanitizeEmail,
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
} from '@/lib/security';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { createSafeErrorResponse } from '@/lib/security/error-handler';
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const body = await request.json();
    const sanitizedEmail = sanitizeEmail(body.email);

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    const rateResult = checkRateLimit(
      `forgot-password:${sanitizedEmail}`,
      RATE_LIMITS.PASSWORD_RESET,
    );
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.max(1, Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
            ),
          },
        },
      );
    }

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (user?.isActive) {
      const rawToken = randomBytes(32).toString('base64url');
      const hashedToken = createHash('sha256')
        .update(rawToken, 'utf8')
        .digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.$transaction(async (transaction) => {
        await transaction.verificationToken.deleteMany({
          where: { identifier: sanitizedEmail },
        });
        await transaction.verificationToken.create({
          data: {
            identifier: sanitizedEmail,
            token: hashedToken,
            expires: expiresAt,
          },
        });
      });

      await logAuthEvent({
        eventType: 'PASSWORD_CHANGE',
        email: sanitizedEmail,
        userId: user.id,
        ipAddress: clientIp,
        details: 'Password reset requested',
      });

      const configuredBaseUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
      if (!configuredBaseUrl && process.env.NODE_ENV === 'production') {
        throw new Error('Application URL is not configured');
      }

      const baseUrl = (configuredBaseUrl || request.nextUrl.origin).replace(
        /\/$/,
        '',
      );
      const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
      const emailResult = await sendEmail({
        to: sanitizedEmail,
        subject: 'Reset Your Password — TalentFlow AI',
        body: BUILTIN_EMAIL_TEMPLATES.passwordReset(user.name, resetUrl),
        userId: user.id,
      });

      if (!emailResult.success) {
        console.error('[ForgotPassword] Password reset email delivery failed');
      }
    }

    // Always return the same response to prevent account enumeration.
    return NextResponse.json({
      message:
        'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    return createSafeErrorResponse(error, {
      status: 500,
      publicMessage: 'An error occurred while processing your request',
      logContext: 'ForgotPassword',
    });
  }
}
