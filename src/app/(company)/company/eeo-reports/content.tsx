// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Empty data - replace with API fetch
const companyApplicants: Array<{
  id: string;
  name: string;
  gender: string;
  ethnicity: string;
  veteran: boolean;
  disability: boolean;
  hired: boolean;
  date: string;
}> = [];

const complianceItems: Array<{
  key: string;
  label: string;
  ready: boolean;
}> = [];

const recommendations: Array<{
  priority: 'high' | 'medium' | 'low';
  text: string;
  impact: string;
}> = [];

const trendData: Array<{
  month: string;
  diversityScore: number;
}> = [];

const diversityScore = 0;

export default function EEOReportsContent() {
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6months');

  const totalApplicants = companyApplicants.length;
  const hiredApplicants = companyApplicants.filter(a => a.hired);
  const totalHired = hiredApplicants.length;
  const responseRate = 0;

  // Demographics comparison data (empty)
  const applicantGender: Record<string, number> = {};
  const hiredGender: Record<string, number> = {};
  const applicantEthnicity = new Map<string, number>();
  const hiredEthnicity = new Map<string, number>();

  const trendMax = 100;
  const trendMin = 0;
  const chartW = 400;
  const chartH = 160;
  const padX = 40;
  const padY = 20;
  const getTrendX = (i: number) => padX + (i / Math.max(trendData.length - 1, 1)) * (chartW - 2 * padX);
  const getTrendY = (v: number) => chartH - padY - ((v - trendMin) / (trendMax - trendMin)) * (chartH - 2 * padY);

  // Comparison chart for gender
  const genderKeys = Object.keys(applicantGender);
  const maxGenderVal = Math.max(...genderKeys.map(k => applicantGender[k]), 1);

  // Comparison chart for ethnicity
  const allEthnicities = [...new Set([...applicantEthnicity.keys(), ...hiredEthnicity.keys()])];
  const maxEthnicityVal = Math.max(...allEthnicities.map(k => applicantEthnicity.get(k) || 0), 1);

  const readyCount = complianceItems.filter(i => i.ready).length;
  const compliancePercent = complianceItems.length > 0 ? Math.round((readyCount / complianceItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          {t.eeo.companySummary}
        </h1>
        <p className="text-muted-foreground mt-1">{t.eeo.subtitle}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.eeo.responseRate}</p>
                <p className="text-3xl font-bold mt-1">{responseRate}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.eeo.applicantPoolDiversity}</p>
                <p className="text-3xl font-bold mt-1">{totalApplicants}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 opacity-10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.eeo.diversityScore}</p>
                <p className="text-3xl font-bold mt-1">{diversityScore}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-700 opacity-10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.eeo.hiringFunnel}</p>
                <p className="text-3xl font-bold mt-1">{totalHired}/{totalApplicants}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State for Data */}
      {companyApplicants.length === 0 && (
        <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No EEO Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              EEO applicant data will appear here once candidates submit their voluntary self-identification information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Charts - only show when data exists */}
      {companyApplicants.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender: Applicant vs Hired */}
          <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {t.eeo.gender} — {t.eeo.applicantDemographics} vs {t.eeo.hiredDemographics}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <svg viewBox="0 0 400 160" className="w-full h-auto">
                {genderKeys.map((key, i) => {
                  const applicantBarW = (applicantGender[key] / maxGenderVal) * 140;
                  const hiredBarW = (hiredGender[key] / maxGenderVal) * 140;
                  const y = 10 + i * 50;
                  return (
                    <g key={key}>
                      <text x="0" y={y + 14} className="fill-foreground text-[11px] font-medium">{key}</text>
                      <rect x="90" y={y} width={applicantBarW} height="18" rx="3" fill="#14b8a6" opacity="0.8" />
                      <text x={90 + applicantBarW + 4} y={y + 13} className="fill-muted-foreground text-[10px]">{applicantGender[key]}</text>
                      <rect x="260" y={y} width={hiredBarW} height="18" rx="3" fill="#10b981" opacity="0.8" />
                      <text x={260 + hiredBarW + 4} y={y + 13} className="fill-muted-foreground text-[10px]">{hiredGender[key]}</text>
                    </g>
                  );
                })}
                <text x="140" y={chartH - 5} textAnchor="middle" className="fill-teal-600 text-[10px] font-bold">{t.eeo.applicantDemographics}</text>
                <text x="320" y={chartH - 5} textAnchor="middle" className="fill-emerald-600 text-[10px] font-bold">{t.eeo.hiredDemographics}</text>
              </svg>
            </CardContent>
          </Card>

          {/* Ethnicity: Applicant vs Hired */}
          <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {t.eeo.ethnicity} — {t.eeo.applicantDemographics} vs {t.eeo.hiredDemographics}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                <svg viewBox="0 0 400 280" className="w-full h-auto">
                  {allEthnicities.map((key, i) => {
                    const appVal = applicantEthnicity.get(key) || 0;
                    const hirVal = hiredEthnicity.get(key) || 0;
                    const applicantBarW = (appVal / maxEthnicityVal) * 120;
                    const hiredBarW = (hirVal / maxEthnicityVal) * 120;
                    const y = 10 + i * 38;
                    const label = key.length > 18 ? key.slice(0, 18) + '…' : key;
                    return (
                      <g key={key}>
                        <text x="0" y={y + 14} className="fill-foreground text-[9px] font-medium">{label}</text>
                        <rect x="120" y={y} width={applicantBarW} height="16" rx="3" fill="#14b8a6" opacity="0.8" />
                        <text x={120 + applicantBarW + 4} y={y + 12} className="fill-muted-foreground text-[9px]">{appVal}</text>
                        <rect x="270" y={y} width={hiredBarW} height="16" rx="3" fill="#10b981" opacity="0.8" />
                        <text x={270 + hiredBarW + 4} y={y + 12} className="fill-muted-foreground text-[9px]">{hirVal}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Analysis & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Analysis */}
        <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.eeo.trendAnalysis}
            </CardTitle>
            <CardDescription>{t.eeo.monthOverMonth} {t.eeo.diversityScore}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No trend data available yet</p>
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padY + ratio * (chartH - 2 * padY);
                    const val = Math.round(trendMax - ratio * (trendMax - trendMin));
                    return (
                      <g key={ratio}>
                        <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                        <text x={padX - 5} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{val}</text>
                      </g>
                    );
                  })}
                  {/* Data points */}
                  {trendData.map((d, i) => (
                    <g key={i}>
                      <circle cx={getTrendX(i)} cy={getTrendY(d.diversityScore)} r="4" fill="#14b8a6" stroke="white" strokeWidth="2" />
                      <text x={getTrendX(i)} y={getTrendY(d.diversityScore) - 10} textAnchor="middle" className="fill-foreground text-[10px] font-bold">{d.diversityScore}</text>
                      <text x={getTrendX(i)} y={chartH - 5} textAnchor="middle" className="fill-muted-foreground text-[9px]">{d.month}</text>
                    </g>
                  ))}
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                {trendData.length >= 2 && (
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-teal-50 dark:bg-teal-950/20">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      {trendData[trendData.length - 1].diversityScore - trendData[0].diversityScore > 0 ? '+' : ''}
                      {trendData[trendData.length - 1].diversityScore - trendData[0].diversityScore} pts
                    </span>
                    <span className="text-xs text-muted-foreground">{t.eeo.monthOverMonth} improvement</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.eeo.complianceStatus}
            </CardTitle>
            <CardDescription>EEO-1 Report Readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No compliance items configured</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{readyCount}/{complianceItems.length} {t.eeo.ready}</span>
                  <Badge className={compliancePercent >= 75
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0'
                  }>
                    {compliancePercent}%
                  </Badge>
                </div>
                <Progress value={compliancePercent} className="h-2" />
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {complianceItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {item.ready ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-sm flex-1">{item.label}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        item.ready
                          ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                          : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                      }`}>
                        {item.ready ? t.eeo.ready : t.eeo.notReady}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items / Recommendations */}
      <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.eeo.actionItems}
          </CardTitle>
          <CardDescription>AI-generated suggestions for improving diversity and inclusion</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No recommendations available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    rec.priority === 'high'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      : rec.priority === 'medium'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
                  }`}>
                    {rec.priority === 'high' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : rec.priority === 'medium' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <Lightbulb className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rec.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.impact}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${
                    rec.priority === 'high'
                      ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                      : rec.priority === 'medium'
                      ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                      : 'border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400'
                  }`}>
                    {rec.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
