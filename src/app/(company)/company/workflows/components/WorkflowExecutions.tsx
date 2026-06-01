// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import type { TranslationKeys } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pause,
  FileText,
  Eye,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionData, WorkflowData, parseStepsJson, parseStepResultsJson, getExecStatusConfig, getActionLabel } from './types';

const StatusIcon = ({ status, className }: { status: string; className?: string }) => {
  switch (status) {
    case 'RUNNING': return <Loader2 className={className} />;
    case 'COMPLETED': return <CheckCircle2 className={className} />;
    case 'FAILED': return <AlertCircle className={className} />;
    case 'PAUSED': return <Pause className={className} />;
    default: return <FileText className={className} />;
  }
};

interface WorkflowExecutionsProps {
  executions: ExecutionData[];
  executionDetail: ExecutionData | null;
  setExecutionDetail: (e: ExecutionData | null) => void;
  selectedWorkflow: WorkflowData | null;
}

export default function WorkflowExecutions({
  executions,
  executionDetail,
  setExecutionDetail,
  selectedWorkflow,
}: WorkflowExecutionsProps) {
  const { t } = useI18n() as { t: TranslationKeys };

  return (
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
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <ExecBadge status={executionDetail.status} t={t} />
                <span className="text-xs text-muted-foreground">
                  {t.workflows.triggeredBy}: {executionDetail.triggeredBy === 'SYSTEM' ? t.workflows.system : t.workflows.manual}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t.workflows.stepProgress} {executionDetail.currentStep} {t.workflows.of} {parseStepsJson(selectedWorkflow?.steps || '[]').length}
              </div>
              {executionDetail.error && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-950 text-xs text-red-700">
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
                        <span className="font-medium">{i + 1}. {getActionLabel(step.action, t)}</span>
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
                    <ExecBadge status={exec.status} t={t} />
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
  );
}

function ExecBadge({ status, t }: { status: string; t: TranslationKeys }) {
  const cfg = getExecStatusConfig(status, t);
  return (
    <Badge className={cn('text-[10px]', cfg.color)}>
      <StatusIcon status={status} className={cn('h-3 w-3 me-1', status === 'RUNNING' && 'animate-spin')} />
      {cfg.label}
    </Badge>
  );
}
