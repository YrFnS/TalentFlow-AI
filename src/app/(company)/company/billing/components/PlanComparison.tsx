// @ts-nocheck
import React from 'react';
import { CheckCircle2, ArrowUpRight, ArrowDownRight, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/store/i18n-store';
import { getPlanIcon, getPlanGradient } from './billing-helpers';

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string;
}

interface PlanComparisonProps {
  plans: Plan[];
  currentPlanType: string;
  onUpgradeClick: (plan: Plan) => void;
}

export default function PlanComparison({
  plans,
  currentPlanType,
  onUpgradeClick,
}: PlanComparisonProps) {
  const { t } = useI18n();

  return (
    <Card className="card-animate-fade-in-up">
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
                className={`relative p-5 rounded-xl border transition-all card-${
                  isCurrentPlan
                    ? 'border-teal-400 dark:border-teal-600 shadow-lg shadow-teal-500/10'
                    : 'border-border/50 hover:border-slate-300'
                }`}
              >
                {plan.type === 'GROWTH' && !isCurrentPlan && (
                  <div className="absolute top-0 end-0 border-2 border-blue-500 rounded-tr-xl">
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
                      className="w-full bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                      onClick={() => onUpgradeClick(plan)}
                    >
                      <Crown className="h-4 w-4 me-1" />
                      {isUpgrade ? t.billing.upgrade : t.billing.contactSales}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isUpgrade ? 'default' : 'outline'}
                      onClick={() => onUpgradeClick(plan)}
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
  );
}
