// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  ThumbsUp,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type FeedbackCategory = 'UI/UX' | 'Performance' | 'Features' | 'Support' | 'Other';

interface FeedbackEntry {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  category: FeedbackCategory;
}

const categoryColors: Record<FeedbackCategory, string> = {
  'UI/UX': 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  'Performance': 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  'Features': 'bg-violet-50 text-violet-700 dark:bg-violet-950 border-0',
  'Support': 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  'Other': 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-0',
};

// No mock data - feedback comes from real data only

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredFeedback = feedback.filter((fb) => {
    const matchesSearch = fb.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.comment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || fb.rating === parseInt(ratingFilter);
    const matchesCategory = categoryFilter === 'all' || fb.category === categoryFilter;
    return matchesSearch && matchesRating && matchesCategory;
  });

  // Stats - all derived from real data, zero/N/A when empty
  const totalFeedback = feedback.length;
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length).toFixed(1)
    : '0.0';
  const responseRate = 'N/A';
  const npsScore = 0;

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedback.filter((fb) => fb.rating === r).length,
  }));
  const maxDist = Math.max(...ratingDist.map((d) => d.count));

  // Category breakdown
  const categories: FeedbackCategory[] = ['UI/UX', 'Performance', 'Features', 'Support', 'Other'];
  const categoryBreakdown = categories.map((cat) => ({
    category: cat,
    count: feedback.filter((fb) => fb.category === cat).length,
    percentage: feedback.length > 0 ? Math.round((feedback.filter((fb) => fb.category === cat).length / feedback.length) * 100) : 0,
  }));

  const categoryDotColors: Record<FeedbackCategory, string> = {
    'UI/UX': 'bg-slate-500',
    'Performance': 'bg-amber-500',
    'Features': 'bg-violet-500',
    'Support': 'bg-blue-500',
    'Other': 'bg-slate-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.feedback.title}</h1>
            <p className="text-sm text-muted-foreground">{t.feedback.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.feedback.totalFeedback}</p>
                <p className="text-xl font-bold">{totalFeedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.feedback.avgRating}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{avgRating}</p>
                  <StarRating rating={feedback.length > 0 ? Math.round(parseFloat(avgRating)) : 0} size="sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                <ThumbsUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.feedback.responseRate}</p>
                <p className="text-xl font-bold">{responseRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.feedback.npsScore}</p>
                <p className="text-xl font-bold">+{npsScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rating Distribution + Category Breakdown */}
        <div className="space-y-6">
          {/* Rating Distribution */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                {t.feedback.ratingDistribution}
              </h3>
              <div className="space-y-3">
                {ratingDist.map((d) => (
                  <div key={d.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 shrink-0">
                      <span className="text-sm font-medium">{d.rating}</span>
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${maxDist > 0 ? (d.count / maxDist) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-6 text-end">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                {t.feedback.categoryBreakdown}
              </h3>
              <div className="space-y-3">
                {categoryBreakdown.map((cb) => (
                  <div key={cb.category} className="flex items-center gap-3">
                    <div className={cn('h-3 w-3 rounded-full shrink-0', categoryDotColors[cb.category])} />
                    <span className="text-sm flex-1">{cb.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', categoryDotColors[cb.category])}
                          style={{ width: `${cb.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-10 text-end">{cb.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Filters + Feedback List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.feedback.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t.feedback.filterRating} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.feedback.allRatings}</SelectItem>
                <SelectItem value="5">5 {t.feedback.stars}</SelectItem>
                <SelectItem value="4">4 {t.feedback.stars}</SelectItem>
                <SelectItem value="3">3 {t.feedback.stars}</SelectItem>
                <SelectItem value="2">2 {t.feedback.stars}</SelectItem>
                <SelectItem value="1">1 {t.feedback.star}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.feedback.filterCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.feedback.allCategories}</SelectItem>
                <SelectItem value="UI/UX">UI/UX</SelectItem>
                <SelectItem value="Performance">{t.feedback.catPerformance}</SelectItem>
                <SelectItem value="Features">{t.feedback.catFeatures}</SelectItem>
                <SelectItem value="Support">{t.feedback.catSupport}</SelectItem>
                <SelectItem value="Other">{t.feedback.catOther}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback List */}
          <div className="space-y-3">
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">{t.feedback.noFeedback}</p>
              </div>
            ) : (
              filteredFeedback.map((fb) => (
                <Card key={fb.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {fb.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{fb.user}</span>
                            <Badge className={cn('text-[10px]', categoryColors[fb.category])}>
                              {fb.category}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{fb.date}</span>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={fb.rating} size="sm" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{fb.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
