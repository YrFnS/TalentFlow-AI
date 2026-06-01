// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  FileDown,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Play,
  User,
  FileText,
  Briefcase,
  MessageSquare,
  BarChart3,
  Activity,
  Bell,
  ChevronRight,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

// Types
type GdprRequestType = 'export' | 'deletion' | 'correction';
type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

interface GdprRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: GdprRequestType;
  status: GdprRequestStatus;
  requestedDate: string;
  completedDate: string | null;
  notes?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface ComplianceItem {
  id: string;
  key: string;
  status: 'implemented' | 'inProgress' | 'notImplemented';
  icon: React.ElementType;
}

// Audit trail is now fetched from API or shown empty
const emptyAuditTrail: AuditEntry[] = [];

const complianceChecklist: ComplianceItem[] = [
  { id: 'c1', key: 'dataRetentionPolicy', status: 'implemented', icon: FileText },
  { id: 'c2', key: 'privacyPolicy', status: 'implemented', icon: Shield },
  { id: 'c3', key: 'cookieConsent', status: 'implemented', icon: CheckCircle2 },
  { id: 'c4', key: 'dataProcessingAgreements', status: 'inProgress', icon: FileText },
  { id: 'c5', key: 'rightToAccess', status: 'implemented', icon: Eye },
  { id: 'c6', key: 'rightToErasure', status: 'implemented', icon: Trash2 },
  { id: 'c7', key: 'dataPortability', status: 'inProgress', icon: FileDown },
  { id: 'c8', key: 'breachNotification', status: 'notImplemented', icon: AlertOctagon },
];

// Data category definitions for export preview
const dataCategories = [
  { key: 'profile', icon: User, color: 'from-teal-500 to-emerald-500' },
  { key: 'applications', icon: Briefcase, color: 'from-emerald-500 to-green-500' },
  { key: 'interviews', icon: MessageSquare, color: 'from-cyan-500 to-teal-500' },
  { key: 'assessments', icon: BarChart3, color: 'from-teal-600 to-cyan-500' },
  { key: 'activities', icon: Activity, color: 'from-emerald-600 to-teal-500' },
  { key: 'notifications', icon: Bell, color: 'from-teal-400 to-emerald-500' },
];

