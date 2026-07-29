'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Briefcase,
  GripVertical,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

type Application = {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  appliedAt: string;
  candidate: {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
  job: { id: string; title: string };
};

type Stage = {
  id: string;
  name: string;
  order: number;
  color: string | null;
  isDefault: boolean;
  currentStageApplications: Application[];
};

type Job = { id: string; title: string };

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function stageStatus(stageName: string): ApplicationStatus | undefined {
  const name = stageName.toLowerCase();
  if (name.includes('applied') || name.includes('new')) return 'APPLIED';
  if (name.includes('screen')) return 'SCREENING';
  if (name.includes('interview')) return 'INTERVIEW';
  if (name.includes('reject')) return 'REJECTED';
  return undefined;
}

function isOfferControlledStage(stageName: string) {
  const name = stageName.toLowerCase();
  return name.includes('offer') || name.includes('hire');
}

function CandidateCard({
  application,
  disabled = false,
  overlay = false,
}: {
  application: Application;
  disabled?: boolean;
  overlay?: boolean;
}) {
  const sortable = useSortable({ id: application.id, disabled });
  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      };

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(overlay ? {} : sortable.attributes)}
      className={cn(
        'rounded-xl border bg-card p-3 shadow-sm transition-shadow',
        !disabled && 'hover:shadow-md',
        sortable.isDragging && 'opacity-40',
        overlay && 'w-72 rotate-1 shadow-xl',
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          aria-label="Move candidate"
          disabled={disabled}
          {...(overlay ? {} : sortable.listeners)}
          className={cn(
            'mt-1 rounded p-0.5 text-muted-foreground',
            disabled ? 'cursor-not-allowed opacity-30' : 'cursor-grab active:cursor-grabbing',
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={application.candidate.user.image || undefined} />
          <AvatarFallback>{initials(application.candidate.user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {application.candidate.user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {application.job.title}
          </p>
        </div>
        {application.matchScore != null && (
          <Badge variant="secondary" className="text-[10px]">
            {Math.round(application.matchScore)}%
          </Badge>
        )}
      </div>
      <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
        Applied {new Date(application.appliedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function StageColumn({
  stage,
  applications,
  canEdit,
}: {
  stage: Stage;
  applications: Application[];
  canEdit: boolean;
}) {
  const droppable = useDroppable({
    id: `stage:${stage.id}`,
    disabled: !canEdit || isOfferControlledStage(stage.name),
  });
  const controlled = isOfferControlledStage(stage.name);

  return (
    <section className="w-[290px] shrink-0">
      <header className="mb-3 flex items-center gap-2 px-1">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: stage.color || 'var(--primary)' }}
        />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {stage.name}
        </h2>
        {controlled && <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />}
        <Badge variant="secondary" className="h-5 text-[10px]">
          {applications.length}
        </Badge>
      </header>

      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={droppable.setNodeRef}
          className={cn(
            'min-h-40 space-y-3 rounded-xl border border-dashed bg-muted/30 p-3 transition-colors',
            droppable.isOver && 'border-primary bg-primary/5',
            controlled && 'bg-muted/60',
          )}
        >
          {applications.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center text-center">
              {controlled ? (
                <LockKeyhole className="h-7 w-7 text-muted-foreground" />
              ) : (
                <Plus className="h-7 w-7 text-muted-foreground" />
              )}
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {controlled ? 'Managed by the offer workflow' : 'Drop candidates here'}
              </p>
            </div>
          ) : (
            applications.map((application) => (
              <CandidateCard
                key={application.id}
                application={application}
                disabled={!canEdit || controlled}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export default function PipelinePage() {
  const { user, validateSession } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#14b8a6');
  const [addingStage, setAddingStage] = useState(false);

  const canEdit = [
    'SUPER_ADMIN',
    'ADMIN',
    'COMPANY_ADMIN',
    'HR_MANAGER',
    'RECRUITER',
  ].includes(user?.role || '');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [stagesResponse, jobsResponse] = await Promise.all([
        fetch('/api/pipeline-stages', { cache: 'no-store' }),
        fetch('/api/jobs', { cache: 'no-store' }),
      ]);
      if (!stagesResponse.ok) {
        throw new Error(
          await getApiErrorMessage(stagesResponse, 'Unable to load pipeline'),
        );
      }

      const stageData = await stagesResponse.json();
      const jobData = jobsResponse.ok ? await jobsResponse.json() : [];
      setStages(Array.isArray(stageData) ? stageData : []);
      setJobs(Array.isArray(jobData) ? jobData : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const visibleStages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stages.map((stage) => ({
      ...stage,
      currentStageApplications: stage.currentStageApplications.filter(
        (application) =>
          (jobFilter === 'all' || application.job.id === jobFilter) &&
          (!term ||
            application.candidate.user.name.toLowerCase().includes(term) ||
            application.candidate.user.email.toLowerCase().includes(term) ||
            application.job.title.toLowerCase().includes(term)),
      ),
    }));
  }, [jobFilter, query, stages]);

  const activeApplication = activeId
    ? stages
        .flatMap((stage) => stage.currentStageApplications)
        .find((application) => application.id === activeId) || null
    : null;

  const totalApplications = stages.reduce(
    (total, stage) => total + stage.currentStageApplications.length,
    0,
  );

  function targetStageFromOver(overId: string): Stage | undefined {
    if (overId.startsWith('stage:')) {
      return stages.find((stage) => stage.id === overId.slice(6));
    }
    return stages.find((stage) =>
      stage.currentStageApplications.some((application) => application.id === overId),
    );
  }

  async function moveApplication(applicationId: string, targetStage: Stage) {
    const sourceStage = stages.find((stage) =>
      stage.currentStageApplications.some(
        (application) => application.id === applicationId,
      ),
    );
    if (!sourceStage || sourceStage.id === targetStage.id) return;
    if (isOfferControlledStage(targetStage.name)) {
      toast.info('Offer and hired stages are updated by the secure offer workflow');
      return;
    }

    const moved = sourceStage.currentStageApplications.find(
      (application) => application.id === applicationId,
    );
    if (!moved) return;

    const previous = stages;
    setStages((current) =>
      current.map((stage) => {
        if (stage.id === sourceStage.id) {
          return {
            ...stage,
            currentStageApplications: stage.currentStageApplications.filter(
              (application) => application.id !== applicationId,
            ),
          };
        }
        if (stage.id === targetStage.id) {
          return {
            ...stage,
            currentStageApplications: [moved, ...stage.currentStageApplications],
          };
        }
        return stage;
      }),
    );

    try {
      const status = stageStatus(targetStage.name);
      const response = await apiFetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicationId,
          currentStageId: targetStage.id,
          ...(status ? { status } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to move candidate'),
        );
      }
      toast.success(`Moved to ${targetStage.name}`);
    } catch (reason) {
      setStages(previous);
      toast.error(reason instanceof Error ? reason.message : 'Unable to move candidate');
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over || event.active.id === event.over.id) return;
    const targetStage = targetStageFromOver(String(event.over.id));
    if (targetStage) {
      void moveApplication(String(event.active.id), targetStage);
    }
  }

  async function addStage() {
    if (!stageName.trim()) {
      toast.error('Stage name is required');
      return;
    }

    setAddingStage(true);
    try {
      const response = await apiFetch('/api/pipeline-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: stageName.trim(), color: stageColor }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to add stage'));
      }
      const stage = await response.json();
      setStages((current) => [
        ...current,
        { ...stage, currentStageApplications: [] },
      ]);
      setStageName('');
      setStageColor('#14b8a6');
      setAddStageOpen(false);
      toast.success('Pipeline stage added');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to add stage');
    } finally {
      setAddingStage(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-12" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hiring pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalApplications} candidates across {stages.length} stages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setAddStageOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              Add stage
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold">{totalApplications}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Access</p>
            <p className="mt-1 font-medium">
              {canEdit ? 'Drag candidates to update stages' : 'Read-only pipeline'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Search candidate or job"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No pipeline stages configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a first stage before moving candidates through the pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-max gap-4">
              {visibleStages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  applications={stage.currentStageApplications}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeApplication ? (
              <CandidateCard application={activeApplication} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pipeline stage</DialogTitle>
            <DialogDescription>
              Use Offer or Hired stages only for display; those statuses are managed
              by the secure offer workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Stage name</Label>
              <Input
                value={stageName}
                onChange={(event) => setStageName(event.target.value)}
                placeholder="Reference check"
              />
            </div>
            <div className="space-y-2">
              <Label>Stage color</Label>
              <Input
                type="color"
                className="h-11 w-full"
                value={stageColor}
                onChange={(event) => setStageColor(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void addStage()} disabled={addingStage}>
              {addingStage && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Add stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
