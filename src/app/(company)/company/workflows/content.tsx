// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { GitMerge, Plus, AlertCircle, LayoutTemplate, Clock } from 'lucide-react';
import type { TranslationKeys } from '@/lib/i18n';
import type { WorkflowStep, WorkflowData, ExecutionData, TemplateData } from './components/types';
import WorkflowStats from './components/WorkflowStats';
import WorkflowList from './components/WorkflowList';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowTemplates from './components/WorkflowTemplates';
import WorkflowExecutions from './components/WorkflowExecutions';
import useWorkflowActions from './components/useWorkflowActions';

export default function WorkflowsContent() {
  const { t } = useI18n() as unknown as { t: TranslationKeys };

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

  const [formStep, setFormStep] = useState(0);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState<string>('APPLICATION_RECEIVED');
  const [formTriggerConfig, setFormTriggerConfig] = useState<Record<string, unknown>>({});
  const [formSteps, setFormSteps] = useState<WorkflowStep[]>([
    { order: 1, action: '', config: {}, delay: 0 },
  ]);

  const [runningExecutions, setRunningExecutions] = useState(0);

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

  // Count running executions
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

  const resetForm = () => {
    setFormStep(0);
    setFormName('');
    setFormDescription('');
    setFormTrigger('APPLICATION_RECEIVED');
    setFormTriggerConfig({});
    setFormSteps([{ order: 1, action: '', config: {}, delay: 0 }]);
    setSelectedWorkflow(null);
  };

  const actions = useWorkflowActions({
    fetchWorkflows,
    selectedWorkflow,
    setSelectedWorkflow,
    setDeleteConfirmOpen,
    formName,
    formDescription,
    formTrigger,
    formTriggerConfig,
    formSteps,
    setCreateOpen,
    setEditOpen,
    resetForm,
  });

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    setFormStep(0);
    setFormName(workflow.name);
    setFormDescription(workflow.description || '');
    setFormTrigger(workflow.trigger);
    try { setFormTriggerConfig(workflow.triggerConfig ? JSON.parse(workflow.triggerConfig) : {}); } catch { setFormTriggerConfig({}); }
    try { const steps = JSON.parse(workflow.steps); setFormSteps(steps.length > 0 ? steps : [{ order: 1, action: '', config: {}, delay: 0 }]); } catch { setFormSteps([{ order: 1, action: '', config: {}, delay: 0 }]); }
    setEditOpen(true);
  };

  const addFormStep = () => {
    setFormSteps((prev) => [...prev, { order: prev.length + 1, action: '', config: {}, delay: 0 }]);
  };

  const removeFormStep = (index: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStepAction = (index: number, action: string) => {
    setFormSteps((prev) => prev.map((s, i) => (i === index ? { ...s, action, config: {} } : s)));
  };

  const updateStepConfig = (index: number, key: string, value: unknown) => {
    setFormSteps((prev) => prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, [key]: value } } : s)));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setFormSteps((prev) => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const applyTemplate = (template: TemplateData) => {
    const applied = actions.applyTemplate(template);
    setFormName(applied.name);
    setFormDescription(applied.description);
    setFormTrigger(applied.trigger);
    setFormTriggerConfig(applied.triggerConfig);
    setFormSteps(applied.steps);
    setFormStep(0);
    setTemplateOpen(false);
    setCreateOpen(true);
  };

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

  // Computed stats
  const activeCount = workflows.filter((w) => w.status === 'ACTIVE').length;
  const totalExecutions = workflows.reduce((acc, w) => acc + (w._count?.executions || 0), 0);
  const successRate = totalExecutions > 0
    ? Math.round((workflows.reduce((acc, w) => acc + (w._count?.executions || 0), 0) / totalExecutions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
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
            className="border-slate-200 text-blue-700"
            onClick={() => { fetchTemplates(); setTemplateOpen(true); }}
          >
            <LayoutTemplate className="h-4 w-4 me-2" />
            {t.workflows.useTemplate}
          </Button>
          <Button
            className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 me-2" />
            {t.workflows.createWorkflow}
          </Button>
        </div>
      </div>

      <WorkflowStats
        activeCount={activeCount}
        totalExecutions={totalExecutions}
        runningExecutions={runningExecutions}
        successRate={successRate}
      />

      <WorkflowList
        workflows={workflows}
        loading={loading}
        openCreate={openCreate}
        openEdit={openEdit}
        toggleWorkflow={actions.toggleWorkflow}
        duplicateWorkflow={actions.duplicateWorkflow}
        triggerManually={actions.triggerManually}
        openHistory={openHistory}
        setSelectedWorkflow={setSelectedWorkflow}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        fetchTemplates={fetchTemplates}
        setTemplateOpen={setTemplateOpen}
      />

      {/* Create / Edit Dialogs */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-blue-600" />
              {t.workflows.createWorkflow}
            </DialogTitle>
          </DialogHeader>
          <WorkflowBuilder
            mode="create" formStep={formStep} setFormStep={setFormStep}
            formName={formName} setFormName={setFormName}
            formDescription={formDescription} setFormDescription={setFormDescription}
            formTrigger={formTrigger} setFormTrigger={setFormTrigger}
            formTriggerConfig={formTriggerConfig} setFormTriggerConfig={setFormTriggerConfig}
            formSteps={formSteps} setFormSteps={setFormSteps}
            selectedWorkflow={selectedWorkflow} saving={actions.saving}
            addFormStep={addFormStep} removeFormStep={removeFormStep}
            updateStepAction={updateStepAction} updateStepConfig={updateStepConfig} moveStep={moveStep}
            handleSave={actions.handleSave}
            onClose={() => { setCreateOpen(false); resetForm(); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-blue-600" />
              {t.workflows.editWorkflow}
            </DialogTitle>
          </DialogHeader>
          <WorkflowBuilder
            mode="edit" formStep={formStep} setFormStep={setFormStep}
            formName={formName} setFormName={setFormName}
            formDescription={formDescription} setFormDescription={setFormDescription}
            formTrigger={formTrigger} setFormTrigger={setFormTrigger}
            formTriggerConfig={formTriggerConfig} setFormTriggerConfig={setFormTriggerConfig}
            formSteps={formSteps} setFormSteps={setFormSteps}
            selectedWorkflow={selectedWorkflow} saving={actions.saving}
            addFormStep={addFormStep} removeFormStep={removeFormStep}
            updateStepAction={updateStepAction} updateStepConfig={updateStepConfig} moveStep={moveStep}
            handleSave={actions.handleSave}
            onClose={() => { setEditOpen(false); resetForm(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-blue-600" />
              {t.workflows.selectTemplate}
            </DialogTitle>
          </DialogHeader>
          <WorkflowTemplates templates={templates} applyTemplate={applyTemplate} />
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {t.workflows.executionHistory}
              {selectedWorkflow && (
                <span className="text-sm font-normal text-muted-foreground">— {selectedWorkflow.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <WorkflowExecutions
            executions={executions} executionDetail={executionDetail}
            setExecutionDetail={setExecutionDetail} selectedWorkflow={selectedWorkflow}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <Button variant="destructive" onClick={actions.deleteWorkflow}>
              {t.workflows.deleteWorkflow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
