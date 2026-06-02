// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';
type OnboardingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

interface AssignmentTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
  isCompleted: boolean;
  status: string;
}

interface OnboardingAssignment {
  id: string;
  employeeName: string;
  employeeEmail: string;
  planName: string;
  planId: string;
  progress: number;
  startDate: string;
  dueDate: string;
  status: OnboardingStatus;
  tasks: AssignmentTask[];
}

const categoryBadgeColorMap: Record<TaskCategory, string> = {
  Document: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  Training: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Setup: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Introduction: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  General: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
};

const categoryKeyMap: Record<TaskCategory, string> = {
  Document: 'categoryDocument',
  Training: 'categoryTraining',
  Setup: 'categorySetup',
  Introduction: 'categoryIntroduction',
  General: 'categoryGeneral',
};

interface AssignmentCardProps {
  assignment: OnboardingAssignment;
  completedTasks: number;
  totalTasks: number;
  onOpenDetail: (assignment: OnboardingAssignment) => void;
  onSendReminder: () => void;
  onToggleTask: (assignment: OnboardingAssignment, taskId: string) => void;
}

export default function AssignmentCard({
  assignment,
  completedTasks,
  totalTasks,
  onOpenDetail,
  onSendReminder,
  onToggleTask,
}: AssignmentCardProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <div className="mt-4 space-y-2 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{completedTasks}/{totalTasks} {ot.taskCount}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={onSendReminder}>
            <Send className="h-3 w-3 me-1" /> {ot.sendReminder}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpenDetail(assignment)}>
            <Eye className="h-3 w-3 me-1" /> {ot.viewDetails}
          </Button>
        </div>
      </div>
      {assignment.tasks.map((task) => {
        const isOverdue = task.status === 'OVERDUE';
        return (
          <div key={task.id} className={cn(
            'flex items-center gap-2 p-2 rounded-md text-sm',
            isOverdue && 'bg-red-50 dark:bg-red-950/20',
            task.isCompleted && 'opacity-60'
          )}>
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={() => onToggleTask(assignment, task.id)}
              className="accent-teal-600"
            />
            <span className={cn('flex-1 text-xs', task.isCompleted && 'line-through')}>{task.title}</span>
            <Badge className={cn('text-[8px] border-0', categoryBadgeColorMap[task.category])}>
              {ot[categoryKeyMap[task.category]]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{ot.dueDay} {task.dueDay}</span>
            {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
          </div>
        );
      })}
    </div>
  );
}
