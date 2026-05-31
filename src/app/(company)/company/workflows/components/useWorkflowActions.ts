// @ts-nocheck
'use client';

import { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import type { WorkflowData, TemplateData, WorkflowStep } from './types';

interface UseWorkflowActionsProps {
  fetchWorkflows: () => Promise<void>;
  selectedWorkflow: WorkflowData | null;
  setSelectedWorkflow: (w: WorkflowData | null) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  formName: string;
  formDescription: string;
  formTrigger: string;
  formTriggerConfig: Record<string, unknown>;
  formSteps: WorkflowStep[];
  setCreateOpen: (v: boolean) => void;
  setEditOpen: (v: boolean) => void;
  resetForm: () => void;
}

export default function useWorkflowActions(props: UseWorkflowActionsProps) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  const {
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
  } = props;

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

  const duplicateWorkflow = async (workflow: WorkflowData) => {
    try {
      const steps = JSON.parse(workflow.steps);
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

  const applyTemplate = (template: TemplateData) => {
    return {
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      triggerConfig: (() => { try { return JSON.parse(template.triggerConfig); } catch { return {}; } })(),
      steps: (() => { try { const s = JSON.parse(template.steps); return s.length > 0 ? s : [{ order: 1, action: '', config: {}, delay: 0 }]; } catch { return [{ order: 1, action: '', config: {}, delay: 0 }]; } })(),
    };
  };

  return {
    saving,
    handleSave,
    toggleWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    triggerManually,
    applyTemplate,
  };
}
