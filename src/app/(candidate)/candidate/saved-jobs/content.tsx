// @ts-nocheck
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  Search,
  ArrowUpDown,
  Briefcase,
  ExternalLink,
  Trash2,
  Zap,
  Building2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


type SortOption = 'dateSaved' | 'salaryHigh' | 'salaryLow' | 'relevant';
type WorkMode = 'remote' | 'hybrid' | 'onsite';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  gradient: string;
  location: string;
  workMode: WorkMode;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  savedDate: string;
  savedDaysAgo: number;
  postedDaysAgo: number;
  matchScore: number;
  saved: boolean;
}

export default function SavedJobsPage() {
  const { t, locale } = useI18n();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dateSaved');

  const isAr = locale === 'ar';

  const filteredAndSortedJobs = useMemo(() => {
    let jobs = savedJobs.filter((job) => job.saved);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'dateSaved':
        jobs.sort((a, b) => a.savedDaysAgo - b.savedDaysAgo);
        break;
      case 'salaryHigh':
        jobs.sort((a, b) => b.salaryMax - a.salaryMax);
        break;
      case 'salaryLow':
        jobs.sort((a, b) => a.salaryMin - b.salaryMin);
        break;
      case 'relevant':
        jobs.sort((a, b) => b.matchScore - a.matchScore);
        break;
    }

    return jobs;
  }, [savedJobs, searchQuery, sortBy]);

  const savedCount = savedJobs.filter((j) => j.saved).length;

  const handleRemoveJob = (id: string) => {
    setSavedJobs((prev) => prev.map((j) => (j.id === id ? { ...j, saved: false } : j)));
  };

  const handleRemoveAll = () => {
    setSavedJobs((prev) => prev.map((j) => ({ ...j, saved: false })));
  };

  const handleApplyAll = () => {
    // Visual feedback only
    alert(isAr ? 'سيتم التقديم على جميع الوظائف المحفوظة' : 'Applying to all saved jobs...');
  };

  const getWorkModeBadge = (mode: WorkMode) => {
    const modeMap: Record<WorkMode, { label: string; color: string }> = {
      remote: {
        label: isAr ? 'عن بُعد' : 'Remote',
        color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      },
      hybrid: {
        label: isAr ? 'هجين' : 'Hybrid',
        color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      },
      onsite: {
        label: isAr ? 'في الموقع' : 'On-site',
        color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      },
    };
    return modeMap[mode];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgoText = (days: number) => {
    if (days === 0) return isAr ? 'اليوم' : 'Today';
    if (days === 1) return isAr ? 'أمس' : 'Yesterday';
    return isAr ? `منذ ${days} أيام` : `${days}d ago`;
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-teal-600 dark:text-teal-400';
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  const getMatchBg = (score: number) => {
    if (score >= 90) return 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800';
    if (score >= 75) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-muted/50 border-border';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isAr ? 'الوظائف المحفوظة' : 'Saved Jobs'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'الوظائف التي حفظتها للاحقاً' : "Jobs you've bookmarked for later"}
              </p>
            </div>
            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
              {isAr ? `${savedCount} وظائف محفوظة` : `${savedCount} jobs saved`}
            </Badge>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'ابحث في الوظائف المحفوظة...' : 'Search saved jobs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-10 bg-background border-border/50 focus-visible:ring-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-10">
                <ArrowUpDown className="h-4 w-4 me-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateSaved">{isAr ? 'تاريخ الحفظ' : 'Date Saved'}</SelectItem>
                <SelectItem value="salaryHigh">{isAr ? 'الراتب: من الأعلى' : 'Salary: High to Low'}</SelectItem>
                <SelectItem value="salaryLow">{isAr ? 'الراتب: من الأقل' : 'Salary: Low to High'}</SelectItem>
                <SelectItem value="relevant">{isAr ? 'الأكثر صلة' : 'Most Relevant'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {savedCount > 0 && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              onClick={handleApplyAll}
            >
              <Zap className="h-3.5 w-3.5 me-1.5" />
              {isAr ? 'التقديم على الكل' : 'Apply to All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={handleRemoveAll}
            >
              <Trash2 className="h-3.5 w-3.5 me-1.5" />
              {isAr ? 'حذف الكل' : 'Remove All'}
            </Button>
          </div>
        )}
      </div>

      {/* Jobs Grid */}
      {filteredAndSortedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedJobs.map((job, index) => {
              const mode = getWorkModeBadge(job.workMode);
              return (
                <div
                  key={job.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <Card className="group h-full glass-card hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${job.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                            {job.companyInitials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm leading-tight truncate" title={job.title}>
                              {job.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate" title={job.company}>
                              {job.company}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-teal-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                          onClick={() => handleRemoveJob(job.id)}
                          title={isAr ? 'إزالة' : 'Remove'}
                        >
                          <BookmarkCheck className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Location & Work Mode */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${mode.color}`}>
                          {mode.label}
                        </Badge>
                      </div>

                      {/* Salary */}
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {job.salaryCurrency}{job.salaryMin.toLocaleString()} - {job.salaryCurrency}{job.salaryMax.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/yr</span>
                      </div>

                      {/* Footer: Match Score + Time */}
                      <div className="flex items-center justify-between pt-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium ${getMatchBg(job.matchScore)}`}>
                          <Sparkles className={`h-3 w-3 ${getMatchColor(job.matchScore)}`} />
                          <span className={getMatchColor(job.matchScore)}>
                            {job.matchScore}% {isAr ? 'تطابق' : 'Match'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isAr ? `حُفظ ${getDaysAgoText(job.savedDaysAgo)}` : `Saved ${getDaysAgoText(job.savedDaysAgo)}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {getDaysAgoText(job.postedDaysAgo)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm"
                          asChild
                        >
                          <Link href={`/candidate/jobs/${job.id}`}>
                            <ExternalLink className="h-3 w-3 me-1" />
                            {isAr ? 'قدّم الآن' : 'Apply Now'}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                          onClick={() => handleRemoveJob(job.id)}
                        >
                          {isAr ? 'إزالة' : 'Remove'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
        </div>
      ) : (
        /* Empty State */
        <div
          className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up"
        >
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950/50 dark:to-emerald-950/50 flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-teal-500/60" />
            </div>
            <div className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-background border-2 border-teal-200 dark:border-teal-800 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-teal-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isAr ? 'لا توجد وظائف محفوظة بعد' : 'No saved jobs yet'}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            {isAr ? 'تصفح الوظائف واحفظ تلك التي تعجبك!' : 'Browse jobs and save the ones you like!'}
          </p>
          <Button
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
            asChild
          >
            <Link href="/candidate/jobs">
              <Search className="h-4 w-4 me-2" />
              {isAr ? 'تصفح الوظائف' : 'Browse Jobs'}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
