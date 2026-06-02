// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, CheckCircle2, Clock, Plus, FileText, GraduationCap, Monitor, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';

interface PlanTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
}

interface OnboardingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  tasks: PlanTask[];
  isActive: boolean;
}

const categoryBadgeColors: Record<TaskCategory, string> = {
  Document: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  Training: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Setup: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Introduction: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  General: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
};

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  Document: FileText,
  Training: GraduationCap,
  Setup: Monitor,
  Introduction: Users,
  General: Settings,
};

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

interface OnboardingPlansSectionProps {
  plans: OnboardingPlan[];
  onTogglePlanActive: (planId: string) => void;
  onCreatePlanClick: () => void;
}

export default function OnboardingPlansSection({
  plans,
  onTogglePlanActive,
  onCreatePlanClick,
}: OnboardingPlansSectionProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-blue-600" />
        {ot.plans}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-border/50 card-">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                <Badge className={cn(
                  'text-[10px] border-0',
                  plan.isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {plan.isActive ? ot.planActive : ot.planInactive}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{plan.tasks.length} {ot.taskCount}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{plan.duration} {plan.duration === 1 ? ot.day : ot.days}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {categories.filter(cat => plan.tasks.some(t => t.category === cat)).map(cat => {
                  const CatIcon = categoryIcons[cat];
                  return (
                    <Badge key={cat} className={cn('text-[9px] gap-0.5 border-0', categoryBadgeColors[cat])}>
                      <CatIcon className="h-2.5 w-2.5" />
                      {ot[getCategoryKey(cat)]}
                    </Badge>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                onClick={() => onTogglePlanActive(plan.id)}
              >
                {plan.isActive ? ot.planInactive : ot.planActive}
              </Button>
            </CardContent>
          </Card>
        ))}
        <Card
          className="border-dashed border-2 border-slate-300 card-cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={onCreatePlanClick}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-blue-600 mb-3">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-700">{ot.createPlan}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
