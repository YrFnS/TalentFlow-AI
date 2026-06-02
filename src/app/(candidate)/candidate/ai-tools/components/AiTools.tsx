// @ts-nocheck
'use client';

import type React from 'react';
import { Sparkles, FileText, MessageSquare, Target, Mic, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AITool {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  buttonLabel: string;
}

export const aiTools: AITool[] = [
  { id: 'resume-analysis', titleKey: 'resumeAnalysis', descKey: 'resumeAnalysisDesc', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', buttonLabel: 'startAnalysis' },
  { id: 'cover-letter', titleKey: 'coverLetterGen', descKey: 'coverLetterGenDesc', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50', buttonLabel: 'generate' },
  { id: 'skill-gap', titleKey: 'skillGapAnalysis', descKey: 'skillGapAnalysisDesc', icon: Target, color: 'text-amber-600', bgColor: 'bg-amber-50', buttonLabel: 'analyzeGap' },
  { id: 'interview-prep', titleKey: 'interviewPrep', descKey: 'interviewPrepDesc', icon: Mic, color: 'text-purple-600', bgColor: 'bg-purple-50', buttonLabel: 'startPrep' },
];

interface AIToolsGridProps {
  t: Record<string, any>;
  onOpenTool: (id: string) => void;
}

export default function AIToolsGrid({ t, onOpenTool }: AIToolsGridProps) {
  const toolLabelMap: Record<string, string> = {
    resumeAnalysis: t.candidate.resumeAnalysis,
    coverLetterGen: t.candidate.coverLetterGen,
    skillGapAnalysis: t.candidate.skillGapAnalysis,
    interviewPrep: t.candidate.interviewPrep,
  };

  const toolDescMap: Record<string, string> = {
    resumeAnalysisDesc: t.candidate.resumeAnalysisDesc,
    coverLetterGenDesc: t.candidate.coverLetterGenDesc,
    skillGapAnalysisDesc: t.candidate.skillGapAnalysisDesc,
    interviewPrepDesc: t.candidate.interviewPrepDesc,
  };

  const buttonLabelMap: Record<string, string> = {
    startAnalysis: t.candidate.startAnalysis,
    generate: t.candidate.generate,
    analyzeGap: t.candidate.analyzeGap,
    startPrep: t.candidate.startPrep,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {aiTools.map((tool) => (
        <Card
          key={tool.id}
          className="group border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative"
          onClick={() => onOpenTool(tool.id)}
        >
          <CardContent className="relative p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tool.bgColor} ${tool.color}`}>
                <tool.icon className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-slate-900">{toolLabelMap[tool.titleKey]}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{toolDescMap[tool.descKey]}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Click to start</span>
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={(e) => { e.stopPropagation(); onOpenTool(tool.id); }}>
                {buttonLabelMap[tool.buttonLabel]}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
