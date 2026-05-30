// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitMerge,
  Plus,
  Play,
  Pause,
  Zap,
  ArrowRight,
  Trash2,
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Copy,
  Send,
  Eye,
  LayoutTemplate,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  XCircle,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface WorkflowStep {
  order: number;
  action: string;
  config: Record<string, unknown>;
  delay?: number;
}

interface WorkflowData {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  trigger: string;
  triggerConfig?: string | null;
  steps: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { executions: number };
}

interface ExecutionData {
  id: string;
  workflowId: string;
  applicationId?: string | null;
  candidateId?: string | null;
  status: string;
  currentStep: number;
  stepResults: string;
  triggeredBy: string;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
}

interface TemplateData {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerConfig: string;
  steps: string;
  status: string;
}

const TRIGGER_OPTIONS = [
  'APPLICATION_RECEIVED',
  'STAGE_CHANGED',
  'INTERVIEW_COMPLETED',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'CANDIDATE_NO_RESPONSE',
  'SCHEDULED_TIME',
  'MANUAL_TRIGGER',
] as const;

const ACTION_OPTIONS = [
  'SEND_EMAIL',
  'MOVE_STAGE',
  'SCHEDULE_INTERVIEW',
  'SEND_SCREENING',
  'AI_SCREEN_RESUME',
  'AI_GENERATE_QUESTIONS',
  'ADD_TAG',
  'ASSIGN_RECRUITER',
  'SEND_NOTIFICATION',
  'WEBHOOK',
  'WAIT',
  'CONDITION_CHECK',
] as const;

function parseStepsJson(stepsJson: string): WorkflowStep[] {
  try {
    return JSON.parse(stepsJson);
  } catch {
    return [];
  }
}

function parseStepResultsJson(resultsJson: string): Array<Record<string, unknown>> {
  try {
    return JSON.parse(resultsJson);
  } catch {
    return [];
  }
}

