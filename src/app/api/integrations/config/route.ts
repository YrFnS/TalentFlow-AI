import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mock integration config
const defaultConfig = {
  slack: {
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
    defaultChannel: '#hiring',
    connected: true,
    events: {
      applicationCreated: true,
      interviewScheduled: true,
      offerSent: true,
      offerAccepted: true,
      offerDeclined: false,
      candidateRejected: false,
      stageChanged: true,
      assessmentCompleted: true,
    },
  },
  teams: {
    enabled: false,
    webhookUrl: '',
    defaultChannel: '',
    connected: false,
    events: {
      applicationCreated: false,
      interviewScheduled: false,
      offerSent: false,
      offerAccepted: false,
      offerDeclined: false,
      candidateRejected: false,
      stageChanged: false,
      assessmentCompleted: false,
    },
  },
};

export async function GET() {
  try {
    // Try to fetch from database
    const settings = await db.companySettings?.findFirst?.();
    if (settings?.integrations) {
      return NextResponse.json({ config: JSON.parse(settings.integrations as string) });
    }
  } catch {
    // Table may not exist, use mock
  }
  return NextResponse.json({ config: defaultConfig });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedConfig = { ...defaultConfig, ...body };

    // In production, save to database
    // await db.companySettings.upsert({ ... })

    return NextResponse.json({ config: updatedConfig });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
