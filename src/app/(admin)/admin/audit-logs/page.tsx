// @ts-nocheck
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Activity,
  Shield,
  FileText,
  Settings,
  Trash2,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

const actionTypes = [
  'user.login',
  'user.register',
  'user.update',
  'user.delete',
  'user.suspend',
  'user.activate',
  'company.create',
  'company.update',
  'company.verify',
  'company.suspend',
  'company.activate',
  'job.create',
  'job.update',
  'job.delete',
  'application.create',
  'application.update',
  'system.config',
  'system.backup',
];

const actionColorMap: Record<string, string> = {
  'user.login': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'user.register': 'bg-teal-100 text-blue-700 dark:bg-teal-950',
  'user.update': 'bg-sky-100 text-sky-700 dark:bg-cyan-950',
  'user.delete': 'bg-red-100 text-red-700 dark:bg-red-950',
  'user.suspend': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'user.activate': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'company.create': 'bg-teal-100 text-blue-700 dark:bg-teal-950',
  'company.update': 'bg-sky-100 text-sky-700 dark:bg-cyan-950',
  'company.verify': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'company.suspend': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'company.activate': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'job.create': 'bg-teal-100 text-blue-700 dark:bg-teal-950',
  'job.update': 'bg-sky-100 text-sky-700 dark:bg-cyan-950',
  'job.delete': 'bg-red-100 text-red-700 dark:bg-red-950',
  'application.create': 'bg-teal-100 text-blue-700 dark:bg-teal-950',
  'application.update': 'bg-sky-100 text-sky-700 dark:bg-cyan-950',
  'system.config': 'bg-amber-100 text-amber-700 dark:bg-amber-950',
  'system.backup': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

function ActionIcon({ action }: { action: string }) {
  if (action.startsWith('user')) return <User className="h-4 w-4" />;
  if (action.startsWith('company')) return <Activity className="h-4 w-4" />;
  if (action.startsWith('job')) return <FileText className="h-4 w-4" />;
  if (action.startsWith('application')) return <FileText className="h-4 w-4" />;
  if (action.startsWith('system')) return <Settings className="h-4 w-4" />;
  return <Shield className="h-4 w-4" />;
}

export default function AuditLogsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (resourceFilter !== 'all') params.set('resource', resourceFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // Will show empty table
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatDetails = (details: string | null) => {
    if (!details) return '—';
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    } catch {
      return details;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setResourceFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || actionFilter !== 'all' || resourceFilter !== 'all' || dateFrom || dateTo;

  const uniqueResources = [...new Set(logs.map(l => l.resource))].sort();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.nav.auditLogs}</h1>
          <p className="text-muted-foreground text-sm">{t.admin.userActivity}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.admin.refreshData}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t.admin.exportData}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t.admin.filterByAction} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.allActions}</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder={t.admin.resource} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <Filter className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-emerald-600" />
            {t.nav.auditLogs}
            <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
          </CardTitle>
          <CardDescription>{t.admin.userActivity}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.admin.timestamp}</TableHead>
                  <TableHead>{t.admin.user}</TableHead>
                  <TableHead>{t.admin.actionType}</TableHead>
                  <TableHead>{t.admin.resource}</TableHead>
                  <TableHead>{t.admin.details}</TableHead>
                  <TableHead>{t.admin.ipAddress}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t.admin.noLogsFound}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-950 dark:text-emerald-300">
                                {log.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{log.user.name}</p>
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColorMap[log.action] || 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300'}>
                          <ActionIcon action={log.action} />
                          <span className="ml-1 text-xs">{log.action}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.resource}
                        {log.resourceId && (
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{log.resourceId}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {formatDetails(log.details)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {log.ipAddress || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
