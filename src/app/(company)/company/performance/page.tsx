// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CycleStatus = 'active' | 'completed' | 'upcoming';
type TrendDirection = 'up' | 'down' | 'stable';

interface ReviewCycle {
  id: string;
  name: string;
  period: string;
  status: CycleStatus;
  progress: number;
  reviewers: number;
}

interface EmployeeRanking {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  department: string;
  score: number;
  trend: TrendDirection;
}

const cycleStatusConfig: Record<CycleStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0', icon: CheckCircle2 },
  upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0', icon: Clock },
};

const trendConfig: Record<TrendDirection, { icon: React.ElementType; color: string }> = {
  up: { icon: TrendingUp, color: 'text-emerald-600' },
  down: { icon: TrendingDown, color: 'text-red-600' },
  stable: { icon: Minus, color: 'text-amber-600' },
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadgeColor(score: number): string {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0';
  if (score >= 75) return 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0';
  if (score >= 60) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0';
  return 'bg-red-50 text-red-700 dark:bg-red-950 border-0';
}

const cycles: ReviewCycle[] = [];

const rankings: EmployeeRanking[] = [];

export default function PerformancePage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Stats
  const activeReviews = cycles.filter((c) => c.status === 'active').length;
  const completionRate = Math.round(
    (cycles.filter((c) => c.status === 'completed').length / cycles.length) * 100
  );
  const avgScore = Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length);
  const overdue = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.performance.title}</h1>
            <p className="text-sm text-muted-foreground">{t.performance.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.performance.startNewReview}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.performance.startNewReview}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.performance.cycleName}</label>
                <Input placeholder={t.performance.cycleNamePlaceholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.performance.periodStart}</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.performance.periodEnd}</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.performance.participants}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.performance.selectParticipants} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.performance.allEmployees}</SelectItem>
                    <SelectItem value="engineering">{t.performance.engineering}</SelectItem>
                    <SelectItem value="design">{t.performance.design}</SelectItem>
                    <SelectItem value="marketing">{t.performance.marketing}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.performance.criteria}</label>
                <Input placeholder={t.performance.criteriaPlaceholder} />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Quality', 'Productivity', 'Communication', 'Leadership', 'Innovation'].map((c) => (
                    <Badge key={c} className="text-[10px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 cursor-pointer hover:bg-teal-100">
                      + {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.performance.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.performance.createCycle}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.performance.activeReviews}</p>
                <p className="text-xl font-bold">{activeReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.performance.completionRate}</p>
                <p className="text-xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.performance.averageScore}</p>
                <p className="text-xl font-bold">{avgScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.performance.overdue}</p>
                <p className="text-xl font-bold">{overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Review Cycles */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                {t.performance.reviewCycles}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cycles.map((cycle) => {
                const statusCfg = cycleStatusConfig[cycle.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={cycle.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cycle.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cycle.period}</p>
                      </div>
                      <Badge className={cn('text-[10px] shrink-0', statusCfg.color)}>
                        <StatusIcon className="h-3 w-3 me-1" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    {cycle.status !== 'upcoming' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">{t.performance.progress}</span>
                          <span className="text-[10px] font-medium">{cycle.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${cycle.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{cycle.reviewers} {t.performance.reviewers}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Employee Performance Ranking */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                {t.performance.employeeRanking}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-12">{t.performance.rank}</TableHead>
                    <TableHead className="text-xs">{t.performance.employee}</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">{t.performance.department}</TableHead>
                    <TableHead className="text-xs">{t.performance.score}</TableHead>
                    <TableHead className="text-xs w-16">{t.performance.trend}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((emp) => {
                    const TrendIcon = trendConfig[emp.trend].icon;
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="text-sm font-bold py-2">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                            emp.rank <= 3
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {emp.rank}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-blue-600 text-white text-[8px]">
                                {emp.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2 hidden sm:table-cell">{emp.department}</TableCell>
                        <TableCell className="py-2">
                          <Badge className={cn('text-[10px]', getScoreBadgeColor(emp.score))}>
                            {emp.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <TrendIcon className={cn('h-4 w-4', trendConfig[emp.trend].color)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
