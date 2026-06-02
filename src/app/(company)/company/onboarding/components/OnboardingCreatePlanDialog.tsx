// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Sparkles } from 'lucide-react';

type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';

interface NewPlanTask {
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
}

const categories: TaskCategory[] = ['Document', 'Training', 'Setup', 'Introduction', 'General'];

const getCategoryKey = (cat: TaskCategory): string => {
  const map: Record<TaskCategory, string> = {
    Document: 'categoryDocument',
    Training: 'categoryTraining',
    Setup: 'categorySetup',
    Introduction: 'categoryIntroduction',
    General: 'categoryGeneral',
  };
  return map[cat];
};

interface OnboardingCreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlanName: string;
  newPlanDesc: string;
  newPlanDuration: string;
  newPlanTasks: NewPlanTask[];
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onUpdateTask: (index: number, field: string, value: string | boolean) => void;
  onCreatePlan: () => void;
}

export default function OnboardingCreatePlanDialog({
  open,
  onOpenChange,
  newPlanName,
  newPlanDesc,
  newPlanDuration,
  newPlanTasks,
  onNameChange,
  onDescChange,
  onDurationChange,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  onCreatePlan,
}: OnboardingCreatePlanDialogProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {ot.createPlan}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">{ot.planName}</label>
            <Input
              value={newPlanName}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1"
              placeholder={ot.planNamePlaceholder}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ot.planDescription}</label>
            <Textarea
              value={newPlanDesc}
              onChange={(e) => onDescChange(e.target.value)}
              className="mt-1"
              rows={2}
              placeholder={ot.planDescriptionPlaceholder}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ot.duration}</label>
            <Input
              type="number"
              min={1}
              value={newPlanDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{ot.tasks}</label>
              <Button variant="outline" size="sm" className="text-xs" onClick={onAddTask}>
                <Plus className="h-3 w-3 me-1" />
                {ot.addTask}
              </Button>
            </div>
            {newPlanTasks.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">{ot.addTaskHint}</p>
            )}
            <div className="space-y-3">
              {newPlanTasks.map((task, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-muted-foreground">{ot.taskTitle}</label>
                        <Input
                          value={task.title}
                          onChange={(e) => onUpdateTask(index, 'title', e.target.value)}
                          className="h-7 text-xs mt-0.5"
                          placeholder={ot.taskTitle}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">{ot.taskCategory}</label>
                        <Select
                          value={task.category}
                          onValueChange={(v) => onUpdateTask(index, 'category', v)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c} value={c}>{ot[getCategoryKey(c)]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">{ot.dueDay}</label>
                        <Input
                          type="number"
                          min={1}
                          value={task.dueDay}
                          onChange={(e) => onUpdateTask(index, 'dueDay', e.target.value)}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={task.isRequired}
                            onChange={(e) => onUpdateTask(index, 'isRequired', e.target.checked)}
                            className="accent-teal-600"
                          />
                          {ot.required}
                        </label>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => onRemoveTask(index)}>
                          <Trash2 className="h-3 w-3 me-1" />
                          {ot.removeTask}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">{t.common.cancel}</Button>
          </DialogClose>
          <Button
            size="sm"
            className="bg-gradient-to-r bg-blue-600 text-white"
            onClick={onCreatePlan}
          >
            {ot.createPlan}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
