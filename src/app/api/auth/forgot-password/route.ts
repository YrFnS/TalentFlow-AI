// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sanitizeEmail, checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/security';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { createSafeErrorResponse } from '@/lib/security/error-handler';
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from '@/lib/email-service';

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

    // Rate limiting: max 3 requests per 15 min per email
    const rateResult = checkRateLimit(
      `forgot-password:${sanitizedEmail}`,
      RATE_LIMITS.PASSWORD_RESET
    );

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // Check if user exists with this email
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (user) {
      // Generate a password reset token (random hex string, 32 bytes)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Store token in VerificationToken model (expires = 1 hour)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Delete any existing password reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { identifier: sanitizedEmail },
      });

      await db.verificationToken.create({
        data: {
          identifier: sanitizedEmail,
          token: hashedToken,
          expires: expiresAt,
        },
      });

      // Log the event
      await logAuthEvent({
        eventType: 'PASSWORD_CHANGE',
        email: sanitizedEmail,
        userId: user.id,
        ipAddress: clientIp,
        details: 'Password reset requested',
      });

      // Send password reset email
      try {
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${rawToken}`;
        const emailBody = BUILTIN_EMAIL_TEMPLATES.passwordReset(user.name, resetUrl);
        await sendEmail({
          to: sanitizedEmail,
          subject: 'Reset Your Password — TalentFlow AI',
          body: emailBody,
          userId: user.id,
        });
      } catch (emailError) {
        console.error('[ForgotPassword] Failed to send password reset email:', emailError);
        // Don't reveal error to prevent email enumeration
      }

      console.log(`[ForgotPassword] Reset token for ${sanitizedEmail}: ${rawToken}`);
      console.log(`[ForgotPassword] Reset URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${rawToken}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    return createSafeErrorResponse(error, {
      status: 500,
      publicMessage: 'An error occurred while processing your request',
      logContext: 'ForgotPassword',
    });
  }
}