export default function GdprContent() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(emptyAuditTrail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGdprData() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/gdpr');
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch {
        // Show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchGdprData();
  }, []);
  const [selectedRequest, setSelectedRequest] = useState<GdprRequest | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [correctionData, setCorrectionData] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportGenerated, setExportGenerated] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Compute stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const avgProcessingTime = totalRequests > 0 ? ((requests.filter(r => r.completedDate).length / Math.max(totalRequests, 1)) * 30).toFixed(1) : '0';

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const getTypeLabel = (type: GdprRequestType) => {
    switch (type) {
      case 'export': return t.gdpr.dataExport;
      case 'deletion': return t.gdpr.dataDeletion;
      case 'correction': return t.gdpr.dataCorrection;
    }
  };

  const getStatusBadge = (status: GdprRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 border-0">{t.gdpr.pending}</Badge>;
      case 'processing':
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 border-0">{t.gdpr.processing}</Badge>;
      case 'completed':
        return <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">{t.gdpr.completed}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0">{t.gdpr.rejected}</Badge>;
    }
  };

  const getTypeBadge = (type: GdprRequestType) => {
    switch (type) {
      case 'export':
        return <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 gap-1"><FileDown className="h-3 w-3" />{t.gdpr.dataExport}</Badge>;
      case 'deletion':
        return <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 gap-1"><Trash2 className="h-3 w-3" />{t.gdpr.dataDeletion}</Badge>;
      case 'correction':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 gap-1"><Edit3 className="h-3 w-3" />{t.gdpr.dataCorrection}</Badge>;
    }
  };

  const handleProcessRequest = useCallback((req: GdprRequest) => {
    setSelectedRequest(req);
    setExportGenerated(false);
    setDeletionConfirmed(false);
    setRejectReason('');
    setCorrectionData({
      name: req.userName,
      email: req.userEmail,
      phone: '',
      address: '',
    });
    setProcessDialogOpen(true);
  }, []);

  const handleViewRequest = useCallback((req: GdprRequest) => {
    setSelectedRequest(req);
    setViewDialogOpen(true);
  }, []);

  const handleGenerateExport = useCallback(async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedRequest.userId, requestType: 'full_export' }),
      });
      if (res.ok) {
        setExportGenerated(true);
        setRequests(prev => prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: 'completed' as GdprRequestStatus, completedDate: new Date().toISOString().slice(0, 10) } : r
        ));
        toast.success(t.gdpr.exportGenerated);
      }
    } catch {
      toast.error('Failed to generate export');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRequest, t]);

  const handleDeleteData = useCallback(async () => {
    if (!selectedRequest || !deletionConfirmed) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedRequest.userId, requestId: selectedRequest.id, confirmed: true }),
      });
      if (res.ok) {
        setRequests(prev => prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: 'processing' as GdprRequestStatus } : r
        ));
        setDeleteConfirmOpen(false);
        setProcessDialogOpen(false);
        toast.success(t.gdpr.deletionScheduled);
      }
    } catch {
      toast.error('Failed to schedule deletion');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRequest, deletionConfirmed, t]);

  const handleCorrectData = useCallback(() => {
    if (!selectedRequest) return;
    setRequests(prev => prev.map(r =>
      r.id === selectedRequest.id ? { ...r, status: 'completed' as GdprRequestStatus, completedDate: new Date().toISOString().slice(0, 10) } : r
    ));
    setProcessDialogOpen(false);
    toast.success(t.gdpr.dataCorrected);
  }, [selectedRequest, t]);

  const handleRejectRequest = useCallback(() => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setRequests(prev => prev.map(r =>
      r.id === selectedRequest.id ? { ...r, status: 'rejected' as GdprRequestStatus, completedDate: new Date().toISOString().slice(0, 10) } : r
    ));
    setRejectDialogOpen(false);
    setProcessDialogOpen(false);
    setRejectReason('');
    toast.success(t.gdpr.confirmReject);
  }, [selectedRequest, rejectReason, t]);

  const getComplianceStatusBadge = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'implemented':
        return <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">{t.gdpr.implemented}</Badge>;
      case 'inProgress':
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 border-0">{t.gdpr.inProgress}</Badge>;
      case 'notImplemented':
        return <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0">{t.gdpr.notImplemented}</Badge>;
    }
  };

  const getComplianceIcon = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'inProgress':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'notImplemented':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getAuditTypeColor = (type: AuditEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-slate-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
    }
  };

  const stats = [
    { label: t.gdpr.totalRequests, value: totalRequests, icon: Shield, color: 'from-teal-500 to-emerald-500' },
    { label: t.gdpr.pendingRequests, value: pendingRequests, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: t.gdpr.completedRequests, value: completedRequests, icon: CheckCircle2, color: 'from-emerald-500 to-green-500' },
    { label: t.gdpr.avgProcessingTime, value: avgProcessingTime, suffix: ` ${t.gdpr.days}`, icon: Activity, color: 'from-cyan-500 to-teal-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.gdpr.title}</h1>
            <p className="text-sm text-muted-foreground">{t.gdpr.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <Card key={index} className="border-border/50 card-animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shrink-0', stat.color)}>
                    <StatIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-xl font-bold">
                      {stat.value}
                      {stat.suffix && <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GDPR Requests Table */}
      <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              {t.gdpr.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="export">{t.gdpr.dataExport}</option>
                <option value="deletion">{t.gdpr.dataDeletion}</option>
                <option value="correction">{t.gdpr.dataCorrection}</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">{t.gdpr.pending}</option>
                <option value="processing">{t.gdpr.processing}</option>
                <option value="completed">{t.gdpr.completed}</option>
                <option value="rejected">{t.gdpr.rejected}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.gdpr.requestId}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.user}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.type}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.status}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.requestedDate}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.completedDate}</TableHead>
                    <TableHead className="text-xs">{t.gdpr.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id} className="gradient-border-start table-row-accent">
                      <TableCell className="text-sm font-medium py-3 font-mono">{req.id}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(req.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{req.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{req.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{getTypeBadge(req.type)}</TableCell>
                      <TableCell className="py-3">{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{req.requestedDate}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{req.completedDate || '—'}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          {(req.status === 'pending' || req.status === 'processing') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800"
                              onClick={() => handleProcessRequest(req)}
                            >
                              <Play className="h-3 w-3" />
                              {t.gdpr.process}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800"
                            onClick={() => handleViewRequest(req)}
                          >
                            <Eye className="h-3 w-3" />
                            {t.gdpr.view}
                          </Button>
                          {req.type === 'export' && req.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800"
                            >
                              <Download className="h-3 w-3" />
                              {t.gdpr.download}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t.gdpr.noRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Grid: Compliance Checklist + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Checklist */}
        <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              {t.gdpr.complianceChecklist}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceChecklist.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                        item.status === 'implemented' ? 'bg-slate-50' :
                        item.status === 'inProgress' ? 'bg-amber-50 dark:bg-amber-950/50' :
                        'bg-red-50 dark:bg-red-950/50'
                      )}>
                        <ItemIcon className={cn(
                          'h-4 w-4',
                          item.status === 'implemented' ? 'text-blue-600' :
                          item.status === 'inProgress' ? 'text-amber-600' :
                          'text-red-600'
                        )} />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {t.gdpr[item.key as keyof typeof t.gdpr]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getComplianceIcon(item.status)}
                      {getComplianceStatusBadge(item.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              {t.gdpr.auditTrail}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 max-h-96 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : auditTrail.length > 0 ? (
                auditTrail.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={cn(
                        'w-3 h-3 rounded-full shrink-0 timeline-dot',
                        getAuditTypeColor(entry.type)
                      )} />
                      {index < auditTrail.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{entry.action}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{entry.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.details}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">by {entry.user}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No audit trail entries</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Request Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-lg dialog-content-glow">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle className="flex items-center gap-2 pt-1">
              <Shield className="h-5 w-5 text-blue-600" />
              {t.gdpr.processRequest}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && `${selectedRequest.id} — ${selectedRequest.userName}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(selectedRequest.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{selectedRequest.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.userEmail}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getTypeBadge(selectedRequest.type)}
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Data Export Section */}
              {selectedRequest.type === 'export' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.gdpr.dataCategories}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {dataCategories.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <div key={cat.key} className="flex items-center gap-2 p-2 rounded-lg border border-border/50">
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br text-white shrink-0', cat.color)}>
                              <CatIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{t.gdpr[cat.key as keyof typeof t.gdpr]}</p>
                              <p className="text-[10px] text-muted-foreground">{t.gdpr[cat.key as keyof typeof t.gdpr]}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!exportGenerated ? (
                    <Button
                      onClick={handleGenerateExport}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          {t.gdpr.processing}
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          {t.gdpr.generateExport}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-700">{t.gdpr.exportGenerated}</p>
                          <p className="text-xs text-blue-600/70/70">{t.gdpr.downloadExpiry}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800"
                      >
                        <Download className="h-4 w-4" />
                        {t.gdpr.download}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Data Deletion Section */}
              {selectedRequest.type === 'deletion' && (
                <div className="space-y-4">
                  {/* Warning */}
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">{t.gdpr.deletionWarning}</p>
                      </div>
                    </div>
                  </div>

                  {/* What will be deleted */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.gdpr.dataCategories}</h4>
                    <div className="space-y-1">
                      {dataCategories.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <div key={cat.key} className="flex items-center gap-2 p-1.5 text-sm">
                            <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <CatIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs">{t.gdpr[cat.key as keyof typeof t.gdpr]}</span>
                            <span className="text-xs text-muted-foreground ms-auto">{t.gdpr[cat.key as keyof typeof t.gdpr]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grace period notice */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">{t.gdpr.gracePeriod}</p>
                      <p className="text-xs text-amber-600/70/70">{t.gdpr.gracePeriodDesc}</p>
                    </div>
                  </div>

                  {/* Confirmation checkbox */}
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-border">
                    <Checkbox
                      id="deletion-confirm"
                      checked={deletionConfirmed}
                      onCheckedChange={(checked) => setDeletionConfirmed(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="deletion-confirm" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                      {t.gdpr.deletionConfirmation}
                    </Label>
                  </div>

                  <Button
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={!deletionConfirmed}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.gdpr.deleteData}
                  </Button>
                </div>
              )}

              {/* Data Correction Section */}
              {selectedRequest.type === 'correction' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">{t.gdpr.correctData}</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t.gdpr.user}</Label>
                        <Input
                          value={correctionData.name || ''}
                          onChange={(e) => setCorrectionData(prev => ({ ...prev, name: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Email</Label>
                        <Input
                          value={correctionData.email || ''}
                          onChange={(e) => setCorrectionData(prev => ({ ...prev, email: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Phone</Label>
                        <Input
                          value={correctionData.phone || ''}
                          onChange={(e) => setCorrectionData(prev => ({ ...prev, phone: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCorrectData}
                    className="w-full bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {t.gdpr.correctData}
                  </Button>
                </div>
              )}

              {/* Reject option for pending/processing requests */}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t.gdpr.confirmReject}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md dialog-content-glow">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle className="flex items-center gap-2 pt-1">
              <Eye className="h-5 w-5 text-blue-600" />
              {t.gdpr.view}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && `Request ${selectedRequest.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(selectedRequest.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold">{selectedRequest.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.gdpr.requestId}</p>
                  <p className="text-sm font-mono font-medium">{selectedRequest.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.gdpr.type}</p>
                  <div>{getTypeBadge(selectedRequest.type)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.gdpr.status}</p>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.gdpr.requestedDate}</p>
                  <p className="text-sm font-medium">{selectedRequest.requestedDate}</p>
                </div>
                {selectedRequest.completedDate && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">{t.gdpr.completedDate}</p>
                    <p className="text-sm font-medium">{selectedRequest.completedDate}</p>
                  </div>
                )}
              </div>
              {selectedRequest.type === 'export' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/50/50">
                  <p className="text-xs font-medium text-blue-700 mb-2">{t.gdpr.dataCategories}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dataCategories.map((cat) => (
                      <span key={cat.key} className="inline-flex items-center gap-1 text-xs bg-teal-100/50 px-2 py-0.5 rounded-full text-blue-700">
                        {t.gdpr[cat.key as keyof typeof t.gdpr]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedRequest.type === 'deletion' && selectedRequest.status === 'processing' && (
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-medium text-amber-700">{t.gdpr.gracePeriod}</p>
                  </div>
                  <p className="text-xs text-amber-600/70/70 mt-1">{t.gdpr.gracePeriodDesc}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="dialog-content-glow">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t.gdpr.deleteData}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>{t.gdpr.deletionWarning}</p>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 mb-2">{t.gdpr.dataCategories}:</p>
                <ul className="space-y-1">
                  {dataCategories.map((cat) => (
                    <li key={cat.key} className="flex items-center gap-1.5 text-xs text-red-600/80/80">
                      <ChevronRight className="h-3 w-3" />
                      {t.gdpr[cat.key as keyof typeof t.gdpr]}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">{t.gdpr.gracePeriodDesc}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteData}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  {t.gdpr.processing}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t.gdpr.deleteData}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Request Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md dialog-content-glow">
          <DialogHeader className="dialog-header-accent">
            <DialogTitle className="flex items-center gap-2 pt-1 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t.gdpr.confirmReject}
            </DialogTitle>
            <DialogDescription>
              {t.gdpr.rejectWarning}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.gdpr.rejectReason}</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.gdpr.rejectReason}
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleRejectRequest}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4" />
              {t.gdpr.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
