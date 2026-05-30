'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Pencil,
  Plus,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Loader2,
  Inbox,
  Shield,
  Zap,
  Crown,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string;
  limits: string | null;
  isActive: boolean;
  subscriberCount: number;
}

interface Subscription {
  id: string;
  companyName: string;
  planName: string;
  planType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  revenue: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
}

interface PlanDistribution {
  type: string;
  name: string;
  count: number;
  revenue: number;
  color: string;
}

// Revenue SVG Line Chart
function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Inbox className="h-8 w-8 mb-2 opacity-30" />
      </div>
    );
  }
  const width = 100;
  const height = 60;
  const padding = { top: 8, right: 4, bottom: 14, left: 4 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const min = Math.min(...data.map((d) => d.revenue));
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.revenue - min) / range) * chartH,
  }));

  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `${padding.left},${padding.top + chartH} ${linePath} ${padding.left + chartW},${padding.top + chartH}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.3} />;
      })}
      <polygon points={areaPath} fill="url(#revenueGrad)" />
      <polyline points={linePath} fill="none" stroke="#14b8a6" strokeWidth={0.8} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.2} fill="#14b8a6" />
      ))}
      {data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 2} textAnchor="middle" fontSize="2.5" fill="currentColor" opacity={0.5}>
            {d.month}
          </text>
        );
      })}
    </svg>
  );
}

// Plan Distribution SVG Donut Chart
function PlanDonutChart({ data }: { data: PlanDistribution[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Inbox className="h-8 w-8 mb-2 opacity-30" />
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Inbox className="h-8 w-8 mb-2 opacity-30" />
      </div>
    );
  }

  const cx = 50;
  const cy = 50;
  const r = 35;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * r;

  const segments = (() => {
    const result: (PlanDistribution & { percentage: number; dashLength: number; gap: number; offset: number })[] = [];
    let offset = 0;
    for (const d of data) {
      const percentage = d.count / total;
      const dashLength = circumference * percentage;
      const gap = circumference - dashLength;
      result.push({ ...d, percentage, dashLength, gap, offset });
      offset += dashLength;
    }
    return result;
  })();

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[200px] mx-auto">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={strokeWidth} />
      {/* Segments */}
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dashLength} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.85}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="3" fill="currentColor" opacity={0.6}>
        total
      </text>
    </svg>
  );
}

export default function AdminBillingContent() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [billingStats, setBillingStats] = useState({
    mrr: 0,
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    churnRate: '0%',
    mrrGrowth: '+0%',
  });
  const [loading, setLoading] = useState(true);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    type: 'STARTER',
    price: 0,
    billingCycle: 'monthly',
    features: '',
    limits: '',
    isActive: true,
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {
      // Use empty state
    }
  }, []);

  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/billing');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setInvoices(data.invoices || []);
        setRevenueData(data.revenueData || []);
        setPlanDistribution(data.planDistribution || []);
        setBillingStats({
          mrr: data.mrr || data.monthlyRevenue || 0,
          activeSubscriptions: data.activeSubscriptions || 0,
          totalSubscriptions: data.totalSubscriptions || 0,
          churnRate: data.churnRate || '0%',
          mrrGrowth: data.mrrGrowth || '+0%',
        });
      }
    } catch {
      // Use empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchBillingData()]);
  }, [fetchPlans, fetchBillingData]);

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    const parsedFeatures = (() => {
      try { return JSON.parse(plan.features).join(', '); } catch { return plan.features; }
    })();
    const parsedLimits = (() => {
      try { return JSON.stringify(JSON.parse(plan.limits || '{}'), null, 2); } catch { return plan.limits || '{}'; }
    })();
    setPlanForm({
      name: plan.name,
      type: plan.type,
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: parsedFeatures,
      limits: parsedLimits,
      isActive: plan.isActive,
    });
    setEditPlanOpen(true);
  };

  const handleSavePlan = () => {
    toast.success(t.billing.planUpdated);
    setEditPlanOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; icon: React.ReactNode }> = {
      ACTIVE: { class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3 me-1" /> },
      PAST_DUE: { class: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: <Clock className="w-3 h-3 me-1" /> },
      CANCELED: { class: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400', icon: <XCircle className="w-3 h-3 me-1" /> },
      TRIALING: { class: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400', icon: <Sparkles className="w-3 h-3 me-1" /> },
    };
    const entry = map[status] || map.ACTIVE;
    return (
      <Badge variant="secondary" className={`text-[10px] border-0 ${entry.class}`}>
        {entry.icon}
        {status}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const map: Record<string, { class: string; icon: React.ReactNode }> = {
      PAID: { class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3 me-1" /> },
      PENDING: { class: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: <Clock className="w-3 h-3 me-1" /> },
      FAILED: { class: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400', icon: <XCircle className="w-3 h-3 me-1" /> },
      REFUNDED: { class: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400', icon: <RefreshCw className="w-3 h-3 me-1" /> },
    };
    const entry = map[status] || map.PENDING;
    return (
      <Badge variant="secondary" className={`text-[10px] border-0 ${entry.class}`}>
        {entry.icon}
        {status === 'PAID' ? t.billing.paid : status === 'PENDING' ? t.billing.pending : status === 'FAILED' ? t.billing.failed : t.billing.refunded}
      </Badge>
    );
  };

  const getPlanTypeColor = (type: string) => {
    const map: Record<string, string> = {
      FREE: 'from-gray-400 to-gray-500',
      STARTER: 'from-teal-500 to-emerald-500',
      GROWTH: 'from-teal-500 to-emerald-600',
      ENTERPRISE: 'from-emerald-600 to-teal-700',
    };
    return map[type] || map.STARTER;
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'FREE': return Shield;
      case 'STARTER': return Zap;
      case 'GROWTH': return Sparkles;
      case 'ENTERPRISE': return Crown;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            {t.billing.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.billing.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          {t.common.poweredBy}
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0 shadow-sm card-hover-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { title: 'MRR', value: `$${billingStats.mrr.toLocaleString()}`, icon: DollarSign, gradient: 'from-teal-500 to-emerald-600' },
            { title: t.billing.activeSubscriptions, value: String(billingStats.activeSubscriptions), icon: Users, gradient: 'from-emerald-500 to-teal-600' },
            { title: t.billing.churnRate, value: billingStats.churnRate, icon: TrendingDown, gradient: 'from-cyan-500 to-teal-600' },
            { title: t.billing.mrrGrowth, value: billingStats.mrrGrowth, icon: TrendingUp, gradient: 'from-teal-600 to-emerald-700' },
          ].map((card, i) => {
            const Icon = card.icon;
            const isPositive = card.value.startsWith('+') || card.value.startsWith('$');
            return (
              <Card key={i} className="relative overflow-hidden border-0 shadow-sm card-hover-lift">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.06]`} />
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                      <p className={`text-3xl font-bold tracking-tight ${isPositive && card.title === t.billing.mrrGrowth ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{card.value}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Revenue Chart + Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 card-hover-lift animate-fade-in-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.billing.revenueOverview}</CardTitle>
                <CardDescription className="text-xs">Last 6 months</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                <BarChart3 className="w-3 h-3 me-1" />
                MRR
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RevenueChart data={revenueData} />
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">Total Revenue</span>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-400">
                ${revenueData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="card-hover-lift animate-fade-in-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
            <CardDescription className="text-xs">{billingStats.totalSubscriptions} total subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <PlanDonutChart data={planDistribution} />
              )}
            </div>
            <div className="space-y-2 mt-3 pt-3 border-t">
              {planDistribution.map((pd) => {
                const Icon = getPlanIcon(pd.type);
                return (
                  <div key={pd.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: pd.color }} />
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{pd.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{pd.count}</span>
                      <span className="text-xs font-medium text-teal-700 dark:text-teal-400">${pd.revenue}</span>
                    </div>
                  </div>
                );
              })}
              {planDistribution.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground text-center">{t.common.noResults}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Management */}
      <Card className="card-hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{t.billing.managePlans}</CardTitle>
              <CardDescription className="text-xs">{plans.length} plans available</CardDescription>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="h-4 w-4 me-1" />
              {t.billing.createPlan}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border">
                  <div className="space-y-3">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const parsedFeatures = (() => {
                  try { return JSON.parse(plan.features); } catch { return []; }
                })();
                const Icon = getPlanIcon(plan.type);
                return (
                  <div
                    key={plan.id}
                    className="relative p-4 rounded-xl border border-border/50 hover:border-teal-300 dark:hover:border-teal-700 transition-all card-hover-lift"
                  >
                    {plan.type === 'GROWTH' && (
                      <div className="absolute top-0 end-0 pricing-ribbon rounded-tr-xl">
                        {t.billing.mostPopular}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${getPlanTypeColor(plan.type)} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{plan.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {plan.price === 0 ? t.billing.free : `$${plan.price}`}{plan.price > 0 && t.billing.perMonth}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPlan(plan)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 mb-3 max-h-24 overflow-y-auto scrollbar-thin">
                      {parsedFeatures.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {t.billing.subscribers}: <span className="font-medium text-foreground">{plan.subscriberCount}</span>
                      </span>
                      <Badge variant="secondary" className="text-[10px] border-0 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                        {plan.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No subscription plans available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="card-hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-500" />
            {t.billing.activeSubscriptions}
            <Badge variant="secondary" className="ml-2">{subscriptions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.admin.companyName}</TableHead>
                    <TableHead className="text-xs">{t.billing.planName}</TableHead>
                    <TableHead className="text-xs">{t.billing.status}</TableHead>
                    <TableHead className="text-xs">{t.billing.date}</TableHead>
                    <TableHead className="text-xs">{t.billing.revenue}</TableHead>
                    <TableHead className="text-xs text-right">{t.billing.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} className="table-row-accent">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                              {getInitials(sub.companyName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{sub.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] border-0 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                          {sub.planName}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{sub.startDate}</TableCell>
                      <TableCell className="text-sm font-medium">{sub.revenue > 0 ? `$${sub.revenue}` : '—'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>{t.billing.view}</DropdownMenuItem>
                            <DropdownMenuItem>{t.common.edit}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="card-hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            {t.billing.billingHistory}
            <Badge variant="secondary" className="ml-2">{invoices.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.billing.invoiceNumber}</TableHead>
                    <TableHead className="text-xs">{t.admin.companyName}</TableHead>
                    <TableHead className="text-xs">{t.billing.amount}</TableHead>
                    <TableHead className="text-xs">{t.billing.status}</TableHead>
                    <TableHead className="text-xs">{t.billing.date}</TableHead>
                    <TableHead className="text-xs text-right">{t.billing.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="table-row-accent">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{inv.invoiceNumber}</code>
                      </TableCell>
                      <TableCell className="text-sm">{inv.companyName}</TableCell>
                      <TableCell className="text-sm font-medium">${inv.amount}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-teal-600 hover:text-teal-700 dark:text-teal-400">
                            <Eye className="h-3.5 w-3.5 me-1" />
                            {t.billing.view}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-teal-600 hover:text-teal-700 dark:text-teal-400">
                            <Download className="h-3.5 w-3.5 me-1" />
                            {t.billing.download}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Editor Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle>{t.billing.editPlan}</DialogTitle>
            <DialogDescription>Modify the plan details, features, and limits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t.billing.planName}</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select value={planForm.type} onValueChange={(v) => setPlanForm({ ...planForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="GROWTH">Growth</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t.billing.price}</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t.billing.billingCycle}</Label>
                <Select value={planForm.billingCycle} onValueChange={(v) => setPlanForm({ ...planForm, billingCycle: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t.billing.monthly}</SelectItem>
                    <SelectItem value="yearly">{t.billing.yearly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t.billing.features} <span className="text-muted-foreground">(comma-separated)</span></Label>
              <Textarea
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t.billing.planLimits} <span className="text-muted-foreground">(JSON)</span></Label>
              <Textarea
                value={planForm.limits}
                onChange={(e) => setPlanForm({ ...planForm, limits: e.target.value })}
                rows={3}
                className="resize-none font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch
                checked={planForm.isActive}
                onCheckedChange={(checked) => setPlanForm({ ...planForm, isActive: checked })}
              />
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditPlanOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
              onClick={handleSavePlan}
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
