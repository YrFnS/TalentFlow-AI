// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Activity, Loader2, Sparkles } from 'lucide-react';

interface WorkflowStatsProps {
  activeCount: number;
  totalExecutions: number;
  runningExecutions: number;
  successRate: number;
}

export default function WorkflowStats({
  activeCount,
  totalExecutions,
  runningExecutions,
  successRate,
}: WorkflowStatsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <Play className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.workflows.activeWorkflows}</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <Activity className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.workflows.totalExecutions}</p>
              <p className="text-xl font-bold">{totalExecutions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.workflows.runningNow}</p>
              <p className="text-xl font-bold">{runningExecutions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950">
              <Sparkles className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.workflows.successRate}</p>
              <p className="text-xl font-bold">{successRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
