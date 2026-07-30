// @ts-nocheck - Prisma payloads are validated before tenant-scoped writes.
import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  isPlatformAdmin,
  requireCompanyAdmin,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import { sendEmail } from '@/lib/email-service';

const companyRoleSchema = z.enum([
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
  'REVIEWER',
]);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const inviteSchema = z.object({
  companyId: z.string().max(200).optional(),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  name: optionalText(100),
  title: optionalText(200),
  role: companyRoleSchema,
});

const updateSchema = z
  .object({
    companyId: z.string().max(200).optional(),
    memberId: z.string().trim().min(1).max(200),
    role: companyRoleSchema.optional(),
    title: z.preprocess(
      (value) => (value === '' ? null : value),
      z.string().trim().max(200).nullable().optional(),
    ),
  })
  .refine((value) => value.role !== undefined || value.title !== undefined, {
    message: 'A role or title change is required',
  });

const memberInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isActive: true,
    },
  },
} as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function roleLabel(role: z.infer<typeof companyRoleSchema>): string {
  return role
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function buildTeamEmail(input: {
  recipientName: string;
  companyName: string;
  role: z.infer<typeof companyRoleSchema>;
  destination: string;
  setupRequired: boolean;
}): string {
  const action = input.setupRequired ? 'Set your password' : 'Open TalentFlow AI';
  const explanation = input.setupRequired
    ? 'Create a password to activate your team account.'
    : 'Sign in with your existing account to access the company workspace.';

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
      <h2 style="margin:0 0 16px;color:#0f766e">You were added to ${escapeHtml(input.companyName)}</h2>
      <p>Hello ${escapeHtml(input.recipientName)},</p>
      <p>You now have the <strong>${escapeHtml(roleLabel(input.role))}</strong> role in the ${escapeHtml(input.companyName)} TalentFlow AI workspace.</p>
      <p>${escapeHtml(explanation)}</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.destination)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600">${action}</a>
      </p>
      ${input.setupRequired ? '<p style="font-size:13px;color:#64748b">This secure setup link expires in 24 hours and should not be forwarded.</p>' : ''}
    </div>`;
}

function validationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join(', ');
}

async function resolveActiveCompany(companyId: string) {
  return db.company.findFirst({
    where: { id: companyId, isActive: true },
    select: { id: true, name: true },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    if (!(await resolveActiveCompany(companyId))) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const members = await db.companyMember.findMany({
      where: { companyId },
      include: memberInclude,
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationError(parsed.error) },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const companyId = resolveCompanyId(auth, input.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: input.email },
      include: {
        companyMemberships: { select: { companyId: true } },
        candidateProfile: { select: { id: true } },
      },
    });

    if (existingUser && !existingUser.isActive) {
      return NextResponse.json(
        { error: 'This account is inactive and cannot be invited' },
        { status: 409 },
      );
    }
    if (existingUser && isPlatformAdmin(existingUser.role)) {
      return NextResponse.json(
        { error: 'Platform administrator accounts cannot be managed as company members' },
        { status: 409 },
      );
    }
    if (
      existingUser?.companyMemberships.some(
        (membership) => membership.companyId === companyId,
      )
    ) {
      return NextResponse.json(
        { error: 'This user is already a member of the company' },
        { status: 409 },
      );
    }
    if (existingUser?.companyMemberships.length) {
      return NextResponse.json(
        {
          error:
            'This account already belongs to another company. The current sign-in model supports one company per account.',
        },
        { status: 409 },
      );
    }
    if (existingUser?.candidateProfile) {
      return NextResponse.json(
        {
          error:
            'This email belongs to a candidate account. Use a separate staff email to avoid changing candidate access.',
        },
        { status: 409 },
      );
    }

    const setupRequired = !existingUser?.password;
    const rawSetupToken = setupRequired
      ? randomBytes(32).toString('base64url')
      : null;
    const setupTokenDigest = rawSetupToken
      ? createHash('sha256').update(rawSetupToken).digest('hex')
      : null;
    const setupExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const member = await db.$transaction(async (transaction) => {
      const user = existingUser
        ? await transaction.user.update({
            where: { id: existingUser.id },
            data: {
              role: input.role,
              ...(input.name && !existingUser.password
                ? { name: input.name }
                : {}),
            },
          })
        : await transaction.user.create({
            data: {
              email: input.email,
              name: input.name || input.email.split('@')[0],
              role: input.role,
              password: null,
              isActive: true,
            },
          });

      const created = await transaction.companyMember.create({
        data: {
          userId: user.id,
          companyId,
          role: input.role,
          title: input.title || null,
        },
        include: memberInclude,
      });

      if (setupTokenDigest) {
        await transaction.verificationToken.deleteMany({
          where: { identifier: input.email },
        });
        await transaction.verificationToken.create({
          data: {
            identifier: input.email,
            token: setupTokenDigest,
            expires: setupExpiresAt,
          },
        });
      }

      await transaction.notification.create({
        data: {
          userId: user.id,
          title: `Added to ${company.name}`,
          message: `You were assigned the ${roleLabel(input.role)} role.`,
          type: 'team',
          link: '/auth/login',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'team.member.add',
          resource: 'company_member',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            invitedUserId: user.id,
            role: input.role,
            setupRequired,
          }),
        },
      });

      return created;
    });

    const configuredBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    const baseUrl = (configuredBaseUrl || request.nextUrl.origin).replace(/\/$/, '');
    const destination = rawSetupToken
      ? `${baseUrl}/auth/reset-password?token=${encodeURIComponent(rawSetupToken)}`
      : `${baseUrl}/auth/login`;

    const email = await sendEmail({
      to: input.email,
      subject: `You were added to ${company.name} on TalentFlow AI`,
      body: buildTeamEmail({
        recipientName: member.user.name,
        companyName: company.name,
        role: input.role,
        destination,
        setupRequired,
      }),
      companyId,
      userId: member.userId,
    });

    return NextResponse.json(
      {
        member,
        setupRequired,
        emailSent: email.success,
        emailError: email.success ? null : email.error || 'Invitation email failed',
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'This user is already a member of the company' },
        { status: 409 },
      );
    }

    console.error('Team POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationError(parsed.error) },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const companyId = resolveCompanyId(auth, input.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.companyMember.findFirst({
      where: { id: input.memberId, companyId },
      include: memberInclude,
    });
    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    if (
      existing.userId === auth.userId &&
      input.role !== undefined &&
      input.role !== existing.role
    ) {
      return NextResponse.json(
        { error: 'You cannot change your own administrator role' },
        { status: 409 },
      );
    }

    if (existing.role === 'COMPANY_ADMIN' && input.role !== undefined && input.role !== 'COMPANY_ADMIN') {
      const administratorCount = await db.companyMember.count({
        where: { companyId, role: 'COMPANY_ADMIN' },
      });
      if (administratorCount <= 1) {
        return NextResponse.json(
          { error: 'The company must keep at least one administrator' },
          { status: 409 },
        );
      }
    }

    const member = await db.$transaction(async (transaction) => {
      const updated = await transaction.companyMember.update({
        where: { id: existing.id },
        data: {
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
        },
        include: memberInclude,
      });

      if (input.role !== undefined && input.role !== existing.role) {
        await transaction.user.update({
          where: { id: existing.userId },
          data: { role: input.role },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'team.member.update',
          resource: 'company_member',
          resourceId: existing.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            oldRole: existing.role,
            newRole: input.role,
            titleChanged: input.title !== undefined,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Team PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const memberId = request.nextUrl.searchParams.get('memberId');
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.companyMember.findFirst({
      where: { id: memberId, companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
          },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }
    if (existing.userId === auth.userId) {
      return NextResponse.json(
        { error: 'You cannot remove your own company membership' },
        { status: 409 },
      );
    }

    if (existing.role === 'COMPANY_ADMIN') {
      const administratorCount = await db.companyMember.count({
        where: { companyId, role: 'COMPANY_ADMIN' },
      });
      if (administratorCount <= 1) {
        return NextResponse.json(
          { error: 'The company must keep at least one administrator' },
          { status: 409 },
        );
      }
    }

    await db.$transaction(async (transaction) => {
      await transaction.companyMember.delete({ where: { id: existing.id } });

      const remainingMembership = await transaction.companyMember.findFirst({
        where: { userId: existing.userId, company: { isActive: true } },
        orderBy: { joinedAt: 'asc' },
        select: { role: true },
      });

      await transaction.user.update({
        where: { id: existing.userId },
        data: { role: remainingMembership?.role || 'CANDIDATE' },
      });

      if (!existing.user.password) {
        await transaction.verificationToken.deleteMany({
          where: { identifier: existing.user.email },
        });
      }

      await transaction.notification.create({
        data: {
          userId: existing.userId,
          title: 'Company access removed',
          message: 'Your company workspace membership was removed.',
          type: 'team',
          link: '/',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'team.member.remove',
          resource: 'company_member',
          resourceId: existing.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            removedUserId: existing.userId,
            removedRole: existing.role,
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 },
    );
  }
}
