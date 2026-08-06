import { NextResponse } from 'next/server';

/**
 * The previous endpoint accepted simulated browser events and could mutate paid
 * subscriptions without a verified Stripe event. It is intentionally closed
 * until the Stripe SDK, signing secret, event-id idempotency, and production
 * checkout flow are implemented together.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Stripe webhook processing is not enabled',
      message:
        'Configure and verify a production Stripe webhook integration before enabling this endpoint.',
    },
    { status: 503 },
  );
}
