import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sanitizeEmail, checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/security';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { createSafeErrorResponse } from '@/lib/security/error-handler';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateResult = checkRateLimit(
      `resend-verification:${sanitizedEmail}`,
      RATE_LIMITS.STRICT
    );

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // Check if user exists and email is not already verified
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email and is not verified, a verification email has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Delete any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: sanitizedEmail },
    });

    // Store in VerificationToken model (expires = 24 hours)
    await db.verificationToken.create({
      data: {
        identifier: sanitizedEmail,
        token: rawToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Log the event
    await logAuthEvent({
      eventType: 'TOKEN_REFRESH',
      email: sanitizedEmail,
      userId: user.id,
      ipAddress: clientIp,
      details: 'Verification email resent',
    });

    // In production, send email. For now, log the token
    console.log(`[ResendVerification] Token for ${sanitizedEmail}: ${rawToken}`);
    console.log(`[ResendVerification] Verify URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${rawToken}`);

    return NextResponse.json({
      message: 'If an account exists with this email and is not verified, a verification email has been sent.',
    });
  } catch (error) {
    return createSafeErrorResponse(error, {
      status: 500,
      publicMessage: 'An error occurred while resending the verification email',
      logContext: 'ResendVerification',
    });
  }
}
