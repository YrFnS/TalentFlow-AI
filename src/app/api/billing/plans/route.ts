import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (plans.length === 0) {
      // Return default plans for demo
      return NextResponse.json({
        plans: [
          {
            id: 'plan_free',
            name: 'Free',
            type: 'FREE',
            price: 0,
            currency: 'USD',
            billingCycle: 'monthly',
            features: JSON.stringify(['5 Active Jobs', '50 Applications/month', 'Basic AI Screening', 'Email Support', 'Single User']),
            limits: JSON.stringify({ jobs: 5, applications: 50, aiCredits: 20 }),
            isActive: true,
            subscriberCount: 120,
          },
          {
            id: 'plan_starter',
            name: 'Starter',
            type: 'STARTER',
            price: 19,
            currency: 'USD',
            billingCycle: 'monthly',
            features: JSON.stringify(['15 Active Jobs', '200 Applications/month', 'Advanced AI Matching', 'Priority Support', 'Up to 3 Team Members', 'Custom Pipeline']),
            limits: JSON.stringify({ jobs: 15, applications: 200, aiCredits: 50 }),
            isActive: true,
            subscriberCount: 85,
          },
          {
            id: 'plan_growth',
            name: 'Growth',
            type: 'GROWTH',
            price: 49,
            currency: 'USD',
            billingCycle: 'monthly',
            features: JSON.stringify(['Unlimited Jobs', 'Unlimited Applications', 'Advanced AI Matching', 'Priority Support', 'Up to 10 Team Members', 'Interview Scheduling', 'Custom Pipeline', 'Analytics Dashboard']),
            limits: JSON.stringify({ jobs: 50, applications: 500, aiCredits: 100 }),
            isActive: true,
            subscriberCount: 64,
          },
          {
            id: 'plan_enterprise',
            name: 'Enterprise',
            type: 'ENTERPRISE',
            price: 149,
            currency: 'USD',
            billingCycle: 'monthly',
            features: JSON.stringify(['Everything in Growth', 'Unlimited Team Members', 'Custom AI Models', 'Dedicated Support', 'API Access', 'SSO Integration', 'Custom Integrations', 'SLA Guarantee']),
            limits: JSON.stringify({ jobs: -1, applications: -1, aiCredits: -1 }),
            isActive: true,
            subscriberCount: 28,
          },
        ],
      });
    }

    return NextResponse.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features,
        limits: plan.limits,
        isActive: plan.isActive,
        subscriberCount: plan._count.subscriptions,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
