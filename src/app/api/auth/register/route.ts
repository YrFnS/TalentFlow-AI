// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp, RATE_LIMITS, sanitizeName, sanitizeEmail, validatePasswordStrength, validateName } from '@/lib/security';
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from '@/lib/email-service';
import { validateInput, registerSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const clientIp = getClientIp(request.headers);
  const rateResult = checkRateLimit(`register:${clientIp}`, RATE_LIMITS.REGISTER);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();

    // Zod schema validation
    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { name, email, password, role } = validation.data;

    // Additional security: sanitize name
    const sanitizedName = sanitizeName(name);
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Additional security: sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Additional security: validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Public registration only allows CANDIDATE role
    const publicRoles = ['CANDIDATE'];

    if (!publicRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Only candidate registration is available. Admin and company accounts must be created by administrators.' },
        { status: 403 }
      );
    }

    // Create user with hashed password (emailVerified remains null until verified)
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        role: role,
        locale: 'en',
        emailVerified: null,
      },
    });

    // Create candidate profile
    await db.candidateProfile.create({
      data: {
        userId: user.id,
        publicSlug: `candidate-${user.id.slice(0, 8)}`,
      },
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.verificationToken.create({
      data: {
        identifier: sanitizedEmail,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Only log partial token info in development for debugging
    if (process.env.NODE_ENV === 'development') {
      const partialToken = verificationToken.slice(0, 8) + '...';
      console.log(`[Register] Verification token generated for ${sanitizedEmail}: ${partialToken} (redacted)`);
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
      const emailBody = BUILTIN_EMAIL_TEMPLATES.emailVerification(sanitizedName, verificationUrl);
      await sendEmail({
        to: sanitizedEmail,
        subject: 'Verify Your Email — TalentFlow AI',
        body: emailBody,
        userId: user.id,
      });
    } catch (emailError) {
      console.error('[Register] Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Audit log for registration
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'auth.register',
        resource: 'user',
        resourceId: user.id,
        ipAddress: clientIp,
        details: JSON.stringify({ email: sanitizedEmail, role }),
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        verificationSent: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
