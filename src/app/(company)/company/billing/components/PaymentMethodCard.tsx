// @ts-nocheck
import React from 'react';
import { CreditCard, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import { getCardBrandIcon, useGetCardBrandName, useInvoiceStatusBadge } from './billing-helpers';

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod | null;
  hasSubscription: boolean;
  invoiceCount: number;
  invoices: Array<{ id: string; invoiceNumber: string; amount: number; status: string }>;
  plans: Array<{ id: string; type: string; name: string }>;
  onOpenPortal: () => void;
  onCancelClick: () => void;
  onUpgradeClick: (plan: { id: string; type: string; name: string }) => void;
}

export default function PaymentMethodCard({
  paymentMethod,
  hasSubscription,
  invoiceCount,
  invoices,
  plans,
  onOpenPortal,
  onCancelClick,
  onUpgradeClick,
}: PaymentMethodCardProps) {
  const { t } = useI18n();
  const getCardBrandName = useGetCardBrandName();
  const getInvoiceStatusBadge = useInvoiceStatusBadge();

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <Card className="card-animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t.billing.paymentMethod}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethod ? (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-xl">
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
                if (starterPlan) onUpgradeClick(starterPlan);
              }}>
                <CreditCard className="h-4 w-4 me-1" />
                {t.billing.updatePayment}
              </Button>
            </div>
          )}
          <Separator />
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start" onClick={onOpenPortal}>
              <ExternalLink className="h-4 w-4 me-2" />
              {t.stripe.openPortal}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={onCancelClick}
              disabled={!hasSubscription}
            >
              <AlertTriangle className="h-4 w-4 me-2" />
              {t.billing.cancelSubscription}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Quick View */}
      <Card className="card-animate-fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{t.billing.billingHistory}</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{invoiceCount}</Badge>
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
  );
}
