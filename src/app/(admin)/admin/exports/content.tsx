// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Users,
  Building2,
  FileText,
  ScrollText,
  Briefcase,
  Clock,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportFormat = 'csv' | 'json';

interface ExportCategory {
  id: string;
  key: string;
  icon: React.ElementType;
  color: string;
  recordCount: number;
}

interface ExportHistoryEntry {
  id: string;
  type: string;
  format: string;
  records: number;
  fileSize: string;
  exportedBy: string;
  date: string;
  data: string; // stored mock data for re-download
}

const categories: ExportCategory[] = [
  { id: 'users', key: 'categoryUsers', icon: Users, color: 'from-teal-500 to-emerald-500', recordCount: 0 },
  { id: 'companies', key: 'categoryCompanies', icon: Building2, color: 'from-emerald-500 to-green-500', recordCount: 0 },
  { id: 'jobs', key: 'categoryJobs', icon: Briefcase, color: 'from-cyan-500 to-teal-500', recordCount: 0 },
  { id: 'applications', key: 'categoryApplications', icon: FileText, color: 'from-teal-600 to-cyan-500', recordCount: 0 },
  { id: 'audit-logs', key: 'categoryAuditLogs', icon: ScrollText, color: 'from-emerald-600 to-teal-500', recordCount: 0 },
];

// Data generators removed - export will use real DB data via API

