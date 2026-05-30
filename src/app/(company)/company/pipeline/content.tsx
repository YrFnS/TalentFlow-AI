'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Sparkles,
  MapPin,
  Briefcase,
  Filter,
  X,
  GripVertical,
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  isDefault: boolean;
  currentStageApplications: Application[];
}

interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  appliedAt: string;
  candidate: {
    user: { id: string; name: string; email: string; image: string | null };
  };
  job: { id: string; title: string };
}

interface Job {
  id: string;
  title: string;
}

// Stage analytics will be calculated from actual pipeline data
interface StageAnalytic {
  stageName: string;
  avgDays: number;
  conversionRate: number;
  color: string;
}

function ApplicationCard({ app, isDragging }: { app: Application; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: app.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials = app.candidate.user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  const scoreColor =
    (app.matchScore || 0) >= 85
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
      : (app.matchScore || 0) >= 70
      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30'
      : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'p-3 rounded-lg border border-border/50 bg-card hover:shadow-md transition-all active:cursor-grabbing card-glow',
        isDragging && 'opacity-50 shadow-lg rotate-2 scale-105'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag Handle */}
        <button {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5 opacity-30 hover:opacity-70 transition-opacity touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        {/* Avatar */}
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{app.candidate.user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{app.job.title}</p>
        </div>
        {app.matchScore && (
          <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold', scoreColor)}>
            <Sparkles className="w-2.5 h-2.5" />
            {app.matchScore}%
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground">
          {new Date(app.appliedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  applications,
}: {
  stage: PipelineStage;
  applications: Application[];
}) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
      {/* Stage Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <h3 className="text-sm font-semibold flex-1">{stage.name}</h3>
        <Badge className="text-[10px] px-2 py-0 h-5 font-semibold animate-bounce-subtle" style={{ backgroundColor: stage.color, color: 'white' }}>
          {applications.length}
        </Badge>
      </div>

      {/* Application Cards */}
      <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[120px] p-3 rounded-lg bg-muted/30 border-2 border-dashed border-teal-200/40 dark:border-teal-800/40 transition-colors hover:border-teal-400/60 dark:hover:border-teal-600/60">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/60 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-teal-300/50 dark:border-teal-700/50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-teal-400/60 dark:text-teal-600/60" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-teal-600/60 dark:text-teal-400/60">Drop candidates here</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">Drag & drop to move</p>
              </div>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelinePage() {
  const { t } = useI18n();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#14b8a6');
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchPipeline = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      const seedData = await seedRes.json();
      const cId = seedData.companyId;
      setCompanyId(cId);

      const [stagesRes, jobsRes] = await Promise.all([
        fetch(`/api/pipeline-stages?companyId=${cId}`),
        fetch(`/api/jobs?companyId=${cId}`),
      ]);

      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setStages(stagesData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const getFilteredApplications = (stage: PipelineStage) => {
    let apps = stage.currentStageApplications || [];
    if (selectedJob !== 'all') {
      apps = apps.filter((a: Application) => a.job.id === selectedJob);
    }
    return apps;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Could add intermediate feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appId = active.id as string;
    const overId = over.id as string;
    let targetStageId: string | null = null;

    for (const stage of stages) {
      const apps = getFilteredApplications(stage);
      if (stage.id === overId || apps.some((a: Application) => a.id === overId)) {
        targetStageId = stage.id;
        break;
      }
    }

    if (targetStageId) {
      const updatedStages = stages.map((stage) => {
        const apps = [...getFilteredApplications(stage)];
        const appIndex = apps.findIndex((a: Application) => a.id === appId);

        if (appIndex !== -1) {
          const [movedApp] = apps.splice(appIndex, 1);
          return { ...stage, currentStageApplications: apps };
        }

        if (stage.id === targetStageId) {
          let movedApp: Application | null = null;
          for (const s of stages) {
            const found = getFilteredApplications(s).find((a: Application) => a.id === appId);
            if (found) {
              movedApp = found;
              break;
            }
          }
          if (movedApp) {
            return { ...stage, currentStageApplications: [...getFilteredApplications(stage), { ...movedApp, currentStageId: targetStageId }] };
          }
        }

        return stage;
      });

      setStages(updatedStages);

      try {
        await fetch('/api/applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: appId, currentStageId: targetStageId }),
        });
      } catch (error) {
        console.error('Failed to update application stage:', error);
        fetchPipeline();
      }
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim() || !companyId) return;
    try {
      const res = await fetch('/api/pipeline-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: newStageName,
          color: newStageColor,
        }),
      });
      if (res.ok) {
        setNewStageName('');
        setNewStageColor('#14b8a6');
        setAddStageOpen(false);
        fetchPipeline();
      }
    } catch (error) {
      console.error('Failed to add stage:', error);
    }
  };

  const activeApp = activeId
    ? stages.flatMap((s) => s.currentStageApplications).find((a: Application) => a.id === activeId)
    : null;

  const totalApplications = stages.reduce(
    (sum, s) => sum + (s.currentStageApplications?.length || 0),
    0
  );

  // Calculate stage analytics from actual pipeline data
  const stageAnalytics: StageAnalytic[] = stages.map((stage, i) => {
    const apps = stage.currentStageApplications || [];
    const nextStage = stages[i + 1];
    const nextApps = nextStage ? (nextStage.currentStageApplications?.length || 0) : 0;
    const conversionRate = apps.length > 0 && nextStage ? Math.round((nextApps / apps.length) * 100) : (i === stages.length - 1 ? 100 : 0);
    return {
      stageName: stage.name,
      avgDays: 0,
      conversionRate,
      color: stage.color,
    };
  });

  const bottleneck = stageAnalytics.length > 0
    ? stageAnalytics.reduce((max, s) => s.avgDays > max.avgDays ? s : max, stageAnalytics[0])
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.pipeline.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalApplications} applications across {stages.length} stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[200px] h-9">
              <Briefcase className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-teal-300 dark:border-teal-700">
                <Plus className="w-4 h-4 me-2" />
                {t.pipeline.addStage}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.pipeline.addStage}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>{t.pipeline.stageName}</Label>
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="e.g., Technical Assessment"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t.pipeline.stageColor}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input value={newStageColor} onChange={(e) => setNewStageColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <Button onClick={handleAddStage} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Add Stage
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Analytics Summary */}
      <Card className="border-teal-200/50 dark:border-teal-800/50 animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              {t.pipelineAnalytics?.title || 'Pipeline Analytics'}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAnalyticsExpanded(!analyticsExpanded)}>
              {analyticsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {analyticsExpanded && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stage Metrics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  {t.pipelineAnalytics?.avgTimeByStage || 'Average Time in Stage'}
                </div>
                {stageAnalytics.length > 0 ? (
                  stageAnalytics.filter(s => s.avgDays > 0).map((stage) => (
                    <div key={stage.stageName} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-medium w-20 shrink-0">{stage.stageName}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((stage.avgDays / 8) * 100, 100)}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-end">{stage.avgDays}d</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No stage data available</p>
                )}

                {/* Bottleneck Indicator */}
                {bottleneck && bottleneck.avgDays > 0 && (
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {t.pipelineAnalytics?.bottleneck || 'Bottleneck'}: {bottleneck.stageName}
                      </span>
                      <span className="text-[10px] text-muted-foreground ms-1">({bottleneck.avgDays}d avg)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Conversion Rates + Mini Funnel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t.pipelineAnalytics?.conversionRate || 'Stage Conversion Rates'}
                </div>
                {stageAnalytics.slice(0, -1).map((stage, i) => {
                  const nextStage = stageAnalytics[i + 1];
                  return (
                    <div key={stage.stageName} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-20 shrink-0 truncate">{stage.stageName}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="w-20 shrink-0 truncate">{nextStage.stageName}</span>
                      <div className="flex-1" />
                      <span className={cn(
                        'font-semibold',
                        stage.conversionRate >= 60 ? 'text-emerald-600 dark:text-emerald-400' :
                        stage.conversionRate >= 40 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      )}>
                        {stage.conversionRate}%
                      </span>
                    </div>
                  );
                })}

                {/* Mini Funnel */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-col items-center gap-0.5">
                    {stageAnalytics.map((stage, i) => {
                      const widthPct = 100 - (i * 18);
                      return (
                        <div
                          key={stage.stageName}
                          className="rounded-sm flex items-center justify-center text-white text-[9px] font-semibold transition-all duration-300"
                          style={{
                            width: `${widthPct}%`,
                            height: '20px',
                            backgroundColor: stage.color,
                            minWidth: '40px',
                          }}
                        >
                          {stage.stageName}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[280px] w-[280px] flex-shrink-0">
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-6 ms-auto" />
                </div>
                <div className="space-y-2 p-1 rounded-lg bg-muted/30">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                applications={getFilteredApplications(stage)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApp && <ApplicationCard app={activeApp} isDragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
