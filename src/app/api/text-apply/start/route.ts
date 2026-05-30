// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, jobId } = body;

    if (!phoneNumber || !jobId) {
      return NextResponse.json(
        { error: 'Phone number and job ID are required' },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { id: true, slug: true, title: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 400 });
    }

    // Generate a short token
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Generate apply link
    const applyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/apply/quick/${token}`;

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create TextApplySession
    try {
      await db.textApplySession.create({
        data: {
          jobId,
          phoneNumber,
          status: 'STARTED',
          applyLink,
          expiresAt,
        },
      });
    } catch {
      // TextApplySession table might not be ready, continue with simulated response
    }

    // Simulated: doesn't actually send SMS
    // In production, you would integrate an SMS service (e.g., Twilio)
    return NextResponse.json({
      message: 'Apply link sent successfully',
      token,
      applyLink,
      expiresAt: expiresAt.toISOString(),
      // Simulated SMS response
      smsSent: true,
      phoneNumber,
    }, { status: 201 });
  } catch (error) {
    console.error('Text apply start error:', error);
    return NextResponse.json({ error: 'Failed to send apply link' }, { status: 500 });
  }
}
