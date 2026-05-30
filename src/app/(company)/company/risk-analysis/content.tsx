// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TrendingUp,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ArrowUpDown,
  Briefcase,
  Brain,
  FileText,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Types
interface RiskFactor {
  category: string;
  score: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  flag: string;
}

interface CandidateRisk {
  id: string;
  candidateName: string;
  jobTitle: string;
  riskScore: number;
  confidence: number;
  recommendation: 'Proceed' | 'Caution' | 'Pass';
  summary: string;
  factors: RiskFactor[];
  detailedAnalysis: string;
  experienceTimeline: ExperienceEntry[];
  lastAnalyzed: string;
}

// Empty data - replace with API fetch
const emptyRiskData: CandidateRisk[] = [];

// Donut chart component
function RiskDonutChart({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low;
  if (total === 0) return null;

  const radius = 70;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  const highPct = high / total;
  const mediumPct = medium / total;
  const lowPct = low / total;

  const highLen = circumference * highPct;
  const mediumLen = circumference * mediumPct;
  const lowLen = circumference * lowPct;

  const highOffset = 0;
  const mediumOffset = highLen;
  const lowOffset = highLen + mediumLen;

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[240px] mx-auto">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={strokeWidth} />

      {/* Low risk segment (green) */}
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke="#10b981" strokeWidth={strokeWidth}
        strokeDasharray={`${lowLen} ${circumference - lowLen}`}
        strokeDashoffset={-lowOffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-700"
      />

      {/* Medium risk segment (amber) */}
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke="#f59e0b" strokeWidth={strokeWidth}
        strokeDasharray={`${mediumLen} ${circumference - mediumLen}`}
        strokeDashoffset={-mediumOffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-700"
      />

      {/* High risk segment (red) */}
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke="#ef4444" strokeWidth={strokeWidth}
        strokeDasharray={`${highLen} ${circumference - highLen}`}
        strokeDashoffset={-highOffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-700"
      />

      {/* Center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-2xl font-bold" style={{ fontSize: '28px' }}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '11px' }}>
        Total
      </text>
    </svg>
  );
}

// Semicircle gauge component
function RiskGauge({ score, size = 180 }: { score: number; size?: number }) {
  const radius = 70;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const strokeWidth = 16;

  const getColor = (s: number) => {
    if (s <= 30) return '#10b981';
    if (s <= 60) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);
  const angle = (score / 100) * 180;
  const rad = ((180 - angle) * Math.PI) / 180;
  const endX = cx + radius * Math.cos(rad);
  const endY = cy - radius * Math.sin(rad);

  const arcPath = score > 0
    ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${score > 50 ? 1 : 0} 1 ${endX} ${endY}`
    : '';

  return (
    <svg viewBox={`0 0 ${size} ${size * 0.65}`} className="w-full max-w-[200px]">
      {/* Background arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {arcPath && (
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      )}
      {/* Score text */}
      <text x={cx} y={cy - 15} textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: '32px' }}>
        {score}
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '11px' }}>
        /100
      </text>
      {/* Labels */}
      <text x={cx - radius - 5} y={cy + 20} textAnchor="middle" className="fill-emerald-500" style={{ fontSize: '10px' }}>
        Low
      </text>
      <text x={cx} y={cy + 35} textAnchor="middle" className="fill-amber-500" style={{ fontSize: '10px' }}>
        Med
      </text>
      <text x={cx + radius + 5} y={cy + 20} textAnchor="middle" className="fill-red-500" style={{ fontSize: '10px' }}>
        High
      </text>
    </svg>
  );
}

// Recommendation badge component
function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const config: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
    Proceed: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
    Caution: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle },
    Pass: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  };

  const cfg = config[recommendation] || config['Caution'];
  const Icon = cfg.icon;

  return (
    <Badge variant="outline" className={cn('text-xs px-2 py-0.5 font-medium border-0', cfg.color, cfg.bgColor)}>
      <Icon className="w-3 h-3 me-1" />
      {recommendation}
    </Badge>
  );
}

// Factor category icon mapping
function getCategoryIcon(category: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    'Job Hopping': ArrowUpDown,
    'Skill Gaps': Brain,
    'Experience Mismatch': Briefcase,
    'Employment Gaps': Clock,
    'Salary Mismatch': TrendingUp,
    'Culture Fit Risk': ShieldQuestion,
  };
  return map[category] || ShieldAlert;
}

