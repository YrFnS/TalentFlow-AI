// @ts-nocheck
'use client';

import React from 'react';
import { BookOpen, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  totalAssessments: number;
  activeAssessments: number;
  avgScore: number;
  skillsCovered: number;
  sa: Record<string, string>;
}

export default function StatsCards({
  totalAssessments,
  activeAssessments,
  avgScore,
  skillsCovered,
  sa,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{sa.totalAssessments}</p>
              <p className="text-2xl font-bold">{totalAssessments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{sa.activeAssessments}</p>
              <p className="text-2xl font-bold">{activeAssessments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{sa.avgScore}</p>
              <p className="text-2xl font-bold">{avgScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/50">
              <Target className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{sa.skillsCovered}</p>
              <p className="text-2xl font-bold">{skillsCovered}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
