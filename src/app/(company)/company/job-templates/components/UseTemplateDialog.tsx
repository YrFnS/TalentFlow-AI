// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, Copy, DollarSign } from 'lucide-react';
import type { JobTemplate } from './constants';
import { getDepartmentLabel, formatSalary } from './constants';

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate: JobTemplate | null;
  onConfirm: () => void;
}

export default function UseTemplateDialog({ open, onOpenChange, selectedTemplate, onConfirm }: UseTemplateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dialog-content-glow">
        <DialogHeader className="dialog-header-accent pt-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            {t.jobTemplates.useTemplate}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t.jobTemplates.useThisTemplate}
          </DialogDescription>
        </DialogHeader>
        {selectedTemplate && (
          <div className="space-y-3 py-2">
            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shrink-0">
                    <span className="text-[10px] font-bold">{getInitials(selectedTemplate.title)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedTemplate.title}</p>
                    <p className="text-xs text-muted-foreground">{getDepartmentLabel(selectedTemplate.department, t)}</p>
                  </div>
                </div>
                {selectedTemplate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.skills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                {(selectedTemplate.salaryMin || selectedTemplate.salaryMax) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatSalary(selectedTemplate.salaryMin, selectedTemplate.salaryMax)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9">{t.common.cancel}</Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
          >
            <Copy className="w-4 h-4 me-1" />
            {t.jobTemplates.useTemplate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