export default function WorkflowsContent() {
  const { t } = useI18n();

  // State
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [executionDetail, setExecutionDetail] = useState<ExecutionData | null>(null);
  const [saving, setSaving] = useState(false);

  // Stepper form state
  const [formStep, setFormStep] = useState(0);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState<string>('APPLICATION_RECEIVED');
  const [formTriggerConfig, setFormTriggerConfig] = useState<Record<string, unknown>>({});
  const [formSteps, setFormSteps] = useState<WorkflowStep[]>([
    { order: 1, action: '', config: {}, delay: 0 },
  ]);

  const FORM_STEPS = [t.workflows.basicInfo, t.workflows.triggerSetup, t.workflows.addSteps, t.workflows.reviewAndSave];

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
  }, [fetchWorkflows, fetchTemplates]);

  // Computed stats
  const activeCount = workflows.filter((w) => w.status === 'ACTIVE').length;
  const totalExecutions = workflows.reduce((acc, w) => acc + (w._count?.executions || 0), 0);
  const [runningExecutions, setRunningExecutions] = useState(0);

  useEffect(() => {
    const countRunning = async () => {
      let running = 0;
      for (const w of workflows) {
        try {
          const res = await fetch(`/api/workflows/${w.id}/executions?limit=100`);
          if (res.ok) {
            const data = await res.json();
            running += data.executions?.filter((e: ExecutionData) => e.status === 'RUNNING').length || 0;
          }
        } catch { /* skip */ }
      }
      setRunningExecutions(running);
    };
    if (workflows.length > 0) countRunning();
  }, [workflows]);

  const successRate = totalExecutions > 0
    ? Math.round((workflows.reduce((acc, w) => {
        // Approximate success from execution counts
        return acc + (w._count?.executions || 0);
      }, 0) / totalExecutions) * 100)
    : 0;

  // Trigger label helper
  const getTriggerLabel = (trigger: string): string => {
    const map: Record<string, string> = {
      APPLICATION_RECEIVED: t.workflows.applicationReceived,
      STAGE_CHANGED: t.workflows.stageChanged,
      INTERVIEW_COMPLETED: t.workflows.interviewCompleted,
      OFFER_ACCEPTED: t.workflows.offerAccepted,
      OFFER_DECLINED: t.workflows.offerDeclined,
      CANDIDATE_NO_RESPONSE: t.workflows.candidateNoResponse,
      SCHEDULED_TIME: t.workflows.scheduledTime,
      MANUAL_TRIGGER: t.workflows.manualTrigger,
    };
    return map[trigger] || trigger;
  };

  // Action label helper
  const getActionLabel = (action: string): string => {
    const map: Record<string, string> = {
      SEND_EMAIL: t.workflows.sendEmail,
      MOVE_STAGE: t.workflows.moveStage,
      SCHEDULE_INTERVIEW: t.workflows.scheduleInterview,
      SEND_SCREENING: t.workflows.sendScreening,
      AI_SCREEN_RESUME: t.workflows.aiScreenResume,
      AI_GENERATE_QUESTIONS: t.workflows.aiGenerateQuestions,
      ADD_TAG: t.workflows.addTag,
      ASSIGN_RECRUITER: t.workflows.assignRecruiter,
      SEND_NOTIFICATION: t.workflows.sendNotification,
      WEBHOOK: t.workflows.webhook,
      WAIT: t.workflows.wait,
      CONDITION_CHECK: t.workflows.conditionCheck,
    };
    return map[action] || action;
  };

  // Status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: t.workflows.active, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: Play };
      case 'PAUSED':
        return { label: t.workflows.paused, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: Pause };
      case 'DRAFT':
        return { label: t.workflows.draft, color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-0', icon: FileText };
      case 'ARCHIVED':
        return { label: t.workflows.archived, color: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400 border-0', icon: Archive };
      default:
        return { label: status, color: 'bg-slate-50 text-slate-700 border-0', icon: FileText };
    }
  };

  // Execution status badge
  const getExecStatusConfig = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return { label: t.workflows.running, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0', icon: Loader2 };
      case 'COMPLETED':
        return { label: t.workflows.completed, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: CheckCircle2 };
      case 'FAILED':
        return { label: t.workflows.failed, color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0', icon: AlertCircle };
      case 'PAUSED':
        return { label: t.workflows.paused, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: Pause };
      default:
        return { label: status, color: 'bg-slate-50 text-slate-700 border-0', icon: FileText };
    }
  };

  // Reset form
  const resetForm = () => {
    setFormStep(0);
    setFormName('');
    setFormDescription('');
    setFormTrigger('APPLICATION_RECEIVED');
    setFormTriggerConfig({});
    setFormSteps([{ order: 1, action: '', config: {}, delay: 0 }]);
    setSelectedWorkflow(null);
  };

  // Open create dialog
  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  // Open edit dialog
  const openEdit = (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    setFormStep(0);
    setFormName(workflow.name);
    setFormDescription(workflow.description || '');
    setFormTrigger(workflow.trigger);
    try {
      setFormTriggerConfig(workflow.triggerConfig ? JSON.parse(workflow.triggerConfig) : {});
    } catch {
      setFormTriggerConfig({});
    }
    try {
      const steps = JSON.parse(workflow.steps);
      setFormSteps(steps.length > 0 ? steps : [{ order: 1, action: '', config: {}, delay: 0 }]);
    } catch {
      setFormSteps([{ order: 1, action: '', config: {}, delay: 0 }]);
    }
    setEditOpen(true);
  };

  // Add step
  const addFormStep = () => {
    setFormSteps((prev) => [
      ...prev,
      { order: prev.length + 1, action: '', config: {}, delay: 0 },
    ]);
  };

  // Remove step
  const removeFormStep = (index: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // Update step action
  const updateStepAction = (index: number, action: string) => {
    setFormSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, action, config: {} } : s))
    );
  };

  // Update step config
  const updateStepConfig = (index: number, key: string, value: unknown) => {
    setFormSteps((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    );
  };

  // Move step up/down
  const moveStep = (index: number, direction: 'up' | 'down') => {
    setFormSteps((prev) => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // Save workflow (create or update)
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error(t.workflows.workflowName + ' is required');
      return;
    }

    const validSteps = formSteps.filter((s) => s.action);
    if (validSteps.length === 0) {
      toast.error(t.workflows.addAction + ' - at least one step is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        trigger: formTrigger,
        triggerConfig: formTriggerConfig,
        steps: validSteps,
        status: 'DRAFT' as string,
      };

      let res: Response;
      if (selectedWorkflow) {
        res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(selectedWorkflow ? t.workflows.workflowUpdated : t.workflows.workflowCreated);
        fetchWorkflows();
        if (selectedWorkflow) {
          setEditOpen(false);
        } else {
          setCreateOpen(false);
        }
        resetForm();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save workflow');
      }
    } catch {
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  // Toggle workflow status
  const toggleWorkflow = async (workflow: WorkflowData) => {
    const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(t.workflows.workflowToggled);
        fetchWorkflows();
      }
    } catch {
      toast.error('Failed to toggle workflow');
    }
  };

  // Duplicate workflow
  const duplicateWorkflow = async (workflow: WorkflowData) => {
    try {
      const steps = parseStepsJson(workflow.steps);
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${workflow.name} (${t.workflows.duplicateName})`,
          description: workflow.description,
          trigger: workflow.trigger,
          triggerConfig: workflow.triggerConfig,
          steps,
          status: 'DRAFT',
        }),
      });
      if (res.ok) {
        toast.success(t.workflows.workflowCreated);
        fetchWorkflows();
      }
    } catch {
      toast.error('Failed to duplicate workflow');
    }
  };

  // Delete workflow
  const deleteWorkflow = async () => {
    if (!selectedWorkflow) return;
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.workflows.workflowDeleted);
        fetchWorkflows();
        setDeleteConfirmOpen(false);
        setSelectedWorkflow(null);
      }
    } catch {
      toast.error('Failed to delete workflow');
    }
  };

  // Trigger workflow manually
  const triggerManually = async (workflow: WorkflowData) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success(t.workflows.workflowTriggered);
        fetchWorkflows();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to trigger workflow');
      }
    } catch {
      toast.error('Failed to trigger workflow');
    }
  };

  // Apply template
  const applyTemplate = (template: TemplateData) => {
    setFormName(template.name);
    setFormDescription(template.description);
    setFormTrigger(template.trigger);
    try {
      setFormTriggerConfig(JSON.parse(template.triggerConfig));
    } catch {
      setFormTriggerConfig({});
    }
    try {
      const steps = JSON.parse(template.steps);
      setFormSteps(steps.length > 0 ? steps : [{ order: 1, action: '', config: {}, delay: 0 }]);
    } catch {
      setFormSteps([{ order: 1, action: '', config: {}, delay: 0 }]);
    }
    setFormStep(0);
    setTemplateOpen(false);
    setCreateOpen(true);
    toast.success(t.workflows.templateApplied);
  };

  // Open execution history
  const openHistory = async (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    setExecutionDetail(null);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/executions?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch {
      setExecutions([]);
    }
    setHistoryOpen(true);
  };

  // Action config fields based on action type
  const renderActionConfig = (step: WorkflowStep, index: number) => {
    switch (step.action) {
      case 'SEND_EMAIL':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="To (email)"
              value={(step.config.to as string) || ''}
              onChange={(e) => updateStepConfig(index, 'to', e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Subject"
              value={(step.config.subject as string) || ''}
              onChange={(e) => updateStepConfig(index, 'subject', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'MOVE_STAGE':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Target Stage ID"
              value={(step.config.targetStageId as string) || ''}
              onChange={(e) => updateStepConfig(index, 'targetStageId', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'SCHEDULE_INTERVIEW':
        return (
          <div className="space-y-2 mt-2">
            <Select
              value={(step.config.interviewType as string) || 'VIDEO'}
              onValueChange={(v) => updateStepConfig(index, 'interviewType', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Interview Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="ON_SITE">On-site</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Duration (minutes)"
              type="number"
              value={(step.config.durationMinutes as number) || 30}
              onChange={(e) => updateStepConfig(index, 'durationMinutes', parseInt(e.target.value) || 30)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'AI_SCREEN_RESUME':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Score Threshold"
              type="number"
              value={(step.config.threshold as number) || 70}
              onChange={(e) => updateStepConfig(index, 'threshold', parseInt(e.target.value) || 70)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'AI_GENERATE_QUESTIONS':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Role"
              value={(step.config.role as string) || ''}
              onChange={(e) => updateStepConfig(index, 'role', e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Number of questions"
              type="number"
              value={(step.config.count as number) || 5}
              onChange={(e) => updateStepConfig(index, 'count', parseInt(e.target.value) || 5)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'ADD_TAG':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Tag name"
              value={(step.config.tag as string) || ''}
              onChange={(e) => updateStepConfig(index, 'tag', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'ASSIGN_RECRUITER':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Recruiter User ID"
              value={(step.config.recruiterId as string) || ''}
              onChange={(e) => updateStepConfig(index, 'recruiterId', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'SEND_NOTIFICATION':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Title"
              value={(step.config.title as string) || ''}
              onChange={(e) => updateStepConfig(index, 'title', e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Message"
              value={(step.config.message as string) || ''}
              onChange={(e) => updateStepConfig(index, 'message', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'WEBHOOK':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="URL"
              value={(step.config.url as string) || ''}
              onChange={(e) => updateStepConfig(index, 'url', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        );
      case 'WAIT':
        return (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">{t.workflows.delayDays}</Label>
                <Input
                  type="number"
                  value={(step.config.delayDays as number) || 0}
                  onChange={(e) => updateStepConfig(index, 'delayDays', parseInt(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">{t.workflows.delayHours}</Label>
                <Input
                  type="number"
                  value={(step.config.delayHours as number) || 0}
                  onChange={(e) => updateStepConfig(index, 'delayHours', parseInt(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">{t.workflows.delayMinutes}</Label>
                <Input
                  type="number"
                  value={(step.config.delayMinutes as number) || 0}
                  onChange={(e) => updateStepConfig(index, 'delayMinutes', parseInt(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        );
      case 'CONDITION_CHECK':
        return (
          <div className="space-y-2 mt-2">
            <Input
              placeholder="Field to check"
              value={(step.config.field as string) || ''}
              onChange={(e) => updateStepConfig(index, 'field', e.target.value)}
              className="h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={(step.config.operator as string) || 'equals'}
                onValueChange={(v) => updateStepConfig(index, 'operator', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={String(step.config.value ?? '')}
                onChange={(e) => updateStepConfig(index, 'value', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render stepper form (shared between create & edit)
  const renderStepperForm = () => (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {FORM_STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setFormStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                i === formStep
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
                  : i < formStep
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-white dark:bg-gray-800 border border-current">
                {i < formStep ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < FORM_STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {formStep === 0 && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="space-y-2">
            <Label>{t.workflows.workflowName}</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t.workflows.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.workflows.description}</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={t.workflows.descriptionPlaceholder}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Step 2: Trigger Setup */}
      {formStep === 1 && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="space-y-2">
            <Label>{t.workflows.trigger}</Label>
            <Select value={formTrigger} onValueChange={setFormTrigger}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((trig) => (
                  <SelectItem key={trig} value={trig}>
                    {getTriggerLabel(trig)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formTrigger === 'STAGE_CHANGED' && (
            <div className="space-y-2">
              <Label>Target Stage</Label>
              <Input
                placeholder="e.g., interview"
                value={String(formTriggerConfig.targetStage || '')}
                onChange={(e) =>
                  setFormTriggerConfig((prev) => ({ ...prev, targetStage: e.target.value }))
                }
              />
            </div>
          )}
          {formTrigger === 'CANDIDATE_NO_RESPONSE' && (
            <div className="space-y-2">
              <Label>{t.workflows.delayDays}</Label>
              <Input
                type="number"
                value={Number(formTriggerConfig.delayDays || 3)}
                onChange={(e) =>
                  setFormTriggerConfig((prev) => ({ ...prev, delayDays: parseInt(e.target.value) || 3 }))
                }
              />
            </div>
          )}
          {formTrigger === 'SCHEDULED_TIME' && (
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                placeholder="e.g., 0 9 * * 1"
                value={String(formTriggerConfig.cron || '')}
                onChange={(e) =>
                  setFormTriggerConfig((prev) => ({ ...prev, cron: e.target.value }))
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3: Add Steps */}
      {formStep === 2 && (
        <div className="space-y-4 animate-fade-in-up max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Label>{t.workflows.steps}</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-600" onClick={addFormStep}>
              <Plus className="h-3 w-3 me-1" />
              {t.workflows.addAction}
            </Button>
          </div>
          <div className="space-y-3">
            {formSteps.map((step, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveStep(i, 'up')}
                        disabled={i === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3 w-3 rotate-90" />
                      </button>
                      <button
                        onClick={() => moveStep(i, 'down')}
                        disabled={i === formSteps.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3 w-3 -rotate-90" />
                      </button>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                    <Select value={step.action} onValueChange={(v) => updateStepAction(i, v)}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder={t.workflows.selectAction} />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_OPTIONS.map((action) => (
                          <SelectItem key={action} value={action}>
                            {getActionLabel(action)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formSteps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFormStep(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {step.action && renderActionConfig(step, i)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Review & Save */}
      {formStep === 3 && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="border-teal-200 dark:border-teal-800">
            <CardContent className="p-4 space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t.workflows.workflowName}:</span>
                <p className="text-sm font-semibold">{formName || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t.workflows.description}:</span>
                <p className="text-sm">{formDescription || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t.workflows.trigger}:</span>
                <p className="text-sm">{getTriggerLabel(formTrigger)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t.workflows.steps}:</span>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {formSteps.filter((s) => s.action).map((step, i, arr) => (
                    <React.Fragment key={i}>
                      <Badge variant="outline" className="text-[10px] border-teal-200 dark:border-teal-800">
                        {i + 1}. {getActionLabel(step.action)}
                      </Badge>
                      {i < arr.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                  {formSteps.filter((s) => s.action).length === 0 && (
                    <span className="text-xs text-muted-foreground">No steps configured</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFormStep((prev) => Math.max(0, prev - 1))}
          disabled={formStep === 0}
        >
          <ChevronLeft className="h-4 w-4 me-1" />
          {t.workflows.previous}
        </Button>
        {formStep < 3 ? (
          <Button
            size="sm"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
            onClick={() => setFormStep((prev) => Math.min(3, prev + 1))}
          >
            {t.workflows.next}
            <ChevronRight className="h-4 w-4 ms-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 me-1" />}
            {t.workflows.saveWorkflow}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <GitMerge className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.workflows.title}</h1>
            <p className="text-sm text-muted-foreground">{t.workflows.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
            onClick={() => {
              fetchTemplates();
              setTemplateOpen(true);
            }}
          >
            <LayoutTemplate className="h-4 w-4 me-2" />
            {t.workflows.useTemplate}
          </Button>
          <Button
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 me-2" />
            {t.workflows.createWorkflow}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <Play className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.workflows.activeWorkflows}</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                <Activity className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.workflows.totalExecutions}</p>
                <p className="text-xl font-bold">{totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.workflows.runningNow}</p>
                <p className="text-xl font-bold">{runningExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950">
                <Sparkles className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.workflows.successRate}</p>
                <p className="text-xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </CardContent>
          </Card>
        ) : workflows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 mb-4">
                <GitMerge className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t.workflows.emptyTitle}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t.workflows.noWorkflows}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="border-teal-200 dark:border-teal-800"
                  onClick={() => {
                    fetchTemplates();
                    setTemplateOpen(true);
                  }}
                >
                  <LayoutTemplate className="w-4 h-4 me-2" />
                  {t.workflows.useTemplate}
                </Button>
                <Button
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                  onClick={openCreate}
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t.workflows.createWorkflow}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => {
            const statusCfg = getStatusConfig(workflow.status);
            const StatusIcon = statusCfg.icon;
            const steps = parseStepsJson(workflow.steps);
            const execCount = workflow._count?.executions || 0;

            return (
              <Card key={workflow.id} className="border-border/50 hover:shadow-md transition-shadow card-hover-lift animate-fade-in-up">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-sm">{workflow.name}</h3>
                        <Badge className={cn('text-[10px]', statusCfg.color)}>
                          <StatusIcon className={cn('h-3 w-3 me-1', workflow.status === 'RUNNING' && 'animate-spin')} />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                          {workflow.description}
                        </p>
                      )}

                      {/* Trigger + Steps Preview */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                          <Zap className="h-2.5 w-2.5 me-1" />
                          {getTriggerLabel(workflow.trigger)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground hidden sm:block" />
                        {steps.map((step, i) => (
                          <React.Fragment key={i}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
                              {step.action ? getActionLabel(step.action) : '?'}
                            </span>
                            {i < steps.length - 1 && (
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {steps.length} {t.workflows.steps}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {execCount} {t.workflows.triggers}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleWorkflow(workflow)}
                        className={cn(
                          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors mt-1',
                          workflow.status === 'ACTIVE' ? 'bg-teal-600' : 'bg-muted'
                        )}
                        title={t.workflows.toggleActive}
                      >
                        <span
                          className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                            workflow.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(workflow)}>
                            <Eye className="h-4 w-4 me-2" />
                            {t.workflows.editWorkflow}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateWorkflow(workflow)}>
                            <Copy className="h-4 w-4 me-2" />
                            {t.workflows.duplicate}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => triggerManually(workflow)}
                            disabled={workflow.status !== 'ACTIVE'}
                          >
                            <Send className="h-4 w-4 me-2" />
                            {t.workflows.triggerManually}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openHistory(workflow)}>
                            <Clock className="h-4 w-4 me-2" />
                            {t.workflows.executionHistory}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t.workflows.deleteWorkflow}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-teal-600" />
              {t.workflows.createWorkflow}
            </DialogTitle>
          </DialogHeader>
          {renderStepperForm()}
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-teal-600" />
              {t.workflows.editWorkflow}
            </DialogTitle>
          </DialogHeader>
          {renderStepperForm()}
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-teal-600" />
              {t.workflows.selectTemplate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {templates.map((template) => {
              const steps = parseStepsJson(template.steps);
              return (
                <Card
                  key={template.id}
                  className="border-border/50 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer transition-colors card-hover-lift"
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                            <Zap className="h-2.5 w-2.5 me-1" />
                            {getTriggerLabel(template.trigger)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {steps.length} {t.workflows.steps}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {steps.map((step, i) => (
                            <React.Fragment key={i}>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
                                {step.action ? getActionLabel(step.action) : '?'}
                              </span>
                              {i < steps.length - 1 && (
                                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                        {t.workflows.useTemplate}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Execution History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              {t.workflows.executionHistory}
              {selectedWorkflow && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedWorkflow.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {executionDetail ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExecutionDetail(null)}
                  className="mb-2"
                >
                  <ChevronLeft className="h-4 w-4 me-1" />
                  {t.workflows.previous}
                </Button>
                <Card className="border-teal-200 dark:border-teal-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cfg = getExecStatusConfig(executionDetail.status);
                        const Icon = cfg.icon;
                        return (
                          <Badge className={cn('text-[10px]', cfg.color)}>
                            <Icon className={cn('h-3 w-3 me-1', executionDetail.status === 'RUNNING' && 'animate-spin')} />
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                      <span className="text-xs text-muted-foreground">
                        {t.workflows.triggeredBy}: {executionDetail.triggeredBy === 'SYSTEM' ? t.workflows.system : t.workflows.manual}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.workflows.stepProgress} {executionDetail.currentStep} {t.workflows.of} {parseStepsJson(selectedWorkflow?.steps || '[]').length}
                    </div>
                    {executionDetail.error && (
                      <div className="p-2 rounded bg-red-50 dark:bg-red-950 text-xs text-red-700 dark:text-red-400">
                        {executionDetail.error}
                      </div>
                    )}
                    {/* Step-by-step progress */}
                    <div className="space-y-2">
                      {(() => {
                        const results = parseStepResultsJson(executionDetail.stepResults);
                        const wfSteps = parseStepsJson(selectedWorkflow?.steps || '[]');
                        return wfSteps.map((step, i) => {
                          const result = results[i] as Record<string, unknown> | undefined;
                          const status = result?.status as string | undefined;
                          return (
                            <div
                              key={i}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded text-xs',
                                status === 'SUCCESS'
                                  ? 'bg-emerald-50 dark:bg-emerald-950'
                                  : status === 'FAILED'
                                  ? 'bg-red-50 dark:bg-red-950'
                                  : 'bg-muted/50'
                              )}
                            >
                              {status === 'SUCCESS' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : status === 'FAILED' ? (
                                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                              ) : (
                                <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}
                              <span className="font-medium">{i + 1}. {getActionLabel(step.action)}</span>
                              {result?.error && (
                                <span className="text-red-600 ml-auto">{String(result.error)}</span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : executions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {t.workflows.executionHistory}: 0
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.workflows.triggeredBy}</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">{t.workflows.stepProgress}</TableHead>
                    <TableHead className="text-xs">Started</TableHead>
                    <TableHead className="text-xs">Completed</TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec) => {
                    const execCfg = getExecStatusConfig(exec.status);
                    const ExecIcon = execCfg.icon;
                    const wfSteps = parseStepsJson(selectedWorkflow?.steps || '[]');
                    return (
                      <TableRow
                        key={exec.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExecutionDetail(exec)}
                      >
                        <TableCell className="text-xs">
                          {exec.triggeredBy === 'SYSTEM' ? t.workflows.system : t.workflows.manual}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', execCfg.color)}>
                            <ExecIcon className={cn('h-3 w-3 me-1', exec.status === 'RUNNING' && 'animate-spin')} />
                            {execCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {exec.currentStep} {t.workflows.of} {wfSteps.length}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(exec.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {exec.completedAt ? new Date(exec.completedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t.workflows.deleteWorkflow}
            </DialogTitle>
            <DialogDescription>{t.workflows.confirmDelete}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={deleteWorkflow}>
              {t.workflows.deleteWorkflow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