function getCategoryKey(category: string): string {
  const map: Record<string, string> = {
    'Job Hopping': 'jobHopping',
    'Skill Gaps': 'skillGaps',
    'Experience Mismatch': 'experienceMismatch',
    'Employment Gaps': 'employmentGaps',
    'Salary Mismatch': 'salaryMismatch',
    'Culture Fit Risk': 'cultureFitRisk',
  };
  return map[category] || category;
}

// Severity color
function getSeverityColor(severity: string): string {
  if (severity === 'high') return 'text-red-600 dark:text-red-400';
  if (severity === 'medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getSeverityBg(severity: string): string {
  if (severity === 'high') return 'bg-red-100 dark:bg-red-900/30';
  if (severity === 'medium') return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-emerald-100 dark:bg-emerald-900/30';
}

export default function RiskAnalysisContent() {
  const { t } = useI18n();
  const [riskData] = useState<CandidateRisk[]>(emptyRiskData);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRisk | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedAnalysis, setGeneratedAnalysis] = useState<string | null>(null);

  // Filters
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [factorFilter, setFactorFilter] = useState('all');

  // Compute stats
  const stats = {
    total: riskData.length,
    high: riskData.filter((r) => r.riskScore > 60).length,
    medium: riskData.filter((r) => r.riskScore >= 30 && r.riskScore <= 60).length,
    low: riskData.filter((r) => r.riskScore < 30).length,
  };

  // Unique jobs for filter
  const uniqueJobs = Array.from(new Set(riskData.map((r) => r.jobTitle)));

  // Filter candidates
  const filteredData = riskData.filter((r) => {
    // Risk level filter
    if (riskLevelFilter === 'high' && r.riskScore <= 60) return false;
    if (riskLevelFilter === 'medium' && (r.riskScore < 30 || r.riskScore > 60)) return false;
    if (riskLevelFilter === 'low' && r.riskScore >= 30) return false;

    // Job filter
    if (jobFilter !== 'all' && r.jobTitle !== jobFilter) return false;

    // Factor filter
    if (factorFilter !== 'all') {
      const hasFactor = r.factors.some((f) => getCategoryKey(f.category) === factorFilter);
      if (!hasFactor) return false;
    }

    return true;
  });

  const handleViewDetails = useCallback((candidate: CandidateRisk) => {
    setSelectedCandidate(candidate);
    setGeneratedAnalysis(null);
    setDetailOpen(true);
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!selectedCandidate) return;
    setGeneratingReport(true);
    setGeneratedAnalysis(null);

    try {
      const res = await fetch('/api/ai/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: selectedCandidate.candidateName,
          jobTitle: selectedCandidate.jobTitle,
          candidateData: {
            riskScore: selectedCandidate.riskScore,
            factors: selectedCandidate.factors,
            summary: selectedCandidate.summary,
          },
          analysisType: 'full',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate report');
      }

      const data = await res.json();
      setGeneratedAnalysis(data.analysis?.detailedAnalysis || data.analysis?.summary || 'Analysis complete.');
      toast.success(t.riskAnalysis.generateReport + ' ✓');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
      // Fallback
      setGeneratedAnalysis(selectedCandidate.detailedAnalysis);
    } finally {
      setGeneratingReport(false);
    }
  }, [selectedCandidate, t]);

  const factorCategories = [
    { key: 'jobHopping', label: t.riskAnalysis.jobHopping },
    { key: 'skillGaps', label: t.riskAnalysis.skillGaps },
    { key: 'experienceMismatch', label: t.riskAnalysis.experienceMismatch },
    { key: 'employmentGaps', label: t.riskAnalysis.employmentGaps },
    { key: 'salaryMismatch', label: t.riskAnalysis.salaryMismatch },
    { key: 'cultureFitRisk', label: t.riskAnalysis.cultureFitRisk },
  ];

  // Stat card config
  const statCards = [
    {
      title: t.riskAnalysis.totalAnalyzed,
      value: stats.total,
      icon: ShieldCheck,
      gradient: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: t.riskAnalysis.highRisk,
      value: stats.high,
      icon: ShieldAlert,
      gradient: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: t.riskAnalysis.mediumRisk,
      icon: ShieldQuestion,
      value: stats.medium,
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: t.riskAnalysis.lowRisk,
      value: stats.low,
      icon: ShieldCheck,
      gradient: 'from-emerald-500 to-cyan-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            {t.riskAnalysis.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.riskAnalysis.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          {t.common.poweredBy}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="card-hover-lift animate-fade-in-up relative overflow-hidden border-0 shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 dark:from-teal-950/20 dark:to-emerald-950/20" />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.bgColor)}>
                    <Icon className={cn('w-5 h-5', card.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Overview: Donut Chart + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.riskAnalysis.riskDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <RiskDonutChart high={stats.high} medium={stats.medium} low={stats.low} />
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">{t.riskAnalysis.highRisk}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">{t.riskAnalysis.mediumRisk}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">{t.riskAnalysis.lowRisk}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Factor Categories */}
        <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.riskAnalysis.riskFactors}</CardTitle>
            <CardDescription className="text-xs">{t.riskAnalysis.scoreBreakdown}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {factorCategories.map((factor) => {
                // Calculate average severity for this factor across all candidates
                const factorScores = riskData
                  .map((r) => r.factors.find((f) => getCategoryKey(f.category) === factor.key))
                  .filter(Boolean)
                  .map((f) => f!.score);
                const avgScore = factorScores.length > 0
                  ? Math.round(factorScores.reduce((a, b) => a + b, 0) / factorScores.length)
                  : 0;
                const severity = avgScore > 60 ? 'high' : avgScore > 30 ? 'medium' : 'low';
                const Icon = getCategoryIcon(factor.key === 'jobHopping' ? 'Job Hopping' : factor.key === 'skillGaps' ? 'Skill Gaps' : factor.key === 'experienceMismatch' ? 'Experience Mismatch' : factor.key === 'employmentGaps' ? 'Employment Gaps' : factor.key === 'salaryMismatch' ? 'Salary Mismatch' : 'Culture Fit Risk');

                return (
                  <div
                    key={factor.key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors',
                    )}
                  >
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0', getSeverityBg(severity))}>
                      <Icon className={cn('w-4 h-4', getSeverityColor(severity))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{factor.label}</span>
                        <span className={cn('text-xs font-semibold', getSeverityColor(severity))}>{avgScore}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            severity === 'high' ? 'bg-red-500' : severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500',
                          )}
                          style={{ width: `${avgScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue placeholder={t.riskAnalysis.filterByRisk} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.riskAnalysis.allRiskLevels}</SelectItem>
            <SelectItem value="high">{t.riskAnalysis.highRisk}</SelectItem>
            <SelectItem value="medium">{t.riskAnalysis.mediumRisk}</SelectItem>
            <SelectItem value="low">{t.riskAnalysis.lowRisk}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <SelectValue placeholder={t.riskAnalysis.filterByJob} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.riskAnalysis.allJobs}</SelectItem>
            {uniqueJobs.map((job) => (
              <SelectItem key={job} value={job}>{job}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={factorFilter} onValueChange={setFactorFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <SelectValue placeholder={t.riskAnalysis.filterByFactor} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.riskAnalysis.allFactors}</SelectItem>
            {factorCategories.map((f) => (
              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Risk Factors Table */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t.riskAnalysis.riskOverview}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredData.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">{t.riskAnalysis.noRiskData}</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.candidate}</th>
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.job}</th>
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.riskScore}</th>
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.keyRiskFactors}</th>
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.aiRecommendation}</th>
                    <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.riskAnalysis.lastAnalyzed}</th>
                    <th className="text-end p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((candidate) => {
                    const topFactors = candidate.factors
                      .filter((f) => f.severity !== 'low')
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 3);

                    return (
                      <tr
                        key={candidate.id}
                        className="border-b border-border/30 hover:bg-accent/20 transition-colors table-row-accent"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px]">
                                {getInitials(candidate.candidateName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{candidate.candidateName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{candidate.jobTitle}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-700',
                                  candidate.riskScore > 60 ? 'bg-red-500' : candidate.riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500',
                                )}
                                style={{ width: `${candidate.riskScore}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-xs font-semibold',
                              candidate.riskScore > 60 ? 'text-red-600 dark:text-red-400' : candidate.riskScore >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                            )}>
                              {candidate.riskScore}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {topFactors.length > 0 ? topFactors.map((f) => (
                              <Badge
                                key={f.category}
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0 border-0',
                                  f.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                )}
                              >
                                {t.riskAnalysis[getCategoryKey(f.category) as keyof typeof t.riskAnalysis]}
                              </Badge>
                            )) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Low Risk
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <RecommendationBadge recommendation={candidate.recommendation} />
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(candidate.lastAnalyzed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-3 text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                            onClick={() => handleViewDetails(candidate)}
                          >
                            <Eye className="w-4 h-4 me-1" />
                            {t.riskAnalysis.viewDetails}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Risk Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dialog-content-glow">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              {t.riskAnalysis.analysisDetails}
            </DialogTitle>
            <DialogDescription>
              {selectedCandidate?.candidateName} — {selectedCandidate?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6 mt-4">
              {/* Risk Score Gauge + Recommendation */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-border/50 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20">
                <RiskGauge score={selectedCandidate.riskScore} />
                <div className="flex-1 text-center sm:text-start space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.riskAnalysis.recommendation}</p>
                    <div className="mt-1">
                      <RecommendationBadge recommendation={selectedCandidate.recommendation} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.riskAnalysis.confidence}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={selectedCandidate.confidence} className="h-2 flex-1" />
                      <span className="text-sm font-semibold">{selectedCandidate.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.riskAnalysis.summary}</p>
                    <p className="text-sm mt-1">{selectedCandidate.summary}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-3">{t.riskAnalysis.scoreBreakdown}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCandidate.factors.map((factor) => {
                    const Icon = getCategoryIcon(factor.category);
                    return (
                      <div key={factor.category} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0', getSeverityBg(factor.severity))}>
                          <Icon className={cn('w-4 h-4', getSeverityColor(factor.severity))} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">
                              {t.riskAnalysis[getCategoryKey(factor.category) as keyof typeof t.riskAnalysis]}
                            </span>
                            <span className={cn('text-xs font-bold', getSeverityColor(factor.severity))}>
                              {factor.score}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                factor.severity === 'high' ? 'bg-red-500' : factor.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500',
                              )}
                              style={{ width: `${factor.score}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{factor.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Experience Timeline */}
              {selectedCandidate.experienceTimeline.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t.riskAnalysis.experience}</h4>
                  <div className="relative ps-6">
                    {/* Timeline line */}
                    <div className="absolute start-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full" />
                    <div className="space-y-4">
                      {selectedCandidate.experienceTimeline.map((entry, idx) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          {/* Timeline dot */}
                          <div className={cn(
                            'absolute -start-4 top-1.5 w-3 h-3 rounded-full border-2 z-10',
                            entry.flag === 'gap'
                              ? 'bg-red-500 border-red-300 dark:border-red-700'
                              : entry.flag === 'short_tenure'
                                ? 'bg-amber-500 border-amber-300 dark:border-amber-700'
                                : 'bg-teal-500 border-teal-300 dark:border-teal-700',
                          )} />
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{entry.role || t.riskAnalysis.employmentGaps}</span>
                              {entry.flag === 'gap' && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  Gap
                                </Badge>
                              )}
                              {entry.flag === 'short_tenure' && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Short
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {entry.company}{entry.company && entry.duration ? ' · ' : ''}{entry.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Detailed Analysis / AI Generated */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">{t.riskAnalysis.detailedAnalysis}</h4>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
                        {t.riskAnalysis.generating}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 me-1.5" />
                        {t.riskAnalysis.generateReport}
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                  {generatingReport ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t.riskAnalysis.generating}</p>
                        <div className="flex gap-1 mt-2">
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                        </div>
                      </div>
                    </div>
                  ) : generatedAnalysis ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{generatedAnalysis}</p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedCandidate.detailedAnalysis}</p>
                  )}
                </div>
              </div>

              {/* Final Recommendation */}
              <div className={cn(
                'flex items-center justify-between p-4 rounded-xl border',
                selectedCandidate.recommendation === 'Proceed'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30'
                  : selectedCandidate.recommendation === 'Pass'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30',
              )}>
                <div className="flex items-center gap-3">
                  {selectedCandidate.recommendation === 'Proceed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  ) : selectedCandidate.recommendation === 'Pass' ? (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{t.riskAnalysis.recommendation}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCandidate.recommendation === 'Proceed'
                        ? t.riskAnalysis.proceed
                        : selectedCandidate.recommendation === 'Pass'
                          ? t.riskAnalysis.pass
                          : t.riskAnalysis.caution}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t.riskAnalysis.confidence}: {selectedCandidate.confidence}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
