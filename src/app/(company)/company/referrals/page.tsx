// @ts-nocheck
'use client';

import React, { useState } from 'react';
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
import {
  Gift,
  Plus,
  DollarSign,
  Users,
  Clock,
  Trophy,
  UserCheck,
  AlertCircle,
  FileText,
  Upload,
  Star,
  TrendingUp,
  ShieldCheck,
  Ban,
  Infinity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ReferralStatus = 'Submitted' | 'Screening' | 'Interviewed' | 'Offered' | 'Hired' | 'Rejected';
type BonusStatus = 'Pending' | 'Paid' | 'Not Eligible';

interface Referral {
  id: string;
  candidateName: string;
  referredBy: string;
  referredByInitials: string;
  role: string;
  department: string;
  date: string;
  status: ReferralStatus;
  bonusStatus: BonusStatus;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  successfulHires: number;
  bonusEarned: string;
}

const statusColors: Record<ReferralStatus, string> = {
  Submitted: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0',
  Screening: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  Interviewed: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Offered: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Hired: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Rejected: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

const bonusColors: Record<BonusStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  'Not Eligible': 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0',
};

const referrals: Referral[] = [];

const leaderboard: LeaderboardEntry[] = [];

const programRules = [
  { icon: DollarSign, title: '$500 Bonus Per Hire', description: 'Earn a $500 bonus for every successful referral that results in a hire.' },
  { icon: ShieldCheck, title: '90+ Days Employment', description: 'The referred candidate must be employed for at least 90 days to qualify.' },
  { icon: Ban, title: 'No Self-Referrals', description: 'You cannot refer yourself or a previous employee within 6 months.' },
  { icon: Infinity, title: 'Unlimited Referrals', description: 'There is no limit on the number of candidates you can refer.' },
];

const allStatuses: ReferralStatus[] = ['Submitted', 'Screening', 'Interviewed', 'Offered', 'Hired', 'Rejected'];

export default function ReferralsPage() {
  const { t } = useI18n();
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredReferrals = filterStatus === 'all'
    ? referrals
    : referrals.filter(r => r.status === filterStatus);

  const totalReferrals = referrals.length;
  const hiredCount = referrals.filter(r => r.status === 'Hired').length;
  const pendingCount = referrals.filter(r => ['Submitted', 'Screening', 'Interviewed', 'Offered'].includes(r.status)).length;
  const bonusEarned = '$0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.referrals.title}</h1>
            <p className="text-sm text-muted-foreground">{t.referrals.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.referrals.referCandidate}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.referrals.referCandidate}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.referrals.candidateName}</label>
                <Input placeholder={t.referrals.candidateNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.referrals.candidateEmail}</label>
                <Input type="email" placeholder={t.referrals.candidateEmailPlaceholder} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.referrals.role}</label>
                  <Input placeholder={t.referrals.rolePlaceholder} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.referrals.department}</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t.referrals.selectDepartment} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Data">Data</SelectItem>
                      <SelectItem value="People">People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.referrals.notes}</label>
                <Input placeholder={t.referrals.notesPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.referrals.resumeUpload}</label>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">{t.referrals.dragDrop}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.referrals.submitReferral}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.referrals.totalReferrals}</p>
                <p className="text-xl font-bold">{totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.referrals.hiredViaReferral}</p>
                <p className="text-xl font-bold">{hiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.referrals.pending}</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-blue-600">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.referrals.bonusEarned}</p>
                <p className="text-xl font-bold">{bonusEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Rules */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-blue-600" />
            {t.referrals.programRules}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {programRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-blue-600">
                  <rule.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold">{rule.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              {t.referrals.activeReferrals}
            </CardTitle>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReferralStatus | 'all')}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={t.referrals.filterStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.referrals.allStatuses}</SelectItem>
                {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.candidateName}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.referredBy}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.role}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.date}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.status}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.referrals.bonusStatus}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <span className="text-sm font-medium">{ref.candidateName}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-600 text-white text-[8px]">
                            {ref.referredByInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{ref.referredBy}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{ref.role}</span>
                      <span className="text-[10px] text-muted-foreground block">{ref.department}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{ref.date}</span>
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', statusColors[ref.status])}>
                        {ref.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', bonusColors[ref.bonusStatus])}>
                        {ref.bonusStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredReferrals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.referrals.noReferrals}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t.referrals.leaderboard}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-border/30 transition-all hover:shadow-sm',
                  index === 0 && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50',
                  index === 1 && 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/50',
                  index === 2 && 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/50',
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  index === 0 && 'bg-amber-100 text-amber-700 dark:bg-amber-900',
                  index === 1 && 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                  index === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                  index > 2 && 'bg-muted text-muted-foreground',
                )}>
                  {index === 0 ? <Star className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                    {entry.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{entry.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{entry.successfulHires} {t.referrals.successfulHires}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">{entry.bonusEarned}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
