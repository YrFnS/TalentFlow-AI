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
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

type ObjectiveStatus = 'on-track' | 'at-risk' | 'behind' | 'complete';
type Confidence = 'high' | 'medium' | 'low';

interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  confidence: Confidence;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  owner: string;
  ownerInitials: string;
  quarter: string;
  status: ObjectiveStatus;
  keyResults: KeyResult[];
}

const statusConfig: Record<ObjectiveStatus, { label: string; color: string; icon: React.ElementType }> = {
  'on-track': { label: 'On Track', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: CheckCircle2 },
  'at-risk': { label: 'At Risk', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: AlertTriangle },
  'behind': { label: 'Behind', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0', icon: Clock },
  'complete': { label: 'Complete', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0', icon: CheckCircle2 },
};

const confidenceConfig: Record<Confidence, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low', color: 'text-red-600 dark:text-red-400' },
};

const objectives: Objective[] = [];

const filterTabs: { key: 'all' | ObjectiveStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'on-track', label: 'On Track' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'behind', label: 'Behind' },
  { key: 'complete', label: 'Complete' },
];

export default function GoalsPage() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<'all' | ObjectiveStatus>('all');
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2026');
  const [newKeyResults, setNewKeyResults] = useState([{ title: '', target: '', unit: '' }]);

  const filteredObjectives = activeFilter === 'all'
    ? objectives
    : objectives.filter(o => o.status === activeFilter);

  const totalObjectives = objectives.length;
  const totalKeyResults = objectives.reduce((sum, o) => sum + o.keyResults.length, 0);
  const onTrackCount = objectives.filter(o => o.status === 'on-track').length;
  const atRiskCount = objectives.filter(o => o.status === 'at-risk').length;

  const overallProgress = 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  const toggleObjective = (id: string) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getObjectiveProgress = (obj: Objective) => {
    const total = obj.keyResults.reduce((sum, kr) => sum + Math.min((kr.current / kr.target) * 100, 100), 0);
    return Math.round(total / obj.keyResults.length);
  };

  const addKeyResult = () => {
    setNewKeyResults([...newKeyResults, { title: '', target: '', unit: '' }]);
  };

  const removeKeyResult = (index: number) => {
    setNewKeyResults(newKeyResults.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.goals.title}</h1>
            <p className="text-sm text-muted-foreground">{t.goals.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1 2026">Q1 2026</SelectItem>
              <SelectItem value="Q2 2026">Q2 2026</SelectItem>
              <SelectItem value="Q3 2026">Q3 2026</SelectItem>
              <SelectItem value="Q4 2026">Q4 2026</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                <Plus className="h-4 w-4 me-2" />
                {t.goals.createObjective}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.goals.createObjective}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.goals.objectiveTitle}</label>
                  <Input placeholder={t.goals.objectiveTitlePlaceholder} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.goals.description}</label>
                  <Input placeholder={t.goals.descriptionPlaceholder} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.goals.owner}</label>
                    <Input placeholder={t.goals.ownerPlaceholder} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.goals.quarter}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t.goals.selectQuarter} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                        <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                        <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                        <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t.goals.keyResults}</label>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addKeyResult}>
                      <Plus className="h-3 w-3" />
                      {t.goals.addKeyResult}
                    </Button>
                  </div>
                  {newKeyResults.map((kr, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/10">
                      <Input
                        placeholder={t.goals.krTitlePlaceholder}
                        className="flex-1 h-8 text-xs"
                        value={kr.title}
                        onChange={(e) => {
                          const updated = [...newKeyResults];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setNewKeyResults(updated);
                        }}
                      />
                      <Input
                        placeholder={t.goals.krTargetPlaceholder}
                        className="w-20 h-8 text-xs"
                        value={kr.target}
                        onChange={(e) => {
                          const updated = [...newKeyResults];
                          updated[i] = { ...updated[i], target: e.target.value };
                          setNewKeyResults(updated);
                        }}
                      />
                      <Input
                        placeholder={t.goals.krUnitPlaceholder}
                        className="w-16 h-8 text-xs"
                        value={kr.unit}
                        onChange={(e) => {
                          const updated = [...newKeyResults];
                          updated[i] = { ...updated[i], unit: e.target.value };
                          setNewKeyResults(updated);
                        }}
                      />
                      {newKeyResults.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeKeyResult(i)}>
                          <Plus className="h-3.5 w-3.5 rotate-45" />
                        </Button>
                      )}
                    </div>
                  ))}
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
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.goals.totalObjectives}</p>
                <p className="text-xl font-bold">{totalObjectives}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.goals.totalKeyResults}</p>
                <p className="text-xl font-bold">{totalKeyResults}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.goals.onTrack}</p>
                <p className="text-xl font-bold">{onTrackCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.goals.atRisk}</p>
                <p className="text-xl font-bold">{atRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quarterly Progress Ring */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.goals.quarterlyProgress}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="goalsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(20, 184, 166)" />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="url(#goalsGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold gradient-text">{overallProgress}%</span>
                <span className="text-[10px] text-muted-foreground">{t.goals.overallCompletion}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 w-full">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const count = objectives.filter(o => o.status === key).length;
                return (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium">{cfg.label}</span>
                    <span className="text-xs text-muted-foreground ms-auto">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Objectives List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 text-xs shrink-0',
                  activeFilter === tab.key
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 border-0'
                    : 'hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-800'
                )}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.key === 'all' ? t.goals.all : statusConfig[tab.key].label}
                {tab.key !== 'all' && (
                  <Badge className="ms-1.5 h-4 min-w-4 px-1 text-[9px] bg-white/20 border-0">
                    {objectives.filter(o => o.status === tab.key).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Objective Cards */}
          <div className="space-y-3">
            {filteredObjectives.map((obj) => {
              const isExpanded = expandedObjectives.has(obj.id);
              const progress = getObjectiveProgress(obj);
              const statusCfg = statusConfig[obj.status];
              const StatusIcon = statusCfg.icon;

              return (
                <Card key={obj.id} className="border-border/50 gradient-border-start overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleObjective(obj.id)}
                      className="w-full text-start p-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px]">
                            {obj.ownerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold truncate">{obj.title}</h3>
                            <Badge className={cn('text-[10px] shrink-0', statusCfg.color)}>
                              <StatusIcon className="h-3 w-3 me-1" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{obj.owner} · {obj.quarter}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1">
                              <Progress value={progress} className="h-1.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground shrink-0">{progress}%</span>
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/50 bg-muted/5 p-4 space-y-3">
                        <p className="text-xs text-muted-foreground">{obj.description}</p>
                        {obj.keyResults.map((kr) => {
                          const krProgress = Math.min((kr.current / kr.target) * 100, 100);
                          const confCfg = confidenceConfig[kr.confidence];
                          return (
                            <div key={kr.id} className="p-3 rounded-lg border border-border/30 bg-background/50 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-medium">{kr.title}</h4>
                                <Select defaultValue={kr.confidence}>
                                  <SelectTrigger className="w-24 h-6 text-[10px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">
                                      <span className={confidenceConfig.high.color}>{t.goals.confidenceHigh}</span>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      <span className={confidenceConfig.medium.color}>{t.goals.confidenceMedium}</span>
                                    </SelectItem>
                                    <SelectItem value="low">
                                      <span className={confidenceConfig.low.color}>{t.goals.confidenceLow}</span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <Progress value={krProgress} className="h-1.5" />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                  {kr.current}/{kr.target} {kr.unit}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredObjectives.length === 0 && (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t.goals.noObjectivesFound}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
