import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Real DB lookup
    const subscription = await db.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        invoices: [],
        paymentMethod: null,
      });
    }

    const limits = subscription.plan.limits
      ? JSON.parse(subscription.plan.limits)
      : { jobs: 10, applications: 100, aiCredits: 50 };

    // Real usage counts from DB
    const [jobCount, applicationCount, aiUsageCount] = await Promise.all([
      db.job.count({ where: { companyId } }),
      db.application.count({
        where: { job: { companyId } },
      }),
      db.aIUsageLog.count({
        where: { userId: { in: (await db.companyMember.findMany({ where: { companyId }, select: { userId: true } })).map(m => m.userId) } },
      }),
    ]);

    const usage = {
      jobs: { current: jobCount, limit: limits.jobs || 10 },
      applications: { current: applicationCount, limit: limits.applications || 100 },
      aiCredits: { current: aiUsageCount, limit: limits.aiCredits || 50 },
    };

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: subscription.plan.name,
        planType: subscription.plan.type,
        status: subscription.status,
        billingCycle: subscription.plan.billingCycle,
        price: subscription.plan.price,
        currency: subscription.plan.currency,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
        usage,
      },
      invoices: subscription.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        date: inv.paidAt || inv.createdAt,
        pdfUrl: inv.pdfUrl,
      })),
      paymentMethod: null, // No PaymentMethod model exists yet
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { planId } = body;
    const companyId = auth.companyId;

    if (!companyId || !planId) {
      return NextResponse.json({ error: 'companyId and planId are required' }, { status: 400 });
    }

    // Check if subscription exists
    const existing = await db.subscription.findUnique({
      where: { companyId },
    });

    if (existing) {
      // Update the subscription plan
      const updated = await db.subscription.update({
        where: { companyId },
        data: {
          planId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
      return NextResponse.json({ subscription: updated, message: 'Plan updated successfully' });
    } else {
      // Create new subscription
      const created = await db.subscription.create({
        data: {
          companyId,
          planId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
      return NextResponse.json({ subscription: created, message: 'Subscription created successfully' });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
