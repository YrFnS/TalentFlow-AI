// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Megaphone, CheckCircle2, ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import type { Recipient } from './types';
import Step1 from './dialogs/Step1CampaignInfo';
import Step2 from './dialogs/Step2EmailBody';
import Step3 from './dialogs/Step3Recipients';
import Step4 from './dialogs/Step4Review';

interface Template { id: string; name: string }
interface Variable { key: string; labelKey: string; sample: string }

interface CreateCampaignDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  step: number; setStep: (s: number) => void;
  formName: string; setFormName: (v: string) => void;
  formSubject: string; setFormSubject: (v: string) => void;
  formEmailMode: 'template' | 'custom'; setFormEmailMode: (v: 'template' | 'custom') => void;
  formTemplateId: string; formBody: string; setFormBody: (v: string) => void;
  formSelectedRecipients: Set<string>;
  formSearchRecipients: string; setFormSearchRecipients: (v: string) => void;
  formFilterJob: string; setFormFilterJob: (v: string) => void;
  formFilterStatus: string; setFormFilterStatus: (v: string) => void;
  formFilterStage: string; setFormFilterStage: (v: string) => void;
  formSendMode: 'now' | 'later'; setFormSendMode: (v: 'now' | 'later') => void;
  formScheduleDate: string; setFormScheduleDate: (v: string) => void;
  isSending: boolean;
  templates: Template[]; setFormTemplateId: (v: string) => void;
  VARIABLES: Variable[];
  ALL_RECIPIENTS: Recipient[];
  uniqueJobs: string[]; uniqueStages: string[];
  canGoNext: () => boolean;
  insertVariable: (key: string) => void;
  toggleRecipient: (id: string) => void;
  selectAllVisible: () => void; deselectAllVisible: () => void;
  filteredRecipients: Recipient[];
  replaceVariables: (text: string) => string;
  handleCreateCampaign: () => void;
}

export default function CreateCampaignDialog(props: CreateCampaignDialogProps) {
  const { t } = useI18n();
  const { open, onOpenChange, step, setStep, isSending, canGoNext, handleCreateCampaign, formSendMode } = props;

  const stepLabels: Record<number, string> = {
    1: t.bulkEmail.campaignName, 2: t.bulkEmail.emailBody, 3: t.bulkEmail.recipientSelection, 4: t.bulkEmail.reviewCampaign,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-blue-600" />{t.bulkEmail.createCampaign}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={cn('step-dot text-xs', s === step && 'step-dot-active', s < step && 'step-dot-completed')}>
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={cn('step-line', s < step && 'step-line-active')} />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t.bulkEmail.step} {step} / 4 — {stepLabels[step]}</p>

        <div className="py-2 max-h-[55vh] overflow-y-auto scrollbar-thin">
          {step === 1 && <Step1 t={t} {...{ formName: props.formName, setFormName: props.setFormName, formSubject: props.formSubject, setFormSubject: props.setFormSubject, formEmailMode: props.formEmailMode, setFormEmailMode: props.setFormEmailMode, formTemplateId: props.formTemplateId, setFormTemplateId: props.setFormTemplateId, setFormBody: props.setFormBody, templates: props.templates }} />}
          {step === 2 && <Step2 t={t} {...{ formBody: props.formBody, setFormBody: props.setFormBody, VARIABLES: props.VARIABLES, insertVariable: props.insertVariable, replaceVariables: props.replaceVariables }} />}
          {step === 3 && <Step3 t={t} {...{ formSelectedRecipients: props.formSelectedRecipients, formSearchRecipients: props.formSearchRecipients, setFormSearchRecipients: props.setFormSearchRecipients, formFilterJob: props.formFilterJob, setFormFilterJob: props.setFormFilterJob, formFilterStatus: props.formFilterStatus, setFormFilterStatus: props.setFormFilterStatus, formFilterStage: props.formFilterStage, setFormFilterStage: props.setFormFilterStage, uniqueJobs: props.uniqueJobs, uniqueStages: props.uniqueStages, filteredRecipients: props.filteredRecipients, toggleRecipient: props.toggleRecipient, selectAllVisible: props.selectAllVisible, deselectAllVisible: props.deselectAllVisible }} />}
          {step === 4 && <Step4 t={t} {...{ formName: props.formName, formSubject: props.formSubject, formSelectedRecipients: props.formSelectedRecipients, formEmailMode: props.formEmailMode, formTemplateId: props.formTemplateId, templates: props.templates, formBody: props.formBody, formSendMode: props.formSendMode, setFormSendMode: props.setFormSendMode, formScheduleDate: props.formScheduleDate, setFormScheduleDate: props.setFormScheduleDate, replaceVariables: props.replaceVariables }} />}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>{step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 me-1" />{t.bulkEmail.previous}</Button>}</div>
          <div className="flex gap-2">
            <DialogClose asChild><Button variant="ghost">{t.common.cancel}</Button></DialogClose>
            {step < 4 ? (
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700" disabled={!canGoNext()} onClick={() => setStep(s => s + 1)}>
                {t.bulkEmail.next}<ArrowRight className="h-4 w-4 ms-1" />
              </Button>
            ) : (
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700" disabled={isSending} onClick={handleCreateCampaign}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Send className="h-4 w-4 me-1" />}
                {formSendMode === 'now' ? t.bulkEmail.sendNow : t.bulkEmail.scheduleLater}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
