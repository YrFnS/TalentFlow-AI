// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Check campaign exists
    const campaign = await db.bulkEmailCampaign.findUnique({
      where: { id: campaignId },
      include: { recipients: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update campaign status to SENT and set sentAt
    await db.bulkEmailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: campaign.recipients.length,
      },
    });

    // Update all recipient records status to 'sent'
    await db.bulkEmailRecipient.updateMany({
      where: { campaignId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign ${campaignId} sent successfully`,
      campaignId,
      sentAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
