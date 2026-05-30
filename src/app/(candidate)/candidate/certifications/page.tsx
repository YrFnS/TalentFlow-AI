// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Share2,
  Upload,
  Sparkles,
  Shield,
  Cloud,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CertStatus = 'active' | 'expired' | 'expiring';

interface Certification {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  providerIcon: React.ElementType;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  credentialId: string;
  skillsValidated: number;
}

interface RecommendedCert {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  reason: string;
}

const statusConfig: Record<CertStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: CheckCircle2 },
  expiring: { label: 'Expiring Soon', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: AlertTriangle },
  expired: { label: 'Expired', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0', icon: Clock },
};



function getTimeRemaining(expiryDate: string, issueDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const total = expiry.getTime() - now.getTime();
  const issue = new Date(issueDate);
  const totalDuration = expiry.getTime() - issue.getTime();
  if (totalDuration <= 0) return 0;
  return Math.max(0, Math.min(100, (total / totalDuration) * 100));
}

export default function CertificationsPage() {
  const { t } = useI18n();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [recommendedCerts, setRecommendedCerts] = useState<RecommendedCert[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchCertifications() {
      try {
        const res = await fetch('/api/candidate/certifications');
        if (res.ok) {
          const data = await res.json();
          setCertifications(data.certifications || []);
          setRecommendedCerts(data.recommended || []);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchCertifications();
  }, []);

  const filteredCerts = activeTab === 'all'
    ? certifications
    : certifications.filter(c => {
        if (activeTab === 'active') return c.status === 'active';
        if (activeTab === 'expiring') return c.status === 'expiring';
        if (activeTab === 'expired') return c.status === 'expired';
        return true;
      });

  const activeCount = certifications.filter(c => c.status === 'active').length;
  const expiringCount = certifications.filter(c => c.status === 'expiring').length;
  const totalSkills = certifications.reduce((sum, c) => sum + c.skillsValidated, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.certifications.title}</h1>
            <p className="text-sm text-muted-foreground">{t.certifications.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.certifications.addCert}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.certifications.addCert}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.certifications.certName}</label>
                <Input placeholder={t.certifications.certNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.certifications.provider}</label>
                <Input placeholder={t.certifications.providerPlaceholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.certifications.issueDate}</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.certifications.expiryDate}</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.certifications.credentialId}</label>
                <Input placeholder={t.certifications.credentialIdPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.certifications.uploadBadge}</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">{t.certifications.uploadBadgeDesc}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.certifications.totalCerts}</p>
                <p className="text-xl font-bold">{certifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.certifications.activeCerts}</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.certifications.expiringSoon}</p>
                <p className="text-xl font-bold">{expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.certifications.skillsValidated}</p>
                <p className="text-xl font-bold">{totalSkills}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t.certifications.all}</TabsTrigger>
          <TabsTrigger value="active">{t.certifications.active}</TabsTrigger>
          <TabsTrigger value="expiring">{t.certifications.expiring}</TabsTrigger>
          <TabsTrigger value="expired">{t.certifications.expired}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Certification Cards Grid */}
          {filteredCerts.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No certifications found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add your first certification to showcase your credentials</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCerts.map((cert) => {
                const statusCfg = statusConfig[cert.status];
                const StatusIcon = statusCfg.icon;
                const ProviderIcon = cert.providerIcon;
                const timeRemaining = getTimeRemaining(cert.expiryDate, cert.issueDate);
                return (
                  <Card key={cert.id} className="border-border/50 hover:border-teal-200 dark:hover:border-teal-800 transition-colors animate-scale-in-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', cert.providerColor)}>
                          <ProviderIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold truncate">{cert.name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{cert.provider}</p>
                            </div>
                            <Badge className={cn('text-[10px] shrink-0', statusCfg.color)}>
                              <StatusIcon className="h-3 w-3 me-1" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span>{t.certifications.issued}: {cert.issueDate}</span>
                            <span>{t.certifications.expires}: {cert.expiryDate}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground">{t.certifications.timeRemaining}</span>
                              <span className="text-[10px] font-medium">{Math.round(timeRemaining)}%</span>
                            </div>
                            <Progress value={timeRemaining} className="h-1.5" />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] text-muted-foreground font-mono">{cert.credentialId}</span>
                            <div className="flex items-center gap-1.5">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-teal-600 dark:text-teal-400">
                                <ExternalLink className="h-3 w-3" />
                                {t.certifications.verify}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-emerald-600 dark:text-emerald-400">
                                <Share2 className="h-3 w-3" />
                                {t.certifications.share}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommended Certifications */}
      {recommendedCerts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.certifications.recommended}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedCerts.map((cert) => (
                <div key={cert.id} className="p-4 rounded-lg border border-border/50 hover:border-teal-200 dark:hover:border-teal-800 transition-colors bg-muted/10">
                  <div className={cn('inline-flex items-center justify-center h-8 w-8 rounded-lg mb-3', cert.providerColor)}>
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold">{cert.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{cert.provider}</p>
                  <p className="text-xs text-muted-foreground mt-2">{cert.reason}</p>
                  <Button size="sm" className="mt-3 h-7 text-xs bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 w-full">
                    {t.certifications.earnThis}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
