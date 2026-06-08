// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/store/i18n-store';
import { statusConfig } from './interview-types';
import type { InterviewStats } from './interview-types';

interface InterviewStatsCardsProps {
  stats: InterviewStats;
}

export default function InterviewStatsCards({ stats }: InterviewStatsCardsProps) {
  const { t } = useI18n();

  const items = [
    { label: t.interviews.scheduled, count: stats.scheduled, ...statusConfig.SCHEDULED },
    { label: t.interviews.inProgress, count: stats.inProgress, ...statusConfig.IN_PROGRESS },
    { label: t.interviews.completed, count: stats.completed, ...statusConfig.COMPLETED },
    { label: t.interviews.cancelled, count: stats.cancelled, ...statusConfig.CANCELLED },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={cn('border', stat.borderColor)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900">{stat.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
