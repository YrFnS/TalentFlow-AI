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
  Star,
  Plus,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  Filter,
  Users,
  Calendar,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ReviewStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type CycleStatus = 'Active' | 'Planning' | 'Completed';

interface ReviewCycle {
  id: string;
  name: string;
  period: string;
  status: CycleStatus;
  totalReviews: number;
  completedReviews: number;
  dueDate: string;
}

interface EmployeeReview {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  reviewerName: string;
  reviewerInitials: string;
  rating: number;
  status: ReviewStatus;
  dueDate: string;
  cycle: string;
}

const cycleStatusColors: Record<CycleStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Planning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Completed: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
};

const reviewStatusColors: Record<ReviewStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  'In Progress': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Overdue: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
};

const initialCycles: ReviewCycle[] = [];

const initialReviews: EmployeeReview[] = [];

const allStatuses: ReviewStatus[] = ['Pending', 'In Progress', 'Completed', 'Overdue'];
const allDepartments = ['Engineering', 'Design', 'Data', 'Marketing', 'Product', 'Sales', 'People'];

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < Math.floor(rating)
              ? 'text-amber-500 fill-amber-500'
              : i < rating
              ? 'text-amber-500 fill-amber-200 dark:fill-amber-800'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
      <span className="text-xs font-medium ms-1">{rating > 0 ? rating.toFixed(1) : '—'}</span>
    </div>
  );
}

export default function ReviewsContent() {
  const { t } = useI18n();
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredReviews = initialReviews.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterDept !== 'all' && r.department !== filterDept) return false;
    if (filterRating !== 'all') {
      const ratingVal = parseFloat(filterRating);
      if (ratingVal === 4 && r.rating < 4) return false;
      if (ratingVal === 3 && (r.rating < 3 || r.rating >= 4)) return false;
      if (ratingVal === 2 && (r.rating < 2 || r.rating >= 3)) return false;
      if (ratingVal === 0 && r.rating > 0) return false;
    }
    return true;
  });

  const totalReviews = initialReviews.length;
  const pendingCount = initialReviews.filter(r => r.status === 'Pending').length;
  const completedCount = initialReviews.filter(r => r.status === 'Completed').length;
  const ratedReviews = initialReviews.filter(r => r.rating > 0);
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.reviews.title}</h1>
            <p className="text-sm text-muted-foreground">{t.reviews.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.reviews.createReview}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.reviews.createReview}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reviews.selectEmployee}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.reviews.selectEmployeePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {initialReviews.map(r => (
                      <SelectItem key={r.id} value={r.employeeName}>{r.employeeName} — {r.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reviews.selectReviewer}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.reviews.selectReviewerPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alex Rivera">Alex Rivera</SelectItem>
                    <SelectItem value="Maria Garcia">Maria Garcia</SelectItem>
                    <SelectItem value="David Kim">David Kim</SelectItem>
                    <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                    <SelectItem value="Omar Patel">Omar Patel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.reviews.reviewPeriod}</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t.reviews.selectPeriod} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                      <SelectItem value="Q2 2025">Q2 2025</SelectItem>
                      <SelectItem value="Q3 2025">Q3 2025</SelectItem>
                      <SelectItem value="Q4 2025">Q4 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.reviews.dueDate}</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reviews.goals}</label>
                <Input placeholder={t.reviews.goalsPlaceholder} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.common.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.reviews.totalReviews}</p>
                <p className="text-xl font-bold">{totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.reviews.pending}</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.reviews.completed}</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-700 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.reviews.avgRating}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Cycles */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          {t.reviews.reviewCycles}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {initialCycles.map((cycle) => (
            <Card key={cycle.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold">{cycle.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{cycle.period}</p>
                  </div>
                  <Badge className={cn('text-[10px]', cycleStatusColors[cycle.status])}>
                    {cycle.status}
                  </Badge>
                </div>
                {cycle.totalReviews > 0 && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{t.reviews.progress}</span>
                        <span className="font-medium">{cycle.completedReviews}/{cycle.totalReviews}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                          style={{ width: `${(cycle.completedReviews / cycle.totalReviews) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{t.reviews.dueDate}: {cycle.dueDate}</span>
                    </div>
                  </>
                )}
                {cycle.totalReviews === 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>{t.reviews.notStarted}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReviewStatus | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.reviews.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reviews.allStatuses}</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={t.reviews.filterDepartment} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reviews.allDepartments}</SelectItem>
            {allDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.reviews.filterRating} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reviews.allRatings}</SelectItem>
            <SelectItem value="4">4+ {t.reviews.stars}</SelectItem>
            <SelectItem value="3">3-4 {t.reviews.stars}</SelectItem>
            <SelectItem value="2">2-3 {t.reviews.stars}</SelectItem>
            <SelectItem value="0">{t.reviews.notRated}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee Reviews Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.reviews.employeeReviews}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.employee}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.department}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.reviewer}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.rating}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.status}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.reviews.dueDate}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[9px]">
                            {review.employeeInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{review.employeeName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{review.department}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                            {review.reviewerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{review.reviewerName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', reviewStatusColors[review.status])}>
                        {review.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{review.dueDate}</span>
                    </td>
                  </tr>
                ))}
                {filteredReviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.reviews.noReviews}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
