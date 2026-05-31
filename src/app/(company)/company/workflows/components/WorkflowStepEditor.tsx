// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ChevronLeft } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import type { TranslationKeys } from '@/lib/i18n';
import { WorkflowStep, ACTION_OPTIONS, getActionLabel } from './types';

interface WorkflowStepEditorProps {
  formSteps: WorkflowStep[];
  updateStepAction: (index: number, action: string) => void;
  updateStepConfig: (index: number, key: string, value: unknown) => void;
  removeFormStep: (index: number) => void;
  moveStep: (index: number, direction: 'up' | 'down') => void;
}

function renderActionConfig(
  step: WorkflowStep,
  index: number,
  updateStepConfig: (index: number, key: string, value: unknown) => void,
  t: TranslationKeys,
) {

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
}

export default function WorkflowStepEditor({
  formSteps,
  updateStepAction,
  updateStepConfig,
  removeFormStep,
  moveStep,
}: WorkflowStepEditorProps) {
  const { t } = useI18n() as { t: TranslationKeys };

  return (
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
                      {getActionLabel(action, t)}
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
            {step.action && renderActionConfig(step, i, updateStepConfig, t)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
