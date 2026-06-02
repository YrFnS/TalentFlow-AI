// @ts-nocheck
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Clock, CheckCircle2, Star } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    completed: number;
    avgRating: string;
  };
  t: Record<string, string>;
}

export default function StatsCards({ stats, t }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.totalRequests}</p>
              <p className="text-xl font-bold">{stats.total}</p>
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
              <p className="text-xs text-muted-foreground">{t.pendingRequests}</p>
              <p className="text-xl font-bold">{stats.pending}</p>
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
              <p className="text-xs text-muted-foreground">{t.completedRequests}</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.averageRating}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold">{stats.avgRating}</p>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
