// @ts-nocheck
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail, Phone, StickyNote, Briefcase, Send, Calendar,
} from 'lucide-react';
import type { Candidate } from './types';

interface EngageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  engageAction: 'email' | 'call' | 'note' | 'job' | null;
  onEngageActionChange: (action: 'email' | 'call' | 'note' | 'job' | null) => void;
  emailTemplate: string;
  onEmailTemplateChange: (val: string) => void;
  emailBody: string;
  onEmailBodyChange: (val: string) => void;
  callNotes: string;
  onCallNotesChange: (val: string) => void;
  noteText: string;
  onNoteTextChange: (val: string) => void;
  reassignJob: string;
  onReassignJobChange: (val: string) => void;
  onConfirm: () => void;
  t: Record<string, string>;
}

export default function EngageDialog({
  open, onOpenChange,
  candidate,
  engageAction, onEngageActionChange,
  emailTemplate, onEmailTemplateChange,
  emailBody, onEmailBodyChange,
  callNotes, onCallNotesChange,
  noteText, onNoteTextChange,
  reassignJob, onReassignJobChange,
  onConfirm, t,
}: EngageDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-600" />
            {t.engage} — {candidate.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Action Selection */}
          {!engageAction && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950"
                onClick={() => { onEngageActionChange('email'); onEmailTemplateChange('general'); onEmailBodyChange(`Dear ${candidate.name},\n\nI hope this message finds you well...`); }}
              >
                <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium">{t.sendEmail}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => { onEngageActionChange('call'); onCallNotesChange(''); }}
              >
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{t.scheduleCall}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => { onEngageActionChange('note'); onNoteTextChange(''); }}
              >
                <StickyNote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium">{t.addNote}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-950"
                onClick={() => { onEngageActionChange('job'); onReassignJobChange(''); }}
              >
                <Briefcase className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">{t.reassignJob}</span>
              </Button>
            </div>
          )}

          {/* Email Action */}
          {engageAction === 'email' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEngageActionChange(null)}>
                  ← Back
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <Select value={emailTemplate} onValueChange={(v) => {
                  onEmailTemplateChange(v);
                  const templates: Record<string, string> = {
                    general: `Dear ${candidate.name},\n\nI hope this message finds you well. We have some exciting opportunities that match your profile...`,
                    followup: `Hi ${candidate.name},\n\nI wanted to follow up on our previous conversation about opportunities at TechVision...`,
                    opportunity: `Dear ${candidate.name},\n\nA new position has opened up that I think would be a great fit for your skills...`,
                  };
                  onEmailBodyChange(templates[v] || '');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Outreach</SelectItem>
                    <SelectItem value="followup">Follow Up</SelectItem>
                    <SelectItem value="opportunity">New Opportunity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={emailBody}
                onChange={(e) => onEmailBodyChange(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
                onClick={onConfirm}
              >
                <Send className="h-3.5 w-3.5 me-1.5" />
                {t.sendEmail}
              </Button>
            </div>
          )}

          {/* Call Action */}
          {engageAction === 'call' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEngageActionChange(null)}>
                  ← Back
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.notes}</label>
                <Textarea
                  value={callNotes}
                  onChange={(e) => onCallNotesChange(e.target.value)}
                  placeholder="Call agenda and notes..."
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                onClick={onConfirm}
              >
                <Calendar className="h-3.5 w-3.5 me-1.5" />
                {t.scheduleCall}
              </Button>
            </div>
          )}

          {/* Note Action */}
          {engageAction === 'note' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEngageActionChange(null)}>
                  ← Back
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.addNote}</label>
                <Textarea
                  value={noteText}
                  onChange={(e) => onNoteTextChange(e.target.value)}
                  placeholder="Add a note about this candidate..."
                  rows={4}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                onClick={onConfirm}
              >
                <StickyNote className="h-3.5 w-3.5 me-1.5" />
                {t.addNote}
              </Button>
            </div>
          )}

          {/* Reassign to Job Action */}
          {engageAction === 'job' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEngageActionChange(null)}>
                  ← Back
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reassignJob}</label>
                <Select value={reassignJob} onValueChange={onReassignJobChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sr-frontend">Senior Frontend Engineer</SelectItem>
                    <SelectItem value="product-designer">Product Designer</SelectItem>
                    <SelectItem value="vp-eng">VP of Engineering</SelectItem>
                    <SelectItem value="data-eng">Data Engineer</SelectItem>
                    <SelectItem value="devops-lead">DevOps Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700"
                onClick={onConfirm}
              >
                <Briefcase className="h-3.5 w-3.5 me-1.5" />
                {t.reassignJob}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
