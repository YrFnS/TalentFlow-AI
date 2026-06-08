// @ts-nocheck
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/store/i18n-store';
import { getPlanIcon, formatDate, getUsagePercent } from './billing-helpers';

interface CurrentPlanCardProps {
  currentPlan: {
    planName: string;
    planType: string;
    price: number;
    billingCycle: string;
    status: string;
    endDate: string | null;
    usage: {
      jobs: { current: number; limit: number };
      applications: { current: number; limit: number };
      aiCredits: { current: number; limit: number };
    };
  };
}

export default function CurrentPlanCard({
  currentPlan,
}: CurrentPlanCardProps) {
  const { t } = useI18n();
  const Icon = getPlanIcon(currentPlan.planType);

  return (
    <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.08]" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{t.billing.currentPlan}</CardTitle>
          <Badge className={
            currentPlan.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0'
              : currentPlan.status === 'TRIALING'
                ? 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0'
          }>
            <CheckCircle2 className="w-3 h-3 me-1" />
            {currentPlan.status === 'ACTIVE' ? t.billing.currentPlanBadge : currentPlan.status === 'TRIALING' ? t.billing.trialEnds : currentPlan.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{currentPlan.planName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-700">
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
  );
}
