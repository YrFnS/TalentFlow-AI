// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, SkipForward, FileText, GraduationCap, Monitor, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';

interface AssignmentTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
  isCompleted: boolean;
  status: string;
}

const categories: TaskCategory[] = ['Document', 'Training', 'Setup', 'Introduction', 'General'];

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  Document: FileText,
  Training: GraduationCap,
  Setup: Monitor,
  Introduction: Users,
  General: Settings,
};

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

const categoryBgColors: Record<TaskCategory, string> = {
  Document: 'bg-blue-500',
  Training: 'bg-purple-500',
  Setup: 'bg-slate-500',
  Introduction: 'bg-amber-500',
  General: 'bg-gray-500',
};

interface TaskChecklistProps {
  tasks: AssignmentTask[];
  onToggleTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
}

export default function TaskChecklist({ tasks, onToggleTask, onSkipTask }: TaskChecklistProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        {ot.tasks}
      </h3>
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4 pe-2">
          {categories.filter(cat => tasks.some(t => t.category === cat)).map(cat => {
            const catTasks = tasks.filter(t => t.category === cat);
            const CatIcon = categoryIcons[cat];
            const catCompleted = catTasks.filter(t => t.isCompleted).length;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md text-white text-[10px]',
                    categoryBgColors[cat]
                  )}>
                    <CatIcon className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold">{ot[getCategoryKey(cat)]}</span>
                  <span className="text-[10px] text-muted-foreground">{catCompleted}/{catTasks.length}</span>
                </div>
                <div className="space-y-1 ms-2">
                  {catTasks.map((task) => {
                    const isOverdue = task.status === 'OVERDUE';
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md text-sm transition-colors',
                          isOverdue && 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800',
                          task.isCompleted && 'opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => onToggleTask(task.id)}
                          className="accent-teal-600"
                        />
                        <span className={cn('flex-1 text-xs', task.isCompleted && 'line-through')}>{task.title}</span>
                        {task.isRequired && (
                          <Badge className="text-[8px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">{ot.required}</Badge>
                        )}
                        {!task.isRequired && (
                          <Badge className="text-[8px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0">{ot.optional}</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{ot.dueDay} {task.dueDay}</span>
                        {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                        {!task.isCompleted && !isOverdue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => onSkipTask(task.id)}
                          >
                            <SkipForward className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
