// @ts-nocheck
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Clock,
  Target,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Users,
  Sparkles,
  Phone,
  Mail,
  Eye,
  Zap,
  DollarSign,
  GraduationCap,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimeToFillData {
  month: string;
  days: number;
  isForecast: boolean;
  lower: number;
  upper: number;
}

interface DropoffCandidate {
  id: string;
  candidateName: string;
  jobTitle: string;
  stage: string;
  daysInStage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  predictedDropoffDate: string;
  recommendedAction: string;
}

interface FunnelStage {
  label: string;
  actual: number;
  predicted: number;
}

interface DepartmentInsight {
  name: string;
  openPositions: number;
  predictedFillDate: string;
  talentAvailability: number;
  sourcingChannels: string[];
}

interface AIRecommendation {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const timeToFillData: TimeToFillData[] = [
  { month: 'Oct', days: 45, isForecast: false, lower: 40, upper: 50 },
  { month: 'Nov', days: 42, isForecast: false, lower: 37, upper: 47 },
  { month: 'Dec', days: 38, isForecast: false, lower: 33, upper: 43 },
  { month: 'Jan', days: 35, isForecast: false, lower: 30, upper: 40 },
  { month: 'Feb', days: 33, isForecast: false, lower: 28, upper: 38 },
  { month: 'Mar', days: 31, isForecast: false, lower: 26, upper: 36 },
  { month: 'Apr', days: 28, isForecast: true, lower: 23, upper: 33 },
  { month: 'May', days: 26, isForecast: true, lower: 20, upper: 32 },
  { month: 'Jun', days: 24, isForecast: true, lower: 18, upper: 30 },
];

const dropoffCandidates: DropoffCandidate[] = [
  { id: '1', candidateName: 'Alex Johnson', jobTitle: 'Senior Engineer', stage: 'Screening', daysInStage: 12, riskLevel: 'High', predictedDropoffDate: 'Mar 8, 2026', recommendedAction: 'Schedule check-in call' },
  { id: '2', candidateName: 'Maria Garcia', jobTitle: 'Product Designer', stage: 'Interview', daysInStage: 8, riskLevel: 'Medium', predictedDropoffDate: 'Mar 15, 2026', recommendedAction: 'Send engagement email' },
  { id: '3', candidateName: 'David Kim', jobTitle: 'Backend Developer', stage: 'Screening', daysInStage: 15, riskLevel: 'High', predictedDropoffDate: 'Mar 5, 2026', recommendedAction: 'Schedule check-in call' },
  { id: '4', candidateName: 'Sophie Taylor', jobTitle: 'Data Analyst', stage: 'Interview', daysInStage: 5, riskLevel: 'Low', predictedDropoffDate: 'Mar 25, 2026', recommendedAction: 'Monitor' },
  { id: '5', candidateName: 'Carlos Ruiz', jobTitle: 'DevOps Engineer', stage: 'Offer', daysInStage: 7, riskLevel: 'Medium', predictedDropoffDate: 'Mar 12, 2026', recommendedAction: 'Send engagement email' },
  { id: '6', candidateName: 'Fatima Al-Rashid', jobTitle: 'Frontend Engineer', stage: 'Screening', daysInStage: 10, riskLevel: 'Medium', predictedDropoffDate: 'Mar 18, 2026', recommendedAction: 'Send engagement email' },
  { id: '7', candidateName: 'Tom Anderson', jobTitle: 'Senior Engineer', stage: 'Interview', daysInStage: 3, riskLevel: 'Low', predictedDropoffDate: 'Mar 30, 2026', recommendedAction: 'Monitor' },
  { id: '8', candidateName: 'Priya Sharma', jobTitle: 'Product Manager', stage: 'Screening', daysInStage: 18, riskLevel: 'High', predictedDropoffDate: 'Mar 3, 2026', recommendedAction: 'Schedule check-in call' },
];

const funnelStages: FunnelStage[] = [
  { label: 'Applied', actual: 100, predicted: 100 },
  { label: 'Screening', actual: 72, predicted: 78 },
  { label: 'Interview', actual: 38, predicted: 45 },
  { label: 'Offer', actual: 15, predicted: 22 },
  { label: 'Hired', actual: 10, predicted: 16 },
];

const departmentInsights: DepartmentInsight[] = [
  { name: 'Engineering', openPositions: 5, predictedFillDate: 'May 15, 2026', talentAvailability: 72, sourcingChannels: ['LinkedIn', 'GitHub', 'Stack Overflow'] },
  { name: 'Design', openPositions: 2, predictedFillDate: 'Apr 20, 2026', talentAvailability: 85, sourcingChannels: ['Dribbble', 'Behance', 'LinkedIn'] },
  { name: 'Product', openPositions: 3, predictedFillDate: 'Jun 1, 2026', talentAvailability: 58, sourcingChannels: ['LinkedIn', 'ProductHunt', 'Referrals'] },
  { name: 'Marketing', openPositions: 1, predictedFillDate: 'Apr 5, 2026', talentAvailability: 90, sourcingChannels: ['LinkedIn', 'Indeed', 'Referrals'] },
];

const aiRecommendations: AIRecommendation[] = [
  { id: '1', icon: DollarSign, title: 'Widen salary range for Senior Engineer role', description: 'Current salary range is 15% below market average. Adjusting could reduce time-to-fill by 40%.', priority: 'High' },
  { id: '2', icon: Users, title: 'Engage silver pool candidates for Product roles', description: '3 silver pool candidates match open Product positions. Re-engagement could save 2 weeks per hire.', priority: 'High' },
  { id: '3', icon: Zap, title: 'Reduce interview stages for faster hiring', description: 'Engineering roles average 5 interview rounds vs industry benchmark of 3. Streamline to reduce drop-off.', priority: 'Medium' },
  { id: '4', icon: GraduationCap, title: 'Launch university partnership for junior roles', description: 'Entry-level positions have 65% longer time-to-fill. University partnerships could reduce by 30%.', priority: 'Medium' },
  { id: '5', icon: Globe, title: 'Consider remote-first for Design positions', description: 'Expanding to remote candidates increases talent pool by 3.2x for Design roles with 90% talent availability.', priority: 'Low' },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function TimeToFillChart({ data }: { data: TimeToFillData[] }) {
  const { t } = useI18n();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartW = 800;
  const chartH = 320;
  const padL = 50;
  const padR = 30;
  const padT = 30;
  const padB = 50;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minDays = Math.min(...data.map((d) => d.lower)) - 5;
  const maxDays = Math.max(...data.map((d) => d.upper)) + 5;
  const range = maxDays - minDays;

  const xScale = (i: number) => padL + (i / (data.length - 1)) * plotW;
  const yScale = (v: number) => padT + plotH - ((v - minDays) / range) * plotH;

  const lastHistIdx = data.filter((d) => !d.isForecast).length - 1;

  // Confidence band path
  const bandTop = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.upper)}`).join(' ');
  const bandBottom = data
    .slice()
    .reverse()
    .map((d, i) => {
      const origIdx = data.length - 1 - i;
      return `L ${xScale(origIdx)} ${yScale(d.lower)}`;
    })
    .join(' ');
  const bandPath = `${bandTop} ${bandBottom} Z`;

  // Historical line
  const histLine = data
    .filter((d) => !d.isForecast)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.days)}`)
    .join(' ');

  // Forecast line (dashed)
  const forecastStart = data.filter((d) => !d.isForecast).length - 1;
  const forecastLine = data
    .slice(forecastStart)
    .map((d, i) => {
      const origIdx = forecastStart + i;
      return `${i === 0 ? 'M' : 'L'} ${xScale(origIdx)} ${yScale(d.days)}`;
    })
    .join(' ');

  // Y-axis ticks
  const yTicks = [20, 30, 40, 50];

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[600px]" role="img" aria-label={t.predictiveAnalytics.timeToFillChart}>
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padL} y1={yScale(tick)} x2={chartW - padR} y2={yScale(tick)} stroke="currentColor" strokeOpacity={0.08} />
            <text x={padL - 8} y={yScale(tick) + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: '11px' }}>{tick}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={d.month} x={xScale(i)} y={chartH - padB + 20} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '11px' }}>
            {d.month}
          </text>
        ))}

        {/* Confidence band */}
        <path d={bandPath} fill="url(#confGrad)" opacity={0.3} />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Historical line (solid) */}
        <path d={histLine} fill="none" stroke="#14b8a6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Forecast line (dashed) */}
        <path d={forecastLine} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4" />

        {/* Data points + hover areas */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(d.days)}
              r={hoveredIdx === i ? 6 : 4}
              fill={d.isForecast ? '#10b981' : '#14b8a6'}
              stroke="white"
              strokeWidth={2}
              className="transition-all duration-200"
            />
            <rect
              x={xScale(i) - 20}
              y={0}
              width={40}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            />
          </g>
        ))}

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <g>
            <rect
              x={xScale(hoveredIdx) - 55}
              y={yScale(data[hoveredIdx].days) - 52}
              width={110}
              height={44}
              rx={6}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            <text x={xScale(hoveredIdx)} y={yScale(data[hoveredIdx].days) - 36} textAnchor="middle" className="fill-foreground font-semibold" style={{ fontSize: '13px' }}>
              {data[hoveredIdx].days} {t.predictiveAnalytics.days}
            </text>
            <text x={xScale(hoveredIdx)} y={yScale(data[hoveredIdx].days) - 18} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }}>
              {data[hoveredIdx].isForecast ? t.predictiveAnalytics.forecast : t.predictiveAnalytics.historical} · {data[hoveredIdx].lower}-{data[hoveredIdx].upper}
            </text>
          </g>
        )}

        {/* Legend */}
        <line x1={padL} y1={chartH - 8} x2={padL + 20} y2={chartH - 8} stroke="#14b8a6" strokeWidth={2} />
        <text x={padL + 24} y={chartH - 4} className="fill-muted-foreground" style={{ fontSize: '10px' }}>{t.predictiveAnalytics.historical}</text>
        <line x1={padL + 100} y1={chartH - 8} x2={padL + 120} y2={chartH - 8} stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />
        <text x={padL + 124} y={chartH - 4} className="fill-muted-foreground" style={{ fontSize: '10px' }}>{t.predictiveAnalytics.forecast}</text>
        <rect x={padL + 200} y={chartH - 14} width={12} height={12} fill="#14b8a6" opacity={0.3} rx={2} />
        <text x={padL + 216} y={chartH - 4} className="fill-muted-foreground" style={{ fontSize: '10px' }}>{t.predictiveAnalytics.confidence}</text>
      </svg>
    </div>
  );
}

