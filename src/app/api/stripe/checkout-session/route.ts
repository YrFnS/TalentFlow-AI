import { NextResponse } from 'next/server';
import { requireCompanyAdmin } from '@/lib/auth-guard';

export async function POST() {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(
    {
      error: 'Stripe checkout is not configured',
      message:
        'The previous simulated checkout has been removed. Configure a real Stripe checkout session before enabling subscription changes.',
    },
    { status: 503 },
  );
}
