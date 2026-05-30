import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// Simulated Stripe Checkout Session creation
export async function POST(req: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { planId, companyId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const effectiveCompanyId = companyId || auth.companyId;
    if (!effectiveCompanyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Find the plan
    let plan = await db.plan.findFirst({ where: { id: planId } });
    if (!plan) {
      // Check if it's a demo plan ID
      const demoPlans: Record<string, { name: string; type: string; price: number; currency: string; billingCycle: string; features: string; limits: string }> = {
        plan_free: {
          name: 'Free', type: 'FREE', price: 0, currency: 'USD', billingCycle: 'monthly',
          features: JSON.stringify(['1 Job Posting', '10 Applications', '5 AI Credits', 'Basic Support']),
          limits: JSON.stringify({ jobs: 1, applications: 10, aiCredits: 5 }),
        },
        plan_starter: {
          name: 'Starter', type: 'STARTER', price: 29, currency: 'USD', billingCycle: 'monthly',
          features: JSON.stringify(['5 Job Postings', '100 Applications', '50 AI Credits', 'Email Support', 'Custom Pipeline']),
          limits: JSON.stringify({ jobs: 5, applications: 100, aiCredits: 50 }),
        },
        plan_growth: {
          name: 'Growth', type: 'GROWTH', price: 79, currency: 'USD', billingCycle: 'monthly',
          features: JSON.stringify(['25 Job Postings', '500 Applications', '200 AI Credits', 'Priority Support', 'Custom Workflows', 'Analytics Dashboard']),
          limits: JSON.stringify({ jobs: 25, applications: 500, aiCredits: 200 }),
        },
        plan_enterprise: {
          name: 'Enterprise', type: 'ENTERPRISE', price: 199, currency: 'USD', billingCycle: 'monthly',
          features: JSON.stringify(['Unlimited Jobs', 'Unlimited Applications', '1000 AI Credits', 'Priority Support', 'SSO Integration', 'Custom Integrations', 'SLA Guarantee']),
          limits: JSON.stringify({ jobs: -1, applications: -1, aiCredits: 1000 }),
        },
      };

      const demoPlan = demoPlans[planId];
      if (!demoPlan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Create the plan in DB
      plan = await db.plan.create({
        data: {
          id: planId,
          ...demoPlan,
          stripePriceId: `price_${planId.replace('plan_', '')}_monthly`,
          isActive: true,
        },
      });
    }

    // Create a simulated checkout session
    const sessionId = `cs_sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Store the session info in the company's stripeCustomerId if needed
    // For simulation, we'll just return the session info
    return NextResponse.json({
      sessionId,
      url: `/company/billing?checkout_session=${sessionId}&planId=${planId}`,
      plan: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
