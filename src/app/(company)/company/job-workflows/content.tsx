// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  GitBranch,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  ArrowRight,
  Save,
  CheckCircle2,
  Eye,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  included: boolean;
}

interface AutoAdvanceRule {
  id: string;
  condition: string;
  fromStage: string;
  toStage: string;
  enabled: boolean;
  threshold: number | null;
}

interface WorkflowConfig {
  id: string;
  jobId: string;
  jobTitle: string;
  customEnabled: boolean;
  stages: Stage[];
  autoAdvanceRules: AutoAdvanceRule[];
}

const defaultStages: Stage[] = [
  { id: 'applied', name: 'Applied', color: '#6b7280', order: 0, included: true },
  { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1, included: true },
  { id: 'phone-interview', name: 'Phone Interview', color: '#0ea5e9', order: 2, included: true },
  { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3, included: true },
  { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4, included: true },
  { id: 'offer', name: 'Offer', color: '#10b981', order: 5, included: true },
  { id: 'hired', name: 'Hired', color: '#059669', order: 6, included: true },
];

const mockWorkflows: WorkflowConfig[] = [
  {
    id: 'wf-1',
    jobId: 'job-1',
    jobTitle: 'Senior Engineer',
    customEnabled: true,
    stages: [
      { id: 'applied', name: 'Applied', color: '#6b7280', order: 0, included: true },
      { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1, included: true },
      { id: 'phone-interview', name: 'Phone Interview', color: '#0ea5e9', order: 2, included: false },
      { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3, included: true },
      { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4, included: false },
      { id: 'offer', name: 'Offer', color: '#10b981', order: 5, included: true },
      { id: 'hired', name: 'Hired', color: '#059669', order: 6, included: true },
    ],
    autoAdvanceRules: [
      { id: 'rule-1', condition: 'screening_passed', fromStage: 'screening', toStage: 'technical-interview', enabled: true, threshold: null },
      { id: 'rule-2', condition: 'score_above_threshold', fromStage: 'technical-interview', toStage: 'offer', enabled: true, threshold: 4 },
    ],
  },
  {
    id: 'wf-2',
    jobId: 'job-2',
    jobTitle: 'Product Designer',
    customEnabled: false,
    stages: defaultStages.map((s) => ({ ...s, included: true })),
    autoAdvanceRules: [],
  },
  {
    id: 'wf-3',
    jobId: 'job-3',
    jobTitle: 'Sales Manager',
    customEnabled: true,
    stages: [
      { id: 'applied', name: 'Applied', color: '#6b7280', order: 0, included: true },
      { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1, included: true },
      { id: 'phone-interview', name: 'Phone Interview', color: '#0ea5e9', order: 2, included: true },
      { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3, included: false },
      { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4, included: false },
      { id: 'offer', name: 'Offer', color: '#10b981', order: 5, included: true },
      { id: 'hired', name: 'Hired', color: '#059669', order: 6, included: true },
    ],
    autoAdvanceRules: [
      { id: 'rule-3', condition: 'screening_passed', fromStage: 'screening', toStage: 'phone-interview', enabled: true, threshold: null },
    ],
  },
  {
    id: 'wf-4',
    jobId: 'job-4',
    jobTitle: 'Marketing Specialist',
    customEnabled: false,
    stages: defaultStages.map((s) => ({ ...s, included: true })),
    autoAdvanceRules: [],
  },
];

const conditionLabels: Record<string, string> = {
  screening_passed: 'conditionScreeningPassed',
  assessment_passed: 'conditionAssessmentPassed',
  interview_completed: 'conditionInterviewCompleted',
  score_above_threshold: 'conditionScoreAbove',
};

