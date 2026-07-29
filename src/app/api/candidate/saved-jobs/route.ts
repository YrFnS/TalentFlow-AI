// @ts-nocheck - Prisma result types are shaped for the candidate portal.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';
import { savedJobMutationSchema, validateInput } from '@/lib/validation/schemas';

async function getCandidateProfileId(userId: string) {
  const profile = await db.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id || null;
}

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const profileId = await getCandidateProfileId(auth.userId);
    if (!profileId) return NextResponse.json([]);

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (jobId) {
      const saved = await db.savedJob.findUnique({
        where: { candidateId_jobId: { candidateId: profileId, jobId } },
        select: { id: true },
      });
      return NextResponse.json({ saved: Boolean(saved) });
    }

    const savedJobs = await db.savedJob.findMany({
      where: { candidateId: profileId },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, logo: true, industry: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      savedJobs.map((savedJob) => ({
        id: savedJob.id,
        jobId: savedJob.jobId,
        title: savedJob.job?.title || '',
        company: savedJob.job?.company?.name || '',
        companyInitials: (savedJob.job?.company?.name || '')
          .split(' ')
          .map((part) => part[0])
          .join(''),
        location: savedJob.job?.location || '',
        workMode: savedJob.job?.isRemote ? 'remote' : 'onsite',
        salaryMin: savedJob.job?.salaryMin || 0,
        salaryMax: savedJob.job?.salaryMax || 0,
        salaryCurrency:
          savedJob.job?.salaryCurrency === 'USD'
            ? '$'
            : savedJob.job?.salaryCurrency || '$',
        savedDate: savedJob.createdAt,
        status: savedJob.job?.status,
        matchScore: 0,
      })),
    );
  } catch (error) {
    console.error('Candidate saved jobs GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(savedJobMutationSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const profileId = await getCandidateProfileId(auth.userId);
    if (!profileId) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 },
      );
    }

    const { jobId, action } = validation.data;
    if (action === 'remove') {
      await db.savedJob.deleteMany({
        where: { candidateId: profileId, jobId },
      });
      return NextResponse.json({ saved: false, message: 'Job removed from saved jobs' });
    }

    const job = await db.job.findFirst({
      where: { id: jobId, status: 'OPEN', publishedAt: { not: null } },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json(
        { error: 'Only open jobs can be saved' },
        { status: 404 },
      );
    }

    const savedJob = await db.savedJob.upsert({
      where: { candidateId_jobId: { candidateId: profileId, jobId } },
      update: {},
      create: { candidateId: profileId, jobId },
    });

    return NextResponse.json({ saved: true, savedJob }, { status: 201 });
  } catch (error) {
    console.error('Candidate saved jobs POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved job' },
      { status: 500 },
    );
  }
}
