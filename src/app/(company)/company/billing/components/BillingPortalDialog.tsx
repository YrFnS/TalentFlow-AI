// @ts-nocheck
import React from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/store/i18n-store';
import { useGetCardBrandName, useInvoiceStatusBadge } from './billing-helpers';

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface BillingPortalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: {
    planName: string;
    status: string;
  };
  paymentMethod: PaymentMethod | null;
  invoices: Array<{ id: string; invoiceNumber: string; amount: number; status: string }>;
  getCardBrandName?: (brand: string) => string;
}

export default function BillingPortalDialog({
  open,
  onOpenChange,
  currentPlan,
  paymentMethod,
  invoices,
  getCardBrandName: propGetCardBrandName,
}: BillingPortalDialogProps) {
  const { t } = useI18n();
  const hookGetCardBrandName = useGetCardBrandName();
  const getCardBrandName = propGetCardBrandName || hookGetCardBrandName;
  const getInvoiceStatusBadge = useInvoiceStatusBadge();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="dialog-header-accent">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
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
              <Badge variant="secondary" className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
