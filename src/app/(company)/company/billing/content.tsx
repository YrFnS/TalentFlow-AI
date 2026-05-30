// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Shield,
  Zap,
  Crown,
  Building2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Loader2,
  Lock,
  ExternalLink,
  FileText,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface SubscriptionData {
  id: string;
  planId: string;
  planName: string;
  planType: string;
  status: string;
  billingCycle: string;
  price: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  usage: {
    jobs: { current: number; limit: number };
    applications: { current: number; limit: number };
    aiCredits: { current: number; limit: number };
  };
}

// Default plans for when DB is empty
const defaultPlans: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    type: 'FREE',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['1 Job Posting', '10 Applications', '5 AI Credits', 'Basic Support']),
    limits: JSON.stringify({ jobs: 1, applications: 10, aiCredits: 5 }),
    isActive: true,
    subscriberCount: 0,
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    type: 'STARTER',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['5 Job Postings', '100 Applications', '50 AI Credits', 'Email Support', 'Custom Pipeline']),
    limits: JSON.stringify({ jobs: 5, applications: 100, aiCredits: 50 }),
    isActive: true,
    subscriberCount: 0,
  },
  {
    id: 'plan_growth',
    name: 'Growth',
    type: 'GROWTH',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['25 Job Postings', '500 Applications', '200 AI Credits', 'Priority Support', 'Custom Workflows', 'Analytics Dashboard']),
    limits: JSON.stringify({ jobs: 25, applications: 500, aiCredits: 200 }),
    isActive: true,
    subscriberCount: 0,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    type: 'ENTERPRISE',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['Unlimited Jobs', 'Unlimited Applications', '1000 AI Credits', 'Priority Support', 'SSO Integration', 'Custom Integrations', 'SLA Guarantee']),
    limits: JSON.stringify({ jobs: -1, applications: -1, aiCredits: 1000 }),
    isActive: true,
    subscriberCount: 0,
  },
];

