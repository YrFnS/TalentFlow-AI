// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardCheck,
  UserPlus,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import TaskChecklist from './TaskChecklist';

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

interface OnboardingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssignment: OnboardingAssignment | null;
  onToggleTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onMarkAllComplete: () => void;
  onSendReminder: () => void;
}

export default function OnboardingDetailDialog({
  open,
  onOpenChange,
  selectedAssignment,
  onToggleTask,
  onSkipTask,
  onMarkAllComplete,
  onSendReminder,
}: OnboardingDetailDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            {ot.newHireDetail}
          </DialogTitle>
        </DialogHeader>
        {selectedAssignment && (
          <div className="space-y-6 py-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  {ot.employee}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(selectedAssignment.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-semibold">{selectedAssignment.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{selectedAssignment.employeeEmail}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ot.plans}: {selectedAssignment.planName}</span>
                      <Badge className={cn('text-[10px]', statusBadgeColors[selectedAssignment.status])}>
                        {getStatusLabel(selectedAssignment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{ot.progress}</span>
                <span className="text-sm font-bold text-blue-600">{selectedAssignment.progress}%</span>
              </div>
              <Progress value={selectedAssignment.progress} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{ot.startDate}: {selectedAssignment.startDate}</span>
                <span>{ot.dueDate}: {selectedAssignment.dueDate}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{getDaysRemaining(selectedAssignment)} {ot.daysRemaining}</span>
              </div>
            </div>
            <TaskChecklist
              tasks={selectedAssignment.tasks}
              onToggleTask={onToggleTask}
              onSkipTask={onSkipTask}
            />
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="text-xs" onClick={onSendReminder}>
                <Send className="h-3 w-3 me-1" />
                {ot.sendReminder}
              </Button>
              {selectedAssignment.status !== 'Completed' && (
                <Button
                  size="sm"
                  className="text-xs bg-gradient-to-r bg-blue-600 text-white"
                  onClick={onMarkAllComplete}
                >
                  <CheckCircle2 className="h-3 w-3 me-1" />
                  {ot.markComplete}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
