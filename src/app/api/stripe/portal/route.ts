import { NextResponse } from 'next/server';
import { requireCompanyAdmin } from '@/lib/auth-guard';

export async function POST() {
  const auth = await requireCompanyAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(
    {
      error: 'Stripe billing portal is not configured',
      message:
        'The previous simulated portal has been removed. Configure Stripe Customer Portal before enabling this action.',
    },
    { status: 503 },
  );
}
