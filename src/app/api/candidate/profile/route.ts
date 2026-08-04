// @ts-nocheck - The request is validated with Zod before transactional writes.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalUrl = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine((value) => ['https:', 'http:'].includes(new URL(value).protocol), {
      message: 'URL must use HTTP or HTTPS',
    })
    .optional(),
);

const dateText = z
  .string()
  .trim()
  .min(4)
  .max(30)
  .refine(
    (value) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(value),
    'Use YYYY, YYYY-MM, or YYYY-MM-DD',
  );

const experienceSchema = z
  .object({
    id: z.string().max(200).optional(),
    title: z.string().trim().min(1).max(200),
    company: z.string().trim().min(1).max(200),
    description: optionalText(10000),
    startDate: dateText,
    endDate: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      dateText.optional(),
    ),
    current: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.current && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must not be before start date',
      });
    }
  });

const educationSchema = z
  .object({
    id: z.string().max(200).optional(),
    institution: z.string().trim().min(1).max(250),
    degree: z.string().trim().min(1).max(250),
    field: optionalText(250),
    startDate: dateText,
    endDate: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      dateText.optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must not be before start date',
      });
    }
  });

const certificationSchema = z.object({
  id: z.string().max(200).optional(),
  name: z.string().trim().min(1).max(250),
  issuer: optionalText(250),
  date: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    dateText.optional(),
  ),
});

const candidateProfileSchema = z.object({
  personalInfo: z.object({
    name: z.string().trim().min(1).max(100),
    phone: optionalText(40),
    location: optionalText(250),
    bio: optionalText(10000),
    currentTitle: optionalText(250),
    linkedin: optionalUrl,
    portfolio: optionalUrl,
    availability: z.enum(['open', 'employed', 'not_looking']).default('open'),
    expectedSalary: optionalText(100),
  }),
  isPublic: z.boolean(),
  skills: z
    .array(z.string().trim().min(1).max(100))
    .max(100),
  experiences: z.array(experienceSchema).max(50),
  educations: z.array(educationSchema).max(50),
  certifications: z.array(certificationSchema).max(100),
});

const profileInclude = {
  candidateProfile: {
    include: {
      experiences: { orderBy: { createdAt: 'asc' } },
      educations: { orderBy: { createdAt: 'asc' } },
      certifications: { orderBy: { createdAt: 'asc' } },
    },
  },
} as const;

function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const skill of skills) {
    const normalized = skill.trim();
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function monthIndex(value: string): number | null {
  const match = value.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2] || '1');
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return year * 12 + month - 1;
}

function calculateExperienceYears(
  experiences: Array<{ startDate: string; endDate?: string; current: boolean }>,
): number | null {
  const current = new Date();
  const currentMonth = current.getUTCFullYear() * 12 + current.getUTCMonth();
  const intervals = experiences
    .map((experience) => {
      const start = monthIndex(experience.startDate);
      const end = experience.current
        ? currentMonth
        : experience.endDate
          ? monthIndex(experience.endDate)
          : start;
      return start === null || end === null || end < start ? null : [start, end] as const;
    })
    .filter((interval): interval is readonly [number, number] => interval !== null)
    .sort((left, right) => left[0] - right[0]);

  if (intervals.length === 0) return null;

  let totalMonths = 0;
  let [rangeStart, rangeEnd] = intervals[0];
  for (const [start, end] of intervals.slice(1)) {
    if (start <= rangeEnd + 1) {
      rangeEnd = Math.max(rangeEnd, end);
    } else {
      totalMonths += rangeEnd - rangeStart + 1;
      rangeStart = start;
      rangeEnd = end;
    }
  }
  totalMonths += rangeEnd - rangeStart + 1;

  return Math.min(80, Math.max(0, Math.round(totalMonths / 12)));
}

