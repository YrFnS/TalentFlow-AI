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
  Map,
  Plus,
  Filter,
  LayoutGrid,
  Columns3,
  Circle,
  User,
  Eye,
  Clock,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

type Category = 'Core' | 'AI' | 'UX' | 'Integration' | 'Security';
type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
type FeatureStatus = 'Planned' | 'In Progress' | 'In Review' | 'Shipped';

interface Feature {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: FeatureStatus;
  quarter: string;
  assignee: string;
  assigneeInitials: string;
  progress: number;
}

const categoryColors: Record<Category, string> = {
  Core: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  AI: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  UX: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400 border-0',
  Integration: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Security: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
};

const priorityColors: Record<Priority, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-500',
  Low: 'bg-slate-400',
};

const statusConfig: Record<FeatureStatus, { color: string; icon: React.ElementType }> = {
  Planned: { color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0', icon: Clock },
  'In Progress': { color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0', icon: ArrowRight },
  'In Review': { color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: Eye },
  Shipped: { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: Rocket },
};

// No mock data - roadmap features come from real data only

const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
const allStatuses: FeatureStatus[] = ['Planned', 'In Progress', 'In Review', 'Shipped'];
const allCategories: Category[] = ['Core', 'AI', 'UX', 'Integration', 'Security'];
const allPriorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export default function RoadmapPage() {
  const { t } = useI18n();
  const [view, setView] = useState<'timeline' | 'kanban'>('timeline');
  const [filterStatus, setFilterStatus] = useState<FeatureStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);

  const filteredFeatures = features.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterPriority !== 'all' && f.priority !== filterPriority) return false;
    if (filterQuarter !== 'all' && f.quarter !== filterQuarter) return false;
    return true;
  });

  const totalFeatures = features.length;
  const inProgressCount = features.filter(f => f.status === 'In Progress').length;
  const plannedCount = features.filter(f => f.status === 'Planned').length;
  const shippedCount = features.filter(f => f.status === 'Shipped').length;

  const renderFeatureCard = (feature: Feature) => {
    const StatusIcon = statusConfig[feature.status].icon;
    return (
      <Card key={feature.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">{feature.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn('w-2 h-2 rounded-full', priorityColors[feature.priority])} title={feature.priority} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-[10px]', categoryColors[feature.category])}>
              {feature.category}
            </Badge>
            <Badge className={cn('text-[10px]', statusConfig[feature.status].color)}>
              <StatusIcon className="h-3 w-3 me-1" />
              {feature.status}
            </Badge>
          </div>
          {feature.status === 'In Progress' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{t.roadmap.progress}</span>
                <span className="text-[10px] font-medium">{feature.progress}%</span>
              </div>
              <Progress value={feature.progress} className="h-1.5" />
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[8px]">
                  {feature.assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">{feature.assignee}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{feature.quarter}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.roadmap.title}</h1>
            <p className="text-sm text-muted-foreground">{t.roadmap.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 px-3 text-xs rounded-none gap-1.5', view === 'timeline' && 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400')}
              onClick={() => setView('timeline')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {t.roadmap.timeline}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 px-3 text-xs rounded-none gap-1.5', view === 'kanban' && 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400')}
              onClick={() => setView('kanban')}
            >
              <Columns3 className="h-3.5 w-3.5" />
              {t.roadmap.kanban}
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                <Plus className="h-4 w-4 me-2" />
                {t.roadmap.addFeature}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.roadmap.addFeature}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.roadmap.featureTitle}</label>
                  <Input placeholder={t.roadmap.featureTitlePlaceholder} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.roadmap.featureDescription}</label>
                  <Input placeholder={t.roadmap.featureDescPlaceholder} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.roadmap.category}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t.roadmap.selectCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.roadmap.priority}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t.roadmap.selectPriority} />
                      </SelectTrigger>
                      <SelectContent>
                        {allPriorities.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.roadmap.quarter}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t.roadmap.selectQuarter} />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map(q => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.roadmap.assignee}</label>
                    <Input placeholder={t.roadmap.assigneePlaceholder} />
                  </div>
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
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Map className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.roadmap.totalFeatures}</p>
                <p className="text-xl font-bold">{totalFeatures}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.roadmap.inProgress}</p>
                <p className="text-xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.roadmap.planned}</p>
                <p className="text-xl font-bold">{plannedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Rocket className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.roadmap.shipped}</p>
                <p className="text-xl font-bold">{shippedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FeatureStatus | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.roadmap.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.roadmap.allStatuses}</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.roadmap.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.roadmap.allCategories}</SelectItem>
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.roadmap.filterPriority} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.roadmap.allPriorities}</SelectItem>
            {allPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterQuarter} onValueChange={setFilterQuarter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.roadmap.filterQuarter} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.roadmap.allQuarters}</SelectItem>
            {quarters.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-6">
          {/* Horizontal Timeline */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[900px]">
              {/* Quarter Headers */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {quarters.map((q) => {
                  const qFeatures = filteredFeatures.filter(f => f.quarter === q);
                  const qShipped = qFeatures.filter(f => f.status === 'Shipped').length;
                  return (
                    <div key={q} className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200/50 dark:border-teal-800/50">
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{q}</span>
                        <Badge className="text-[9px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                          {qFeatures.length} {t.roadmap.features}
                        </Badge>
                        {qShipped > 0 && (
                          <Badge className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
                            <CheckCircle2 className="h-2.5 w-2.5 me-0.5" />
                            {qShipped}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Line */}
              <div className="relative mb-6">
                <div className="absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500" />
                {quarters.map((q, i) => (
                  <div
                    key={q}
                    className="absolute top-0 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-background"
                    style={{ left: `${12.5 + i * 25}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  />
                ))}
              </div>

              {/* Feature Cards by Quarter */}
              <div className="grid grid-cols-4 gap-4">
                {quarters.map((q) => {
                  const qFeatures = filteredFeatures.filter(f => f.quarter === q);
                  return (
                    <div key={q} className="space-y-3">
                      {qFeatures.map(renderFeatureCard)}
                      {qFeatures.length === 0 && (
                        <Card className="border-dashed border-border/50">
                          <CardContent className="p-6 text-center">
                            <p className="text-xs text-muted-foreground">{t.roadmap.noFeatures}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allStatuses.map((status) => {
            const statusFeatures = filteredFeatures.filter(f => f.status === status);
            const StatusIcon = statusConfig[status].icon;
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
                  <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{status}</span>
                  <Badge className="ms-auto text-[10px] bg-background border border-border/50">
                    {statusFeatures.length}
                  </Badge>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {statusFeatures.map((feature) => (
                    <Card key={feature.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-md transition-shadow cursor-grab">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold truncate">{feature.title}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap ms-5">
                          <Badge className={cn('text-[9px]', categoryColors[feature.category])}>
                            {feature.category}
                          </Badge>
                          <span className={cn('w-2 h-2 rounded-full shrink-0', priorityColors[feature.priority])} title={feature.priority} />
                        </div>
                        {feature.status === 'In Progress' && (
                          <div className="ms-5">
                            <Progress value={feature.progress} className="h-1" />
                          </div>
                        )}
                        <div className="flex items-center justify-between ms-5 pt-1 border-t border-border/30">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[7px]">
                                {feature.assigneeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[9px] text-muted-foreground">{feature.assignee}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{feature.quarter}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {statusFeatures.length === 0 && (
                    <Card className="border-dashed border-border/30">
                      <CardContent className="p-6 text-center">
                        <p className="text-xs text-muted-foreground">{t.roadmap.noFeatures}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