function HiringFunnelSVG({ stages, showActual }: { stages: FunnelStage[]; showActual: boolean }) {
  const { t } = useI18n();
  const svgW = 600;
  const svgH = 400;
  const centerX = svgW / 2;
  const topY = 30;
  const bottomY = svgH - 50;
  const stageH = (bottomY - topY) / stages.length;
  const maxWidth = 480;
  const minWidth = 60;

  const colors = ['#14b8a6', '#0d9488', '#0f766e', '#10b981', '#059669'];

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[600px] mx-auto" role="img" aria-label={t.predictiveAnalytics.funnelForecast}>
      {stages.map((stage, i) => {
        const value = showActual ? stage.actual : stage.predicted;
        const ratio = value / 100;
        const w = minWidth + (maxWidth - minWidth) * ratio;
        const y = topY + i * stageH;
        const nextValue = i < stages.length - 1 ? (showActual ? stages[i + 1].actual : stages[i + 1].predicted) : 0;
        const nextRatio = nextValue / 100;
        const nextW = i < stages.length - 1 ? minWidth + (maxWidth - minWidth) * nextRatio : 0;
        const nextY = topY + (i + 1) * stageH;

        const tl = centerX - w / 2;
        const tr = centerX + w / 2;
        const bl = i < stages.length - 1 ? centerX - nextW / 2 : centerX - w / 2;
        const br = i < stages.length - 1 ? centerX + nextW / 2 : centerX + w / 2;

        return (
          <g key={stage.label}>
            <path
              d={`M ${tl} ${y} L ${tr} ${y} L ${br} ${y + stageH} L ${bl} ${y + stageH} Z`}
              fill={colors[i]}
              opacity={0.85}
              className="transition-all duration-500"
            />
            <text x={centerX} y={y + stageH / 2 - 2} textAnchor="middle" className="fill-white font-semibold" style={{ fontSize: '13px' }}>
              {stage.label}
            </text>
            <text x={centerX} y={y + stageH / 2 + 14} textAnchor="middle" className="fill-white/80" style={{ fontSize: '11px' }}>
              {value}%
            </text>
            {i < stages.length - 1 && (
              <text x={centerX + w / 2 + 16} y={y + stageH / 2 + 4} className="fill-muted-foreground" style={{ fontSize: '10px' }}>
                → {nextValue}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StarVisualization({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < score ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────────────────────

export default function PredictiveAnalyticsContent() {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [funnelMode, setFunnelMode] = useState<'actual' | 'predicted'>('predicted');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/predictive-analytics');
      if (res.ok) {
        toast.success(t.predictiveAnalytics.refreshPredictions + ' ✓');
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setTimeout(() => setRefreshing(false), 1500);
    }
  }, [t]);

  const filteredCandidates = useMemo(() => {
    if (riskFilter === 'all') return dropoffCandidates;
    return dropoffCandidates.filter((c) => c.riskLevel.toLowerCase() === riskFilter);
  }, [riskFilter]);

  const atRiskCount = dropoffCandidates.filter((c) => c.riskLevel !== 'Low').length;

  const lastUpdated = new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Prediction cards config
  const predictionCards = [
    {
      title: t.predictiveAnalytics.predictedTimeToFill,
      value: '28',
      unit: t.predictiveAnalytics.days,
      trend: 'down' as const,
      trendText: t.predictiveAnalytics.trendDown,
      sub: `24-32 ${t.predictiveAnalytics.confidenceInterval}`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-slate-50',
    },
    {
      title: t.predictiveAnalytics.dropoffRisk,
      value: String(atRiskCount),
      unit: t.predictiveAnalytics.atRiskCandidates,
      trend: 'up' as const,
      trendText: t.predictiveAnalytics.trendUp,
      sub: `${Math.round((atRiskCount / dropoffCandidates.length) * 100)}% ${t.predictiveAnalytics.atRiskCandidates}`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: t.predictiveAnalytics.qualityForecast,
      value: '7.8',
      unit: '/10',
      trend: 'up' as const,
      trendText: t.predictiveAnalytics.trendUp,
      sub: '',
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: t.predictiveAnalytics.hiringVelocity,
      value: '4.2',
      unit: t.predictiveAnalytics.hiresPerMonth,
      trend: 'up' as const,
      trendText: t.predictiveAnalytics.trendUp,
      sub: '+0.8 vs last quarter',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-slate-50',
    },
  ];

  const riskBadgeConfig: Record<string, { color: string; bg: string }> = {
    High: { color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
    Medium: { color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    Low: { color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  };

  const priorityBadgeConfig: Record<string, { color: string; bg: string }> = {
    High: { color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
    Medium: { color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    Low: { color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  };

  const actionIconMap: Record<string, React.ElementType> = {
    'Schedule check-in call': Phone,
    'Send engagement email': Mail,
    'Monitor': Eye,
  };

  const getActionKey = (action: string) => {
    if (action.includes('check-in') || action.includes('Schedule')) return t.predictiveAnalytics.scheduleCheckin;
    if (action.includes('email') || action.includes('Send engagement')) return t.predictiveAnalytics.sendEngagementEmail;
    return t.predictiveAnalytics.monitor;
  };

  return (
    <div className="space-y-6">
      {/* ── AI Predictions Banner ── */}
      <div className="relative rounded-xl overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-blue-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.predictiveAnalytics.title}</h1>
              <p className="text-sm text-teal-100">{t.predictiveAnalytics.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-teal-100">
              {t.predictiveAnalytics.lastUpdated}: {lastUpdated}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                  {t.predictiveAnalytics.refreshing}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 me-1.5" />
                  {t.predictiveAnalytics.refreshPredictions}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Key Predictions Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictionCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="card-animate-fade-in-up relative overflow-hidden border-0 shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 dark:from-teal-950/20 dark:to-emerald-950/20" />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.bgColor)}>
                    <Icon className={cn('w-4 h-4', card.color)} />
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="text-2xl font-bold">{card.value}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">{card.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {card.trend === 'down' ? (
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  <span className="text-xs text-emerald-600">{card.trendText}</span>
                </div>
                {card.sub && (
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                )}
                {/* Star visualization for Quality of Hire */}
                {card.title === t.predictiveAnalytics.qualityForecast && (
                  <StarVisualization score={Math.round(parseFloat(card.value))} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Time-to-Fill Forecast Chart ── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            {t.predictiveAnalytics.timeToFillChart}
          </CardTitle>
          <CardDescription className="text-xs">
            {t.predictiveAnalytics.historical} (6 {t.predictiveAnalytics.days.toLowerCase()}) · {t.predictiveAnalytics.forecast} (3 {t.predictiveAnalytics.days.toLowerCase()})
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <TimeToFillChart data={timeToFillData} />
        </CardContent>
      </Card>

      {/* ── Candidate Drop-off Prediction Table ── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t.predictiveAnalytics.dropoffPrediction}
            </CardTitle>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder={t.predictiveAnalytics.riskLevel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.predictiveAnalytics.riskLevel}: All</SelectItem>
                <SelectItem value="high">{t.predictiveAnalytics.high}</SelectItem>
                <SelectItem value="medium">{t.predictiveAnalytics.medium}</SelectItem>
                <SelectItem value="low">{t.predictiveAnalytics.low}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.candidate}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.job}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.stage}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.daysInStage}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.riskLevel}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.predictedDropoffDate}</th>
                  <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.predictiveAnalytics.recommendedAction}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => {
                  const riskCfg = riskBadgeConfig[c.riskLevel] || riskBadgeConfig.Low;
                  const ActionIcon = actionIconMap[c.recommendedAction] || Eye;
                  return (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-teal-100 text-blue-700 text-[10px]">
                              {getInitials(c.candidateName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{c.candidateName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{c.jobTitle}</td>
                      <td className="p-3 text-sm">{c.stage}</td>
                      <td className="p-3 text-sm">{c.daysInStage}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn('text-xs px-2 py-0.5 font-medium border-0', riskCfg.color, riskCfg.bg)}>
                          {c.riskLevel === 'High' ? t.predictiveAnalytics.high : c.riskLevel === 'Medium' ? t.predictiveAnalytics.medium : t.predictiveAnalytics.low}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{c.predictedDropoffDate}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 h-7 px-2 text-xs">
                          <ActionIcon className="w-3.5 h-3.5 me-1" />
                          {getActionKey(c.recommendedAction)}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Hiring Funnel Forecast ── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {t.predictiveAnalytics.funnelForecast}
            </CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <Button
                variant={funnelMode === 'actual' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-3 text-xs',
                  funnelMode === 'actual' && 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
                onClick={() => setFunnelMode('actual')}
              >
                {t.predictiveAnalytics.actual}
              </Button>
              <Button
                variant={funnelMode === 'predicted' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-3 text-xs',
                  funnelMode === 'predicted' && 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
                onClick={() => setFunnelMode('predicted')}
              >
                {t.predictiveAnalytics.predicted}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <HiringFunnelSVG stages={funnelStages} showActual={funnelMode === 'actual'} />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {funnelStages.map((stage, i) => {
              const colors = ['bg-slate-500', 'bg-blue-600', 'bg-blue-700', 'bg-emerald-500', 'bg-emerald-600'];
              return (
                <div key={stage.label} className="text-center">
                  <div className={cn('h-2 rounded-full mx-auto mb-1.5', colors[i])} style={{ width: `${stage.predicted}%` }} />
                  <p className="text-xs font-medium">{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.predictiveAnalytics.actual}: {stage.actual}% · {t.predictiveAnalytics.predicted}: {stage.predicted}%
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Department Insights ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          {t.predictiveAnalytics.departmentInsights}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departmentInsights.map((dept, i) => (
            <Card key={dept.name} className="card-border-0 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10 rounded-lg" />
              <CardContent className="relative p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{dept.name}</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-teal-100 text-blue-700">
                    {dept.openPositions} {t.predictiveAnalytics.openPositions}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t.predictiveAnalytics.predictedFillDate}</span>
                    <span className="font-medium">{dept.predictedFillDate}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t.predictiveAnalytics.talentAvailability}</span>
                      <span className={cn(
                        'font-medium',
                        dept.talentAvailability >= 70 ? 'text-emerald-600' : dept.talentAvailability >= 50 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {dept.talentAvailability}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          dept.talentAvailability >= 70 ? 'bg-emerald-500' : dept.talentAvailability >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${dept.talentAvailability}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t.predictiveAnalytics.sourcingChannels}</p>
                    <div className="flex flex-wrap gap-1">
                      {dept.sourcingChannels.map((ch) => (
                        <Badge key={ch} variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-muted/50">
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── AI Recommendations ── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {t.predictiveAnalytics.aiRecommendations}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {aiRecommendations.map((rec) => {
              const Icon = rec.icon;
              const pCfg = priorityBadgeConfig[rec.priority] || priorityBadgeConfig.Low;
              return (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
                >
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 bg-slate-50')}>
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{rec.title}</span>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-0 font-medium', pCfg.color, pCfg.bg)}>
                        {rec.priority === 'High' ? t.predictiveAnalytics.high : rec.priority === 'Medium' ? t.predictiveAnalytics.medium : t.predictiveAnalytics.low}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs h-7 border-slate-200 text-blue-700 hover:bg-slate-50"
                  >
                    <Sparkles className="w-3 h-3 me-1" />
                    {t.predictiveAnalytics.takeAction}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
