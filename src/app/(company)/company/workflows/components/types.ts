// @ts-nocheck

import type { TranslationKeys } from '@/lib/i18n';

export interface WorkflowStep {
  order: number;
  action: string;
  config: Record<string, unknown>;
  delay?: number;
}

export interface WorkflowData {
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

export interface ExecutionData {
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

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerConfig: string;
  steps: string;
  status: string;
}

export const TRIGGER_OPTIONS = [
  'APPLICATION_RECEIVED',
  'STAGE_CHANGED',
  'INTERVIEW_COMPLETED',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'CANDIDATE_NO_RESPONSE',
  'SCHEDULED_TIME',
  'MANUAL_TRIGGER',
] as const;

export const ACTION_OPTIONS = [
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

export function parseStepsJson(stepsJson: string): WorkflowStep[] {
  try {
    return JSON.parse(stepsJson);
  } catch {
    return [];
  }
}

export function parseStepResultsJson(resultsJson: string): Array<Record<string, unknown>> {
  try {
    return JSON.parse(resultsJson);
  } catch {
    return [];
  }
}

// Trigger label helper
export function getTriggerLabel(trigger: string, t: TranslationKeys): string {
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
}

// Action label helper
export function getActionLabel(action: string, t: TranslationKeys): string {
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
}

// Status badge config
export function getStatusConfig(status: string, t: TranslationKeys) {
  switch (status) {
    case 'ACTIVE':
      return { label: t.workflows.active, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0', icon: 'Play' as const };
    case 'PAUSED':
      return { label: t.workflows.paused, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0', icon: 'Pause' as const };
    case 'DRAFT':
      return { label: t.workflows.draft, color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-0', icon: 'FileText' as const };
    case 'ARCHIVED':
      return { label: t.workflows.archived, color: 'bg-gray-50 text-gray-700  dark:text-gray-400 border-0', icon: 'Archive' as const };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-0', icon: 'FileText' as const };
  }
}

// Execution status badge
export function getExecStatusConfig(status: string, t: TranslationKeys) {
  switch (status) {
    case 'RUNNING':
      return { label: t.workflows.running, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0', icon: 'Loader2' as const };
    case 'COMPLETED':
      return { label: t.workflows.completed, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0', icon: 'CheckCircle2' as const };
    case 'FAILED':
      return { label: t.workflows.failed, color: 'bg-red-50 text-red-700 dark:bg-red-950 border-0', icon: 'AlertCircle' as const };
    case 'PAUSED':
      return { label: t.workflows.paused, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0', icon: 'Pause' as const };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-0', icon: 'FileText' as const };
  }
}
