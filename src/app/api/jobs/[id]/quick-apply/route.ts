import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateInput, quickApplySchema } from '@/lib/validation/schemas';

// Simple in-memory rate limiter for quick-apply (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 applications per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60_000; // 1 hour

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  // Fallback: User-Agent fingerprint to avoid shared 'unknown' bucket
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  if (ua || lang) {
    let hash = 0;
    const str = `${ua}:${lang}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `anon-${Math.abs(hash).toString(36)}`;
  }
  return 'anon-no-headers';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000); // Clean up every 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many applications submitted. Please try again later.' },
        { status: 429 }
      );
    }

    const { id } = await params;

    // Check if job exists and is open
    const job = await db.job.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();

    // Honeypot check: if the hidden 'website' field is filled, it's a bot
    const honeypot = formData.get('website');
    if (honeypot && (honeypot as string).trim().length > 0) {
      // Silently reject but return a success-like response to not alert bots
      return NextResponse.json({
        message: 'Application submitted successfully',
        applicationId: `bot_rejected_${Date.now()}`,
      }, { status: 201 });
    }

    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const resume = formData.get('resume') as File | null;

    // Zod schema validation for text fields
    const validation = validateInput(quickApplySchema, { name, email, phone, website: '' });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Handle resume upload
    let resumeUrl: string | null = null;
    if (resume && resume.size > 0) {
      const bytes = await resume.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {}

      const filename = `${Date.now()}-${resume.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);
      resumeUrl = `/uploads/resumes/${filename}`;
    }

    // Find or create user by email
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name,
          role: 'CANDIDATE',
          isActive: true,
          locale: 'en',
        },
      });

      // Create candidate profile
      await db.candidateProfile.create({
        data: {
          userId: user.id,
          phone: phone || null,
          resumeUrl,
          currentTitle: null,
          skills: null,
          experienceYears: null,
          location: null,
        },
      });
    }

    // Get candidate profile
    const candidateProfile = await db.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidateProfile) {
      return NextResponse.json({ error: 'Failed to create candidate profile' }, { status: 500 });
    }

    // Check if already applied
    const existingApp = await db.application.findUnique({
      where: { jobId_candidateId: { jobId: id, candidateId: candidateProfile.id } },
    });

    if (existingApp) {
      return NextResponse.json({ error: 'You have already applied for this job', applicationId: existingApp.id }, { status: 409 });
    }

    // Get the first pipeline stage
    const firstStage = job.company.stages[0];

    // Create the application
    const application = await db.application.create({
      data: {
        jobId: id,
        candidateId: candidateProfile.id,
        source: 'quick_apply',
        currentStageId: firstStage?.id || null,
      },
    });

    // Create the first application stage entry
    if (firstStage) {
      await db.applicationStage.create({
        data: {
          applicationId: application.id,
          stageId: firstStage.id,
        },
      });
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      applicationId: application.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Quick apply error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
