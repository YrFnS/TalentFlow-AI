// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface OnboardingStatsCardsProps {
  stats: {
    active: number;
    completedCount: number;
    completionRate: number;
    avgDays: number;
    overdueTasks: number;
  };
}

export default function OnboardingStatsCards({ stats }: OnboardingStatsCardsProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{ot.activeAssignments}</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{ot.completionRate}</p>
              <p className="text-xl font-bold">{stats.completionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{ot.avgDays}</p>
              <p className="text-xl font-bold">{stats.avgDays}d</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{ot.overdueTasks}</p>
              <p className="text-xl font-bold">{stats.overdueTasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
