// @ts-nocheck
'use client';

import React from 'react';
import { Plus, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AssessmentCard from './AssessmentCard';

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

interface AssessmentListProps {
  loading: boolean;
  filtered: AssessmentItem[];
  getTypeBadge: (type: string) => { label: string; color: string };
  getCategoryColor: (category: string) => string;
  sa: Record<string, string>;
  onViewDetail: (assessment: AssessmentItem) => void;
  onDelete: (assessment: AssessmentItem) => void;
  onCreateNew: () => void;
}

export default function AssessmentList({
  loading,
  filtered,
  getTypeBadge,
  getCategoryColor,
  sa,
  onViewDetail,
  onDelete,
  onCreateNew,
}: AssessmentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">{sa.noAssessments}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{sa.subtitle}</p>
          <Button
            onClick={onCreateNew}
            className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {sa.createAssessment}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filtered.map((assessment) => (
        <AssessmentCard
          key={assessment.id}
          assessment={assessment}
          getTypeBadge={getTypeBadge}
          getCategoryColor={getCategoryColor}
          sa={sa}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
