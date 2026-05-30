'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Plug,
  Hash,
  MessageSquare,
  Send,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Bell,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IntegrationConfig {
  enabled: boolean;
  webhookUrl: string;
  defaultChannel: string;
  connected: boolean;
}

interface EventConfig {
  applicationCreated: boolean;
  interviewScheduled: boolean;
  offerSent: boolean;
  offerAccepted: boolean;
  offerDeclined: boolean;
  candidateRejected: boolean;
  stageChanged: boolean;
  assessmentCompleted: boolean;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  channel: string;
  status: 'sent' | 'failed';
  platform: 'slack' | 'teams';
}

const defaultSlack: IntegrationConfig = {
  enabled: true,
  webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  defaultChannel: '#hiring',
  connected: true,
};

const defaultTeams: IntegrationConfig = {
  enabled: false,
  webhookUrl: process.env.TEAMS_WEBHOOK_URL || '',
  defaultChannel: '',
  connected: false,
};

const defaultEvents: EventConfig = {
  applicationCreated: true,
  interviewScheduled: true,
  offerSent: true,
  offerAccepted: true,
  offerDeclined: false,
  candidateRejected: false,
  stageChanged: true,
  assessmentCompleted: true,
};

const mockActivityLog: ActivityLogEntry[] = [
  { id: '1', timestamp: '2024-03-20T14:30:00Z', eventType: 'New Application Received', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '2', timestamp: '2024-03-20T13:15:00Z', eventType: 'Interview Scheduled', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '3', timestamp: '2024-03-20T11:00:00Z', eventType: 'Offer Sent', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '4', timestamp: '2024-03-19T16:45:00Z', eventType: 'Pipeline Stage Changed', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '5', timestamp: '2024-03-19T15:20:00Z', eventType: 'Assessment Completed', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '6', timestamp: '2024-03-19T10:00:00Z', eventType: 'Offer Accepted', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '7', timestamp: '2024-03-18T14:30:00Z', eventType: 'New Application Received', channel: '#hiring', status: 'failed', platform: 'slack' },
  { id: '8', timestamp: '2024-03-18T12:00:00Z', eventType: 'Interview Scheduled', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '9', timestamp: '2024-03-17T09:30:00Z', eventType: 'Offer Declined', channel: '#hiring', status: 'sent', platform: 'slack' },
  { id: '10', timestamp: '2024-03-17T08:00:00Z', eventType: 'Candidate Rejected', channel: '#hiring', status: 'sent', platform: 'slack' },
];

const eventKeys: { key: keyof EventConfig; labelKey: string; color: string }[] = [
  { key: 'applicationCreated', labelKey: 'eventApplicationCreated', color: 'teal' },
  { key: 'interviewScheduled', labelKey: 'eventInterviewScheduled', color: 'cyan' },
  { key: 'offerSent', labelKey: 'eventOfferSent', color: 'emerald' },
  { key: 'offerAccepted', labelKey: 'eventOfferAccepted', color: 'emerald' },
  { key: 'offerDeclined', labelKey: 'eventOfferDeclined', color: 'amber' },
  { key: 'candidateRejected', labelKey: 'eventCandidateRejected', color: 'red' },
  { key: 'stageChanged', labelKey: 'eventStageChanged', color: 'teal' },
  { key: 'assessmentCompleted', labelKey: 'eventAssessmentCompleted', color: 'teal' },
];

