import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { validatePasswordStrength } from '@/lib/security/input-sanitizer';
import { logAuthEvent } from '@/lib/security/auth-logger';
import { createSafeErrorResponse } from '@/lib/security/error-handler';
import { getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, password, and confirm password are required' },
        { status: 400 }
      );
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Hash the provided token to look it up
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Look up the token in VerificationToken model
    const verificationToken = await db.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'This reset link is invalid' },
        { status: 400 }
      );
    }

    // Check if token is not expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token: hashedToken },
      }).catch(() => {});

      return NextResponse.json(
        { error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Find user by the identifier (email) from the token
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { token: hashedToken },
    });

    // Log password change
    await logAuthEvent({
      eventType: 'PASSWORD_CHANGE',
      userId: user.id,
      email: user.email,
      ipAddress: clientIp,
      details: 'Password reset completed',
    });

    return NextResponse.json({
      message: 'Your password has been reset successfully',
    });
  } catch (error) {
    return createSafeErrorResponse(error, {
      status: 500,
      publicMessage: 'An error occurred while resetting your password',
      logContext: 'ResetPassword',
    });
  }
}
