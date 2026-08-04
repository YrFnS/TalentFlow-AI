import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  sanitizeEmail,
} from '@/lib/security';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { createSafeErrorResponse } from '@/lib/security/error-handler';
import {
  BUILTIN_EMAIL_TEMPLATES,
  sendEmail,
} from '@/lib/email-service';

const GENERIC_MESSAGE =
  'If an unverified account exists for this email, a verification message has been sent.';

function applicationUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Application URL is not configured');
  }
  return 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const body = (await request.json()) as { email?: unknown };
    const sanitizedEmail =
      typeof body.email === 'string' ? sanitizeEmail(body.email) : '';

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 },
      );
    }

    const rateResult = checkRateLimit(
      `resend-verification:${sanitizedEmail}`,
      RATE_LIMITS.STRICT,
    );
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.max(
                1,
                Math.ceil((rateResult.resetTime - Date.now()) / 1000),
              ),
            ),
          },
        },
      );
    }

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || user.emailVerified || !user.isActive) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenDigest = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.$transaction(async (transaction) => {
      await transaction.verificationToken.deleteMany({
        where: { identifier: sanitizedEmail },
      });
      await transaction.verificationToken.create({
        data: {
          identifier: sanitizedEmail,
          token: tokenDigest,
          expires,
        },
      });
    });

    const verificationUrl = `${applicationUrl()}/auth/verify-email?token=${encodeURIComponent(
      rawToken,
    )}`;
    const email = await sendEmail({
      to: user.email,
      subject: 'Verify Your Email — TalentFlow AI',
      body: BUILTIN_EMAIL_TEMPLATES.emailVerification(
        user.name,
        verificationUrl,
      ),
      userId: user.id,
    });

    await logAuthEvent({
      eventType: 'TOKEN_REFRESH',
      email: sanitizedEmail,
      userId: user.id,
      ipAddress: clientIp,
      details: email.success
        ? 'Verification email resent'
        : 'Verification email delivery failed',
    });

    if (!email.success) {
      console.error('[ResendVerification] Verification email delivery failed');
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    return createSafeErrorResponse(error, {
      status: 500,
      publicMessage: 'An error occurred while resending the verification email',
      logContext: 'ResendVerification',
    });
  }
}
