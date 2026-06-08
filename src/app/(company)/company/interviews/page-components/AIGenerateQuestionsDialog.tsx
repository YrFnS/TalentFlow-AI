// @ts-nocheck
import React from 'react';
import { Sparkles, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AIQuestion {
  question: string;
  category: string;
  difficulty: string;
  evaluationCriteria: string;
}

interface AIGenerateQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  questions: AIQuestion[];
  formRole: string;
  onFormRoleChange: (value: string) => void;
  formLevel: string;
  onFormLevelChange: (value: string) => void;
  formType: string;
  onFormTypeChange: (value: string) => void;
  formCount: number;
  onFormCountChange: (value: number) => void;
  onGenerate: () => void;
  onAddToKit: (question: AIQuestion) => void;
  onReset: () => void;
  disabled: boolean;
}

export default function AIGenerateQuestionsDialog({
  open,
  onOpenChange,
  loading,
  error,
  questions,
  formRole,
  onFormRoleChange,
  formLevel,
  onFormLevelChange,
  formType,
  onFormTypeChange,
  formCount,
  onFormCountChange,
  onGenerate,
  onAddToKit,
  onReset,
  disabled,
}: AIGenerateQuestionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Generate Interview Questions
          </DialogTitle>
          <DialogDescription>
            Let AI generate tailored interview questions for any role and level.
          </DialogDescription>
        </DialogHeader>

        {questions.length === 0 && !loading && !error && (
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Role *</label>
              <Input
                placeholder="e.g., Senior Frontend Engineer"
                value={formRole}
                onChange={(e) => onFormRoleChange(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Level</label>
                <Select value={formLevel} onValueChange={onFormLevelChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={formType} onValueChange={onFormTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Number of Questions</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formCount}
                onChange={(e) => onFormCountChange(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-slate-500">Generating questions...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Generation Failed</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {questions.length > 0 && !loading && (
          <div className="space-y-3 overflow-y-auto max-h-[50vh]">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-2 border-b">
              <span className="font-medium">{questions.length} questions generated</span>
            </div>
            {questions.map((q, i) => {
              const categoryColor = q.category === 'technical' ? 'bg-blue-100 text-blue-700'
                : q.category === 'behavioral' ? 'bg-purple-100 text-purple-700'
                : q.category === 'situational' ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700';
              const difficultyColor = q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700'
                : q.difficulty === 'hard' ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700';
              return (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] shrink-0">Q{i + 1}</Badge>
                        <Badge className={`text-[10px] shrink-0 ${categoryColor}`}>{q.category}</Badge>
                        <Badge className={`text-[10px] shrink-0 ${difficultyColor}`}>{q.difficulty}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-700 shrink-0 h-7"
                        onClick={() => onAddToKit(q)}
                      >
                        <PlusCircle className="w-3.5 h-3.5 me-1" />
                        Add to Kit
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-2">{q.question}</p>
                    <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Evaluation:</span> {q.evaluationCriteria}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          {questions.length > 0 && !loading && (
            <Button variant="outline" size="sm" onClick={onReset}>
              Generate More
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {questions.length === 0 && !loading && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={onGenerate}
              disabled={disabled}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Questions
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
