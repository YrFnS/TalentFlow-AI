// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;

    const campaigns = await db.bulkEmailCampaign.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        recipients: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        status: c.status.toLowerCase(),
        body: c.body,
        templateId: c.templateId,
        recipients: c.recipients.map((r) => ({
          id: r.id,
          name: '',
          email: '',
          job: '',
          status: '',
          stage: '',
          emailStatus: r.status,
        })),
        sent: c.sentCount,
        opened: c.openedCount,
        clicked: c.clickedCount,
        bounced: c.bouncedCount,
        scheduledAt: c.scheduledAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString().split('T')[0],
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, subject, body: emailBody, templateId, recipientIds, scheduleDate } = body;
    const companyId = auth.companyId;

    if (!name || !subject || !emailBody || !companyId) {
      return NextResponse.json(
        { error: 'Campaign name, subject, body, and companyId are required' },
        { status: 400 }
      );
    }

    const recipientCount = recipientIds?.length || 0;

    const newCampaign = await db.bulkEmailCampaign.create({
      data: {
        companyId,
        name,
        subject,
        body: emailBody,
        templateId: templateId || null,
        status: scheduleDate ? 'SCHEDULED' : 'DRAFT',
        recipientCount,
        scheduledAt: scheduleDate ? new Date(scheduleDate) : null,
      },
    });

    // Create recipient records if recipient IDs provided
    if (recipientIds?.length) {
      await db.bulkEmailRecipient.createMany({
        data: recipientIds.map((candidateId: string) => ({
          campaignId: newCampaign.id,
          candidateId,
          status: 'pending',
        })),
      });
    }

    // Fetch with recipients for response
    const campaignWithRecipients = await db.bulkEmailCampaign.findUnique({
      where: { id: newCampaign.id },
      include: { recipients: true },
    });

    const campaignResponse = {
      id: newCampaign.id,
      name: newCampaign.name,
      subject: newCampaign.subject,
      status: newCampaign.status.toLowerCase(),
      body: newCampaign.body,
      templateId: newCampaign.templateId,
      recipients: campaignWithRecipients?.recipients.map((r) => ({
        id: r.id,
        name: '',
        email: '',
        job: '',
        status: '',
        stage: '',
        emailStatus: r.status,
      })) || [],
      sent: newCampaign.sentCount,
      opened: newCampaign.openedCount,
      clicked: newCampaign.clickedCount,
      bounced: newCampaign.bouncedCount,
      scheduledAt: newCampaign.scheduledAt?.toISOString() || null,
      createdAt: newCampaign.createdAt.toISOString().split('T')[0],
    };

    return NextResponse.json({ campaign: campaignResponse }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
