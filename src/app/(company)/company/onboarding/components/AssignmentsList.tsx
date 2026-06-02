// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import AssignmentCard from './AssignmentCard';

type OnboardingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

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
  tasks: any[];
}

const statusBadgeColors: Record<OnboardingStatus, string> = {
  Pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
  'In Progress': 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Overdue: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

interface AssignmentsListProps {
  filteredAssignments: OnboardingAssignment[];
  expandedAssignment: string | null;
  onToggleExpand: (id: string | null) => void;
  onOpenDetail: (assignment: OnboardingAssignment) => void;
  onSendReminder: () => void;
  onToggleTask: (assignment: OnboardingAssignment, taskId: string) => void;
}

export default function AssignmentsList({
  filteredAssignments,
  expandedAssignment,
  onToggleExpand,
  onOpenDetail,
  onSendReminder,
  onToggleTask,
}: AssignmentsListProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  const getStatusLabel = (status: OnboardingStatus): string => {
    const key = status === 'In Progress' ? 'inProgress' : status.toLowerCase();
    return ot[key] || status;
  };

  const getDaysRemaining = (assignment: OnboardingAssignment): number => {
    const due = new Date(assignment.dueDate);
    const now = new Date();
    return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
  };

  return (
    <div className="space-y-3">
      {filteredAssignments.map((assignment) => {
        const isExpanded = expandedAssignment === assignment.id;
        const daysRemaining = getDaysRemaining(assignment);
        const completedTasks = assignment.tasks.filter(t => t.isCompleted).length;
        const totalTasks = assignment.tasks.length;
        const overdueTasks = assignment.tasks.filter(t => t.status === 'OVERDUE').length;

        return (
          <Card key={assignment.id} className={cn(
            'border-border/50 card-',
            assignment.status === 'Overdue' && 'border-red-200 dark:border-red-800'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => onToggleExpand(isExpanded ? null : assignment.id)}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(assignment.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{assignment.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{assignment.planName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
                    <Progress value={assignment.progress} className="h-2 flex-1" />
                    <span className="text-xs font-medium w-8 text-end">{assignment.progress}%</span>
                  </div>
                  <Badge className={cn('text-[10px]', statusBadgeColors[assignment.status])}>
                    {getStatusLabel(assignment.status)}
                  </Badge>
                  {overdueTasks > 0 && (
                    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 text-[10px]">
                      <AlertCircle className="h-3 w-3 me-1" />
                      {overdueTasks} {ot.overdue}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{daysRemaining} {ot.daysRemaining}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              <div className="sm:hidden mt-2 flex items-center gap-2">
                <Progress value={assignment.progress} className="h-2 flex-1" />
                <span className="text-xs font-medium">{assignment.progress}%</span>
                <span className="text-[10px] text-muted-foreground">{completedTasks}/{totalTasks}</span>
              </div>
              {isExpanded && (
                <AssignmentCard
                  assignment={assignment}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                  onOpenDetail={onOpenDetail}
                  onSendReminder={onSendReminder}
                  onToggleTask={onToggleTask}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
      {filteredAssignments.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{ot.noOnboardings}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
