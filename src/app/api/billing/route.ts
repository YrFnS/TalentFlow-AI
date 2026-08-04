// @ts-nocheck - Prisma aggregates are normalized for the billing response.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyAdmin,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';

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

    const memberIds = (
      await db.companyMember.findMany({
        where: { companyId },
        select: { userId: true },
      })
    ).map((member) => member.userId);

    const [jobCount, applicationCount, aiUsageCount] = await Promise.all([
      db.job.count({ where: { companyId, status: { not: 'ARCHIVED' } } }),
      db.application.count({ where: { job: { companyId } } }),
      memberIds.length > 0
        ? db.aIUsageLog.count({ where: { userId: { in: memberIds } } })
        : Promise.resolve(0),
    ]);

    if (!subscription) {
      return NextResponse.json({
        billingEnabled: false,
        subscription: null,
        usage: {
          jobs: { current: jobCount, limit: null },
          applications: { current: applicationCount, limit: null },
          aiCredits: { current: aiUsageCount, limit: null },
        },
        invoices: [],
        paymentMethod: null,
      });
    }

    const limits = subscription.plan.limits
      ? JSON.parse(subscription.plan.limits)
      : {};

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
        usage: {
          jobs: { current: jobCount, limit: limits.jobs ?? null },
          applications: {
            current: applicationCount,
            limit: limits.applications ?? null,
          },
          aiCredits: {
            current: aiUsageCount,
            limit: limits.aiCredits ?? null,
          },
        },
      },
      invoices: subscription.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        date: invoice.paidAt || invoice.createdAt,
        pdfUrl: invoice.invoicePdf || invoice.pdfUrl,
        hostedUrl: invoice.hostedInvoiceUrl,
      })),
      paymentMethod: null,
    });
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 },
    );
  }
}

export async function POST() {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(
    {
      error: 'Online billing is not enabled',
      message:
        'Subscription changes are disabled until a verified Stripe checkout integration is configured.',
    },
    { status: 503 },
  );
}
