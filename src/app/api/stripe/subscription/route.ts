// @ts-nocheck - Legacy read-only subscription response.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember, resolveCompanyId } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });

    if (!subscription) {
      return NextResponse.json({
        billingEnabled: false,
        subscription: null,
        plan: null,
        invoices: [],
        paymentMethod: null,
      });
    }

    const limits = subscription.plan.limits
      ? JSON.parse(subscription.plan.limits)
      : {};
    const memberIds = (
      await db.companyMember.findMany({
        where: { companyId },
        select: { userId: true },
      })
    ).map((member) => member.userId);

    const [jobs, applications, aiRequests] = await Promise.all([
      db.job.count({ where: { companyId, status: { not: 'ARCHIVED' } } }),
      db.application.count({ where: { job: { companyId } } }),
      memberIds.length
        ? db.aIUsageLog.count({ where: { userId: { in: memberIds } } })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({
      billingEnabled: false,
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
        usage: {
          jobs: { current: jobs, limit: limits.jobs ?? null },
          applications: {
            current: applications,
            limit: limits.applications ?? null,
          },
          aiCredits: { current: aiRequests, limit: limits.aiCredits ?? null },
        },
      },
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        type: subscription.plan.type,
        price: subscription.plan.price,
        features: subscription.plan.features,
        limits: subscription.plan.limits,
      },
      invoices: subscription.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        date: invoice.paidAt || invoice.createdAt,
        pdfUrl: invoice.invoicePdf || invoice.pdfUrl,
        hostedInvoiceUrl: invoice.hostedInvoiceUrl,
      })),
      paymentMethod: null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 },
    );
  }
}
