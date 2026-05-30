import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCandidate } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const userId = auth.userId;

    let profileId = candidateId;

    if (!profileId && userId) {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      profileId = profile?.id;
    }

    if (!profileId) {
      const firstCandidate = await db.candidateProfile.findFirst({
        select: { id: true },
      });
      profileId = firstCandidate?.id;
    }

    if (!profileId) {
      return NextResponse.json([]);
    }

    const savedJobs = await db.savedJob.findMany({
      where: { candidateId: profileId },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logo: true, industry: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      savedJobs.map((sj: any) => ({
        id: sj.id,
        jobId: sj.jobId,
        title: sj.job?.title || '',
        company: sj.job?.company?.name || '',
        companyInitials: (sj.job?.company?.name || '').split(' ').map((n: string) => n[0]).join(''),
        location: sj.job?.location || '',
        workMode: sj.job?.isRemote ? 'remote' : 'onsite',
        salaryMin: sj.job?.salaryMin || 0,
        salaryMax: sj.job?.salaryMax || 0,
        salaryCurrency: sj.job?.salaryCurrency === 'USD' ? '$' : sj.job?.salaryCurrency || '$',
        savedDate: sj.createdAt,
        matchScore: 0,
      }))
    );
  } catch (error) {
    console.error('Candidate saved jobs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { candidateId, jobId, action } = body;
    const userId = auth.userId;

    let profileId = candidateId;
    if (!profileId && userId) {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      profileId = profile?.id;
    }

    if (!profileId || !jobId) {
      return NextResponse.json({ error: 'candidateId and jobId are required' }, { status: 400 });
    }

    if (action === 'remove') {
      await db.savedJob.deleteMany({
        where: { candidateId: profileId, jobId },
      });
      return NextResponse.json({ message: 'Job unsaved' });
    }

    const savedJob = await db.savedJob.create({
      data: { candidateId: profileId, jobId },
    });

    return NextResponse.json({ savedJob }, { status: 201 });
  } catch (error) {
    console.error('Candidate saved jobs POST error:', error);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}
