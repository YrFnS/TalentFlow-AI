// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import type { TranslationKeys } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  FileText,
  Archive,
  Zap,
  ArrowRight,
  MoreHorizontal,
  Copy,
  Send,
  Eye,
  Trash2,
  Clock,
  Activity,
  LayoutTemplate,
  Plus,
  GitMerge,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowData, parseStepsJson, getTriggerLabel, getActionLabel, getStatusConfig } from './types';

const StatusIcon = ({ status, className }: { status: string; className?: string }) => {
  switch (status) {
    case 'ACTIVE': return <Play className={className} />;
    case 'PAUSED': return <Pause className={className} />;
    case 'DRAFT': return <FileText className={className} />;
    case 'ARCHIVED': return <Archive className={className} />;
    default: return <FileText className={className} />;
  }
};

interface WorkflowListProps {
  workflows: WorkflowData[];
  loading: boolean;
  openCreate: () => void;
  openEdit: (workflow: WorkflowData) => void;
  toggleWorkflow: (workflow: WorkflowData) => void;
  duplicateWorkflow: (workflow: WorkflowData) => void;
  triggerManually: (workflow: WorkflowData) => void;
  openHistory: (workflow: WorkflowData) => void;
  setSelectedWorkflow: (w: WorkflowData | null) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  fetchTemplates: () => void;
  setTemplateOpen: (v: boolean) => void;
}

export default function WorkflowList({
  workflows,
  loading,
  openCreate,
  openEdit,
  toggleWorkflow,
  duplicateWorkflow,
  triggerManually,
  openHistory,
  setSelectedWorkflow,
  setDeleteConfirmOpen,
  fetchTemplates,
  setTemplateOpen,
}: WorkflowListProps) {
  const { t } = useI18n() as { t: TranslationKeys };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (workflows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
            <GitMerge className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t.workflows.emptyTitle}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{t.workflows.noWorkflows}</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="border-slate-200"
              onClick={() => {
                fetchTemplates();
                setTemplateOpen(true);
              }}
            >
              <LayoutTemplate className="w-4 h-4 me-2" />
              {t.workflows.useTemplate}
            </Button>
            <Button
              className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4 me-2" />
              {t.workflows.createWorkflow}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => {
        const statusCfg = getStatusConfig(workflow.status, t);
        const steps = parseStepsJson(workflow.steps);
        const execCount = workflow._count?.executions || 0;

        return (
          <Card key={workflow.id} className="border-border/50 hover:shadow-md transition-shadow card-animate-fade-in-up">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-sm">{workflow.name}</h3>
                    <Badge className={cn('text-[10px]', statusCfg.color)}>
                      <StatusIcon status={workflow.status} className={cn('h-3 w-3 me-1', workflow.status === 'RUNNING' && 'animate-spin')} />
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
                    <Badge variant="outline" className="text-[10px] text-blue-700 border-slate-200">
                      <Zap className="h-2.5 w-2.5 me-1" />
                      {getTriggerLabel(workflow.trigger, t)}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground hidden sm:block" />
                    {steps.map((step, i) => (
                      <React.Fragment key={i}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
                          {step.action ? getActionLabel(step.action, t) : '?'}
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
                      workflow.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-muted'
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
      })}
    </div>
  );
}
