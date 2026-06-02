// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PlayCircle } from 'lucide-react';

interface MockNewHire {
  id: string;
  name: string;
  email: string;
}

interface OnboardingPlan {
  id: string;
  name: string;
  isActive: boolean;
  duration: number;
  tasks: any[];
}

interface OnboardingTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerNewHire: string;
  triggerPlanId: string;
  triggerStartDate: string;
  mockNewHires: MockNewHire[];
  plans: OnboardingPlan[];
  onNewHireChange: (v: string) => void;
  onPlanIdChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onTrigger: () => void;
}

export default function OnboardingTriggerDialog({
  open,
  onOpenChange,
  triggerNewHire,
  triggerPlanId,
  triggerStartDate,
  mockNewHires,
  plans,
  onNewHireChange,
  onPlanIdChange,
  onStartDateChange,
  onTrigger,
}: OnboardingTriggerDialogProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            {ot.triggerOnboarding}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">{ot.selectNewHire}</label>
            <Select value={triggerNewHire} onValueChange={onNewHireChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={ot.selectEmployee} />
              </SelectTrigger>
              <SelectContent>
                {mockNewHires.map(h => (
                  <SelectItem key={h.id} value={h.id}>{h.name} ({h.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{ot.selectPlan}</label>
            <Select value={triggerPlanId} onValueChange={onPlanIdChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={ot.selectPlan} />
              </SelectTrigger>
              <SelectContent>
                {plans.filter(p => p.isActive).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.tasks.length} {ot.taskCount}, {p.duration} {ot.days})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{ot.startDate}</label>
            <Input
              type="date"
              value={triggerStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">{t.common.cancel}</Button>
          </DialogClose>
          <Button
            size="sm"
            className="bg-gradient-to-r bg-blue-600 text-white"
            onClick={onTrigger}
          >
            <PlayCircle className="h-3.5 w-3.5 me-1" />
            {ot.triggerOnboarding}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
