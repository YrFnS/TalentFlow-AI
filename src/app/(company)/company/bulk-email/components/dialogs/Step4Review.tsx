// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CheckCircle2, Eye, Send, Clock, Calendar } from 'lucide-react';

interface Template { id: string; name: string }

interface Step4Props {
  formName: string; formSubject: string;
  formSelectedRecipients: Set<string>;
  formEmailMode: 'template' | 'custom'; formTemplateId: string;
  templates: Template[]; formBody: string;
  formSendMode: 'now' | 'later'; setFormSendMode: (v: 'now' | 'later') => void;
  formScheduleDate: string; setFormScheduleDate: (v: string) => void;
  replaceVariables: (text: string) => string;
  t: { bulkEmail: Record<string, string> };
}

export default function Step4({ formName, formSubject, formSelectedRecipients, formEmailMode, formTemplateId, templates, formBody,
  formSendMode, setFormSendMode, formScheduleDate, setFormScheduleDate, replaceVariables, t }: Step4Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{t.bulkEmail.campaignSummary}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.campaignName}</p>
            <p className="text-sm font-medium mt-0.5">{formName}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.subject}</p>
            <p className="text-sm font-medium mt-0.5 truncate">{formSubject}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.recipients}</p>
            <p className="text-sm font-medium mt-0.5">{formSelectedRecipients.size}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.selectTemplate}</p>
            <p className="text-sm font-medium mt-0.5">{formEmailMode === 'template' ? templates.find(t => t.id === formTemplateId)?.name || '—' : t.bulkEmail.writeCustom}</p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" />{t.bulkEmail.preview}</h3>
        <div className="rounded-lg border border-border/50 p-3 bg-muted/20 max-h-40 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t.bulkEmail.subject}</p>
          <p className="text-sm font-medium mb-2">{replaceVariables(formSubject)}</p>
          <Separator className="my-2" />
          <p className="text-sm whitespace-pre-line">{replaceVariables(formBody)}</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" />{t.bulkEmail.scheduleLater}</h3>
        <div className="flex gap-2">
          <Button variant={formSendMode === 'now' ? 'default' : 'outline'} size="sm"
            className={cn(formSendMode === 'now' && 'bg-gradient-to-r bg-blue-600 text-white')} onClick={() => setFormSendMode('now')}>
            <Send className="h-3.5 w-3.5 me-1" />{t.bulkEmail.sendNow}
          </Button>
          <Button variant={formSendMode === 'later' ? 'default' : 'outline'} size="sm"
            className={cn(formSendMode === 'later' && 'bg-gradient-to-r bg-blue-600 text-white')} onClick={() => setFormSendMode('later')}>
            <Clock className="h-3.5 w-3.5 me-1" />{t.bulkEmail.scheduleLater}
          </Button>
        </div>
        {formSendMode === 'later' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.bulkEmail.scheduleDate}</label>
            <Input type="datetime-local" value={formScheduleDate} onChange={(e) => setFormScheduleDate(e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
}
