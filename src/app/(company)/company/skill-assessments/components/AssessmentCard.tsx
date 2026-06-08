// @ts-nocheck
'use client';

import React from 'react';
import { BookOpen, Clock, Award, TrendingUp, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface AssessmentCardProps {
  assessment: AssessmentItem;
  getTypeBadge: (type: string) => { label: string; color: string };
  getCategoryColor: (category: string) => string;
  sa: Record<string, string>;
  onViewDetail: (assessment: AssessmentItem) => void;
  onDelete: (assessment: AssessmentItem) => void;
}

export default function AssessmentCard({
  assessment,
  getTypeBadge,
  getCategoryColor,
  sa,
  onViewDetail,
  onDelete,
}: AssessmentCardProps) {
  const typeBadge = getTypeBadge(assessment.type);

  return (
    <Card
      className="card-cursor-pointer transition-all hover:shadow-md"
      onClick={() => onViewDetail(assessment)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{assessment.title}</h3>
              <Badge className={`text-[10px] ${typeBadge.color}`}>
                {typeBadge.label}
              </Badge>
              <Badge
                variant="outline"
                className={
                  assessment.isActive
                    ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700'
                    : 'border-gray-300 text-gray-500'
                }
              >
                {assessment.isActive ? sa.active : sa.inactive}
              </Badge>
            </div>
            {assessment.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {assessment.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {assessment.questions?.length || 0} {sa.questions.toLowerCase()}
              </span>
              {assessment.timeLimitMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {assessment.timeLimitMinutes} {sa.minutes}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {sa.passingScore}: {assessment.passingScore}%
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {sa.avgScore}: {assessment.averageScore}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {assessment.skills.slice(0, 5).map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={`text-[10px] ${getCategoryColor(skill.category)}`}
                >
                  {skill.name}
                </Badge>
              ))}
              {assessment.skills.length > 5 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{assessment.skills.length - 5}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetail(assessment); }}>
                <Eye className="h-4 w-4 me-2" />
                {sa.viewResults}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Pencil className="h-4 w-4 me-2" />
                {sa.editAssessment}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(assessment);
                }}
              >
                <Trash2 className="h-4 w-4 me-2" />
                {sa.deleteAssessment}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
