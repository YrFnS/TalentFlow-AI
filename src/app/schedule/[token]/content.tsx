// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SlotInfo {
  id: string;
  interviewerName: string;
  jobTitle: string;
  companyName: string;
  location: string;
  status: string;
  bookedBy: { name: string; email: string } | null;
}

interface AvailableSlot {
  id: string;
  token: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
}

type Step = 'select' | 'confirm' | 'done';

export default function ScheduleContent() {
  const { t } = useI18n();
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [step, setStep] = useState<Step>('select');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [booking, setBooking] = useState(false);

  // Date navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/self-schedule/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.selfScheduling.invalidToken);
        return;
      }
      const data = await res.json();
      setSlotInfo(data.slot);
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      setError(t.selfScheduling.invalidToken);
    } finally {
      setLoading(false);
    }
  }, [token, t.selfScheduling.invalidToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group available slots by date
  const slotsByDate = availableSlots.reduce(
    (groups, slot) => {
      const dateKey = new Date(slot.startTime).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
      return groups;
    },
    {} as Record<string, AvailableSlot[]>
  );

  // Get available dates for the calendar
  const availableDates = Object.keys(slotsByDate).sort();

  // Get slots for the currently selected date
  const currentDateKey = currentDate.toLocaleDateString('en-CA');
  const slotsForDate = slotsByDate[currentDateKey] || [];

  // Navigate to next available date
  const goToNextDate = () => {
    const currentIdx = availableDates.indexOf(currentDateKey);
    if (currentIdx < availableDates.length - 1) {
      setCurrentDate(new Date(availableDates[currentIdx + 1] + 'T12:00:00'));
    }
  };

  const goToPrevDate = () => {
    const currentIdx = availableDates.indexOf(currentDateKey);
    if (currentIdx > 0) {
      setCurrentDate(new Date(availableDates[currentIdx - 1] + 'T12:00:00'));
    }
  };

  const currentIdx = availableDates.indexOf(currentDateKey);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < availableDates.length - 1;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    if (!candidateName.trim()) {
      toast.error(t.selfScheduling.nameRequired);
      return;
    }
    if (!candidateEmail.trim()) {
      toast.error(t.selfScheduling.emailRequired);
      return;
    }

    setBooking(true);
    try {
      const res = await fetch('/api/interviews/self-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t.selfScheduling.bookingError);
        return;
      }

      toast.success(t.selfScheduling.bookingSuccess);
      setStep('done');
    } catch (err) {
      toast.error(t.selfScheduling.bookingError);
    } finally {
      setBooking(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error || !slotInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t.selfScheduling.invalidToken}</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Confirmation Step ────────────────────────────────────────
  if (step === 'done' && selectedSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-fade-in-up">
          <CardContent className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.selfScheduling.bookingConfirmed}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t.selfScheduling.bookingConfirmedDesc}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-border/50 p-4 text-start space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.selfScheduling.interviewDate}</p>
                  <p className="text-sm font-medium">{formatDate(selectedSlot.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.selfScheduling.interviewTime}</p>
                  <p className="text-sm font-medium">
                    {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)} ({selectedSlot.duration} {t.selfScheduling.minutes})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.selfScheduling.interviewerName}</p>
                  <p className="text-sm font-medium">{slotInfo.interviewerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.selfScheduling.companyName}</p>
                  <p className="text-sm font-medium">{slotInfo.companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.selfScheduling.location}</p>
                  <p className="text-sm font-medium">{slotInfo.location}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A confirmation email will be sent to <span className="font-medium">{candidateEmail}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Confirm Booking Step ─────────────────────────────────────
  if (step === 'confirm' && selectedSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-fade-in-up">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-fit -mt-2 -ms-2 text-teal-600" onClick={() => setStep('select')}>
              <ArrowLeft className="w-4 h-4 me-1" />{t.selfScheduling.backToSlots}
            </Button>
            <CardTitle className="text-xl">{t.selfScheduling.confirmBooking}</CardTitle>
            <CardDescription>
              {formatDate(selectedSlot.startTime)} · {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Booking summary */}
            <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-4 space-y-2 border border-teal-100 dark:border-teal-900/30">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{formatDate(selectedSlot.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)} ({selectedSlot.duration} {t.selfScheduling.minutes})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{slotInfo.interviewerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{slotInfo.companyName}</span>
              </div>
            </div>

            {/* Candidate info form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.selfScheduling.yourName} *</Label>
                <Input
                  placeholder={t.selfScheduling.enterName}
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.selfScheduling.yourEmail} *</Label>
                <Input
                  type="email"
                  placeholder={t.selfScheduling.enterEmail}
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              onClick={handleConfirmBooking}
              disabled={booking || !candidateName.trim() || !candidateEmail.trim()}
            >
              {booking ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 me-2" />}
              {t.selfScheduling.confirmBooking}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main: Slot Selection ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900">
      {/* Top branding bar */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">TalentFlow AI</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header card */}
        <Card className="border-teal-200 dark:border-teal-800/30 animate-fade-in-up">
          <CardContent className="p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">{t.selfScheduling.scheduleInterview}</h1>
            <p className="text-sm text-muted-foreground mb-4">{t.selfScheduling.scheduleDesc}</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium">{slotInfo.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30">
                <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">{slotInfo.interviewerName}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{slotInfo.companyName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date selector */}
        {availableDates.length > 0 ? (
          <Card className="animate-fade-in-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.selfScheduling.selectDate}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevDate} disabled={!hasPrev}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 min-w-[160px] text-center">
                    {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextDate} disabled={!hasNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Date chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
                {availableDates.map((dateStr) => {
                  const date = new Date(dateStr + 'T12:00:00');
                  const isActive = dateStr === currentDateKey;
                  const slotsCount = slotsByDate[dateStr]?.length || 0;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setCurrentDate(date)}
                      className={cn(
                        'flex-shrink-0 px-4 py-3 rounded-lg border text-center transition-all duration-200 min-w-[80px]',
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'bg-white dark:bg-gray-800/50 border-border/50 hover:border-teal-300 dark:hover:border-teal-700'
                      )}
                    >
                      <p className={cn('text-xs font-medium', isActive ? 'text-teal-100' : 'text-muted-foreground')}>
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </p>
                      <p className={cn('text-lg font-bold', isActive ? 'text-white' : '')}>{date.getDate()}</p>
                      <p className={cn('text-[10px]', isActive ? 'text-teal-100' : 'text-muted-foreground')}>
                        {slotsCount} {slotsCount === 1 ? 'slot' : 'slots'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <div>
                <h3 className="text-sm font-semibold mb-3">{t.selfScheduling.availableTimes}</h3>
                {slotsForDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t.selfScheduling.noSlotsAvailable}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slotsForDate.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            'p-4 rounded-lg border-2 text-center transition-all duration-200 animate-fade-in-up',
                            isSelected
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-md'
                              : 'border-border/50 bg-white dark:bg-gray-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm'
                          )}
                        >
                          <p className={cn('text-base font-bold', isSelected ? 'text-teal-700 dark:text-teal-400' : '')}>
                            {formatTime(slot.startTime)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {slot.duration} {t.selfScheduling.minutes}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Continue button */}
              {selectedSlot && (
                <div className="mt-6 animate-fade-in-up">
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11"
                    onClick={() => setStep('confirm')}
                  >
                    {t.selfScheduling.confirmBooking}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">{t.selfScheduling.noSlotsAvailable}</h3>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 dark:bg-gray-900/50 mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-teal-500" />
            Powered by TalentFlow AI
          </p>
        </div>
      </footer>
    </div>
  );
}

// Briefcase icon for job title (not imported from lucide, using a simple one)
function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