function toCSV(data: Record<string, string>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function toJSON(data: Record<string, string>[]): string {
  return JSON.stringify(data, null, 2);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportsContent() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<ExportCategory[]>([
    { id: 'users', key: 'categoryUsers', icon: Users, color: 'from-teal-500 to-emerald-500', recordCount: 0 },
    { id: 'companies', key: 'categoryCompanies', icon: Building2, color: 'from-emerald-500 to-green-500', recordCount: 0 },
    { id: 'jobs', key: 'categoryJobs', icon: Briefcase, color: 'from-cyan-500 to-teal-500', recordCount: 0 },
    { id: 'applications', key: 'categoryApplications', icon: FileText, color: 'from-teal-600 to-cyan-500', recordCount: 0 },
    { id: 'audit-logs', key: 'categoryAuditLogs', icon: ScrollText, color: 'from-emerald-600 to-teal-500', recordCount: 0 },
  ]);
  const [exportFormats, setExportFormats] = useState<Record<string, string>>({
    users: 'csv',
    companies: 'csv',
    jobs: 'csv',
    applications: 'csv',
    'audit-logs': 'csv',
  });
  const [dateFrom, setDateFrom] = useState<Record<string, string>>({});
  const [dateTo, setDateTo] = useState<Record<string, string>>({});
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);

  const handleExport = useCallback(async (cat: ExportCategory) => {
    setExportingId(cat.id);

    try {
      // Fetch real data from the API
      const res = await fetch(`/api/exports/${cat.id}`);
      if (!res.ok) throw new Error('Export failed');
      const data: Record<string, string>[] = await res.json();

      const format = exportFormats[cat.id];
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5);
      const extension = format === 'csv' ? 'csv' : 'json';
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
      const content = format === 'csv' ? toCSV(data) : toJSON(data);
      const fileName = `${cat.id}-export-${dateStr}.${extension}`;

      downloadFile(content, fileName, mimeType);

      const fileSize = format === 'csv'
        ? `${Math.round(content.length / 1024)} KB`
        : `${(content.length / 1024 / 1024).toFixed(1)} MB`;

      const typeNameMap: Record<string, string> = {
        users: t.dataExport.categoryUsers,
        companies: t.dataExport.categoryCompanies,
        jobs: t.dataExport.categoryJobs,
        applications: t.dataExport.categoryApplications,
        'audit-logs': t.dataExport.categoryAuditLogs,
      };

      setExportHistory(prev => [{
        id: `EXP-${String(prev.length + 1).padStart(3, '0')}`,
        type: typeNameMap[cat.id] || cat.id,
        format: format.toUpperCase(),
        records: data.length,
        fileSize,
        exportedBy: 'Admin User',
        date: `${dateStr} ${timeStr}`,
        data: content,
      }, ...prev]);
    } catch (error) {
      console.error('Export failed:', error);
    }

    setExportingId(null);
  }, [exportFormats, categories, t]);

  const handleBulkExport = useCallback(async () => {
    setExportingId('bulk');

    try {
      // Export all categories via API
      for (const cat of categories) {
        const res = await fetch(`/api/exports/${cat.id}`);
        if (!res.ok) continue;
        const data: Record<string, string>[] = await res.json();
        const format = exportFormats[cat.id];
        const dateStr = new Date().toISOString().slice(0, 10);
        const extension = format === 'csv' ? 'csv' : 'json';
        const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
        const content = format === 'csv' ? toCSV(data) : toJSON(data);
        const fileName = `${cat.id}-export-${dateStr}.${extension}`;
        downloadFile(content, fileName, mimeType);
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
    }

    setExportingId(null);
  }, [exportFormats, categories]);

  const handleRedownload = useCallback((entry: ExportHistoryEntry) => {
    if (entry.data) {
      const format = entry.format.toLowerCase() === 'csv' ? 'csv' : 'json';
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
      const fileName = `${entry.type.toLowerCase().replace(' ', '-')}-re-export.${format}`;
      downloadFile(entry.data, fileName, mimeType);
    }
  }, []);

  const formatLabel = (fmt: ExportFormat) => fmt === 'csv' ? t.dataExport.formatCSV : t.dataExport.formatJSON;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.dataExport.title}</h1>
            <p className="text-sm text-muted-foreground">{t.dataExport.subtitle}</p>
          </div>
        </div>
        <Button
          onClick={handleBulkExport}
          disabled={exportingId === 'bulk'}
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
        >
          {exportingId === 'bulk' ? (
            <>
              <Clock className="h-4 w-4 me-2 animate-spin" />
              {t.dataExport.exporting}
            </>
          ) : (
            <>
              <Archive className="h-4 w-4 me-2" />
              {t.dataExport.bulkExport}
            </>
          )}
        </Button>
      </div>

      {/* Bulk Export Description */}
      <Card className="border-border/50 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <Archive className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t.dataExport.bulkExport}</p>
            <p className="text-xs text-muted-foreground">{t.dataExport.bulkExportDesc}</p>
          </div>
        </CardContent>
      </Card>

      {/* Export Categories */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-blue-600" />
          {t.dataExport.exportCategories}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isExporting = exportingId === cat.id;
            const currentFormat = exportFormats[cat.id];

            return (
              <Card key={cat.id} className="border-border/50 card-animate-fade-in-up">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shrink-0', cat.color)}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{t.dataExport[cat.key as keyof typeof t.dataExport]}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {t.dataExport[(cat.key + 'Desc') as keyof typeof t.dataExport]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
                      <CheckCircle2 className="h-3 w-3 me-1" />
                      {cat.recordCount.toLocaleString()} {t.dataExport.recordCount}
                    </Badge>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t.dataExport.format}</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`format-${cat.id}`}
                          checked={currentFormat === 'csv'}
                          onChange={() => setExportFormats(prev => ({ ...prev, [cat.id]: 'csv' }))}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-border"
                        />
                        <span className="text-xs font-medium">{t.dataExport.formatCSV}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`format-${cat.id}`}
                          checked={currentFormat === 'json'}
                          onChange={() => setExportFormats(prev => ({ ...prev, [cat.id]: 'json' }))}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-border"
                        />
                        <span className="text-xs font-medium">{t.dataExport.formatJSON}</span>
                      </label>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t.dataExport.dateRange}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={dateFrom[cat.id] || ''}
                        onChange={(e) => setDateFrom(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder={t.dataExport.dateFrom}
                      />
                      <Input
                        type="date"
                        value={dateTo[cat.id] || ''}
                        onChange={(e) => setDateTo(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder={t.dataExport.dateTo}
                      />
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    size="sm"
                    onClick={() => handleExport(cat)}
                    disabled={isExporting}
                    className="w-full h-9 text-xs bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 gap-1.5"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        {t.dataExport.exporting}
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        {t.dataExport.exportBtn}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Export History */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            {t.dataExport.exportHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exportHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.dataExport.type}</TableHead>
                    <TableHead className="text-xs">{t.dataExport.format}</TableHead>
                    <TableHead className="text-xs">{t.dataExport.records}</TableHead>
                    <TableHead className="text-xs">{t.dataExport.fileSize}</TableHead>
                    <TableHead className="text-xs">{t.dataExport.exportedBy}</TableHead>
                    <TableHead className="text-xs">{t.dataExport.date}</TableHead>
                    <TableHead className="text-xs">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportHistory.map((entry) => (
                    <TableRow key={entry.id} className="gradient-border-start">
                      <TableCell className="text-sm font-medium py-3">{entry.type}</TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn(
                          'text-[10px] border-0',
                          entry.format === 'CSV'
                            ? 'bg-slate-50 text-blue-700 dark:bg-teal-950'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                        )}>
                          {entry.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{entry.records.toLocaleString()}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{entry.fileSize}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{entry.exportedBy}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{entry.date}</TableCell>
                      <TableCell className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800"
                          onClick={() => handleRedownload(entry)}
                        >
                          <Download className="h-3 w-3" />
                          {t.dataExport.downloadAgain}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Download className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t.dataExport.noHistory}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
