import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// Simulated Stripe Billing Portal session
export async function POST(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Create a simulated billing portal session
    const sessionId = `bps_sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Get subscription details for the portal
    const subscription = await db.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    return NextResponse.json({
      sessionId,
      url: `/company/billing?portal_session=${sessionId}`,
      subscription: subscription ? {
        id: subscription.id,
        planName: subscription.plan.name,
        planType: subscription.plan.type,
        status: subscription.status,
        price: subscription.plan.price,
        currentPeriodEnd: subscription.currentPeriodEnd || subscription.endDate,
      } : null,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
