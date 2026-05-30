import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, code } = body;

    if (!token && !code) {
      return NextResponse.json(
        { error: 'Token or code is required' },
        { status: 400 }
      );
    }

    // Try to find a TextApplySession
    let session = null;

    try {
      // Search by token/code matching applyLink
      const sessions = await db.textApplySession.findMany({
        where: {
          status: 'STARTED',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Find matching session
      session = sessions.find((s) => s.applyLink.includes(token || code || ''));
    } catch {
      // TextApplySession table might not be ready
    }

    if (session) {
      // Get job details
      const job = await db.job.findUnique({
        where: { id: session.jobId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              industry: true,
              location: true,
            },
          },
        },
      });

      if (job) {
        // Update session status
        try {
          await db.textApplySession.update({
            where: { id: session.id },
            data: { status: 'LINK_SENT' },
          });
        } catch {}

        return NextResponse.json({
          verified: true,
          job: {
            id: job.id,
            title: job.title,
            slug: job.slug,
            description: job.description,
            jobType: job.jobType,
            status: job.status,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            location: job.location,
            isRemote: job.isRemote,
            company: job.company,
          },
          prefill: {
            phone: session.phoneNumber,
          },
        });
      }
    }

    // No valid session found - return verification status
    // For demo purposes, return a partial success so the UI can show something
    return NextResponse.json({
      verified: false,
      message: 'Session not found or expired. You can still apply directly.',
    });
  } catch (error) {
    console.error('Text apply verify error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
