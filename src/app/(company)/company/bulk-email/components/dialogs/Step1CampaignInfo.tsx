// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileText, Mail } from 'lucide-react';

interface Template { id: string; name: string }

interface Step1Props {
  formName: string; setFormName: (v: string) => void;
  formSubject: string; setFormSubject: (v: string) => void;
  formEmailMode: 'template' | 'custom'; setFormEmailMode: (v: 'template' | 'custom') => void;
  formTemplateId: string; setFormTemplateId: (v: string) => void;
  setFormBody: (v: string) => void;
  templates: Template[];
  t: { bulkEmail: Record<string, string> };
}

export default function Step1({ formName, setFormName, formSubject, setFormSubject, formEmailMode, setFormEmailMode, formTemplateId, setFormTemplateId, setFormBody, templates, t }: Step1Props) {
  const bodyMap: Record<string, string> = {
    'TPL-001': 'Dear {{candidate_name}},\n\nWe are pleased to invite you for an interview for the {{job_title}} position at {{company_name}}.\n\nInterview Details:\n- Date: {{interview_date}}\n- Time: {{interview_time}}\n\nPlease confirm your availability.\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-002': 'Dear {{candidate_name}},\n\nThis is a reminder about your interview for the {{job_title}} position.\n\nDate: {{interview_date}}\nTime: {{interview_time}}\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-003': 'Dear {{candidate_name}},\n\nThank you for applying for the {{job_title}} position at {{company_name}}.\n\nWe will review your application and get back to you soon.\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-004': 'Dear {{candidate_name}},\n\nWe wanted to provide you with an update regarding your application for the {{job_title}} position at {{company_name}}.\n\nYour application is currently under review.\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-005': 'Dear {{candidate_name}},\n\nWe are thrilled to offer you the {{job_title}} position at {{company_name}}!\n\nPlease review the attached offer letter.\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-006': 'Dear {{candidate_name}},\n\nThank you for your interest in the {{job_title}} position at {{company_name}}.\n\nAfter careful review, we have decided not to move forward at this time.\n\nBest regards,\n{{company_name}} Hiring Team',
    'TPL-008': 'Dear {{candidate_name}},\n\nWelcome to {{company_name}}! We are thrilled to have you join our team as {{job_title}}.\n\nPlease complete your onboarding paperwork.\n\nBest regards,\n{{company_name}} HR Team',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.bulkEmail.campaignName}</label>
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Q2 Interview Invitations" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.bulkEmail.subject}</label>
        <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="e.g. Interview Invitation - {{job_title}}" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.bulkEmail.selectTemplate}</label>
        <div className="flex gap-2">
          <Button variant={formEmailMode === 'template' ? 'default' : 'outline'} size="sm"
            className={cn(formEmailMode === 'template' && 'bg-gradient-to-r bg-blue-600 text-white')}
            onClick={() => setFormEmailMode('template')}>
            <FileText className="h-3.5 w-3.5 me-1" />{t.bulkEmail.selectTemplate}
          </Button>
          <Button variant={formEmailMode === 'custom' ? 'default' : 'outline'} size="sm"
            className={cn(formEmailMode === 'custom' && 'bg-gradient-to-r bg-blue-600 text-white')}
            onClick={() => setFormEmailMode('custom')}>
            <Mail className="h-3.5 w-3.5 me-1" />{t.bulkEmail.writeCustom}
          </Button>
        </div>
      </div>
      {formEmailMode === 'template' && (
        <div className="space-y-2">
          <Select value={formTemplateId} onValueChange={(v) => {
            setFormTemplateId(v);
            if (bodyMap[v]) setFormBody(bodyMap[v]);
          }}>
            <SelectTrigger><SelectValue placeholder={t.bulkEmail.selectTemplate} /></SelectTrigger>
            <SelectContent>{templates.map(tpl => <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