const samplePreviews = [
  {
    event: 'New Application Received',
    candidate: 'Alex Johnson',
    job: 'Senior Frontend Engineer',
    action: 'applied for',
    colorClass: 'border-l-teal-500',
    bgClass: 'bg-teal-50 dark:bg-teal-950/20',
  },
  {
    event: 'Interview Scheduled',
    candidate: 'Maria Garcia',
    job: 'Product Designer',
    action: 'interview scheduled for',
    colorClass: 'border-l-cyan-500',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
  {
    event: 'Offer Accepted',
    candidate: 'David Kim',
    job: 'DevOps Engineer',
    action: 'accepted the offer for',
    colorClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
];

export default function IntegrationsContent() {
  const { t } = useI18n();
  const it = t.integrations as Record<string, string>;

  const [slack, setSlack] = useState<IntegrationConfig>(defaultSlack);
  const [teams, setTeams] = useState<IntegrationConfig>(defaultTeams);
  const [events, setEvents] = useState<EventConfig>(defaultEvents);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingTeams, setTestingTeams] = useState(false);
  const [activityLog] = useState<ActivityLogEntry[]>(mockActivityLog);

  const handleTestConnection = async (platform: 'slack' | 'teams') => {
    const config = platform === 'slack' ? slack : teams;
    if (!config.webhookUrl) {
      toast.error(it.testFailed);
      return;
    }

    const setTesting = platform === 'slack' ? setTestingSlack : setTestingTeams;
    const setConfig = platform === 'slack' ? setSlack : setTeams;

    setTesting(true);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          webhookUrl: config.webhookUrl,
          channel: config.defaultChannel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({ ...prev, connected: true }));
        toast.success(it.testSent);
      } else {
        setConfig((prev) => ({ ...prev, connected: false }));
        toast.error(it.testFailed);
      }
    } catch {
      setConfig((prev) => ({ ...prev, connected: false }));
      toast.error(it.testFailed);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    toast.success(it.settingsSaved);
  };

  const handleToggleEvent = (key: keyof EventConfig) => {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{it.title}</h1>
            <p className="text-sm text-muted-foreground">{it.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={handleSave}
        >
          <Save className="h-4 w-4 me-2" />
          {it.saveSettings}
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slack Integration */}
        <Card className="border-border/50 card-hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A154B] text-white">
                  <Hash className="h-4 w-4" />
                </div>
                {it.slackIntegration}
              </CardTitle>
              <div className="flex items-center gap-2">
                {slack.connected ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 status-dot-green" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{it.connected}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 status-dot-red" />
                    <span className="text-[10px] text-red-500">{it.disconnected}</span>
                  </div>
                )}
                <Switch
                  checked={slack.enabled}
                  onCheckedChange={(checked) => setSlack((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </CardHeader>
          {slack.enabled && (
            <CardContent className="p-4 pt-0 space-y-3 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{it.webhookUrl}</label>
                <Input
                  value={slack.webhookUrl}
                  onChange={(e) => setSlack((prev) => ({ ...prev, webhookUrl: e.target.value, connected: false }))}
                  placeholder={it.webhookPlaceholder}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{it.defaultChannel}</label>
                <Input
                  value={slack.defaultChannel}
                  onChange={(e) => setSlack((prev) => ({ ...prev, defaultChannel: e.target.value }))}
                  placeholder={it.channelPlaceholder}
                  className="text-xs h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                onClick={() => handleTestConnection('slack')}
                disabled={testingSlack}
              >
                {testingSlack ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {testingSlack ? it.connecting : it.testConnection}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Teams Integration */}
        <Card className="border-border/50 card-hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6264A7] text-white">
                  <MessageSquare className="h-4 w-4" />
                </div>
                {it.teamsIntegration}
              </CardTitle>
              <div className="flex items-center gap-2">
                {teams.connected ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 status-dot-green" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{it.connected}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 status-dot-red" />
                    <span className="text-[10px] text-red-500">{it.disconnected}</span>
                  </div>
                )}
                <Switch
                  checked={teams.enabled}
                  onCheckedChange={(checked) => setTeams((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </CardHeader>
          {teams.enabled && (
            <CardContent className="p-4 pt-0 space-y-3 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{it.webhookUrl}</label>
                <Input
                  value={teams.webhookUrl}
                  onChange={(e) => setTeams((prev) => ({ ...prev, webhookUrl: e.target.value, connected: false }))}
                  placeholder={it.webhookPlaceholder}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{it.defaultChannel}</label>
                <Input
                  value={teams.defaultChannel}
                  onChange={(e) => setTeams((prev) => ({ ...prev, defaultChannel: e.target.value }))}
                  placeholder={it.channelPlaceholder}
                  className="text-xs h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                onClick={() => handleTestConnection('teams')}
                disabled={testingTeams}
              >
                {testingTeams ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {testingTeams ? it.connecting : it.testConnection}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Notifications */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {it.eventNotifications}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {eventKeys.map((evt) => (
                  <div
                    key={evt.key}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-lg border transition-all',
                      events[evt.key]
                        ? 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20'
                        : 'border-border/50 bg-muted/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          events[evt.key] ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      />
                      <span className="text-xs font-medium">{it[evt.labelKey]}</span>
                    </div>
                    <Switch
                      checked={events[evt.key]}
                      onCheckedChange={() => handleToggleEvent(evt.key)}
                      className="scale-90"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Preview */}
        <div>
          <Card className="border-border/50 card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {it.notificationPreview}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {samplePreviews.map((preview, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-lg border-l-4',
                    preview.colorClass,
                    preview.bgClass
                  )}
                >
                  <div className="text-[10px] font-bold text-muted-foreground mb-1">
                    {preview.event}
                  </div>
                  <div className="text-xs font-medium">
                    {preview.candidate} {preview.action} {preview.job}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/30">
                    {it.previewFooter}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Log */}
      <Card className="border-border/50 card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {it.activityLog}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.eventTime}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.eventType}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.eventChannel}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.eventStatus}</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {entry.platform === 'slack' ? (
                          <Hash className="h-3 w-3 text-[#4A154B]" />
                        ) : (
                          <MessageSquare className="h-3 w-3 text-[#6264A7]" />
                        )}
                        <span className="text-xs">{entry.eventType}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{entry.channel}</td>
                    <td className="p-3">
                      <Badge
                        className={cn(
                          'text-[10px] gap-1 border-0',
                          entry.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                        )}
                      >
                        {entry.status === 'sent' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {entry.status === 'sent' ? it.eventSent : it.eventFailed}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (mobile) */}
      <div className="lg:hidden">
        <Button
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={handleSave}
        >
          <Save className="h-4 w-4 me-2" />
          {it.saveSettings}
        </Button>
      </div>
    </div>
  );
}
