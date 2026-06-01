// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import type { TranslationKeys } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { WorkflowStep, WorkflowData, TRIGGER_OPTIONS, getTriggerLabel, getActionLabel } from './types';
import WorkflowStepEditor from './WorkflowStepEditor';

interface WorkflowBuilderProps {
  mode: 'create' | 'edit';
  formStep: number;
  setFormStep: (s: number) => void;
  formName: string;
  setFormName: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formTrigger: string;
  setFormTrigger: (v: string) => void;
  formTriggerConfig: Record<string, unknown>;
  setFormTriggerConfig: (v: Record<string, unknown>) => void;
  formSteps: WorkflowStep[];
  setFormSteps: (v: WorkflowStep[] | ((prev: WorkflowStep[]) => WorkflowStep[])) => void;
  selectedWorkflow: WorkflowData | null;
  saving: boolean;
  addFormStep: () => void;
  removeFormStep: (index: number) => void;
  updateStepAction: (index: number, action: string) => void;
  updateStepConfig: (index: number, key: string, value: unknown) => void;
  moveStep: (index: number, direction: 'up' | 'down') => void;
  handleSave: () => Promise<void>;
  onClose: () => void;
}

export default function WorkflowBuilder(props: WorkflowBuilderProps) {
  const { t } = useI18n() as { t: TranslationKeys };
  const {
    formStep, setFormStep,
    formName, setFormName,
    formDescription, setFormDescription,
    formTrigger, setFormTrigger,
    formTriggerConfig, setFormTriggerConfig,
    formSteps, setFormSteps,
    selectedWorkflow, saving,
    addFormStep, removeFormStep,
    updateStepAction, updateStepConfig, moveStep,
    handleSave,
  } = props;

  const FORM_STEPS = [t.workflows.basicInfo, t.workflows.triggerSetup, t.workflows.addSteps, t.workflows.reviewAndSave];

  return (
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
                  ? 'bg-teal-100 text-blue-700 dark:bg-teal-950'
                  : i < formStep
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
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
                    {getTriggerLabel(trig, t)}
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
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={addFormStep}>
              <Plus className="h-3 w-3 me-1" />
              {t.workflows.addAction}
            </Button>
          </div>
          <WorkflowStepEditor
            formSteps={formSteps}
            updateStepAction={updateStepAction}
            updateStepConfig={updateStepConfig}
            removeFormStep={removeFormStep}
            moveStep={moveStep}
          />
        </div>
      )}

      {/* Step 4: Review & Save */}
      {formStep === 3 && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="border-slate-200">
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
                <p className="text-sm">{getTriggerLabel(formTrigger, t)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t.workflows.steps}:</span>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {formSteps.filter((s) => s.action).map((step, i, arr) => (
                    <React.Fragment key={i}>
                      <Badge variant="outline" className="text-[10px] border-slate-200">
                        {i + 1}. {getActionLabel(step.action, t)}
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
            className="bg-gradient-to-r bg-blue-600 text-white"
            onClick={() => setFormStep((prev) => Math.min(3, prev + 1))}
          >
            {t.workflows.next}
            <ChevronRight className="h-4 w-4 ms-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-gradient-to-r bg-blue-600 text-white"
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
}
