// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Users,
  EyeOff,
  TrendingUp,
  Download,
  Filter,
  ShieldCheck,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface EEOApplicant {
  id: string;
  name: string;
  job: string;
  company: string;
  gender: string;
  ethnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
  selfIdentified: boolean;
  date: string;
}

export default function EEOContent() {
  const { t } = useI18n();
  const [applicants, setApplicants] = useState<EEOApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [responseFilter, setResponseFilter] = useState<string>('all');

  const fetchEEO = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/eeo');
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants || []);
      }
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEEO();
  }, []);

  const filteredApplicants = applicants.filter((a) => {
    if (companyFilter !== 'all' && a.company !== companyFilter) return false;
    if (jobFilter !== 'all' && a.job !== jobFilter) return false;
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    if (responseFilter === 'identified' && !a.selfIdentified) return false;
    if (responseFilter === 'declined' && a.selfIdentified) return false;
    return true;
  });

  // Calculate stats
  const totalResponses = filteredApplicants.length;
  const declinedCount = filteredApplicants.filter(a => !a.selfIdentified).length;
  const identifiedApplicants = filteredApplicants.filter(a => a.selfIdentified);
  const genderCounts: Record<string, number> = {};
  identifiedApplicants.forEach(a => { genderCounts[a.gender] = (genderCounts[a.gender] || 0) + 1; });
  const genderDiversityPercent = identifiedApplicants.length > 0
    ? Math.round((Object.keys(genderCounts).length / identifiedApplicants.length) * 100)
    : 0;

  const ethnicityCounts: Record<string, number> = {};
  identifiedApplicants.forEach(a => { ethnicityCounts[a.ethnicity] = (ethnicityCounts[a.ethnicity] || 0) + 1; });
  const ethnicDiversityIndex = identifiedApplicants.length > 0
    ? Math.round((Object.keys(ethnicityCounts).length / identifiedApplicants.length) * 100)
    : 0;

  // Gender distribution data
  const genderData = [
    { label: t.eeo.male, count: genderCounts['Male'] || 0, color: '#14b8a6' },
    { label: t.eeo.female, count: genderCounts['Female'] || 0, color: '#10b981' },
    { label: t.eeo.nonBinary, count: genderCounts['Non-Binary'] || 0, color: '#06b6d4' },
    { label: t.eeo.other, count: genderCounts['Other'] || 0, color: '#0d9488' },
    { label: t.eeo.preferNotToSay, count: genderCounts['Prefer Not to Say'] || 0, color: '#6b7280' },
  ].filter(d => d.count > 0);

  const maxGenderCount = Math.max(...genderData.map(d => d.count), 1);

  // Ethnicity distribution data
  const ethnicityData = [
    { label: t.eeo.hispanicOrLatino, count: ethnicityCounts['Hispanic or Latino'] || 0, color: '#14b8a6' },
    { label: t.eeo.white, count: ethnicityCounts['White'] || 0, color: '#10b981' },
    { label: t.eeo.blackOrAfricanAmerican, count: ethnicityCounts['Black or African American'] || 0, color: '#06b6d4' },
    { label: t.eeo.asian, count: ethnicityCounts['Asian'] || 0, color: '#0d9488' },
    { label: t.eeo.nativeHawaiian, count: ethnicityCounts['Native Hawaiian or Pacific Islander'] || 0, color: '#059669' },
    { label: t.eeo.americanIndian, count: ethnicityCounts['American Indian or Alaska Native'] || 0, color: '#047857' },
    { label: t.eeo.twoOrMoreRaces, count: ethnicityCounts['Two or More Races'] || 0, color: '#6b7280' },
  ].filter(d => d.count > 0);

  const maxEthnicityCount = Math.max(...ethnicityData.map(d => d.count), 1);

  // Veteran status
  const veteranYes = identifiedApplicants.filter(a => a.veteranStatus === 'Yes').length;
  const veteranNo = identifiedApplicants.filter(a => a.veteranStatus === 'No').length;
  const veteranTotal = veteranYes + veteranNo || 1;
  const veteranYesPct = Math.round((veteranYes / veteranTotal) * 100);
  const veteranNoPct = 100 - veteranYesPct;

  // Disability status
  const disabilityYes = identifiedApplicants.filter(a => a.disabilityStatus === 'Yes').length;
  const disabilityNo = identifiedApplicants.filter(a => a.disabilityStatus === 'No').length;
  const disabilityTotal = disabilityYes + disabilityNo || 1;
  const disabilityYesPct = Math.round((disabilityYes / disabilityTotal) * 100);
  const disabilityNoPct = 100 - disabilityYesPct;

  // Unique values for filters
  const companies = [...new Set(applicants.map(a => a.company))];
  const jobs = [...new Set(applicants.map(a => a.job))];

  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = [t.eeo.applicant, t.eeo.jobApplied, t.eeo.gender, t.eeo.ethnicity, t.eeo.veteranStatus, t.eeo.disabilityStatus, t.eeo.selfIdentified, t.eeo.date];
    const rows = filteredApplicants.map(a => [
      a.name, a.job, a.gender, a.ethnicity, a.veteranStatus, a.disabilityStatus,
      a.selfIdentified ? t.eeo.yes : t.eeo.no, a.date
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eeo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t.eeo.exportReport, { description: 'CSV downloaded successfully' });
  };

  const statCards = [
    { title: t.eeo.totalResponses, value: totalResponses, icon: Users, gradient: 'from-teal-500 to-emerald-600' },
    { title: t.eeo.declinedToIdentify, value: declinedCount, icon: EyeOff, gradient: 'from-emerald-500 to-teal-600' },
    { title: t.eeo.genderDiversity, value: `${genderDiversityPercent}%`, icon: TrendingUp, gradient: 'from-cyan-500 to-teal-600' },
    { title: t.eeo.ethnicDiversity, value: `${ethnicDiversityIndex}%`, icon: BarChart3, gradient: 'from-teal-600 to-emerald-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            {t.eeo.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.eeo.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchEEO} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={filteredApplicants.length === 0}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 gap-2"
          >
            <Download className="h-4 w-4" />
            {t.eeo.exportReport}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden border-0 shadow-md card-hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.eeo.filters}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.eeo.byCompany}</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.eeo.byJob}</label>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.eeo.byDateRange}</label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.eeo.byResponseStatus}</label>
              <Select value={responseFilter} onValueChange={setResponseFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Responses</SelectItem>
                  <SelectItem value="identified">{t.eeo.selfIdentified}</SelectItem>
                  <SelectItem value="declined">{t.eeo.declinedToIdentify}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EEO Data Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.eeo.eeoReport}
            <Badge variant="secondary" className="ml-2 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
              {filteredApplicants.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredApplicants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.eeo.applicant}</TableHead>
                    <TableHead className="text-xs">{t.eeo.jobApplied}</TableHead>
                    <TableHead className="text-xs">{t.eeo.gender}</TableHead>
                    <TableHead className="text-xs">{t.eeo.ethnicity}</TableHead>
                    <TableHead className="text-xs">{t.eeo.veteranStatus}</TableHead>
                    <TableHead className="text-xs">{t.eeo.disabilityStatus}</TableHead>
                    <TableHead className="text-xs">{t.eeo.selfIdentified}</TableHead>
                    <TableHead className="text-xs">{t.eeo.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id} className="gradient-border-start">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs dark:bg-teal-950 dark:text-teal-400">
                              {getInitials(applicant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{applicant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{applicant.job}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                          {applicant.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{applicant.ethnicity}</TableCell>
                      <TableCell className="text-sm">{applicant.veteranStatus}</TableCell>
                      <TableCell className="text-sm">{applicant.disabilityStatus}</TableCell>
                      <TableCell>
                        {applicant.selfIdentified ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs">
                            {t.eeo.yes}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t.eeo.no}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{applicant.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No EEO survey data available</p>
              <p className="text-xs mt-1">EEO data will appear when candidates complete voluntary self-identification surveys</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row - only show when there's data */}
      {identifiedApplicants.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <Card className="border-border/50 animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {t.eeo.genderDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 400 180" className="w-full h-auto">
                  {genderData.map((item, i) => {
                    const barWidth = (item.count / maxGenderCount) * 250;
                    const y = 10 + i * 34;
                    return (
                      <g key={item.label}>
                        <text x="0" y={y + 14} className="fill-foreground text-[11px] font-medium" textAnchor="start">
                          {item.label.length > 16 ? item.label.slice(0, 16) + '...' : item.label}
                        </text>
                        <rect x="130" y={y} width={barWidth} height="22" rx="4" fill={item.color} opacity="0.85">
                          <animate attributeName="width" from="0" to={barWidth} dur="0.8s" fill="freeze" />
                        </rect>
                        <text x={130 + barWidth + 8} y={y + 15} className="fill-muted-foreground text-[11px] font-bold">
                          {item.count} ({Math.round((item.count / identifiedApplicants.length) * 100)}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>

            {/* Ethnicity Distribution */}
            <Card className="border-border/50 animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {t.eeo.ethnicityDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 400 240" className="w-full h-auto">
                  {ethnicityData.map((item, i) => {
                    const barWidth = (item.count / maxEthnicityCount) * 220;
                    const y = 10 + i * 34;
                    const truncated = item.label.length > 22 ? item.label.slice(0, 22) + '...' : item.label;
                    return (
                      <g key={item.label}>
                        <text x="0" y={y + 14} className="fill-foreground text-[10px] font-medium" textAnchor="start">
                          {truncated}
                        </text>
                        <rect x="160" y={y} width={barWidth} height="22" rx="4" fill={item.color} opacity="0.85">
                          <animate attributeName="width" from="0" to={barWidth} dur="0.8s" fill="freeze" />
                        </rect>
                        <text x={160 + barWidth + 8} y={y + 15} className="fill-muted-foreground text-[11px] font-bold">
                          {item.count} ({Math.round((item.count / identifiedApplicants.length) * 100)}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Veteran Status */}
            <Card className="border-border/50 animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{t.eeo.veteranDistribution}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <svg viewBox="0 0 120 120" className="w-40 h-40">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#14b8a6" strokeWidth="16"
                      strokeDasharray={`${veteranYesPct * 3.14} ${100 * 3.14}`}
                      strokeDashoffset="0" transform="rotate(-90 60 60)"
                      className="transition-all duration-1000" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="16"
                      strokeDasharray={`${veteranNoPct * 3.14} ${100 * 3.14}`}
                      strokeDashoffset={`${-veteranYesPct * 3.14}`}
                      transform="rotate(-90 60 60)"
                      className="transition-all duration-1000 dark:stroke-gray-700" />
                    <text x="60" y="55" textAnchor="middle" className="fill-foreground text-xl font-bold">{veteranYesPct}%</text>
                    <text x="60" y="72" textAnchor="middle" className="fill-muted-foreground text-[9px]">{t.eeo.yes}</text>
                  </svg>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                      <span className="text-sm">{t.eeo.yes} ({veteranYes})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-gray-700" />
                      <span className="text-sm">{t.eeo.no} ({veteranNo})</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disability Status */}
            <Card className="border-border/50 animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{t.eeo.disabilityDistribution}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.eeo.yes}</span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{disabilityYesPct}%</span>
                  </div>
                  <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${disabilityYesPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{disabilityYes} {t.eeo.applicant.toLowerCase()}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.eeo.no}</span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{disabilityNoPct}%</span>
                  </div>
                  <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                      style={{ width: `${disabilityNoPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{disabilityNo} {t.eeo.applicant.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