export default function CompanyBillingContent() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

  // Checkout form
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/27');
  const [cvc, setCvc] = useState('123');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch plans
      const plansRes = await fetch('/api/billing/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.plans && plansData.plans.length > 0) {
          setPlans(plansData.plans);
        }
      }

      // Fetch subscription
      const subRes = await fetch('/api/stripe/subscription');
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.subscription) {
          setSubscription(subData.subscription);
          setInvoices(subData.invoices || []);
          setPaymentMethod(subData.paymentMethod);
        }
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Card number auto-format
  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Expiry auto-format
  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
    } else {
      setExpiry(digits);
    }
  };

  const currentPlanType = subscription?.planType || 'FREE';

  const handleUpgradeClick = (plan: Plan) => {
    setCheckoutPlan(plan);
    setPaymentStep('form');
    setCheckoutOpen(true);
  };

  const handleSubscribe = async () => {
    if (!checkoutPlan) return;
    setProcessing(true);
    setPaymentStep('processing');

    // Simulate 3-4 second processing
    await new Promise((resolve) => setTimeout(resolve, 3500));

    try {
      // Create checkout session (simulated)
      const sessionRes = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: checkoutPlan.id }),
      });

      if (sessionRes.ok) {
        // Simulate webhook: checkout.session.completed
        const webhookRes = await fetch('/api/stripe/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkout.session.completed',
            data: {
              companyId: 'demo_company',
              planId: checkoutPlan.id,
            },
          }),
        });

        if (webhookRes.ok) {
          setPaymentStep('success');
          // Refresh data
          setTimeout(() => {
            fetchData();
            setCheckoutOpen(false);
            toast.success(t.billing.planUpdated);
          }, 2000);
        } else {
          setPaymentStep('failed');
        }
      } else {
        setPaymentStep('failed');
      }
    } catch {
      setPaymentStep('failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelConfirmed) return;

    try {
      await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer.subscription.deleted',
          data: { companyId: 'demo_company' },
        }),
      });
      toast.success(t.billing.subscriptionCancelled);
      setCancelOpen(false);
      setCancelConfirmed(false);
      fetchData();
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleOpenPortal = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        setPortalOpen(true);
      }
    } catch {
      toast.error(t.common.error);
    }
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

  const getPlanGradient = (type: string) => {
    const map: Record<string, string> = {
      FREE: 'from-gray-400 to-gray-500',
      STARTER: 'from-teal-500 to-emerald-500',
      GROWTH: 'from-teal-500 to-emerald-600',
      ENTERPRISE: 'from-emerald-600 to-teal-700',
    };
    return map[type] || map.STARTER;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const map: Record<string, { class: string; icon: React.ReactNode }> = {
      PAID: { class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3 me-1" /> },
      PENDING: { class: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: <Calendar className="w-3 h-3 me-1" /> },
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

  const getUsagePercent = (current: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  const getCardBrandName = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return t.stripe.visa;
      case 'mastercard': return t.stripe.mastercard;
      case 'amex': return t.stripe.amex;
      default: return brand;
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Current subscription info (with fallback for Free plan)
  const currentPlan = subscription || {
    planName: 'Free',
    planType: 'FREE',
    price: 0,
    billingCycle: 'monthly',
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: null,
    usage: { jobs: { current: 0, limit: 1 }, applications: { current: 0, limit: 10 }, aiCredits: { current: 0, limit: 5 } },
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleOpenPortal} className="text-sm">
            <ExternalLink className="h-4 w-4 me-2" />
            {t.stripe.manageBilling}
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            {t.common.poweredBy}
          </div>
        </div>
      </div>

      {/* Current Plan Card + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <Card className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.08]" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t.billing.currentPlan}</CardTitle>
              <Badge className={
                currentPlan.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0'
                  : currentPlan.status === 'TRIALING'
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0'
              }>
                <CheckCircle2 className="w-3 h-3 me-1" />
                {currentPlan.status === 'ACTIVE' ? t.billing.currentPlanBadge : currentPlan.status === 'TRIALING' ? t.billing.trialEnds : currentPlan.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                {React.createElement(getPlanIcon(currentPlan.planType), { className: 'w-7 h-7' })}
              </div>
              <div>
                <h3 className="text-xl font-bold">{currentPlan.planName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                    {currentPlan.price === 0 ? t.billing.free : `$${currentPlan.price}`}
                  </span>
                  {currentPlan.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {currentPlan.billingCycle === 'monthly' ? t.billing.perMonth : t.billing.perYear}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t.billing.billingCycle}</p>
                <p className="text-sm font-medium">{currentPlan.billingCycle === 'monthly' ? t.billing.monthly : t.billing.yearly}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t.billing.renewalDate}</p>
                <p className="text-sm font-medium">{formatDate(currentPlan.endDate)}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-3">{t.billing.usage}</p>
              <div className="space-y-3">
                {[
                  { label: t.billing.jobs, ...currentPlan.usage.jobs },
                  { label: t.billing.applications, ...currentPlan.usage.applications },
                  { label: t.billing.aiCredits, ...currentPlan.usage.aiCredits },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs font-medium">{metric.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {metric.current} {t.billing.of} {metric.limit <= 0 ? '∞' : metric.limit}
                      </span>
                    </div>
                    <Progress
                      value={metric.limit <= 0 ? 5 : getUsagePercent(metric.current, metric.limit)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method + Quick Actions */}
        <div className="space-y-6">
          {/* Payment Method */}
          <Card className="card-hover-lift animate-fade-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{t.billing.paymentMethod}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod ? (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xl">
                    {getCardBrandIcon(paymentMethod.brand)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {getCardBrandName(paymentMethod.brand)} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.stripe.expires} {paymentMethod.expMonth.toString().padStart(2, '0')}/{paymentMethod.expYear}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info(t.stripe.updateCard)}>
                    {t.billing.updatePayment}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t.stripe.updateCard}</p>
                    <p className="text-xs text-muted-foreground">{t.stripe.cardEnding} —</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    const starterPlan = plans.find(p => p.type === 'STARTER');
                    if (starterPlan) handleUpgradeClick(starterPlan);
                  }}>
                    <CreditCard className="h-4 w-4 me-1" />
                    {t.billing.updatePayment}
                  </Button>
                </div>
              )}
              <Separator />
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleOpenPortal}>
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t.stripe.openPortal}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setCancelOpen(true)}
                  disabled={!subscription}
                >
                  <AlertTriangle className="h-4 w-4 me-2" />
                  {t.billing.cancelSubscription}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Quick View */}
          <Card className="card-hover-lift animate-fade-in-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{t.billing.billingHistory}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{invoices.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {invoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{inv.invoiceNumber}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">${inv.amount}</span>
                        {getInvoiceStatusBadge(inv.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t.common.noResults}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Comparison */}
      <Card className="card-hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t.billing.planComparison}</CardTitle>
          <CardDescription className="text-xs">{t.billing.features}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.type);
              const isCurrentPlan = plan.type === currentPlanType;
              const planIndex = plans.findIndex((p) => p.type === plan.type);
              const currentIndex = plans.findIndex((p) => p.type === currentPlanType);
              const isUpgrade = planIndex > currentIndex;
              const isDowngrade = planIndex < currentIndex;
              const parsedFeatures = (() => {
                try { return JSON.parse(plan.features); } catch { return []; }
              })();

              return (
                <div
                  key={plan.id}
                  className={`relative p-5 rounded-xl border transition-all card-hover-lift ${
                    isCurrentPlan
                      ? 'border-teal-400 dark:border-teal-600 shadow-lg shadow-teal-500/10'
                      : 'border-border/50 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  {plan.type === 'GROWTH' && !isCurrentPlan && (
                    <div className="absolute top-0 end-0 pricing-ribbon rounded-tr-xl">
                      {t.billing.mostPopular}
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getPlanGradient(plan.type)} text-white shadow-md mx-auto mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">
                        {plan.price === 0 ? t.billing.free : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {plan.billingCycle === 'monthly' ? t.billing.perMonth : t.billing.perYear}
                        </span>
                      )}
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-2 mb-4 min-h-[120px] max-h-[160px] overflow-y-auto scrollbar-thin">
                    {parsedFeatures.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle2 className="h-4 w-4 me-2" />
                        {t.billing.currentPlanBadge}
                      </Button>
                    ) : plan.type === 'ENTERPRISE' ? (
                      <Button
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        <Crown className="h-4 w-4 me-1" />
                        {isUpgrade ? t.billing.upgrade : t.billing.contactSales}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isUpgrade ? 'default' : 'outline'}
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        {isUpgrade ? (
                          <>
                            <ArrowUpRight className="h-4 w-4 me-1" />
                            {t.billing.upgrade}
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-4 w-4 me-1" />
                            {t.billing.downgrade}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full Invoice History */}
      <Card className="card-hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t.billing.billingHistory}</CardTitle>
          <CardDescription className="text-xs">{invoices.length} {t.billing.billingHistory.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t.billing.invoiceNumber}</TableHead>
                  <TableHead className="text-xs">{t.billing.amount}</TableHead>
                  <TableHead className="text-xs">{t.billing.status}</TableHead>
                  <TableHead className="text-xs">{t.billing.date}</TableHead>
                  <TableHead className="text-xs text-end">{t.billing.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center">
                      <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="table-row-accent">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{inv.invoiceNumber}</code>
                      </TableCell>
                      <TableCell className="text-sm font-medium">${inv.amount}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(inv.date)}</TableCell>
                      <TableCell className="text-end">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => {
        if (!processing) setCheckoutOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Stripe-like header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">{t.stripe.simulateCheckout}</span>
            </div>
            <h2 className="text-xl font-bold">{t.stripe.checkoutTitle}</h2>
            <p className="text-sm opacity-80 mt-1">{t.stripe.checkoutSubtitle}</p>
          </div>

          {paymentStep === 'form' && checkoutPlan && (
            <>
              {/* Order Summary */}
              <div className="px-6 pt-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                  <h4 className="text-sm font-semibold mb-3">{t.stripe.orderSummary}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getPlanGradient(checkoutPlan.type)} text-white`}>
                        {React.createElement(getPlanIcon(checkoutPlan.type), { className: 'w-4 h-4' })}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{checkoutPlan.name} {t.stripe.planChange}</p>
                        <p className="text-xs text-muted-foreground">{t.billing.monthly}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-lg font-bold">${checkoutPlan.price}</p>
                      <p className="text-xs text-muted-foreground">{t.billing.perMonth}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{t.stripe.totalToday}</span>
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-400">${checkoutPlan.price}.00</span>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="px-6 pt-4 pb-2 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.stripe.cardNumber}</Label>
                  <div className="relative">
                    <Input
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder={t.stripe.cardNumberPlaceholder}
                      className="ps-10 font-mono"
                      maxLength={19}
                    />
                    <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.stripe.expiry}</Label>
                    <Input
                      value={expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder={t.stripe.expiryPlaceholder}
                      className="font-mono"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.stripe.cvc}</Label>
                    <Input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder={t.stripe.cvcPlaceholder}
                      className="font-mono"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.stripe.nameOnCard}</Label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder={t.stripe.nameOnCardPlaceholder}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-4 pt-2 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  {t.stripe.securePayment}
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-12 text-base font-semibold"
                  onClick={handleSubscribe}
                  disabled={cardNumber.replace(/\s/g, '').length < 16}
                >
                  {t.stripe.subscribe} — ${checkoutPlan.price}/{t.billing.monthly.toLowerCase().replace('ly', '')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t.stripe.poweredByStripe}
                </p>
              </div>
            </>
          )}

          {paymentStep === 'processing' && (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold">{t.stripe.processing}</h3>
              <p className="text-sm text-muted-foreground">{t.stripe.securePayment}</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{t.stripe.paymentSuccess}</h3>
              <p className="text-sm text-muted-foreground">{t.stripe.paymentSuccessDesc}</p>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">{t.stripe.paymentFailed}</h3>
              <p className="text-sm text-muted-foreground">{t.stripe.paymentFailedDesc}</p>
              <Button variant="outline" onClick={() => setPaymentStep('form')}>
                {t.common.back}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing Portal Dialog */}
      <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-500" />
              {t.stripe.billingPortal}
            </DialogTitle>
            <DialogDescription>{t.stripe.billingPortalDesc}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Simulated portal content */}
            <div className="p-4 rounded-xl border border-border/50 space-y-3">
              <h4 className="text-sm font-semibold">{t.billing.currentPlan}</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">{currentPlan.planName}</span>
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                  {currentPlan.status}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 space-y-3">
              <h4 className="text-sm font-semibold">{t.billing.paymentMethod}</h4>
              {paymentMethod ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {getCardBrandName(paymentMethod.brand)} •••• {paymentMethod.last4}
                  </span>
                  <Button variant="ghost" size="sm">{t.stripe.updateCard}</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border/50 space-y-3">
              <h4 className="text-sm font-semibold">{t.billing.billingHistory}</h4>
              {invoices.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {invoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                      <div className="flex items-center gap-2">
                        <span>${inv.amount}</span>
                        {getInvoiceStatusBadge(inv.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalOpen(false)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelOpen} onOpenChange={(open) => {
        if (!processing) {
          setCancelOpen(open);
          if (!open) setCancelConfirmed(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t.billing.cancelSubscription}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t.billing.cancelWarning}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">{t.billing.cancelSubscription}</h4>
              <ul className="space-y-1.5 text-xs text-red-600 dark:text-red-400">
                {(() => {
                  try {
                    const currentPlanFeatures = JSON.parse(plans.find(p => p.type === 'FREE')?.features || '[]');
                    return currentPlanFeatures.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        {f}
                      </li>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </ul>
            </div>
            <label className="flex items-center gap-3 mt-4 p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={cancelConfirmed}
                onCheckedChange={(checked) => setCancelConfirmed(checked === true)}
              />
              <span className="text-sm text-muted-foreground">{t.billing.cancelConfirmation}</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelConfirmed(false); }}>
              {t.billing.keepSubscription}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!cancelConfirmed}
              onClick={handleCancelSubscription}
            >
              {t.billing.cancelSubscription}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
