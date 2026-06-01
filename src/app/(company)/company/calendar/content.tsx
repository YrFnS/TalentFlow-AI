// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  Phone,
  Bell,
  FileText,
  AlertCircle,
  CheckSquare,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EventType = 'Interview' | 'Meeting' | 'Call' | 'Deadline' | 'Reminder' | 'Other';
type ViewMode = 'month' | 'week';

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  allDay: boolean;
  location: string;
  meetingLink: string;
  reminder: number; // minutes before
  color: string;
  applicationId: string | null;
  applicationName: string | null;
}

const eventTypeColors: Record<EventType, { bg: string; text: string; icon: React.ElementType }> = {
  Interview: { bg: 'bg-teal-100', text: 'text-blue-700', icon: Video },
  Meeting: { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700', icon: CalendarIcon },
  Call: { bg: 'bg-cyan-100 dark:bg-cyan-950/50', text: 'text-cyan-700', icon: Phone },
  Deadline: { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700', icon: AlertCircle },
  Reminder: { bg: 'bg-rose-100 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-400', icon: Bell },
  Other: { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400', icon: MoreHorizontal },
};

const presetColors = [
  { name: 'Teal', value: '#0d9488' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
];

function getNow() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const initialEvents: CalendarEvent[] = [];

export default function CalendarContent() {
  const { t } = useI18n();
  const { year: nowYear, month: nowMonth, day: nowDay } = getNow();

  const [currentYear, setCurrentYear] = useState(nowYear);
  const [currentMonth, setCurrentMonth] = useState(nowMonth);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Create event form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('Meeting');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formReminder, setFormReminder] = useState('15');
  const [formColor, setFormColor] = useState('#0d9488');
  const [formApplication, setFormApplication] = useState('none');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = formatDateStr(nowYear, nowMonth, nowDay);

  const dayKeys = [t.calendar.sunday, t.calendar.monday, t.calendar.tuesday, t.calendar.wednesday, t.calendar.thursday, t.calendar.friday, t.calendar.saturday];

  const monthNames = useMemo(() => {
    const months: string[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(2025, m, 1);
      months.push(d.toLocaleDateString('en-US', { month: 'long' }));
    }
    return months;
  }, []);

  const eventsForDate = (dateStr: string) => initialEvents.filter(e => e.date === dateStr);

  const upcomingEvents = useMemo(() => {
    const today = new Date(nowYear, nowMonth, nowDay);
    const next7 = new Date(today);
    next7.setDate(next7.getDate() + 7);
    return initialEvents
      .filter(e => {
        const ed = new Date(e.date);
        return ed >= today && ed <= next7;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [nowYear, nowMonth, nowDay]);

  // Week view calculation
  const weekDays = useMemo(() => {
    const today = new Date(nowYear, nowMonth, nowDay);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        date: d,
        dateStr: formatDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
        dayName: dayKeys[i],
        dayNum: d.getDate(),
        isToday: formatDateStr(d.getFullYear(), d.getMonth(), d.getDate()) === todayStr,
      };
    });
  }, [nowYear, nowMonth, nowDay, weekOffset, dayKeys, todayStr]);

  const goToPrevious = () => {
    if (viewMode === 'month') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
      else { setCurrentMonth(currentMonth - 1); }
    } else {
      setWeekOffset(weekOffset - 1);
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
      else { setCurrentMonth(currentMonth + 1); }
    } else {
      setWeekOffset(weekOffset + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(nowYear);
    setCurrentMonth(nowMonth);
    setWeekOffset(0);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const openCreateDialog = (dateStr?: string) => {
    setFormTitle('');
    setFormType('Meeting');
    setFormDate(dateStr || todayStr);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormAllDay(false);
    setFormLocation('');
    setFormMeetingLink('');
    setFormReminder('15');
    setFormColor('#0d9488');
    setFormApplication('none');
    setCreateDialogOpen(true);
  };

  const selectedDateEvents = selectedDate ? eventsForDate(selectedDate) : [];

  // Calendar grid cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const formatTime12 = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.calendar.title}</h1>
            <p className="text-sm text-muted-foreground">{t.calendar.subtitle}</p>
          </div>
        </div>
        <Button onClick={() => openCreateDialog()} className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
          <Plus className="h-4 w-4 me-2" />
          {t.calendar.createEvent}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Navigation */}
          <Card className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
                    {t.calendar.today}
                  </Button>
                </div>
                <h2 className="text-lg font-semibold">
                  {viewMode === 'month'
                    ? `${monthNames[currentMonth]} ${currentYear}`
                    : `${weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </h2>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('month')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      viewMode === 'month' ? 'bg-gradient-to-r bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.calendar.monthView}
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      viewMode === 'week' ? 'bg-gradient-to-r bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.calendar.weekView}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Month View */}
          {viewMode === 'month' && (
            <Card className="border-border/50">
              <CardContent className="p-2 sm:p-3">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {dayKeys.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px">
                  {calendarCells.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-muted/20 rounded" />;
                    }
                    const dateStr = formatDateStr(currentYear, currentMonth, day);
                    const isToday = dateStr === todayStr;
                    const dayEvents = eventsForDate(dateStr);
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(dateStr)}
                        className={cn(
                          'min-h-[80px] sm:min-h-[100px] p-1.5 rounded text-start transition-colors relative group',
                          isSelected ? 'bg-slate-50 ring-1 ring-blue-500' : 'hover:bg-muted/30',
                          isToday && !isSelected && 'bg-slate-50/30 dark:bg-teal-950/10'
                        )}
                      >
                        <span className={cn(
                          'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                          isToday ? 'bg-slate-500 text-white ring-2 ring-teal-300' : 'text-foreground'
                        )}>
                          {day}
                        </span>
                        <div className="mt-0.5 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(evt => {
                            const typeCfg = eventTypeColors[evt.type];
                            return (
                              <div
                                key={evt.id}
                                className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate"
                                style={{ backgroundColor: evt.color + '20', color: evt.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                                <span className="truncate">{evt.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <Card className="border-border/50">
              <CardContent className="p-2 sm:p-3">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((wd) => {
                    const dayEvents = eventsForDate(wd.dateStr);
                    return (
                      <div key={wd.dateStr} className="space-y-2">
                        <div className={cn(
                          'text-center py-2 rounded-lg',
                          wd.isToday ? 'bg-slate-50' : ''
                        )}>
                          <div className="text-xs text-muted-foreground">{wd.dayName}</div>
                          <div className={cn(
                            'text-lg font-bold',
                            wd.isToday ? 'text-blue-600' : ''
                          )}>{wd.dayNum}</div>
                        </div>
                        {dayEvents.length > 0 ? dayEvents.map(evt => {
                          const typeCfg = eventTypeColors[evt.type];
                          const TypeIcon = typeCfg.icon;
                          return (
                            <button
                              key={evt.id}
                              onClick={() => setDetailEvent(evt)}
                              className="w-full text-start rounded-lg p-2 transition-shadow hover:shadow-md animate-fade-in-up"
                              style={{ backgroundColor: evt.color + '15', borderLeft: `3px solid ${evt.color}` }}
                            >
                              <div className="text-[10px] font-medium mb-0.5" style={{ color: evt.color }}>
                                <TypeIcon className="h-3 w-3 inline me-1" />
                                {evt.type}
                              </div>
                              <div className="text-xs font-semibold truncate">{evt.title}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {evt.allDay ? t.calendar.allDay : formatTime12(evt.startTime)}
                              </div>
                            </button>
                          );
                        }) : (
                          <div className="text-xs text-muted-foreground text-center py-4">{t.calendar.noEvents}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Day Events */}
          {selectedDate && viewMode === 'month' && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {t.calendar.eventsFor} {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateEvents.map(evt => {
                      const typeCfg = eventTypeColors[evt.type];
                      const TypeIcon = typeCfg.icon;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => setDetailEvent(evt)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors text-start"
                        >
                          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', typeCfg.bg)}>
                            <TypeIcon className={cn('h-4 w-4', typeCfg.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{evt.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {evt.allDay ? t.calendar.allDay : `${formatTime12(evt.startTime)} - ${formatTime12(evt.endTime)}`}
                              {evt.location && ` · ${evt.location}`}
                            </div>
                          </div>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.calendar.noEventsForDay}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                {t.calendar.upcomingEvents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                  {upcomingEvents.map(evt => {
                    const typeCfg = eventTypeColors[evt.type];
                    const TypeIcon = typeCfg.icon;
                    return (
                      <button
                        key={evt.id}
                        onClick={() => setDetailEvent(evt)}
                        className="w-full text-start p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors animate-fade-in-up"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className={cn('h-3.5 w-3.5', typeCfg.text)} />
                          <span className="text-[10px] font-medium" style={{ color: evt.color }}>{evt.type}</span>
                        </div>
                        <div className="text-xs font-semibold truncate">{evt.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{evt.allDay ? t.calendar.allDay : formatTime12(evt.startTime)}</span>
                          {evt.location && (
                            <>
                              <MapPin className="h-3 w-3 ms-1" />
                              <span className="truncate">{evt.location}</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t.calendar.noEvents}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(open) => { if (!open) setDetailEvent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailEvent && (() => {
                const typeCfg = eventTypeColors[detailEvent.type];
                const TypeIcon = typeCfg.icon;
                return <TypeIcon className={cn('h-5 w-5', typeCfg.text)} />;
              })()}
              {t.calendar.eventDetails}
            </DialogTitle>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-4 py-2">
              <div>
                <h3 className="text-lg font-bold">{detailEvent.title}</h3>
                <Badge className="mt-1" style={{ backgroundColor: detailEvent.color + '20', color: detailEvent.color, border: 'none' }}>
                  {detailEvent.type}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <span>{new Date(detailEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {!detailEvent.allDay && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{formatTime12(detailEvent.startTime)} - {formatTime12(detailEvent.endTime)}</span>
                  </div>
                )}
                {detailEvent.allDay && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{t.calendar.allDay}</span>
                  </div>
                )}
                {detailEvent.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>{detailEvent.location}</span>
                  </div>
                )}
                {detailEvent.meetingLink && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Video className="h-4 w-4 text-blue-600" />
                    <a href={detailEvent.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center gap-1">
                      {detailEvent.meetingLink}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {detailEvent.applicationName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{t.calendar.relatedApplication}: {detailEvent.applicationName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  {t.calendar.editEvent}
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700 border-red-200 dark:border-red-900">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.calendar.deleteEvent}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.calendar.createEvent}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.eventTitle}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t.calendar.eventTitlePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.eventType}</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as EventType)}>
                <SelectTrigger><SelectValue placeholder={t.calendar.selectType} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interview">{t.calendar.typeInterview}</SelectItem>
                  <SelectItem value="Meeting">{t.calendar.typeMeeting}</SelectItem>
                  <SelectItem value="Call">{t.calendar.typeCall}</SelectItem>
                  <SelectItem value="Deadline">{t.calendar.typeDeadline}</SelectItem>
                  <SelectItem value="Reminder">{t.calendar.typeReminder}</SelectItem>
                  <SelectItem value="Other">{t.calendar.typeOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.date}</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.calendar.startTime}</Label>
                <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} disabled={formAllDay} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.calendar.endTime}</Label>
                <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} disabled={formAllDay} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formAllDay}
                onChange={(e) => setFormAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="allDay" className="text-sm font-medium cursor-pointer">{t.calendar.allDay}</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.location}</Label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder={t.calendar.locationPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.meetingLink}</Label>
              <Input value={formMeetingLink} onChange={(e) => setFormMeetingLink(e.target.value)} placeholder={t.calendar.meetingLinkPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.reminder}</Label>
              <Select value={formReminder} onValueChange={setFormReminder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t.calendar.reminderNone}</SelectItem>
                  <SelectItem value="5">{t.calendar.reminder5}</SelectItem>
                  <SelectItem value="10">{t.calendar.reminder10}</SelectItem>
                  <SelectItem value="15">{t.calendar.reminder15}</SelectItem>
                  <SelectItem value="30">{t.calendar.reminder30}</SelectItem>
                  <SelectItem value="60">{t.calendar.reminder60}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.color}</Label>
              <div className="flex items-center gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFormColor(c.value)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all',
                      formColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.calendar.linkApplication}</Label>
              <Select value={formApplication} onValueChange={setFormApplication}>
                <SelectTrigger><SelectValue placeholder={t.calendar.selectApplication} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.calendar.noApplication}</SelectItem>
                  <SelectItem value="APP-001">Alex Johnson → Sr. Frontend Engineer</SelectItem>
                  <SelectItem value="APP-002">Maria Garcia → Product Designer</SelectItem>
                  <SelectItem value="APP-003">David Kim → DevOps Engineer</SelectItem>
                  <SelectItem value="APP-004">Priya Sharma → Data Analyst</SelectItem>
                  <SelectItem value="APP-005">Tom Anderson → Sales Manager</SelectItem>
                  <SelectItem value="APP-006">Sarah Chen → ML Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