function serializeProfile(user: any) {
  const profile = user.candidateProfile;
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    profile: {
      id: profile?.id || null,
      phone: profile?.phone || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      currentTitle: profile?.currentTitle || '',
      linkedin: profile?.linkedin || '',
      portfolio: profile?.portfolio || '',
      availability: profile?.availability || 'open',
      expectedSalary: profile?.expectedSalary || '',
      isPublic: profile?.isPublic ?? true,
      publicSlug: profile?.publicSlug || null,
      skills: profile?.skills ? JSON.parse(profile.skills) : [],
      experienceYears: profile?.experienceYears ?? null,
      hasStoredResume: Boolean(profile?.resumeUrl || profile?.resumeText),
      updatedAt: profile?.updatedAt || null,
    },
    experiences: (profile?.experiences || []).map((experience: any) => ({
      id: experience.id,
      title: experience.title,
      company: experience.company,
      description: experience.description || '',
      startDate: experience.startDate,
      endDate: experience.endDate || '',
      current: experience.current,
    })),
    educations: (profile?.educations || []).map((education: any) => ({
      id: education.id,
      institution: education.institution,
      degree: education.degree,
      field: education.field || '',
      startDate: education.startDate,
      endDate: education.endDate || '',
    })),
    certifications: (profile?.certifications || []).map((certification: any) => ({
      id: certification.id,
      name: certification.name,
      issuer: certification.issuer || '',
      date: certification.date || '',
    })),
  };
}

export async function GET() {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: profileInclude,
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(serializeProfile(user));
  } catch (error) {
    console.error('Candidate profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load candidate profile' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = candidateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues
            .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
            .join(', '),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const skills = normalizeSkills(input.skills);
    const experienceYears = calculateExperienceYears(input.experiences);

    await db.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: auth.userId },
        select: { id: true },
      });
      if (!user) throw new Error('User not found');

      await transaction.user.update({
        where: { id: auth.userId },
        data: { name: input.personalInfo.name },
      });

      const profile = await transaction.candidateProfile.upsert({
        where: { userId: auth.userId },
        create: {
          userId: auth.userId,
          phone: input.personalInfo.phone || null,
          location: input.personalInfo.location || null,
          bio: input.personalInfo.bio || null,
          currentTitle: input.personalInfo.currentTitle || null,
          linkedin: input.personalInfo.linkedin || null,
          portfolio: input.personalInfo.portfolio || null,
          availability: input.personalInfo.availability,
          expectedSalary: input.personalInfo.expectedSalary || null,
          isPublic: input.isPublic,
          skills: JSON.stringify(skills),
          experienceYears,
          publicSlug: `candidate-${auth.userId}`,
        },
        update: {
          phone: input.personalInfo.phone || null,
          location: input.personalInfo.location || null,
          bio: input.personalInfo.bio || null,
          currentTitle: input.personalInfo.currentTitle || null,
          linkedin: input.personalInfo.linkedin || null,
          portfolio: input.personalInfo.portfolio || null,
          availability: input.personalInfo.availability,
          expectedSalary: input.personalInfo.expectedSalary || null,
          isPublic: input.isPublic,
          skills: JSON.stringify(skills),
          experienceYears,
        },
        select: { id: true },
      });

      await Promise.all([
        transaction.experience.deleteMany({ where: { profileId: profile.id } }),
        transaction.education.deleteMany({ where: { profileId: profile.id } }),
        transaction.certification.deleteMany({ where: { profileId: profile.id } }),
      ]);

      if (input.experiences.length > 0) {
        await transaction.experience.createMany({
          data: input.experiences.map((experience) => ({
            profileId: profile.id,
            title: experience.title,
            company: experience.company,
            description: experience.description || null,
            startDate: experience.startDate,
            endDate: experience.current ? null : experience.endDate || null,
            current: experience.current,
          })),
        });
      }

      if (input.educations.length > 0) {
        await transaction.education.createMany({
          data: input.educations.map((education) => ({
            profileId: profile.id,
            institution: education.institution,
            degree: education.degree,
            field: education.field || null,
            startDate: education.startDate,
            endDate: education.endDate || null,
          })),
        });
      }

      if (input.certifications.length > 0) {
        await transaction.certification.createMany({
          data: input.certifications.map((certification) => ({
            profileId: profile.id,
            name: certification.name,
            issuer: certification.issuer || null,
            date: certification.date || null,
          })),
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'candidate.profile.update',
          resource: 'candidate_profile',
          resourceId: profile.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            isPublic: input.isPublic,
            skills: skills.length,
            experiences: input.experiences.length,
            educations: input.educations.length,
            certifications: input.certifications.length,
          }),
        },
      });
    });

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: profileInclude,
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(serializeProfile(user));
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'The public profile identifier is already in use' },
        { status: 409 },
      );
    }

    console.error('Candidate profile PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to save candidate profile' },
      { status: 500 },
    );
  }
}
