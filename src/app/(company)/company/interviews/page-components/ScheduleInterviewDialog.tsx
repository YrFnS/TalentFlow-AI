// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/store/i18n-store';
import { typeConfig, interviewTypes } from './interview-types';

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formType: string;
  onFormTypeChange: (value: string) => void;
  formDate: string;
  onFormDateChange: (value: string) => void;
  formTime: string;
  onFormTimeChange: (value: string) => void;
  formDuration: string;
  onFormDurationChange: (value: string) => void;
  formInterviewer: string;
  onFormInterviewerChange: (value: string) => void;
  formNotes: string;
  onFormNotesChange: (value: string) => void;
  submitting: boolean;
  onSchedule: () => void;
  getTypeLabel: (type: string) => string;
}

export default function ScheduleInterviewDialog({
  open,
  onOpenChange,
  formType,
  onFormTypeChange,
  formDate,
  onFormDateChange,
  formTime,
  onFormTimeChange,
  formDuration,
  onFormDurationChange,
  formInterviewer,
  onFormInterviewerChange,
  formNotes,
  onFormNotesChange,
  submitting,
  onSchedule,
  getTypeLabel,
}: ScheduleInterviewDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 me-2" />
          {t.interviews.schedule}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.interviews.schedule}</DialogTitle>
          <DialogDescription>
            {t.interviews.selectApplication}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.interviews.type}</label>
            <Select value={formType} onValueChange={onFormTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map((type) => {
                  const cfg = typeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', cfg.color)} />
                        {getTypeLabel(type)}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.interviews.date}</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => onFormDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.interviews.time}</label>
              <Input
                type="time"
                value={formTime}
                onChange={(e) => onFormTimeChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.interviews.duration}</label>
            <Select value={formDuration} onValueChange={onFormDurationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {t.interviews.minutes}</SelectItem>
                <SelectItem value="30">30 {t.interviews.minutes}</SelectItem>
                <SelectItem value="45">45 {t.interviews.minutes}</SelectItem>
                <SelectItem value="60">60 {t.interviews.minutes}</SelectItem>
                <SelectItem value="90">90 {t.interviews.minutes}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.interviews.interviewer}</label>
            <Input
              placeholder="Interviewer name"
              value={formInterviewer}
              onChange={(e) => onFormInterviewerChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.interviews.notes}</label>
            <Textarea
              placeholder={t.interviews.notes}
              value={formNotes}
              onChange={(e) => onFormNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSchedule}
            disabled={!formDate || !formTime || submitting}
          >
            {submitting ? t.common.loading : t.interviews.schedule}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
