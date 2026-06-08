// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface CreateAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  setFormTitle: (value: string) => void;
  formDescription: string;
  setFormDescription: (value: string) => void;
  formType: string;
  setFormType: (value: string) => void;
  formPassingScore: number;
  setFormPassingScore: (value: number) => void;
  formTimeLimit: number | null;
  setFormTimeLimit: (value: number | null) => void;
  formQuestionCount: number;
  setFormQuestionCount: (value: number) => void;
  formSkillIds: string[];
  toggleSkill: (skillId: string) => void;
  taxonomy: SkillTaxonomy[];
  getCategoryLabel: (category: string) => string;
  sa: Record<string, string>;
  handleCreateAssessment: () => void;
}

export default function CreateAssessmentDialog({
  open,
  onOpenChange,
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formType,
  setFormType,
  formPassingScore,
  setFormPassingScore,
  formTimeLimit,
  setFormTimeLimit,
  formQuestionCount,
  setFormQuestionCount,
  formSkillIds,
  toggleSkill,
  taxonomy,
  getCategoryLabel,
  sa,
  handleCreateAssessment,
}: CreateAssessmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sa.createAssessment}</DialogTitle>
          <DialogDescription>{sa.subtitle}</DialogDescription>
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
          <div className="space-y-2">
            <Label>{sa.description}</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={sa.description}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <Label>{sa.passingScore}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formPassingScore}
                onChange={(e) => setFormPassingScore(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{sa.timeLimit} ({sa.minutes})</Label>
              <Input
                type="number"
                min={0}
                value={formTimeLimit || ''}
                onChange={(e) => setFormTimeLimit(e.target.value ? Number(e.target.value) : null)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>{sa.questionCount}</Label>
              <Input
                type="number"
                min={1}
                max={50}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {sa.goBack}
          </Button>
          <Button
            onClick={handleCreateAssessment}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={formSkillIds.length === 0 || !formTitle.trim()}
          >
            {sa.saveAssessment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
