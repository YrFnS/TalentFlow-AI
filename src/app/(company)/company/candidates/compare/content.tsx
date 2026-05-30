// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Briefcase,
  Users,
  Sparkles,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Minus,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  ArrowLeftRight,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================
// Types
// ============================================

interface ExperienceEntry {
  company: string;
  title: string;
  duration: string;
  description: string;
}

interface CandidateData {
  id: string;
  name: string;
  currentTitle: string;
  matchScore: number;
  applicationStatus: string;
  experienceYears: number;
  education: string;
  skills: string[];
  experience: ExperienceEntry[];
  scores: {
    skills: number;
    experience: number;
    education: number;
    cultureFit: number;
    technical: number;
    communication: number;
  };
}

interface JobData {
  id: string;
  title: string;
  requiredSkills: string[];
  candidates: CandidateData[];
}

interface AIInsight {
  candidateId: string;
  candidateName: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  confidence: number;
}

// ============================================
// Mock Data (EMPTY - replace with API fetch)
// ============================================

const initialJobs: JobData[] = [];

// ============================================
// Color map for candidates in comparison
// ============================================
const candidateColors = [
  { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.15)', bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500' },
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500' },
];

// ============================================
// Radar Chart SVG Component
// ============================================
function RadarChart({ candidates }: { candidates: CandidateData[] }) {
  const { t } = useI18n();
  const dimensions = [
    t.comparison.skillsScore,
    t.comparison.experienceScore,
    t.comparison.educationScore,
    t.comparison.cultureFit,
    t.comparison.technical,
    t.comparison.communication,
  ];
  const dimensionKeys: (keyof CandidateData['scores'])[] = [
    'skills', 'experience', 'education', 'cultureFit', 'technical', 'communication',
  ];

  const size = 280;
  const center = size / 2;
  const radius = 100;
  const levels = 4;

  // Generate polygon points for a given score list
  const getPoints = (scores: number[]) => {
    return scores.map((score, i) => {
      const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
      const r = (score / 100) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
  };

  // Grid lines
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels) * radius;
    const points = dimensions.map((_, i) => {
      const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  // Axis lines and labels
  const axes = dimensions.map((label, i) => {
    const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    // Label position further out
    const labelR = radius + 22;
    const lx = center + labelR * Math.cos(angle);
    const ly = center + labelR * Math.sin(angle);
    return { x1: center, y1: center, x2: x, y2: y, lx, ly, label };
  });

  return (
    <div className="flex justify-center">
      <svg width={size + 60} height={size + 60} viewBox={`0 0 ${size + 60} ${size + 60}`} className="max-w-full h-auto">
        <g transform={`translate(30, 30)`}>
          {/* Grid polygons */}
          {gridPolygons.map((points, i) => (
            <polygon
              key={`grid-${i}`}
              points={points}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
            />
          ))}

          {/* Axis lines */}
          {axes.map((axis, i) => (
            <line
              key={`axis-${i}`}
              x1={axis.x1}
              y1={axis.y1}
              x2={axis.x2}
              y2={axis.y2}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
            />
          ))}

          {/* Data polygons for each candidate */}
          {candidates.map((candidate, cIdx) => {
            const scores = dimensionKeys.map((key) => candidate.scores[key]);
            return (
              <g key={candidate.id}>
                <polygon
                  points={getPoints(scores)}
                  fill={candidateColors[cIdx].fill}
                  stroke={candidateColors[cIdx].stroke}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                {/* Data points */}
                {scores.map((score, sIdx) => {
                  const angle = (Math.PI * 2 * sIdx) / dimensions.length - Math.PI / 2;
                  const r = (score / 100) * radius;
                  return (
                    <circle
                      key={`${candidate.id}-${sIdx}`}
                      cx={center + r * Math.cos(angle)}
                      cy={center + r * Math.sin(angle)}
                      r="3"
                      fill={candidateColors[cIdx].stroke}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Labels */}
          {axes.map((axis, i) => (
            <text
              key={`label-${i}`}
              x={axis.lx}
              y={axis.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {axis.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CompareContent() {
  const { t } = useI18n();

  // State
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hiringDecisions, setHiringDecisions] = useState<Record<string, 'recommend' | 'strong_recommend' | 'pass'>>({});
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>({});
  const [showComparison, setShowComparison] = useState(false);

  // Derived data
  const currentJob = useMemo(() => initialJobs.find((j) => j.id === selectedJobId) || null, [selectedJobId]);

  const filteredCandidates = useMemo(() => {
    if (!currentJob) return [];
    if (!searchQuery) return currentJob.candidates;
    const q = searchQuery.toLowerCase();
    return currentJob.candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.currentTitle.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [currentJob, searchQuery]);

  const selectedCandidates = useMemo(
    () => currentJob ? currentJob.candidates.filter((c) => selectedCandidateIds.has(c.id)) : [],
    [currentJob, selectedCandidateIds]
  );

  // Handlers
  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          toast.error(t.comparison.maxCandidates);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCandidateIds(new Set());
    setShowComparison(false);
    setAiInsights([]);
    setHiringDecisions({});
    setCandidateNotes({});
  };

  const handleCompare = () => {
    if (selectedCandidateIds.size < 2) {
      toast.error(t.comparison.selectAtLeast);
      return;
    }
    setShowComparison(true);
  };

  const handleGenerateAI = async () => {
    if (selectedCandidates.length < 2) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/candidates/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId,
          candidateIds: selectedCandidates.map((c) => c.id),
          candidates: selectedCandidates.map((c) => ({
            id: c.id,
            name: c.name,
            currentTitle: c.currentTitle,
            skills: c.skills,
            experienceYears: c.experienceYears,
            education: c.education,
            matchScore: c.matchScore,
            scores: c.scores,
          })),
          jobTitle: currentJob?.title || '',
          requiredSkills: currentJob?.requiredSkills || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights || []);
        toast.success(t.common.success);
      } else {
        setAiInsights([]);
        toast.error('Failed to generate AI insights');
      }
    } catch {
      setAiInsights([]);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHiringDecision = (candidateId: string, decision: 'recommend' | 'strong_recommend' | 'pass') => {
    setHiringDecisions((prev) => ({ ...prev, [candidateId]: decision }));
    const candidate = selectedCandidates.find((c) => c.id === candidateId);
    if (candidate) {
      toast.success(`${candidate.name}: ${decision === 'strong_recommend' ? t.comparison.strongRecommend : decision === 'recommend' ? t.comparison.recommend : t.comparison.pass}`);
    }
  };

  // Skills classification
  const getSkillsClassification = (candidate: CandidateData) => {
    if (!currentJob) return { matched: [] as string[], missing: [] as string[], extra: [] as string[] };
    const required = new Set(currentJob.requiredSkills);
    const candidateSkills = new Set(candidate.skills);
    const matched = candidate.skills.filter((s) => required.has(s));
    const missing = currentJob.requiredSkills.filter((s) => !candidateSkills.has(s));
    const extra = candidate.skills.filter((s) => !required.has(s));
    return { matched, missing, extra };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Interview': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'Screening': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Applied': return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-teal-500" />
            {t.comparison.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.comparison.subtitle}</p>
        </div>
      </div>

      {/* Job Selection */}
      <Card className="card-hover-lift">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5 block">
                {t.comparison.selectJob}
              </label>
              <Select value={selectedJobId} onValueChange={(v) => { setSelectedJobId(v); clearSelection(); }}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <Briefcase className="w-4 h-4 me-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {initialJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/30">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{currentJob?.candidates.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t.comparison.totalApplicants}</p>
              </div>
              <p className="text-sm text-muted-foreground">{t.comparison.selectInstruction}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Selector */}
      <Card className="card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" />
              {t.nav.candidates}
              {selectedCandidateIds.size > 0 && (
                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                  {selectedCandidateIds.size} / 3
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.comparison.searchCandidates}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-8 w-[220px]"
                />
              </div>
              {selectedCandidateIds.size >= 2 && (
                <Button
                  onClick={handleCompare}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  size="sm"
                >
                  {t.comparison.compareNow}
                </Button>
              )}
              {selectedCandidateIds.size > 0 && (
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  {t.comparison.clearSelection}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCandidates.map((candidate) => {
              const isSelected = selectedCandidateIds.has(candidate.id);
              return (
                <button
                  key={candidate.id}
                  onClick={() => toggleCandidateSelection(candidate.id)}
                  className={cn(
                    'relative p-3 rounded-lg border-2 text-start transition-all card-hover-lift',
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md shadow-teal-500/10'
                      : 'border-border hover:border-teal-300 dark:hover:border-teal-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={cn('text-xs font-semibold', isSelected ? 'bg-teal-500 text-white' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400')}>
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{candidate.currentTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold', 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400')}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {candidate.matchScore}%
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusColor(candidate.applicationStatus))}>
                      {candidate.applicationStatus}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ms-auto">
                      {candidate.experienceYears} {t.comparison.yearsExp}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {showComparison && selectedCandidates.length >= 2 && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Profile Comparison */}
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-500" />
                {t.comparison.profile}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('grid gap-6', selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                {selectedCandidates.map((candidate, idx) => (
                  <div
                    key={candidate.id}
                    className={cn('p-4 rounded-lg border-2', candidateColors[idx].border, 'border-opacity-40')}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className={cn('text-lg font-semibold', candidateColors[idx].bg, 'text-white')}>
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.currentTitle}</p>
                      </div>
                      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold', 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400')}>
                        <Sparkles className="w-3 h-3" />
                        {t.comparison.matchScore}: {candidate.matchScore}%
                      </div>
                      <Separator className="my-2" />
                      <div className="w-full space-y-2 text-start">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{candidate.experienceYears} {t.comparison.yearsExp}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{candidate.education}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Match */}
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-teal-500" />
                {t.comparison.skillsMatch}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('grid gap-6', selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                {selectedCandidates.map((candidate, idx) => {
                  const { matched, missing, extra } = getSkillsClassification(candidate);
                  return (
                    <div key={candidate.id} className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className={cn('text-[10px] font-semibold', candidateColors[idx].bg, 'text-white')}>
                            {getInitials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{candidate.name}</span>
                      </div>
                      {/* Matched Skills */}
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.comparison.matched} ({matched.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matched.map((s) => (
                            <Badge key={s} className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {/* Missing Skills */}
                      {missing.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-500 dark:text-red-400 mb-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {t.comparison.missing} ({missing.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {missing.map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Extra Skills */}
                      {extra.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t.comparison.extra} ({extra.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {extra.slice(0, 5).map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                                {s}
                              </Badge>
                            ))}
                            {extra.length > 5 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{extra.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Score Comparison - Radar Chart */}
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                {t.comparison.scoreComparison}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <RadarChart candidates={selectedCandidates} />
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4">
                  {selectedCandidates.map((candidate, idx) => (
                    <div key={candidate.id} className="flex items-center gap-1.5">
                      <div className={cn('w-3 h-3 rounded-full', candidateColors[idx].bg)} />
                      <span className="text-xs font-medium">{candidate.name}</span>
                    </div>
                  ))}
                </div>
                {/* Score table */}
                <div className="mt-4 w-full max-w-2xl overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-start text-muted-foreground font-medium">{t.comparison.scoreComparison}</th>
                        {selectedCandidates.map((candidate, idx) => (
                          <th key={candidate.id} className={cn('py-2 px-3 text-center font-semibold', candidateColors[idx].text)}>
                            {candidate.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(['skills', 'experience', 'education', 'cultureFit', 'technical', 'communication'] as const).map((key) => {
                        const labelMap: Record<string, string> = {
                          skills: t.comparison.skillsScore,
                          experience: t.comparison.experienceScore,
                          education: t.comparison.educationScore,
                          cultureFit: t.comparison.cultureFit,
                          technical: t.comparison.technical,
                          communication: t.comparison.communication,
                        };
                        const maxScore = Math.max(...selectedCandidates.map((c) => c.scores[key]));
                        return (
                          <tr key={key} className="border-b border-border/50">
                            <td className="py-2 px-3 text-muted-foreground">{labelMap[key]}</td>
                            {selectedCandidates.map((candidate) => (
                              <td key={candidate.id} className="py-2 px-3 text-center">
                                <span className={cn(
                                  'font-semibold',
                                  candidate.scores[key] === maxScore ? 'text-teal-600 dark:text-teal-400' : ''
                                )}>
                                  {candidate.scores[key]}
                                </span>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Timeline */}
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-500" />
                {t.comparison.experienceTimeline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('grid gap-6', selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                {selectedCandidates.map((candidate, idx) => (
                  <div key={candidate.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className={cn('text-[10px] font-semibold', candidateColors[idx].bg, 'text-white')}>
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{candidate.name}</span>
                    </div>
                    <div className="relative ps-6">
                      {/* Timeline line */}
                      <div className="absolute start-2 top-0 bottom-0 w-0.5 bg-teal-200 dark:bg-teal-800" />
                      {candidate.experience.map((exp, expIdx) => (
                        <div key={expIdx} className="relative mb-4 last:mb-0">
                          {/* Timeline dot */}
                          <div className={cn('absolute -start-[18px] top-1 w-3 h-3 rounded-full border-2 border-background', candidateColors[idx].bg)} />
                          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold">{exp.title}</p>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                                {exp.duration}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium">{exp.company}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="card-hover-lift border-teal-200/50 dark:border-teal-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  {t.comparison.aiInsights}
                </CardTitle>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin me-1.5" />
                      {t.comparison.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 me-1.5" />
                      {t.comparison.generateAI}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInsights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t.comparison.generateAI}</p>
                </div>
              ) : (
                <div className={cn('grid gap-6', selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                  {aiInsights.map((insight, idx) => (
                    <div key={insight.candidateId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className={cn('text-[10px] font-semibold', candidateColors[idx].bg, 'text-white')}>
                            {getInitials(insight.candidateName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{insight.candidateName}</span>
                      </div>
                      {/* Strengths */}
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {t.comparison.pros}
                        </p>
                        <ul className="space-y-1">
                          {insight.pros.map((pro, i) => (
                            <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400/80 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Concerns */}
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                          <Minus className="w-3 h-3" />
                          {t.comparison.cons}
                        </p>
                        <ul className="space-y-1">
                          {insight.cons.map((con, i) => (
                            <li key={i} className="text-xs text-amber-600 dark:text-amber-400/80 flex items-start gap-1.5">
                              <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Recommendation */}
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/30">
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">{t.comparison.recommendation}</p>
                        <p className="text-sm font-medium">{insight.recommendation}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{t.comparison.confidence}:</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-500 transition-all duration-500"
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{insight.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hiring Decision */}
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500" />
                {t.comparison.hiringDecision}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('grid gap-6', selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                {selectedCandidates.map((candidate, idx) => (
                  <div key={candidate.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className={cn('text-[10px] font-semibold', candidateColors[idx].bg, 'text-white')}>
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{candidate.name}</span>
                    </div>
                    {/* Vote buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant={hiringDecisions[candidate.id] === 'strong_recommend' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'flex-1 text-xs',
                          hiringDecisions[candidate.id] === 'strong_recommend'
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400'
                        )}
                        onClick={() => handleHiringDecision(candidate.id, 'strong_recommend')}
                      >
                        <Star className="w-3 h-3 me-1" />
                        {t.comparison.strongRecommend}
                      </Button>
                      <Button
                        variant={hiringDecisions[candidate.id] === 'recommend' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'flex-1 text-xs',
                          hiringDecisions[candidate.id] === 'recommend'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                        )}
                        onClick={() => handleHiringDecision(candidate.id, 'recommend')}
                      >
                        <ThumbsUp className="w-3 h-3 me-1" />
                        {t.comparison.recommend}
                      </Button>
                      <Button
                        variant={hiringDecisions[candidate.id] === 'pass' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'flex-1 text-xs',
                          hiringDecisions[candidate.id] === 'pass'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        )}
                        onClick={() => handleHiringDecision(candidate.id, 'pass')}
                      >
                        <ThumbsDown className="w-3 h-3 me-1" />
                        {t.comparison.pass}
                      </Button>
                    </div>
                    {/* Notes */}
                    <Textarea
                      placeholder={t.comparison.addNotes}
                      value={candidateNotes[candidate.id] || ''}
                      onChange={(e) => setCandidateNotes((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
                      className="text-xs min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state when no comparison is shown */}
      {!showComparison && (
        <Card className="card-hover-lift">
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t.comparison.noCandidatesSelected}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.comparison.selectInstruction}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