export default function JobWorkflowsContent() {
  const { t } = useI18n();
  const jt = t.jobWorkflows as Record<string, string>;

  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>(mockWorkflows);

  const currentWorkflow = useMemo(
    () => workflows.find((w) => w.jobId === selectedJobId),
    [workflows, selectedJobId]
  );

  const includedStages = useMemo(() => {
    if (!currentWorkflow) return [];
    return currentWorkflow.stages
      .filter((s) => s.included)
      .sort((a, b) => a.order - b.order);
  }, [currentWorkflow]);

  const handleToggleCustom = (enabled: boolean) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId ? { ...w, customEnabled: enabled } : w
      )
    );
  };

  const handleToggleStage = (stageId: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId
          ? {
              ...w,
              stages: w.stages.map((s) =>
                s.id === stageId ? { ...s, included: !s.included } : s
              ),
            }
          : w
      )
    );
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    if (!currentWorkflow) return;
    const stages = [...currentWorkflow.stages].sort((a, b) => a.order - b.order);
    const idx = stages.findIndex((s) => s.id === stageId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === stages.length - 1)) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempOrder = stages[idx].order;
    stages[idx] = { ...stages[idx], order: stages[swapIdx].order };
    stages[swapIdx] = { ...stages[swapIdx], order: tempOrder };

    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId ? { ...w, stages } : w
      )
    );
  };

  const handleAddRule = () => {
    const newRule: AutoAdvanceRule = {
      id: `rule-${Date.now()}`,
      condition: 'screening_passed',
      fromStage: 'screening',
      toStage: 'phone-interview',
      enabled: true,
      threshold: null,
    };
    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId
          ? { ...w, autoAdvanceRules: [...w.autoAdvanceRules, newRule] }
          : w
      )
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId
          ? { ...w, autoAdvanceRules: w.autoAdvanceRules.filter((r) => r.id !== ruleId) }
          : w
      )
    );
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<AutoAdvanceRule>) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.jobId === selectedJobId
          ? {
              ...w,
              autoAdvanceRules: w.autoAdvanceRules.map((r) =>
                r.id === ruleId ? { ...r, ...updates } : r
              ),
            }
          : w
      )
    );
  };

  const handleSave = () => {
    toast.success(jt.configSaved);
  };

  if (!currentWorkflow) return null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{jt.title}</h1>
            <p className="text-sm text-muted-foreground">{jt.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={handleSave}
        >
          <Save className="h-4 w-4 me-2" />
          {jt.saveConfiguration}
        </Button>
      </div>

      {/* Job Selector */}
      <Card className="border-border/50 card-">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-medium min-w-[140px]">{jt.selectJob}</label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((w) => (
                  <SelectItem key={w.jobId} value={w.jobId}>
                    {w.jobTitle}
                    {w.customEnabled && (
                      <Badge className="ms-2 text-[9px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
                        {jt.customPipelineActive}
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                currentWorkflow.customEnabled
                  ? 'border-slate-300 text-blue-700'
                  : 'border-gray-300 text-gray-500  dark:text-gray-400'
              )}
            >
              {currentWorkflow.customEnabled ? jt.customPipelineActive : jt.usingDefaultPipeline}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Configurator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Pipeline Toggle */}
          <Card className="border-border/50 card-">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-blue-600" />
                {jt.customPipeline}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={currentWorkflow.customEnabled}
                    onCheckedChange={handleToggleCustom}
                  />
                  <span className="text-sm font-medium">{jt.enableCustom}</span>
                </div>
              </div>

              {currentWorkflow.customEnabled && (
                <div className="space-y-2 animate-fade-in-up">
                  {/* Stage Checklist */}
                  <div className="text-xs text-muted-foreground font-medium mb-2">
                    {jt.defaultStages}
                  </div>
                  {currentWorkflow.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, idx) => (
                      <div
                        key={stage.id}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                          stage.included
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-border/50 bg-muted/20 opacity-60'
                        )}
                      >
                        <Switch
                          checked={stage.included}
                          onCheckedChange={() => handleToggleStage(stage.id)}
                          className="scale-90"
                        />
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium flex-1">{stage.name}</span>
                        <Badge variant="outline" className="text-[10px] min-w-[24px] justify-center">
                          {idx + 1}
                        </Badge>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveStage(stage.id, 'up')}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveStage(stage.id, 'down')}
                            disabled={idx === currentWorkflow.stages.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Advance Rules */}
          <Card className="border-border/50 card-">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  {jt.autoAdvanceRules}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                  onClick={handleAddRule}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {jt.addRule}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {currentWorkflow.autoAdvanceRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{jt.noRules}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentWorkflow.autoAdvanceRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/10"
                    >
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) =>
                            handleUpdateRule(rule.id, { enabled: checked })
                          }
                          className="scale-90"
                        />
                        <span className="text-xs text-muted-foreground">{jt.whenCondition}</span>
                      </div>

                      <Select
                        value={rule.condition}
                        onValueChange={(val) => handleUpdateRule(rule.id, { condition: val })}
                      >
                        <SelectTrigger className="h-8 text-xs w-full sm:w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(conditionLabels).map(([key, labelKey]) => (
                            <SelectItem key={key} value={key}>
                              {jt[labelKey] || key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {rule.condition === 'score_above_threshold' && (
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={rule.threshold || ''}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              threshold: parseInt(e.target.value) || null,
                            })
                          }
                          placeholder={jt.thresholdScore}
                          className="h-8 w-20 px-2 text-xs border rounded-md bg-background"
                        />
                      )}

                      <div className="flex items-center gap-1.5">
                        <Select
                          value={rule.fromStage}
                          onValueChange={(val) => handleUpdateRule(rule.id, { fromStage: val })}
                        >
                          <SelectTrigger className="h-8 text-xs w-full sm:w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentWorkflow.stages
                              .filter((s) => s.included)
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <Select
                          value={rule.toStage}
                          onValueChange={(val) => handleUpdateRule(rule.id, { toStage: val })}
                        >
                          <SelectTrigger className="h-8 text-xs w-full sm:w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentWorkflow.stages
                              .filter((s) => s.included)
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0 ms-auto"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-6">
          {/* Pipeline Preview */}
          <Card className="border-border/50 card-">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                {jt.pipelinePreview}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {/* Horizontal Pipeline Flow */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {includedStages.map((stage, idx) => (
                    <React.Fragment key={stage.id}>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
                          style={{
                            borderColor: stage.color + '40',
                            backgroundColor: stage.color + '10',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span>{stage.name}</span>
                        </div>
                      </div>
                      {idx < includedStages.length - 1 && (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Visual Flowchart */}
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex flex-col items-center gap-2">
                    {includedStages.map((stage, idx) => (
                      <React.Fragment key={stage.id}>
                        <div
                          className="w-full max-w-[180px] px-3 py-2 rounded-lg border text-center text-xs font-medium"
                          style={{
                            borderColor: stage.color + '50',
                            backgroundColor: stage.color + '15',
                            color: stage.color,
                          }}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span>{stage.name}</span>
                          </div>
                        </div>
                        {idx < includedStages.length - 1 && (
                          <div className="flex flex-col items-center">
                            <div className="w-px h-3 bg-border" />
                            <ChevronRight className="h-3 w-3 text-muted-foreground rotate-90" />
                            <div className="w-px h-3 bg-border" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Auto-advance rules on flowchart */}
                  {currentWorkflow.autoAdvanceRules.filter((r) => r.enabled).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/30">
                      <div className="text-[10px] text-muted-foreground font-medium mb-2">
                        {jt.autoAdvanceRules}
                      </div>
                      {currentWorkflow.autoAdvanceRules
                        .filter((r) => r.enabled)
                        .map((rule) => {
                          const fromName =
                            currentWorkflow.stages.find((s) => s.id === rule.fromStage)?.name ||
                            rule.fromStage;
                          const toName =
                            currentWorkflow.stages.find((s) => s.id === rule.toStage)?.name ||
                            rule.toStage;
                          return (
                            <div
                              key={rule.id}
                              className="flex items-center gap-1.5 text-[10px] mb-1.5"
                            >
                              <Zap className="h-3 w-3 text-amber-500" />
                              <span className="text-muted-foreground">
                                {jt[conditionLabels[rule.condition] || rule.condition] || rule.condition}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-blue-500" />
                              <span className="font-medium text-blue-600">
                                {fromName} → {toName}
                              </span>
                              {rule.threshold && (
                                <Badge className="text-[8px] bg-amber-50 text-amber-700 dark:bg-amber-950 border-0 ms-1">
                                  ≥ {rule.threshold}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {includedStages.length}
                    </div>
                    <div className="text-[10px] text-emerald-600/70/70">
                      {jt.includedStages}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200/50 dark:border-gray-800/50 text-center">
                    <div className="text-lg font-bold text-gray-500 dark:text-gray-400">
                      {currentWorkflow.stages.filter((s) => !s.included).length}
                    </div>
                    <div className="text-[10px] text-gray-500/70 dark:text-gray-400/70">
                      {jt.excludedStages}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button (mobile) */}
          <div className="lg:hidden">
            <Button
              className="w-full bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 me-2" />
              {jt.saveConfiguration}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
