// @ts-nocheck
import React from 'react';
import { Lock, CreditCard, Loader2, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useI18n } from '@/store/i18n-store';
import { getPlanIcon, getPlanGradient } from './billing-helpers';

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutPlan: Plan | null;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardName: string;
  processing: boolean;
  paymentStep: 'form' | 'processing' | 'success' | 'failed';
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvcChange: (value: string) => void;
  onCardNameChange: (value: string) => void;
  onSubscribe: () => void;
  onBackToForm: () => void;

}

export default function CheckoutDialog({
  open,
  onOpenChange,
  checkoutPlan,
  cardNumber,
  expiry,
  cvc,
  cardName,
  processing,
  paymentStep,
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
  onCardNameChange,
  onSubscribe,
  onBackToForm,
}: CheckoutDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!processing) onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Stripe-like header */}
        <div className="bg-blue-600 p-5 text-white">
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
                  <span className="text-lg font-bold text-blue-700">${checkoutPlan.price}.00</span>
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
                    onChange={(e) => onCardNumberChange(e.target.value)}
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
                    onChange={(e) => onExpiryChange(e.target.value)}
                    placeholder={t.stripe.expiryPlaceholder}
                    className="font-mono"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.stripe.cvc}</Label>
                  <Input
                    value={cvc}
                    onChange={(e) => onCvcChange(e.target.value)}
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
                  onChange={(e) => onCardNameChange(e.target.value)}
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
                className="w-full bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white h-12 text-base font-semibold"
                onClick={onSubscribe}
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
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{t.stripe.processing}</h3>
            <p className="text-sm text-muted-foreground">{t.stripe.securePayment}</p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700">{t.stripe.paymentSuccess}</h3>
            <p className="text-sm text-muted-foreground">{t.stripe.paymentSuccessDesc}</p>
          </div>
        )}

        {paymentStep === 'failed' && (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-700">{t.stripe.paymentFailed}</h3>
            <p className="text-sm text-muted-foreground">{t.stripe.paymentFailedDesc}</p>
            <Button variant="outline" onClick={onBackToForm}>
              {t.common.back}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
