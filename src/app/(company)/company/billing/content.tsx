// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import CurrentPlanCard from './components/CurrentPlanCard';
import PaymentMethodCard from './components/PaymentMethodCard';
import PlanComparison from './components/PlanComparison';
import InvoiceHistoryTable from './components/InvoiceHistoryTable';
import CheckoutDialog from './components/CheckoutDialog';
import BillingPortalDialog from './components/BillingPortalDialog';
import CancelSubscriptionDialog from './components/CancelSubscriptionDialog';
import { useGetCardBrandName } from './components/billing-helpers';
import { Plan, InvoiceItem, PaymentMethod, SubscriptionData, defaultPlans } from './components/billing-types';

export default function CompanyBillingContent() {
  const { t } = useI18n();
  const getCardBrandName = useGetCardBrandName();

  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

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
      const plansRes = await fetch('/api/billing/plans');
      if (plansRes.ok) {
        const pd = await plansRes.json();
        if (pd.plans?.length > 0) setPlans(pd.plans);
      }
      const subRes = await fetch('/api/stripe/subscription');
      if (subRes.ok) {
        const sd = await subRes.json();
        if (sd.subscription) {
          setSubscription(sd.subscription);
          setInvoices(sd.invoices || []);
          setPaymentMethod(sd.paymentMethod);
        }
      }
    } catch { /* defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length >= 3 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits);
  };

  const handleUpgradeClick = (plan: Plan) => {
    setCheckoutPlan(plan);
    setPaymentStep('form');
    setCheckoutOpen(true);
  };

  const handleSubscribe = async () => {
    if (!checkoutPlan) return;
    setProcessing(true);
    setPaymentStep('processing');
    await new Promise((r) => setTimeout(r, 3500));
    try {
      const sessionRes = await fetch('/api/stripe/checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: checkoutPlan.id }),
      });
      if (sessionRes.ok) {
        const webhookRes = await fetch('/api/stripe/webhook', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'checkout.session.completed', data: { companyId: 'demo_company', planId: checkoutPlan.id } }),
        });
        if (webhookRes.ok) {
          setPaymentStep('success');
          setTimeout(() => { fetchData(); setCheckoutOpen(false); toast.success(t.billing.planUpdated); }, 2000);
        } else { setPaymentStep('failed'); }
      } else { setPaymentStep('failed'); }
    } catch { setPaymentStep('failed'); }
    finally { setProcessing(false); }
  };

  const handleCancelSubscription = async () => {
    if (!cancelConfirmed) return;
    try {
      await fetch('/api/stripe/webhook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'customer.subscription.deleted', data: { companyId: 'demo_company' } }),
      });
      toast.success(t.billing.subscriptionCancelled);
      setCancelOpen(false); setCancelConfirmed(false); fetchData();
    } catch { toast.error(t.common.error); }
  };

  const handleOpenPortal = async () => {
    try {
      if ((await fetch('/api/stripe/portal', { method: 'POST' })).ok) setPortalOpen(true);
    } catch { toast.error(t.common.error); }
  };

  const currentPlan = subscription || {
    planName: 'Free', planType: 'FREE', price: 0, billingCycle: 'monthly', status: 'ACTIVE',
    startDate: new Date().toISOString(), endDate: null,
    usage: { jobs: { current: 0, limit: 1 }, applications: { current: 0, limit: 10 }, aiCredits: { current: 0, limit: 5 } },
  };

  const currentPlanType = subscription?.planType || 'FREE';
  const freePlanFeatures = plans.find(p => p.type === 'FREE')?.features || '[]';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-blue-600 text-white">{t.billing.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.billing.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleOpenPortal} className="text-sm">
            <ExternalLink className="h-4 w-4 me-2" />
            {t.stripe.manageBilling}
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {t.common.poweredBy}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentPlanCard currentPlan={currentPlan} />
        <PaymentMethodCard
          paymentMethod={paymentMethod} hasSubscription={!!subscription}
          invoiceCount={invoices.length} invoices={invoices} plans={plans}
          onOpenPortal={handleOpenPortal} onCancelClick={() => setCancelOpen(true)}
          onUpgradeClick={handleUpgradeClick}
        />
      </div>

      <PlanComparison plans={plans} currentPlanType={currentPlanType} onUpgradeClick={handleUpgradeClick} />
      <InvoiceHistoryTable invoices={invoices} />

      <CheckoutDialog
        open={checkoutOpen} onOpenChange={setCheckoutOpen} checkoutPlan={checkoutPlan}
        cardNumber={cardNumber} expiry={expiry} cvc={cvc} cardName={cardName}
        processing={processing} paymentStep={paymentStep}
        onCardNumberChange={handleCardNumberChange} onExpiryChange={handleExpiryChange}
        onCvcChange={(v) => setCvc(v.replace(/\D/g, '').slice(0, 3))} onCardNameChange={setCardName}
        onSubscribe={handleSubscribe} onBackToForm={() => setPaymentStep('form')}
      />

      <BillingPortalDialog
        open={portalOpen} onOpenChange={setPortalOpen}
        currentPlan={{ planName: currentPlan.planName, status: currentPlan.status }}
        paymentMethod={paymentMethod} invoices={invoices}
        getCardBrandName={getCardBrandName}
      />

      <CancelSubscriptionDialog
        open={cancelOpen} onOpenChange={setCancelOpen}
        cancelConfirmed={cancelConfirmed} onCancelConfirmedChange={setCancelConfirmed}
        onCancelSubscription={handleCancelSubscription} processing={processing}
        freePlanFeatures={freePlanFeatures}
      />
    </div>
  );
}
