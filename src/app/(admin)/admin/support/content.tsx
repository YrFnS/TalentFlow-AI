'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LifeBuoy,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Category = 'Technical' | 'Billing' | 'Account' | 'Feature Request' | 'Bug Report';

interface Ticket {
  id: string;
  title: string;
  description: string;
  reporter: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  createdDate: string;
  lastUpdate: string;
}

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Open', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-0', icon: XCircle },
};

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-0', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-0', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border-0', dot: 'bg-amber-500' },
  critical: { label: 'Critical', color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-0', dot: 'bg-red-500' },
};

const categoryConfig: Record<Category, string> = {
  Technical: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  Billing: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Account: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0',
  'Feature Request': 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-0',
  'Bug Report': 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0',
};

// No mock data - tickets are managed externally

export default function SupportPage() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    avgResponse: 'N/A',
    satisfaction: 'N/A',
  };

  const toggleExpand = (id: string) => {
    setExpandedTicket(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.support.title}</h1>
            <p className="text-sm text-muted-foreground">{t.support.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.support.totalTickets}</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.support.openTickets}</p>
                <p className="text-xl font-bold">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.support.avgResponse}</p>
                <p className="text-xl font-bold">{stats.avgResponse}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.support.satisfaction}</p>
                <p className="text-xl font-bold">{stats.satisfaction}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.support.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t.support.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.support.allStatuses}</SelectItem>
            <SelectItem value="open">{t.support.statusOpen}</SelectItem>
            <SelectItem value="in_progress">{t.support.statusInProgress}</SelectItem>
            <SelectItem value="resolved">{t.support.statusResolved}</SelectItem>
            <SelectItem value="closed">{t.support.statusClosed}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t.support.filterPriority} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.support.allPriorities}</SelectItem>
            <SelectItem value="low">{t.support.priorityLow}</SelectItem>
            <SelectItem value="medium">{t.support.priorityMedium}</SelectItem>
            <SelectItem value="high">{t.support.priorityHigh}</SelectItem>
            <SelectItem value="critical">{t.support.priorityCritical}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t.support.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.support.allCategories}</SelectItem>
            <SelectItem value="Technical">{t.support.catTechnical}</SelectItem>
            <SelectItem value="Billing">{t.support.catBilling}</SelectItem>
            <SelectItem value="Account">{t.support.catAccount}</SelectItem>
            <SelectItem value="Feature Request">{t.support.catFeatureRequest}</SelectItem>
            <SelectItem value="Bug Report">{t.support.catBugReport}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <LifeBuoy className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">{t.support.noTickets}</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const sCfg = statusConfig[ticket.status];
            const pCfg = priorityConfig[ticket.priority];
            const StatusIcon = sCfg.icon;
            const isExpanded = expandedTicket === ticket.id;

            return (
              <Card key={ticket.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => toggleExpand(ticket.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                        <h3 className="font-semibold text-sm">{ticket.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={cn('text-[10px]', sCfg.color)}>
                          <StatusIcon className="h-3 w-3 me-1" />
                          {sCfg.label}
                        </Badge>
                        <Badge className={cn('text-[10px]', pCfg.color)}>
                          <div className={cn('w-1.5 h-1.5 rounded-full me-1', pCfg.dot)} />
                          {pCfg.label}
                        </Badge>
                        <Badge className={cn('text-[10px]', categoryConfig[ticket.category])}>
                          {ticket.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{ticket.lastUpdate}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-muted-foreground">{t.support.reporter}:</span>
                          <span className="font-medium">{ticket.reporter}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-muted-foreground">{t.support.category}:</span>
                          <Badge className={cn('text-[10px]', categoryConfig[ticket.category])}>{ticket.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-muted-foreground">{t.support.createdDate}:</span>
                          <span className="font-medium">{ticket.createdDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-muted-foreground">{t.support.lastUpdate}:</span>
                          <span className="font-medium">{ticket.lastUpdate}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                        {ticket.description}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
