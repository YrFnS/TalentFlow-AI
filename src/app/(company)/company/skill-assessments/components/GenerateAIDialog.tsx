// @ts-nocheck
'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SkillBadgeSelector from './SkillBadgeSelector';

interface SkillTaxonomy {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
}

interface GenerateAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  setFormTitle: (value: string) => void;
  formType: string;
  setFormType: (value: string) => void;
  formDifficulty: string;
  setFormDifficulty: (value: string) => void;
  formQuestionCount: number;
  setFormQuestionCount: (value: number) => void;
  formSkillIds: string[];
  toggleSkill: (skillId: string) => void;
  formQuestions: unknown[];
  generating: boolean;
  taxonomy: SkillTaxonomy[];
  getCategoryLabel: (category: string) => string;
  sa: Record<string, string>;
  handleGenerateQuestions: () => void;
  handleCreateAssessment: () => void;
}

export default function GenerateAIDialog({
  open,
  onOpenChange,
  formTitle,
  setFormTitle,
  formType,
  setFormType,
  formDifficulty,
  setFormDifficulty,
  formQuestionCount,
  setFormQuestionCount,
  formSkillIds,
  toggleSkill,
  formQuestions,
  generating,
  taxonomy,
  getCategoryLabel,
  sa,
  handleGenerateQuestions,
  handleCreateAssessment,
}: GenerateAIDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {sa.generateWithAI}
          </DialogTitle>
          <DialogDescription>
            {sa.generatingQuestions}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{sa.assessmentTitle} *</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={sa.assessmentTitle}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{sa.assessmentType}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">{sa.custom}</SelectItem>
                  <SelectItem value="CODING">{sa.coding}</SelectItem>
                  <SelectItem value="SITUATIONAL">{sa.situational}</SelectItem>
                  <SelectItem value="BEHAVIORAL">{sa.behavioral}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{sa.difficulty}</Label>
              <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">{sa.easy}</SelectItem>
                  <SelectItem value="MEDIUM">{sa.medium}</SelectItem>
                  <SelectItem value="HARD">{sa.hard}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{sa.questionCount}</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formQuestionCount}
                onChange={(e) => setFormQuestionCount(Number(e.target.value))}
              />
            </div>
          </div>
          <SkillBadgeSelector
            taxonomy={taxonomy}
            formSkillIds={formSkillIds}
            toggleSkill={toggleSkill}
            getCategoryLabel={getCategoryLabel}
            sa={sa}
          />

          {/* Generated Questions Preview */}
          {formQuestions.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {sa.questionsGenerated}
              </Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {(formQuestions as { question: string; type: string; difficulty: string }[]).map((q, idx) => (
                  <div key={idx} className="text-sm flex gap-2">
                    <span className="text-muted-foreground font-medium">{idx + 1}.</span>
                    <div>
                      <p>{q.question}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[9px]">{q.type}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{q.difficulty}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {sa.goBack}
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateQuestions}
            disabled={generating || formSkillIds.length === 0}
            className="gap-2 border-slate-300 text-blue-700 hover:bg-slate-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {sa.generating}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {sa.generateWithAI}
              </>
            )}
          </Button>
          <Button
            onClick={handleCreateAssessment}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={formSkillIds.length === 0 || !formTitle.trim() || formQuestions.length === 0}
          >
            {sa.saveAssessment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
