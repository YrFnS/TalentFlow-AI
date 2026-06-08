// @ts-nocheck
'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SkillInfo {
  name: string;
  category: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  description?: string;
  skillIds: string[];
  skills: SkillInfo[];
  questions: unknown[];
  timeLimitMinutes: number | null;
  passingScore: number;
  type: string;
  isActive: boolean;
  createdAt: string;
  totalResults: number;
  averageScore: number;
}

interface AssessmentResult {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  score: number | null;
  overallLevel: string | null;
  completedAt: string;
}

interface AssessmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssessment: AssessmentItem | null;
  assessmentResults: AssessmentResult[];
  getCategoryColor: (category: string) => string;
  sa: Record<string, string>;
}

export default function AssessmentDetailDialog({
  open,
  onOpenChange,
  selectedAssessment,
  assessmentResults,
  getCategoryColor,
  sa,
}: AssessmentDetailDialogProps) {
  if (!selectedAssessment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            {selectedAssessment.title}
          </DialogTitle>
          <DialogDescription>{selectedAssessment.description || sa.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Assessment Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-2xl font-bold text-blue-700">
                {selectedAssessment.questions?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">{sa.questions}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-700">
                {selectedAssessment.passingScore}%
              </p>
              <p className="text-xs text-muted-foreground">{sa.passingScore}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <p className="text-2xl font-bold text-amber-700">
                {selectedAssessment.timeLimitMinutes || '—'}
              </p>
              <p className="text-xs text-muted-foreground">{sa.timeLimit}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-cyan-50">
              <p className="text-2xl font-bold text-cyan-700">
                {selectedAssessment.totalResults}
              </p>
              <p className="text-xs text-muted-foreground">{sa.totalResults}</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-semibold mb-2">{sa.selectSkills}</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedAssessment.skills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={`text-xs ${getCategoryColor(skill.category)}`}
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Results Table */}
          <div>
            <h4 className="text-sm font-semibold mb-2">{sa.results}</h4>
            {assessmentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {sa.noResults}
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-semibold text-muted-foreground">
                  <span>{sa.candidateName}</span>
                  <span>{sa.score}</span>
                  <span>{sa.level}</span>
                  <span>{sa.passingScore}</span>
                  <span>{sa.completedAt}</span>
                </div>
                <ScrollArea className="max-h-48">
                  {assessmentResults.map((result) => (
                    <div
                      key={result.id}
                      className="grid grid-cols-5 gap-2 p-3 border-t text-sm items-center"
                    >
                      <span className="font-medium truncate">{result.candidateName}</span>
                      <span className="font-mono">{result.score !== null ? `${result.score}%` : '—'}</span>
                      <span>
                        {result.overallLevel ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {result.overallLevel}
                          </Badge>
                        ) : '—'}
                      </span>
                      <span>
                        {(result.score !== null && result.score >= selectedAssessment.passingScore) ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
                            {sa.passed}
                          </Badge>
                        ) : result.score !== null ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 text-[10px]">
                            {sa.failed}
                          </Badge>
                        ) : '—'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
