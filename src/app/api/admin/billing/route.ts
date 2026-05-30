import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const [subscriptions, invoices] = await Promise.all([
      db.subscription.findMany({
        include: {
          company: { select: { name: true } },
          plan: { select: { name: true, type: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.invoice.findMany({
        include: {
          subscription: {
            include: {
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Calculate revenue data
    const totalRevenue = subscriptions.reduce((sum, sub) => {
      return sum + (sub.plan?.price || 0);
    }, 0);

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
    const monthlyRevenue = subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, sub) => sum + (sub.plan?.price || 0), 0);

    // Calculate MRR growth: compare this month's paid invoices vs last month's
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthPaidInvoices, lastMonthPaidInvoices] = await Promise.all([
      db.invoice.findMany({
        where: {
          status: 'PAID',
          paidAt: { gte: thisMonthStart },
        },
        select: { amount: true },
      }),
      db.invoice.findMany({
        where: {
          status: 'PAID',
          paidAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
        select: { amount: true },
      }),
    ]);

    const thisMonthMRR = thisMonthPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const lastMonthMRR = lastMonthPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    let mrrGrowth = '+0%';
    if (lastMonthMRR > 0) {
      const growthPercent = ((thisMonthMRR - lastMonthMRR) / lastMonthMRR) * 100;
      mrrGrowth = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`;
    } else if (thisMonthMRR > 0) {
      mrrGrowth = '+100%';
    }

    // Revenue by month (last 6 months)
    const revenueData: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthInvoices = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d >= monthStart && d < monthEnd && inv.status === 'PAID';
      });
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      revenueData.push({
        month: monthStart.toLocaleString('en', { month: 'short' }),
        revenue: monthRevenue,
      });
    }

    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      companyName: sub.company?.name || 'Unknown',
      planName: sub.plan?.name || 'Unknown',
      planType: sub.plan?.type || 'UNKNOWN',
      status: sub.status,
      startDate: sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : '—',
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : null,
      revenue: sub.plan?.price || 0,
    }));

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      companyName: inv.subscription?.company?.name || 'Unknown',
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      date: inv.createdAt ? new Date(inv.createdAt).toISOString().slice(0, 10) : '—',
      pdfUrl: inv.pdfUrl,
    }));

    // Plan distribution
    const planDistribution: { type: string; name: string; count: number; revenue: number; color: string }[] = [];
    const planGroups: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const sub of subscriptions) {
      const planType = sub.plan?.type || 'UNKNOWN';
      if (!planGroups[planType]) {
        planGroups[planType] = { name: sub.plan?.name || planType, count: 0, revenue: 0 };
      }
      planGroups[planType].count++;
      if (sub.status === 'ACTIVE') {
        planGroups[planType].revenue += sub.plan?.price || 0;
      }
    }
    const planColors: Record<string, string> = {
      FREE: '#9ca3af',
      STARTER: '#14b8a6',
      GROWTH: '#10b981',
      ENTERPRISE: '#0d9488',
    };
    for (const [type, data] of Object.entries(planGroups)) {
      planDistribution.push({ type, name: data.name, count: data.count, revenue: data.revenue, color: planColors[type] || '#14b8a6' });
    }

    return NextResponse.json({
      monthlyRevenue,
      mrr: monthlyRevenue,
      activeSubscriptions: activeSubs,
      totalSubscriptions: subscriptions.length,
      churnRate: subscriptions.length > 0
        ? `${((subscriptions.filter((s) => s.status === 'CANCELED').length / subscriptions.length) * 100).toFixed(1)}%`
        : '0%',
      mrrGrowth,
      revenueData,
      planDistribution,
      subscriptions: formattedSubscriptions,
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({
      monthlyRevenue: 0,
      mrr: 0,
      activeSubscriptions: 0,
      totalSubscriptions: 0,
      churnRate: '0%',
      mrrGrowth: '+0%',
      revenueData: [],
      planDistribution: [],
      subscriptions: [],
      invoices: [],
    });
  }
}
