// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Loader2, HelpCircle } from 'lucide-react';
import type { ScreeningQuestion } from './types';
import ScreeningQuestionEditor from './ScreeningQuestionEditor';

interface ScreeningStepProps {
  screeningQuestions: ScreeningQuestion[];
  screeningAiLoading: boolean;
  jobTitle: string;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onUpdateQuestion: (index: number, field: keyof ScreeningQuestion, value: unknown) => void;
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  onAddOption: (qIndex: number) => void;
  onRemoveOption: (qIndex: number, optIndex: number) => void;
  onUpdateOption: (qIndex: number, optIndex: number, value: string) => void;
  onSuggestQuestions: () => void;
  t: Record<string, any>;
}

export default function ScreeningStep({
  screeningQuestions, screeningAiLoading, jobTitle,
  onAddQuestion, onRemoveQuestion, onUpdateQuestion, onMoveQuestion,
  onAddOption, onRemoveOption, onUpdateOption,
  onSuggestQuestions, t,
}: ScreeningStepProps) {
  const screening = t.screening;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{screening.title}</h2>
          <p className="text-sm text-muted-foreground">{screening.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSuggestQuestions}
            disabled={screeningAiLoading || !jobTitle.trim()}
            className="border-slate-300 text-blue-600 hover:bg-slate-50"
          >
            {screeningAiLoading ? (
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 me-2" />
            )}
            {screeningAiLoading ? screening.generating : screening.suggestWithAI}
          </Button>
          <Button
            size="sm"
            onClick={onAddQuestion}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 me-2" />
            {screening.addQuestion}
          </Button>
        </div>
      </div>

      {screeningQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
          <HelpCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">{screening.noQuestions}</p>
          <p className="text-muted-foreground text-xs mt-1">Add questions manually or use AI to suggest relevant ones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {screeningQuestions.map((q, qIndex) => (
            <ScreeningQuestionEditor
              key={qIndex}
              question={q}
              index={qIndex}
              total={screeningQuestions.length}
              onUpdate={(field, value) => onUpdateQuestion(qIndex, field, value)}
              onRemove={() => onRemoveQuestion(qIndex)}
              onMove={(dir) => onMoveQuestion(qIndex, dir)}
              onAddOption={() => onAddOption(qIndex)}
              onRemoveOption={(optIndex) => onRemoveOption(qIndex, optIndex)}
              onUpdateOption={(optIndex, value) => onUpdateOption(qIndex, optIndex, value)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
