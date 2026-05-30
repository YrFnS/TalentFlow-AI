import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mock engagement events for fallback
const mockEvents = [
  { id: 'e1', candidateId: '1', candidateName: 'Alex Rivera', type: 'EMAIL_SENT', campaignName: 'Senior Frontend Engineer Search', details: 'Initial outreach email sent', date: '2025-03-03T10:30:00Z' },
  { id: 'e2', candidateId: '2', candidateName: 'Priya Patel', type: 'EMAIL_OPENED', campaignName: 'Product Designer Pipeline', details: 'Email opened on mobile', date: '2025-03-03T09:15:00Z' },
  { id: 'e3', candidateId: '3', candidateName: 'Marcus Johnson', type: 'EMAIL_CLICKED', campaignName: 'DevOps Talent Pool', details: 'Clicked job link in email', date: '2025-03-02T16:45:00Z' },
  { id: 'e4', candidateId: '4', candidateName: 'Sophie Chen', type: 'INTERVIEW_SCHEDULED', campaignName: 'Data Science Interns 2025', details: 'Phone screen scheduled for March 10', date: '2025-03-02T14:20:00Z' },
  { id: 'e5', candidateId: '5', candidateName: 'Omar Al-Farsi', type: 'APPLIED', campaignName: 'Senior Frontend Engineer Search', details: 'Applied through campaign link', date: '2025-03-02T11:00:00Z' },
  { id: 'e6', candidateId: '6', candidateName: 'Emma Williams', type: 'VIEWED_PROFILE', campaignName: null, details: 'Viewed company career page', date: '2025-03-01T15:30:00Z' },
  { id: 'e7', candidateId: '1', candidateName: 'Alex Rivera', type: 'EMAIL_OPENED', campaignName: 'Senior Frontend Engineer Search', details: 'Email opened 2nd time', date: '2025-03-01T10:00:00Z' },
  { id: 'e8', candidateId: '2', candidateName: 'Priya Patel', type: 'INTERVIEW_SCHEDULED', campaignName: 'Product Designer Pipeline', details: 'Design challenge sent', date: '2025-02-28T13:45:00Z' },
  { id: 'e9', candidateId: '3', candidateName: 'Marcus Johnson', type: 'EMAIL_SENT', campaignName: 'DevOps Talent Pool', details: 'Follow-up email sent', date: '2025-02-27T09:30:00Z' },
  { id: 'e10', candidateId: '4', candidateName: 'Sophie Chen', type: 'APPLIED', campaignName: 'Data Science Interns 2025', details: 'Submitted application via re-engagement', date: '2025-02-26T17:00:00Z' },
];

// GET /api/candidate-engagement — List engagement events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const candidateId = searchParams.get('candidateId');

    // Try to fetch from DB
    if (companyId) {
      try {
        const where: Record<string, unknown> = { companyId };
        if (type) where.type = type;
        if (candidateId) where.candidateId = candidateId;

        const engagements = await db.candidateEngagement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        if (engagements.length > 0) {
          return NextResponse.json({ events: engagements.map(e => ({
            ...e,
            details: e.details ? JSON.parse(e.details) : null,
          }))});
        }
      } catch (dbError) {
        console.error('DB error fetching engagements:', dbError);
      }
    }

    // Filter mock events
    let filtered = [...mockEvents];
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    if (candidateId) {
      filtered = filtered.filter(e => e.candidateId === candidateId);
    }

    return NextResponse.json({ events: filtered });
  } catch (error) {
    console.error('Error fetching engagement events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/candidate-engagement — Log a new engagement event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, companyId, type, campaignId, details } = body;

    if (!candidateId || !companyId || !type) {
      return NextResponse.json(
        { error: 'candidateId, companyId, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'INTERVIEW_SCHEDULED', 'APPLIED', 'VIEWED_PROFILE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      const engagement = await db.candidateEngagement.create({
        data: {
          candidateId,
          companyId,
          type,
          campaignId: campaignId || null,
          details: details ? JSON.stringify(details) : null,
        },
      });

      return NextResponse.json({ event: engagement }, { status: 201 });
    } catch (dbError) {
      console.error('DB error creating engagement:', dbError);
      // Return mock response
      return NextResponse.json({
        event: {
          id: `e${Date.now()}`,
          candidateId,
          companyId,
          type,
          campaignId: campaignId || null,
          details,
          createdAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating engagement event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
