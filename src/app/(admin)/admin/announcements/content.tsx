// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Plus,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AnnouncementType = 'system' | 'update' | 'maintenance' | 'critical';
type AnnouncementStatus = 'active' | 'expired' | 'draft';
type Audience = 'all' | 'users' | 'companies' | 'admins';
type FilterTab = 'all' | 'active' | 'draft' | 'expired';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  audience: Audience;
  status: AnnouncementStatus;
  date: string;
  priority: boolean;
}

// No mock data - announcements come from user creation only

const typeConfig: Record<AnnouncementType, { icon: React.ElementType; color: string; bg: string }> = {
  system: { icon: Info, color: 'text-blue-700', bg: 'bg-slate-50' },
  update: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  maintenance: { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  critical: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-950/30' },
};

const statusConfig: Record<AnnouncementStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' },
  draft: { label: 'Draft', color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-0' },
  expired: { label: 'Expired', color: 'bg-red-50 text-red-700 dark:bg-red-950 border-0' },
};

const audienceConfig: Record<Audience, { label: string; icon: React.ElementType }> = {
  all: { label: 'All', icon: Users },
  users: { label: 'Users', icon: Users },
  companies: { label: 'Companies', icon: Shield },
  admins: { label: 'Admins', icon: Shield },
};

export default function AnnouncementsPage() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<AnnouncementType>('system');
  const [newAudience, setNewAudience] = useState<Audience>('all');
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newPriority, setNewPriority] = useState(false);

  const filtered = filterTab === 'all'
    ? announcements
    : announcements.filter((a) => a.status === filterTab);

  const counts = {
    all: announcements.length,
    active: announcements.filter((a) => a.status === 'active').length,
    draft: announcements.filter((a) => a.status === 'draft').length,
    expired: announcements.filter((a) => a.status === 'expired').length,
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      audience: newAudience,
      status: 'active',
      date: newScheduleDate || new Date().toISOString().split('T')[0],
      priority: newPriority,
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setNewTitle('');
    setNewMessage('');
    setNewType('system');
    setNewAudience('all');
    setNewScheduleDate('');
    setNewPriority(false);
    setCreateOpen(false);
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `${t.announcements.all} (${counts.all})` },
    { key: 'active', label: `${t.announcements.active} (${counts.active})` },
    { key: 'draft', label: `${t.announcements.draft} (${counts.draft})` },
    { key: 'expired', label: `${t.announcements.expired} (${counts.expired})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.announcements.title}</h1>
            <p className="text-sm text-muted-foreground">{t.announcements.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 me-2" />
          {t.announcements.create}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              filterTab === tab.key
                ? 'bg-slate-50 text-blue-700'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">{t.announcements.noAnnouncements}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((announcement) => {
            const typeCfg = typeConfig[announcement.type];
            const statusCfg = statusConfig[announcement.status];
            const audienceCfg = audienceConfig[announcement.audience];
            const TypeIcon = typeCfg.icon;
            const AudienceIcon = audienceCfg.icon;

            return (
              <Card key={announcement.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', typeCfg.bg)}>
                      <TypeIcon className={cn('h-5 w-5', typeCfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            {announcement.title}
                            {announcement.priority && (
                              <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Priority</Badge>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {announcement.message}
                          </p>
                        </div>
                        <Badge className={cn('text-[10px] shrink-0', statusCfg.color)}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className={cn('text-[10px]', typeCfg.color, typeCfg.bg, 'border-0')}>
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AudienceIcon className="h-3 w-3" />
                          {audienceCfg.label}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {announcement.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              {t.announcements.create}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.announcements.titleLabel}</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t.announcements.titlePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.announcements.messageLabel}</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t.announcements.messagePlaceholder}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.announcements.typeLabel}</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as AnnouncementType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">{t.announcements.typeSystem}</SelectItem>
                    <SelectItem value="update">{t.announcements.typeUpdate}</SelectItem>
                    <SelectItem value="maintenance">{t.announcements.typeMaintenance}</SelectItem>
                    <SelectItem value="critical">{t.announcements.typeCritical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.announcements.audienceLabel}</Label>
                <Select value={newAudience} onValueChange={(v) => setNewAudience(v as Audience)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.announcements.audienceAll}</SelectItem>
                    <SelectItem value="users">{t.announcements.audienceUsers}</SelectItem>
                    <SelectItem value="companies">{t.announcements.audienceCompanies}</SelectItem>
                    <SelectItem value="admins">{t.announcements.audienceAdmins}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.announcements.scheduleLabel}</Label>
              <Input
                type="date"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewPriority(!newPriority)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  newPriority ? 'bg-blue-600' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    newPriority ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <Label className="text-sm">{t.announcements.priorityLabel}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-gradient-to-r bg-blue-600 text-white"
              onClick={handleCreate}
              disabled={!newTitle.trim() || !newMessage.trim()}
            >
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
