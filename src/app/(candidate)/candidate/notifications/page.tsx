// @ts-nocheck
'use client'

import React, { useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  info: {
    bg: 'bg-slate-50',
    text: 'text-blue-600',
    border: 'border-s-teal-300 dark:border-s-teal-700',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-600',
    border: 'border-s-emerald-300 dark:border-s-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-600',
    border: 'border-s-amber-300 dark:border-s-amber-700',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-600',
    border: 'border-s-red-300 dark:border-s-red-700',
  },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      userId: 'demo',
      title: 'Interview Scheduled',
      message: 'Your interview for Senior Developer at TechCorp is tomorrow at 10:00 AM',
      type: 'success',
      link: '/candidate/applications',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n2',
      userId: 'demo',
      title: 'Application Update',
      message: 'Your application for Product Manager at DesignStudio moved to Screening stage',
      type: 'info',
      link: '/candidate/applications',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n3',
      userId: 'demo',
      title: 'New Job Match',
      message: '3 new jobs match your profile — check them out before they close!',
      type: 'info',
      link: '/candidate/explore',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n4',
      userId: 'demo',
      title: 'Offer Received!',
      message: 'Congratulations! CloudScale has sent you an offer for DevOps Engineer',
      type: 'success',
      link: '/candidate/applications',
      isRead: false,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n5',
      userId: 'demo',
      title: 'Interview Reminder',
      message: 'Reminder: You have a video interview with InnovateCo in 2 hours',
      type: 'warning',
      link: '/candidate/applications',
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n6',
      userId: 'demo',
      title: 'Application Rejected',
      message: 'Your application for UX Researcher at UserFirst was not selected this time',
      type: 'error',
      link: '/candidate/applications',
      isRead: true,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n7',
      userId: 'demo',
      title: 'Profile Views Increase',
      message: 'Your profile was viewed 12 times this week — a 40% increase!',
      type: 'info',
      link: '/candidate/profile',
      isRead: true,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n8',
      userId: 'demo',
      title: 'System Maintenance',
      message: 'Platform maintenance scheduled for Saturday 2:00 AM — 4:00 AM UTC',
      type: 'warning',
      link: null,
      isRead: true,
      createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return !n.isRead;
      case 'applications':
        return n.type === 'info' || n.type === 'success' || n.type === 'error';
      case 'interviews':
        return n.title.toLowerCase().includes('interview');
      case 'system':
        return n.type === 'warning' && !n.title.toLowerCase().includes('interview');
      default:
        return true;
    }
  });

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true, userId: 'demo' }),
    }).catch(() => {});
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    fetch(`/api/notifications?id=${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const EmptyState = () => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-12 text-center">
        <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">{t.common.noResults}</h3>
        <p className="mt-1 text-sm text-muted-foreground">No notifications in this category</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-500" />
            {t.common.notificationsCenter}
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-slate-50 hover:text-blue-700 hover:border-slate-200 dark:hover:bg-teal-950 dark:hover:text-blue-400 dark:hover:border-teal-800"
          >
            <CheckCheck className="h-4 w-4" />
            {t.common.markAllRead}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5">
            {t.common.all}
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            {t.common.unread}
            {unreadCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] bg-slate-500 text-white border-0">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications">
            {t.common.applications}
          </TabsTrigger>
          <TabsTrigger value="interviews">
            {t.common.interviews}
          </TabsTrigger>
          <TabsTrigger value="system">
            {t.common.system}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = iconMap[notification.type] || Info;
                const colors = colorMap[notification.type] || colorMap.info;

                return (
                  <Card
                    key={notification.id}
                    className={`group border-0 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer border-s-4 ${colors.border} ${
                      !notification.isRead ? 'bg-accent/30' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
                          <Icon className={`h-5 w-5 ${colors.text}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{notification.title}</h3>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notification.createdAt)}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                                  Read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 me-1" />
                                Delete
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

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <span>{notifications.length} total notifications</span>
        <span>{unreadCount} unread</span>
      </div>
    </div>
  );
}
