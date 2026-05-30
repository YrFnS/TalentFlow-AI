import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// Get current subscription details with plan info
export async function GET() {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = auth.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

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
        plan: null,
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
        where: {
          userId: {
            in: (await db.companyMember.findMany({
              where: { companyId },
              select: { userId: true },
            })).map((m) => m.userId),
          },
        },
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
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        usage,
      },
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        type: subscription.plan.type,
        price: subscription.plan.price,
        features: subscription.plan.features,
        limits: subscription.plan.limits,
      },
      invoices: subscription.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        date: inv.paidAt || inv.createdAt,
        pdfUrl: inv.pdfUrl || inv.invoicePdf,
        hostedInvoiceUrl: inv.hostedInvoiceUrl,
      })),
      paymentMethod: subscription.stripeSubscriptionId ? {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2027,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
