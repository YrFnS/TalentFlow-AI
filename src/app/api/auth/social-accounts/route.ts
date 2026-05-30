import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// GET /api/auth/social-accounts — list user's connected social accounts
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;

    const accounts = await db.account.findMany({
      where: {
        userId,
        provider: { in: ['google', 'linkedin'] },
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch social accounts' }, { status: 500 });
  }
}

// DELETE /api/auth/social-accounts?accountId=xxx — unlink a social account
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Verify the account belongs to the user
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId,
        provider: { in: ['google', 'linkedin'] },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found or does not belong to this user' }, { status: 404 });
    }

    // Check if the user has at least one other way to sign in
    // (another OAuth account or a password)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    const otherAccounts = await db.account.findMany({
      where: {
        userId,
        id: { not: accountId },
      },
    });

    if (!user?.password && otherAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Cannot unlink the last account. You must have at least one way to sign in.' },
        { status: 400 }
      );
    }

    // Delete the account
    await db.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ message: 'Account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking social account:', error);
    return NextResponse.json({ error: 'Failed to unlink social account' }, { status: 500 });
  }
}
