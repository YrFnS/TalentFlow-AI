import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const requests = await db.gDPRRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user data separately since GDPRRequest has no user relation
    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = userIds.length > 0 ? await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }) : [];

    const formattedRequests = requests.map((r) => {
      const user = users.find((u) => u.id === r.userId);
      return {
        id: r.id,
        userId: r.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        type: r.type.toLowerCase() as 'export' | 'deletion' | 'correction',
        status: r.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'rejected',
        requestedDate: new Date(r.createdAt).toISOString().slice(0, 10),
        completedDate: r.completedAt ? new Date(r.completedAt).toISOString().slice(0, 10) : null,
      };
    });

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching GDPR requests:', error);
    return NextResponse.json({ requests: [] });
  }
}
