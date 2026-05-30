import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const [totalLogs, aiProviders, recentLogs] = await Promise.all([
      db.aIUsageLog.count(),
      db.aIProvider.findMany({
        where: { isActive: true },
        include: { models: true },
      }),
      db.aIUsageLog.findMany({
        take: 14,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate totals from actual logs
    const allLogs = await db.aIUsageLog.findMany({
      select: { inputTokens: true, outputTokens: true, feature: true, userId: true, success: true, createdAt: true },
    });

    const totalInputTokens = allLogs.reduce((sum, l) => sum + l.inputTokens, 0);
    const totalOutputTokens = allLogs.reduce((sum, l) => sum + l.outputTokens, 0);
    // Rough cost estimate: $0.005 per 1K input tokens, $0.015 per 1K output tokens
    const estimatedCost = (totalInputTokens / 1000) * 0.005 + (totalOutputTokens / 1000) * 0.015;

    // Group by feature
    const featureMap: Record<string, number> = {};
    allLogs.forEach((l) => {
      featureMap[l.feature] = (featureMap[l.feature] || 0) + 1;
    });
    const featureUsage = Object.entries(featureMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        percentage: allLogs.length > 0 ? Math.round((count / allLogs.length) * 100) : 0,
        count,
      }));

    // Group by user
    const userMap: Record<string, { name: string; email: string; calls: number; lastActiveAt: Date | null }> = {};
    allLogs.forEach((l) => {
      if (!userMap[l.userId]) {
        userMap[l.userId] = { name: l.userId, email: '', calls: 0, lastActiveAt: null };
      }
      userMap[l.userId].calls++;
      if (!userMap[l.userId].lastActiveAt || new Date(l.createdAt) > new Date(userMap[l.userId].lastActiveAt!)) {
        userMap[l.userId].lastActiveAt = new Date(l.createdAt);
      }
    });

    // Get top users with names - fetch user data separately since AIUsageLog has no user relation
    const topUserIds = Object.entries(userMap)
      .sort((a, b) => b[1].calls - a[1].calls)
      .slice(0, 5)
      .map(([id]) => id);

    const topUsersData = topUserIds.length > 0 ? await db.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, email: true },
    }) : [];

    const topUsers = topUserIds.map((id) => {
      const userData = topUsersData.find((u) => u.id === id);
      const calls = userMap[id]?.calls || 0;
      const lastActiveAt = userMap[id]?.lastActiveAt;
      return {
        name: userData?.name || 'Unknown',
        email: userData?.email || '',
        calls,
        cost: `$${((calls / Math.max(totalLogs, 1)) * estimatedCost).toFixed(2)}`,
        lastActive: lastActiveAt ? new Date(lastActiveAt).toISOString() : '',
      };
    });

    // API keys from providers - aggregate usage from aIUsageLog by matching model to provider
    const providerUsageMap: Record<string, { calls: number; cost: number }> = {};

    // Get all logs with modelId to map to providers
    const logsByModel = await db.aIUsageLog.groupBy({
      by: ['modelId'],
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true },
    });

    // Build a map from modelId to providerId
    const allModels = await db.aIModel.findMany({
      select: { id: true, providerId: true },
    });
    const modelToProvider: Record<string, string> = {};
    allModels.forEach((m) => {
      modelToProvider[m.id] = m.providerId;
    });

    logsByModel.forEach((l) => {
      const providerId = modelToProvider[l.modelId];
      if (providerId) {
        if (!providerUsageMap[providerId]) {
          providerUsageMap[providerId] = { calls: 0, cost: 0 };
        }
        providerUsageMap[providerId].calls += l._count.id;
        const inputCost = (l._sum.inputTokens || 0) / 1000 * 0.005;
        const outputCost = (l._sum.outputTokens || 0) / 1000 * 0.015;
        providerUsageMap[providerId].cost += inputCost + outputCost;
      }
    });

    const apiKeys = aiProviders.map((p) => {
      const usage = providerUsageMap[p.id] || { calls: 0, cost: 0 };
      return {
        name: `${p.apiKey.slice(0, 10)}...${p.apiKey.slice(-4)}`,
        provider: p.name,
        calls: usage.calls,
        cost: `$${usage.cost.toFixed(2)}`,
        status: p.isActive ? 'active' : 'expired',
      };
    });

    // Daily costs (last 14 days)
    const dailyCosts: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogs = allLogs.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= dayStart && d < dayEnd;
      });
      const dayInput = dayLogs.reduce((s, l) => s + l.inputTokens, 0);
      const dayOutput = dayLogs.reduce((s, l) => s + l.outputTokens, 0);
      dailyCosts.push(parseFloat(((dayInput / 1000) * 0.005 + (dayOutput / 1000) * 0.015).toFixed(2)));
    }

    const activeKeys = apiKeys.filter((k) => k.status === 'active').length;

    return NextResponse.json({
      totalCost: `$${estimatedCost.toFixed(2)}`,
      totalCalls: totalLogs,
      avgCostPerCall: totalLogs > 0 ? `$${(estimatedCost / totalLogs).toFixed(3)}` : '$0.000',
      activeKeys,
      dailyCosts,
      featureUsage,
      topUsers,
      apiKeys,
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json({
      totalCost: '$0.00',
      totalCalls: 0,
      avgCostPerCall: '$0.000',
      activeKeys: 0,
      dailyCosts: [],
      featureUsage: [],
      topUsers: [],
      apiKeys: [],
    });
  }
}
