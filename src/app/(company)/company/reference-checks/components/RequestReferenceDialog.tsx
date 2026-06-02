// @ts-nocheck
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Send, AlertCircle, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { MockApplication } from './types';

interface RequestReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formApplicationId: string;
  setFormApplicationId: (v: string) => void;
  formRefName: string;
  setFormRefName: (v: string) => void;
  formRefEmail: string;
  setFormRefEmail: (v: string) => void;
  formRefPhone: string;
  setFormRefPhone: (v: string) => void;
  formRefTitle: string;
  setFormRefTitle: (v: string) => void;
  formRefCompany: string;
  setFormRefCompany: (v: string) => void;
  formRelationship: string;
  setFormRelationship: (v: string) => void;
  formQuestions: string[];
  setFormQuestions: (v: string[]) => void;
  formExpiryDate: string;
  setFormExpiryDate: (v: string) => void;
  selectedApplication: MockApplication | undefined;
  mockApplications: MockApplication[];
  rt: Record<string, string>;
  commonT: Record<string, string>;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, value: string) => void;
  onRemoveQuestion: (index: number) => void;
  onSendRequest: () => void;
}

export default function RequestReferenceDialog({
  open,
  onOpenChange,
  formApplicationId,
  setFormApplicationId,
  formRefName,
  setFormRefName,
  formRefEmail,
  setFormRefEmail,
  formRefPhone,
  setFormRefPhone,
  formRefTitle,
  setFormRefTitle,
  formRefCompany,
  setFormRefCompany,
  formRelationship,
  setFormRelationship,
  formQuestions,
  setFormQuestions,
  formExpiryDate,
  setFormExpiryDate,
  selectedApplication,
  mockApplications,
  rt,
  commonT,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onSendRequest,
}: RequestReferenceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            {rt.requestReference}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {/* Select Application */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{rt.selectApplication} *</label>
            <Select value={formApplicationId} onValueChange={setFormApplicationId}>
              <SelectTrigger>
                <SelectValue placeholder={rt.selectApplication} />
              </SelectTrigger>
              <SelectContent>
                {mockApplications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.candidateName} — {app.jobTitle} ({app.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-filled Candidate Name */}
          {selectedApplication && (
            <Card className="border-border/50 animate-fade-in-up">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(selectedApplication.candidateName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{selectedApplication.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{selectedApplication.jobTitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reference Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.referenceName} *</label>
              <Input
                value={formRefName}
                onChange={(e) => setFormRefName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.referenceEmail} *</label>
              <Input
                type="email"
                value={formRefEmail}
                onChange={(e) => setFormRefEmail(e.target.value)}
                placeholder="john@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.referencePhone}</label>
              <Input
                value={formRefPhone}
                onChange={(e) => setFormRefPhone(e.target.value)}
                placeholder="+1-555-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.referenceTitle}</label>
              <Input
                value={formRefTitle}
                onChange={(e) => setFormRefTitle(e.target.value)}
                placeholder="Engineering Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.company}</label>
              <Input
                value={formRefCompany}
                onChange={(e) => setFormRefCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.relationship} *</label>
              <Select value={formRelationship} onValueChange={setFormRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder={rt.relationship} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">{rt.relationshipManager}</SelectItem>
                  <SelectItem value="Colleague">{rt.relationshipColleague}</SelectItem>
                  <SelectItem value="Direct Report">{rt.relationshipDirectReport}</SelectItem>
                  <SelectItem value="Other">{rt.relationshipOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                {rt.questions}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                onClick={onAddQuestion}
              >
                <Plus className="h-3.5 w-3.5" />
                {rt.addQuestion}
              </Button>
            </div>
            <div className="space-y-2">
              {formQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                  <Input
                    value={q}
                    onChange={(e) => onUpdateQuestion(i, e.target.value)}
                    className="flex-1"
                    placeholder={`${rt.questionPlaceholder || 'Question'} ${i + 1}`}
                  />
                  {formQuestions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => onRemoveQuestion(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{rt.expiryDate}</label>
            <Input
              type="date"
              value={formExpiryDate}
              onChange={(e) => setFormExpiryDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              {rt.expiryHint || 'Default: 14 days from today'}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{commonT.cancel}</Button>
          </DialogClose>
          <Button
            className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={onSendRequest}
          >
            <Send className="h-3.5 w-3.5 me-1.5" />
            {rt.sendRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
