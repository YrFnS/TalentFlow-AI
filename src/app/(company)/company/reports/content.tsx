// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileBarChart,
  Download,
  Plus,
  FileText,
  Users,
  GitBranch,
  BarChart3,
  Clock,
  Trophy,
  Timer,
  Heart,
  CheckSquare,
  CalendarIcon,
  FileSpreadsheet,
  FileType,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ReportTemplate {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface GeneratedReport {
  name: string;
  date: string;
  format: 'PDF' | 'CSV' | 'Excel';
  size: string;
}

export default function CompanyReportsPage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    format: 'pdf',
    sections: { summary: true, details: true, charts: true, recommendations: false },
  });

  const reportTemplates: ReportTemplate[] = [
    { title: t.reports.hiringSummary, description: t.reports.hiringSummaryDesc, icon: FileText, color: 'bg-blue-600' },
    { title: t.reports.pipelineAnalytics, description: t.reports.pipelineAnalyticsDesc, icon: GitBranch, color: 'from-emerald-500 to-teal-600' },
    { title: t.reports.candidateSource, description: t.reports.candidateSourceDesc, icon: Users, color: 'from-cyan-500 to-teal-600' },
    { title: t.reports.interviewPerformance, description: t.reports.interviewPerformanceDesc, icon: BarChart3, color: 'from-teal-600 to-emerald-700' },
    { title: t.reports.timeToHire, description: t.reports.timeToHireDesc, icon: Clock, color: 'from-emerald-600 to-teal-700' },
    { title: t.reports.diversityInclusion, description: t.reports.diversityInclusionDesc, icon: Heart, color: 'from-teal-500 to-cyan-600' },
  ];

  const generatedReports: GeneratedReport[] = [];

  const quickStats = [
    { label: t.reports.reportsThisMonth, value: '—', icon: FileBarChart, gradient: 'bg-blue-600' },
    { label: t.reports.mostPopular, value: '—', icon: Trophy, gradient: 'from-emerald-500 to-teal-600' },
    { label: t.reports.avgGenerationTime, value: '—', icon: Timer, gradient: 'from-cyan-500 to-teal-600' },
  ];

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <FileType className="h-4 w-4 text-red-500" />;
      case 'CSV': return <FileText className="h-4 w-4 text-green-500" />;
      case 'Excel': return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      PDF: 'bg-red-50 text-red-700 dark:bg-red-950/30',
      CSV: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      Excel: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30',
    };
    return colors[format] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-blue-600 text-white">
            {t.reports.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.reports.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg">
              <Plus className="h-4 w-4 me-2" />
              {t.reports.generateReport}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.reports.generateReport}</DialogTitle>
              <DialogDescription>Create a new report from a template</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reports.reportType}</label>
                <Select value={reportForm.type} onValueChange={(v) => setReportForm({ ...reportForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.reports.selectReportType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hiring-summary">{t.reports.hiringSummary}</SelectItem>
                    <SelectItem value="pipeline-analytics">{t.reports.pipelineAnalytics}</SelectItem>
                    <SelectItem value="candidate-source">{t.reports.candidateSource}</SelectItem>
                    <SelectItem value="interview-performance">{t.reports.interviewPerformance}</SelectItem>
                    <SelectItem value="time-to-hire">{t.reports.timeToHire}</SelectItem>
                    <SelectItem value="diversity-inclusion">{t.reports.diversityInclusion}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.reports.startDate}</label>
                  <Input
                    type="date"
                    value={reportForm.startDate}
                    onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.reports.endDate}</label>
                  <Input
                    type="date"
                    value={reportForm.endDate}
                    onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reports.format}</label>
                <Select value={reportForm.format} onValueChange={(v) => setReportForm({ ...reportForm, format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">{t.reports.pdf}</SelectItem>
                    <SelectItem value="csv">{t.reports.csv}</SelectItem>
                    <SelectItem value="excel">{t.reports.excel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reports.includeSections}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'summary', label: 'Summary' },
                    { key: 'details', label: 'Details' },
                    { key: 'charts', label: 'Charts' },
                    { key: 'recommendations', label: 'Recommendations' },
                  ].map((section) => (
                    <label
                      key={section.key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={reportForm.sections[section.key as keyof typeof reportForm.sections]}
                        onChange={(e) =>
                          setReportForm({
                            ...reportForm,
                            sections: { ...reportForm.sections, [section.key]: e.target.checked },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button
                className="bg-gradient-to-r bg-blue-600 text-white"
                onClick={() => setDialogOpen(false)}
              >
                <Sparkles className="h-4 w-4 me-2" />
                {t.reports.generateReport}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden border-0 shadow-md">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Templates */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">{t.reports.reportTemplates}</CardTitle>
          <CardDescription>Choose a template to generate a new report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <div
                key={template.title}
                className="group relative p-5 rounded-xl border border-border/50 hover:border-slate-300 bg-gradient-to-br from-muted/30 to-transparent hover:shadow-lg transition-all cursor-pointer"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${template.color} text-white shadow mb-3`}>
                  <template.icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold mb-1">{template.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-blue-600 hover:text-blue-700 p-0 h-auto"
                >
                  <Plus className="h-3.5 w-3.5 me-1" />
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">{t.reports.generatedReports}</CardTitle>
          <CardDescription>Previously generated reports available for download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {generatedReports.map((report, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {getFormatIcon(report.format)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium truncate">{report.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {report.date}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className={`text-xs border-0 ${getFormatBadge(report.format)}`}>
                    {report.format}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 me-1" />
                    {t.reports.download}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
