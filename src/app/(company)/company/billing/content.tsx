'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CreditCard,
  FileText,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type Metric = { current: number; limit: number | null };
type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string;
};
type Billing = {
  subscription: null | {
    planId: string;
    planName: string;
    status: string;
    price: number;
    currency: string;
    billingCycle: string;
    endDate: string | null;
    usage: { jobs: Metric; applications: Metric; aiCredits: Metric };
  };
  usage?: { jobs: Metric; applications: Metric; aiCredits: Metric };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    pdfUrl?: string | null;
    hostedUrl?: string | null;
  }>;
};

const emptyUsage = {
  jobs: { current: 0, limit: null },
  applications: { current: 0, limit: null },
  aiCredits: { current: 0, limit: null },
};

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function features(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function Usage({ label, value }: { label: string; value: Metric }) {
  const unlimited = value.limit === null || value.limit < 0;
  const percent = unlimited || !value.limit ? 0 : Math.min(100, (value.current / value.limit) * 100);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.current} / {unlimited ? 'Unlimited' : value.limit}</span>
      </div>
      {!unlimited && <Progress value={percent} className="mt-3 h-2" />}
    </div>
  );
}

export default function CompanyBillingContent() {
  const { user, validateSession } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [billingResponse, planResponse] = await Promise.all([
        fetch('/api/billing', { cache: 'no-store' }),
        fetch('/api/billing/plans', { cache: 'no-store' }),
      ]);
      if (!billingResponse.ok) throw new Error('Failed to load billing data');
      setBilling(await billingResponse.json());
      setPlans(planResponse.ok ? (await planResponse.json()).plans || [] : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-20" /><Skeleton className="h-40" /><Skeleton className="h-72" /></div>;
  }

  const usage = billing?.subscription?.usage || billing?.usage || emptyUsage;
  const currentPlanId = billing?.subscription?.planId;
  const canManage = ['COMPANY_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Billing</h1><p className="mt-1 text-sm text-muted-foreground">Real subscription usage and invoice history for your company.</p></div>
        <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}Refresh</Button>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-medium">Online billing is disabled</p><p className="mt-1 text-sm text-muted-foreground">The simulated payment flow was removed. Checkout, upgrades, cancellations, and payment-method changes remain unavailable until verified Stripe integration is configured.</p></div></CardContent>
      </Card>

      {error ? (
        <Card><CardContent className="py-12 text-center"><p className="text-destructive">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Try again</Button></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />Current plan</CardTitle></CardHeader><CardContent>{billing?.subscription ? <div className="space-y-2"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{billing.subscription.planName}</p><p className="text-sm text-muted-foreground">{money(billing.subscription.price, billing.subscription.currency)} / {billing.subscription.billingCycle}</p></div><Badge>{billing.subscription.status}</Badge></div>{billing.subscription.endDate && <p className="text-xs text-muted-foreground">Period ends {new Date(billing.subscription.endDate).toLocaleDateString()}</p>}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No subscription record is configured.</p>}</CardContent></Card>
            <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4 text-primary" />Usage</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><Usage label="Jobs" value={usage.jobs} /><Usage label="Applications" value={usage.applications} /><Usage label="AI requests" value={usage.aiCredits} /></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" />Plan catalog</CardTitle></CardHeader><CardContent>{plans.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No plans are configured.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => <div key={plan.id} className={`rounded-xl border p-5 ${plan.id === currentPlanId ? 'border-primary bg-primary/5' : ''}`}><div className="flex items-start justify-between"><div><p className="font-semibold">{plan.name}</p><p className="mt-1 text-2xl font-bold">{money(plan.price, plan.currency)}</p><p className="text-xs text-muted-foreground">per {plan.billingCycle}</p></div>{plan.id === currentPlanId && <Badge>Current</Badge>}</div><ul className="mt-4 space-y-2">{features(plan.features).map((feature) => <li key={feature} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />{feature}</li>)}</ul><Button className="mt-5 w-full" variant="outline" disabled>{plan.id === currentPlanId ? 'Current plan' : canManage ? 'Unavailable' : 'Admin access required'}</Button></div>)}</div>}</CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Invoices</CardTitle></CardHeader><CardContent>{!billing?.invoices.length ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No invoices are recorded.</p> : <div className="divide-y rounded-lg border">{billing.invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{invoice.invoiceNumber}</p><p className="text-xs text-muted-foreground">{new Date(invoice.date).toLocaleDateString()} · {money(invoice.amount, invoice.currency)}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{invoice.status}</Badge>{(invoice.hostedUrl || invoice.pdfUrl) && <Button asChild variant="ghost" size="sm"><a href={invoice.hostedUrl || invoice.pdfUrl || '#'} target="_blank" rel="noreferrer">View</a></Button>}</div></div>)}</div>}</CardContent></Card>
        </>
      )}
    </div>
  );
}
