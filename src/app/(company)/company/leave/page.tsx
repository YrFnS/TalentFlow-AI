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
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Heart,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type LeaveType = 'annual' | 'sick' | 'personal';
type LeaveStatus = 'approved' | 'pending' | 'rejected';

interface LeaveEntry {
  id: string;
  employee: string;
  avatar: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
}

const leaveTypeConfig: Record<LeaveType, { label: string; color: string; icon: React.ElementType }> = {
  annual: { label: 'Annual Leave', color: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0', icon: Sun },
  sick: { label: 'Sick Leave', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0', icon: Heart },
  personal: { label: 'Personal Leave', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950 border-0', icon: User },
};

const statusConfig: Record<LeaveStatus, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 dark:bg-red-950 border-0', icon: XCircle },
};

const leaves: LeaveEntry[] = [];

// Calendar helper
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function LeavePage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0); // January 2024
  const currentYear = 2024;

  const calendarDays = getCalendarDays(currentYear, currentMonth);
  const monthNames = [
    t.leave.january, t.leave.february, t.leave.march, t.leave.april,
    t.leave.may, t.leave.june, t.leave.july, t.leave.august,
    t.leave.september, t.leave.october, t.leave.november, t.leave.december,
  ];

  // Get leaves for the current calendar month
  const leaveDates: Record<string, { type: LeaveType; status: LeaveStatus }[]> = {};
  leaves.forEach((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!leaveDates[key]) leaveDates[key] = [];
      leaveDates[key].push({ type: leave.type, status: leave.status });
    }
  });

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const historyLeaves = leaves.filter((l) => l.status !== 'pending');

  const leaveBalances = [
    { label: t.leave.annualLeave, used: 0, total: 0, icon: Sun, color: 'bg-blue-600' },
    { label: t.leave.sickLeave, used: 0, total: 0, icon: Heart, color: 'from-rose-500 to-pink-600' },
    { label: t.leave.personalLeave, used: 0, total: 0, icon: User, color: 'from-violet-500 to-purple-600' },
    { label: t.leave.totalUsed, used: 0, total: 0, icon: Calendar, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.leave.title}</h1>
            <p className="text-sm text-muted-foreground">{t.leave.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.leave.requestLeave}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.leave.requestLeave}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.leave.leaveType}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.leave.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">{t.leave.annualLeave}</SelectItem>
                    <SelectItem value="sick">{t.leave.sickLeave}</SelectItem>
                    <SelectItem value="personal">{t.leave.personalLeave}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.leave.startDate}</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.leave.endDate}</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.leave.reason}</label>
                <Input placeholder={t.leave.reasonPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.leave.attachment}</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">{t.leave.attachmentPlaceholder}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.leave.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.leave.submitRequest}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalances.map((bal) => (
          <Card key={bal.label} className="border-border/50 ">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white', bal.color)}>
                  <bal.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{bal.label}</p>
                  <p className="text-xl font-bold">{bal.used}<span className="text-sm text-muted-foreground font-normal">/{bal.total}</span></p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(bal.used / bal.total) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{monthNames[currentMonth]} {currentYear}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {DAYS.map((day) => (
                <div key={day} className="text-[10px] font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="h-8" />;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const leaves = leaveDates[dateStr] || [];
                const hasApproved = leaves.some((l) => l.status === 'approved');
                const hasPending = leaves.some((l) => l.status === 'pending');
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'h-8 flex flex-col items-center justify-center rounded-md text-xs relative',
                      hasApproved && 'bg-teal-100 text-blue-700',
                      hasPending && 'bg-amber-100 dark:bg-amber-950/50 text-amber-700',
                      !hasApproved && !hasPending && 'hover:bg-muted/50',
                    )}
                  >
                    {day}
                    {leaves.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {leaves.slice(0, 2).map((l, li) => (
                          <div
                            key={li}
                            className={cn(
                              'w-1 h-1 rounded-full',
                              l.status === 'approved' && 'bg-slate-500',
                              l.status === 'pending' && 'bg-amber-500',
                              l.status === 'rejected' && 'bg-red-500',
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-[10px] text-muted-foreground">{t.leave.approved}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] text-muted-foreground">{t.leave.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                {t.leave.pendingRequests} ({pendingLeaves.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t.leave.noPendingRequests}</p>
              ) : (
                pendingLeaves.map((leave) => {
                  const typeCfg = leaveTypeConfig[leave.type];
                  const TypeIcon = typeCfg.icon;
                  return (
                    <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                          {leave.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{leave.employee}</span>
                          <Badge className={cn('text-[10px]', typeCfg.color)}>
                            <TypeIcon className="h-3 w-3 me-1" />
                            {typeCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {leave.startDate} — {leave.endDate} &middot; {leave.days} {t.leave.days}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950/30">
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          {t.leave.approve}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30">
                          <XCircle className="h-3 w-3 me-1" />
                          {t.leave.reject}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t.leave.leaveHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.leave.employee}</TableHead>
                    <TableHead className="text-xs">{t.leave.type}</TableHead>
                    <TableHead className="text-xs">{t.leave.dates}</TableHead>
                    <TableHead className="text-xs">{t.leave.daysCount}</TableHead>
                    <TableHead className="text-xs">{t.leave.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLeaves.map((leave) => {
                    const typeCfg = leaveTypeConfig[leave.type];
                    const sCfg = statusConfig[leave.status];
                    const StatusIcon = sCfg.icon;
                    const TypeIcon = typeCfg.icon;
                    return (
                      <TableRow key={leave.id}>
                        <TableCell className="text-sm py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-600 text-white text-[8px]">
                                {leave.avatar}
                              </AvatarFallback>
                            </Avatar>
                            {leave.employee}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-2">
                          <Badge className={cn('text-[10px]', typeCfg.color)}>
                            <TypeIcon className="h-3 w-3 me-1" />
                            {typeCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {leave.startDate} — {leave.endDate}
                        </TableCell>
                        <TableCell className="text-sm py-2">{leave.days}</TableCell>
                        <TableCell className="py-2">
                          <Badge className={cn('text-[10px]', sCfg.color)}>
                            <StatusIcon className="h-3 w-3 me-1" />
                            {sCfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
