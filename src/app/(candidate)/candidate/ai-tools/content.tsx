// @ts-nocheck
'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  MessageSquare,
  Target,
  Mic,
  ArrowRight,
  Settings,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Brain,
  AlertCircle,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';

interface AITool {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  buttonLabel: string;
}

const aiTools: AITool[] = [
  {
    id: 'resume-analysis',
    titleKey: 'resumeAnalysis',
    descKey: 'resumeAnalysisDesc',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    buttonLabel: 'startAnalysis',
  },
  {
    id: 'cover-letter',
    titleKey: 'coverLetterGen',
    descKey: 'coverLetterGenDesc',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    buttonLabel: 'generate',
  },
  {
    id: 'skill-gap',
    titleKey: 'skillGapAnalysis',
    descKey: 'skillGapAnalysisDesc',
    icon: Target,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    buttonLabel: 'analyzeGap',
  },
  {
    id: 'interview-prep',
    titleKey: 'interviewPrep',
    descKey: 'interviewPrepDesc',
    icon: Mic,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    buttonLabel: 'startPrep',
  },
];

// Score badge component
function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50'
    : score >= 60 ? 'text-amber-600 bg-amber-50'
    : 'text-red-600 bg-red-50';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${color}`}>
      <span>{label}:</span>
      <span>{score}/100</span>
    </div>
  );
}

// Render analysis result with formatting
function AnalysisResultView({ data }: { data: Record<string, unknown> }) {
  const analysis = data;

  return (
    <div className="space-y-6">
      {/* Powered by AI badge at top */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-medium">Powered by AI</span>
      </div>

      {/* Scores */}
      {(analysis.atsScore != null || analysis.overallScore != null || analysis.matchScore != null) && (
        <div className="flex flex-wrap gap-3">
          {analysis.overallScore != null && <ScoreBadge score={analysis.overallScore as number} label="Overall" />}
          {analysis.atsScore != null && <ScoreBadge score={analysis.atsScore as number} label="ATS" />}
          {analysis.matchScore != null && <ScoreBadge score={analysis.matchScore as number} label="Match" />}
        </div>
      )}

      {/* Summary */}
      {analysis.summary && (
        <div className="p-4 rounded-xl bg-muted border border-border/50">
          <p className="text-sm font-medium leading-relaxed">{analysis.summary as string}</p>
        </div>
      )}

      {/* Strengths */}
      {Array.isArray(analysis.strengths) && (analysis.strengths as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Strengths</h4>
          <ul className="space-y-2">
            {(analysis.strengths as string[]).map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0">&check;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {Array.isArray(analysis.weaknesses) && (analysis.weaknesses as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-amber-600 mb-2">Areas for Improvement</h4>
          <ul className="space-y-2">
            {(analysis.weaknesses as string[]).map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Keywords */}
      {Array.isArray(analysis.missingKeywords) && (analysis.missingKeywords as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-red-600 mb-2">Missing Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {(analysis.missingKeywords as string[]).map((kw, i) => (
              <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">{kw}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {Array.isArray(analysis.recommendations) && (analysis.recommendations as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Recommendations</h4>
          <ol className="space-y-2 list-decimal list-inside">
            {(analysis.recommendations as string[]).map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Improvements */}
      {Array.isArray(analysis.improvements) && (analysis.improvements as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Improvement Suggestions</h4>
          <ol className="space-y-2 list-decimal list-inside">
            {(analysis.improvements as string[]).map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Skills Match */}
      {analysis.skillsMatch && typeof analysis.skillsMatch === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-purple-600 mb-2">Skills Match</h4>
          {((analysis.skillsMatch as Record<string, unknown>).matchPercentage != null) && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Match</span>
                <span>{(analysis.skillsMatch as Record<string, unknown>).matchPercentage as number}%</span>
              </div>
              <Progress value={(analysis.skillsMatch as Record<string, unknown>).matchPercentage as number} className="h-2" />
            </div>
          )}
          {Array.isArray((analysis.skillsMatch as Record<string, unknown>).matchedSkills) && (
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground">Matched: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {((analysis.skillsMatch as Record<string, unknown>).matchedSkills as string[]).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {Array.isArray((analysis.skillsMatch as Record<string, unknown>).missingSkills) && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Missing: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {((analysis.skillsMatch as Record<string, unknown>).missingSkills as string[]).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-red-50 text-red-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyword Analysis */}
      {analysis.keywordAnalysis && typeof analysis.keywordAnalysis === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Keyword Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            {Array.isArray((analysis.keywordAnalysis as Record<string, unknown>).found) && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Found Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {((analysis.keywordAnalysis as Record<string, unknown>).found as string[]).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray((analysis.keywordAnalysis as Record<string, unknown>).missing) && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Missing Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {((analysis.keywordAnalysis as Record<string, unknown>).missing as string[]).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Skills (skill gap) */}
      {analysis.currentSkills && typeof analysis.currentSkills === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Current Skills</h4>
          {Array.isArray((analysis.currentSkills as Record<string, unknown>).matched) && (
            <div className="space-y-1">
              {((analysis.currentSkills as Record<string, unknown>).matched as Array<Record<string, string>>).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{item.skill}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{item.level}</span>
                  <Badge variant="secondary" className="text-xs capitalize">{item.relevance} relevance</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missing Skills (skill gap) */}
      {(analysis.missingSkills && typeof analysis.missingSkills === 'object') && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">Skills to Develop</h4>
          {Array.isArray((analysis.missingSkills as Record<string, unknown>).critical) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-red-600">Critical:</span>
              <ul className="space-y-1 mt-1">
                {((analysis.missingSkills as Record<string, unknown>).critical as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge variant="destructive" className="text-[10px] h-5 shrink-0">Critical</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray((analysis.missingSkills as Record<string, unknown>).important) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-amber-600">Important:</span>
              <ul className="space-y-1 mt-1">
                {((analysis.missingSkills as Record<string, unknown>).important as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 shrink-0">Important</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray((analysis.missingSkills as Record<string, unknown>).nice) && (
            <div>
              <span className="text-xs font-semibold text-blue-600">Nice to Have:</span>
              <ul className="space-y-1 mt-1">
                {((analysis.missingSkills as Record<string, unknown>).nice as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5 shrink-0">Nice</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Learning Resources (skill gap) */}
      {Array.isArray(analysis.learningResources) && (analysis.learningResources as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Learning Resources</h4>
          <div className="space-y-2">
            {(analysis.learningResources as Array<Record<string, string>>).map((item, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-card text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.duration}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.resource}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Demand (skill gap) */}
      {analysis.marketDemand && typeof analysis.marketDemand === 'object' && (
        <div className="p-3 rounded-lg border border-slate-200 bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">Market Demand</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Trend:</span>
              <p className="font-medium capitalize">{(analysis.marketDemand as Record<string, unknown>).trend as string}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Avg Salary:</span>
              <p className="font-medium">{(analysis.marketDemand as Record<string, unknown>).averageSalary as string}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground">Outlook:</span>
              <p className="text-sm">{(analysis.marketDemand as Record<string, unknown>).outlook as string}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Path (skill gap) */}
      {Array.isArray(analysis.recommendedPath) && (analysis.recommendedPath as Array<Record<string, unknown>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Recommended Path</h4>
          <div className="space-y-2">
            {(analysis.recommendedPath as Array<Record<string, unknown>>).map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {item.step as number || i + 1}
                </div>
                <div>
                  <p className="font-medium">{item.action as string}</p>
                  <p className="text-xs text-muted-foreground">{item.timeline as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Questions */}
      {Array.isArray(analysis.commonQuestions) && (analysis.commonQuestions as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Common Questions</h4>
          <div className="space-y-3">
            {(analysis.commonQuestions as Array<Record<string, string>>).map((q, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 bg-card">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">Q{i + 1}</Badge>
                  <div>
                    <p className="text-sm font-medium">{q.question}</p>
                    {q.type && <Badge variant="outline" className="text-[10px] mt-1 capitalize">{q.type}</Badge>}
                    {q.suggestedApproach && (
                      <p className="text-xs text-muted-foreground mt-1.5"><strong>Approach:</strong> {q.suggestedApproach}</p>
                    )}
                    {q.sampleAnswer && (
                      <div className="mt-2 p-2 rounded bg-muted/50">
                        <p className="text-xs"><strong>Sample:</strong> {q.sampleAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Questions */}
      {Array.isArray(analysis.behavioralQuestions) && (analysis.behavioralQuestions as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-purple-600 mb-2">Behavioral Questions</h4>
          <div className="space-y-2">
            {(analysis.behavioralQuestions as Array<Record<string, string>>).map((q, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-card text-sm">
                <p className="font-medium">{q.question}</p>
                {q.starExample && (
                  <p className="text-xs text-muted-foreground mt-1"><strong>STAR Example:</strong> {q.starExample}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips (interview prep) */}
      {analysis.tips && typeof analysis.tips === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Tips</h4>
          <div className="grid gap-3">
            {Array.isArray((analysis.tips as Record<string, unknown>).before) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Before the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((analysis.tips as Record<string, unknown>).before as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="text-blue-500 shrink-0">&bull;</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray((analysis.tips as Record<string, unknown>).during) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">During the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((analysis.tips as Record<string, unknown>).during as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="text-emerald-500 shrink-0">&bull;</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray((analysis.tips as Record<string, unknown>).after) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">After the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((analysis.tips as Record<string, unknown>).after as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="text-purple-500 shrink-0">&bull;</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions to Ask */}
      {Array.isArray(analysis.questionsToAsk) && (analysis.questionsToAsk as string[]).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Questions to Ask the Interviewer</h4>
          <ul className="space-y-1">
            {(analysis.questionsToAsk as string[]).map((q, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5">
                <span className="text-blue-500 shrink-0">?</span>{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags */}
      {Array.isArray(analysis.redFlags) && (analysis.redFlags as string[]).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">Things to Avoid</h4>
          <ul className="space-y-1">
            {(analysis.redFlags as string[]).map((flag, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5">
                <span className="text-red-500 shrink-0">&times;</span>{flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Exercise */}
      {analysis.practiceExercise && typeof analysis.practiceExercise === 'object' && (
        <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50">
          <h4 className="text-sm font-semibold text-purple-600 mb-1">
            {(analysis.practiceExercise as Record<string, string>).title}
          </h4>
          <p className="text-sm text-muted-foreground mb-2">{(analysis.practiceExercise as Record<string, string>).description}</p>
          {Array.isArray((analysis.practiceExercise as Record<string, unknown>).steps) && (
            <ol className="space-y-1 list-decimal list-inside text-sm">
              {((analysis.practiceExercise as Record<string, unknown>).steps as string[]).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIToolsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Resume analysis form
  const [resumeText, setResumeText] = useState('');
  const [jobDescForResume, setJobDescForResume] = useState('');

  // Cover letter form
  const [coverJobDesc, setCoverJobDesc] = useState('');
  const [coverTargetRole, setCoverTargetRole] = useState('');

  // Skill gap form
  const [gapCurrentSkills, setGapCurrentSkills] = useState('');
  const [gapTargetRole, setGapTargetRole] = useState('');

  // Interview prep form
  const [interviewJobDesc, setInterviewJobDesc] = useState('');
  const [interviewTargetRole, setInterviewTargetRole] = useState('');
  const [interviewType, setInterviewType] = useState('technical');

  const userId = user?.id || '';

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

  const handleAnalyzeResume = useCallback(async () => {
    if (!resumeText.trim() || !jobDescForResume.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRawText(null);
    setActiveDialog('resume-analysis');

    try {
      const res = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescForResume.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      if (data.rawText) {
        setRawText(data.rawText);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescForResume]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!coverJobDesc.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRawText(null);

    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobDescription: coverJobDesc.trim(),
          candidateName: user?.name || undefined,
          candidateCurrentTitle: coverTargetRole.trim() || undefined,
          candidateSkills: undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }

      setRawText(data.coverLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, coverJobDesc, coverTargetRole, user?.name]);

  const handleSkillGapAnalysis = useCallback(async () => {
    if (!gapCurrentSkills.trim() || !gapTargetRole.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRawText(null);

    try {
      const res = await fetch('/api/ai/skill-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentSkills: gapCurrentSkills.trim(),
          targetRole: gapTargetRole.trim(),
          currentRole: user?.name || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      if (data.analysis?.rawText) {
        setRawText(data.analysis.rawText);
      } else {
        setResult(data.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, gapCurrentSkills, gapTargetRole, user?.name]);

  const handleInterviewPrep = useCallback(async () => {
    if (!interviewJobDesc.trim() && !interviewTargetRole.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRawText(null);

    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobDescription: interviewJobDesc.trim() || `Interview for ${interviewTargetRole} position`,
          candidateProfile: user?.name || undefined,
          interviewType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Preparation failed');
        return;
      }

      if (data.guide?.rawText) {
        setRawText(data.guide.rawText);
      } else {
        setResult(data.guide);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, interviewJobDesc, interviewTargetRole, interviewType, user?.name]);

  const handleCopy = () => {
    const textToCopy = rawText || (result ? JSON.stringify(result, null, 2) : '');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setResult(null);
    setRawText(null);
    setError(null);
    setIsLoading(false);
  };

  const openTool = (toolId: string) => {
    setError(null);
    setResult(null);
    setRawText(null);
    setActiveDialog(toolId);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t.candidate.aiTools}</h1>
            <p className="text-muted-foreground">AI-powered tools to boost your job search</p>
          </div>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {aiTools.map((tool) => (
          <Card
            key={tool.id}
            className="group border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative"
            onClick={() => openTool(tool.id)}
          >
            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tool.bgColor} ${tool.color}`}>
                  <tool.icon className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-slate-900">{toolLabelMap[tool.titleKey]}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {toolDescMap[tool.descKey]}
                  </p>
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
                <Button
                  size="sm"
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTool(tool.id);
                  }}
                >
                  {buttonLabelMap[tool.buttonLabel]}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============================================ */}
      {/* Resume Analysis Dialog */}
      {/* ============================================ */}
      <Dialog open={activeDialog === 'resume-analysis'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {t.candidate.resumeAnalysis}
            </DialogTitle>
          </DialogHeader>

          {!isLoading && !result && !rawText && !error && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t.candidate.pasteResume}</Label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={8}
                  placeholder="Paste your resume content here..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t.candidate.pasteJobDescription} *</Label>
                <Textarea
                  value={jobDescForResume}
                  onChange={(e) => setJobDescForResume(e.target.value)}
                  rows={4}
                  placeholder="Paste a job description to compare against..."
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-muted-foreground">{t.candidate.analyzing}</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Analysis Failed</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                  {error.includes('No active AI provider') && (
                    <Button variant="outline" size="sm" className="mt-2 text-red-700 border-red-300 hover:bg-red-100" asChild>
                      <Link href="/candidate/ai-settings">
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Configure AI
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {(result || rawText) && !isLoading && (
            <div className="space-y-4 overflow-y-auto max-h-[55vh] border-s-2 border-blue-200 pl-4">
              {result && !rawText && <AnalysisResultView data={result} />}
              {rawText && (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                  <ReactMarkdown>{rawText}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            {(result || rawText || error) && !isLoading && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={closeDialog}>
                  Close
                </Button>
              </>
            )}
            {!result && !rawText && !error && !isLoading && (
              <>
                <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={handleAnalyzeResume}
                  disabled={!resumeText.trim() || !jobDescForResume.trim() || isLoading}
                >
                  <Sparkles className="h-4 w-4" />
                  {t.candidate.startAnalysis}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Cover Letter Dialog */}
      {/* ============================================ */}
      <Dialog open={activeDialog === 'cover-letter' && !rawText && !result} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              {t.candidate.coverLetterGen}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.candidate.targetRole}</Label>
              <Input
                value={coverTargetRole}
                onChange={(e) => setCoverTargetRole(e.target.value)}
                placeholder={t.candidate.enterTargetRole}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.pasteJobDescription}</Label>
              <Textarea
                value={coverJobDesc}
                onChange={(e) => setCoverJobDesc(e.target.value)}
                rows={5}
                placeholder={t.candidate.pasteJobDescription}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleGenerateCoverLetter}
              disabled={!coverJobDesc.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? t.candidate.generating : t.candidate.generate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Result Dialog */}
      <Dialog open={activeDialog === 'cover-letter' && (!!rawText || !!result)} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Generated Cover Letter
            </DialogTitle>
          </DialogHeader>
          {(rawText || result) && !isLoading && (
            <div className="space-y-4 overflow-y-auto max-h-[55vh]">
              {error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Generation Failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                      {error.includes('No active AI provider') && (
                        <Button variant="outline" size="sm" className="mt-2 text-red-700 border-red-300 hover:bg-red-100" asChild>
                          <Link href="/candidate/ai-settings">
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Configure AI
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                <ReactMarkdown>{rawText || ''}</ReactMarkdown>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={closeDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Skill Gap Dialog */}
      {/* ============================================ */}
      <Dialog open={activeDialog === 'skill-gap' && !result && !rawText} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              {t.candidate.skillGapAnalysis}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current Skills</Label>
              <Textarea
                value={gapCurrentSkills}
                onChange={(e) => setGapCurrentSkills(e.target.value)}
                rows={3}
                placeholder="e.g., React, TypeScript, Node.js, CSS, Git"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.targetRole}</Label>
              <Input
                value={gapTargetRole}
                onChange={(e) => setGapTargetRole(e.target.value)}
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleSkillGapAnalysis}
              disabled={!gapCurrentSkills.trim() || !gapTargetRole.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {isLoading ? t.candidate.analyzing : t.candidate.analyzeGap}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Gap Result Dialog */}
      <Dialog open={activeDialog === 'skill-gap' && (!!result || !!rawText)} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              Skill Gap Analysis
            </DialogTitle>
          </DialogHeader>
          {(result || rawText) && !isLoading && (
            <div className="space-y-4 overflow-y-auto max-h-[55vh]">
              {error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Analysis Failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                      {error.includes('No active AI provider') && (
                        <Button variant="outline" size="sm" className="mt-2 text-red-700 border-red-300 hover:bg-red-100" asChild>
                          <Link href="/candidate/ai-settings">
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Configure AI
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {result && !rawText && <AnalysisResultView data={result} />}
              {rawText && (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                  <ReactMarkdown>{rawText}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={closeDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Interview Prep Dialog */}
      {/* ============================================ */}
      <Dialog open={activeDialog === 'interview-prep' && !result && !rawText} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-600" />
              {t.candidate.interviewPrep}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.candidate.targetRole}</Label>
              <Input
                value={interviewTargetRole}
                onChange={(e) => setInterviewTargetRole(e.target.value)}
                placeholder={t.candidate.enterTargetRole}
              />
            </div>
            <div className="space-y-2">
              <Label>Job Description (optional)</Label>
              <Textarea
                value={interviewJobDesc}
                onChange={(e) => setInterviewJobDesc(e.target.value)}
                rows={4}
                placeholder="Paste a job description for more targeted preparation..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.jobType}</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger>
                  <SelectValue placeholder={t.candidate.selectJobType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Interview</SelectItem>
                  <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                  <SelectItem value="system-design">System Design</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleInterviewPrep}
              disabled={(!interviewJobDesc.trim() && !interviewTargetRole.trim()) || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {isLoading ? t.candidate.preparing : t.candidate.startPrep}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Prep Result Dialog */}
      <Dialog open={activeDialog === 'interview-prep' && (!!result || !!rawText)} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-600" />
              Interview Preparation Guide
            </DialogTitle>
          </DialogHeader>
          {(result || rawText) && !isLoading && (
            <div className="space-y-4 overflow-y-auto max-h-[55vh]">
              {error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Preparation Failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                      {error.includes('No active AI provider') && (
                        <Button variant="outline" size="sm" className="mt-2 text-red-700 border-red-300 hover:bg-red-100" asChild>
                          <Link href="/candidate/ai-settings">
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Configure AI
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {result && !rawText && <AnalysisResultView data={result} />}
              {rawText && (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                  <ReactMarkdown>{rawText}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={closeDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Not Configured Dialog */}
      <Dialog open={activeDialog === 'not-configured'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {t.candidate.aiNotConfigured}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.candidate.aiNotConfiguredDesc}</p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.close}</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" asChild>
              <Link href="/candidate/ai-settings">
                <Settings className="h-4 w-4" />
                {t.candidate.goToAISettings}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
