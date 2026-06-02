// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ReferenceCheckStatus, ReferenceCheckItem } from './types';
import StarRating from './StarRating';

const statusColors: Record<ReferenceCheckStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Sent: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0',
  Declined: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

const statusIcons: Record<ReferenceCheckStatus, React.ElementType> = {
  Pending: Clock,
  Sent: Send,
  Completed: CheckCircle2,
  Expired: AlertCircle,
  Declined: XCircle,
};

interface ReferenceChecksTableProps {
  filteredChecks: ReferenceCheckItem[];
  filterStatus: ReferenceCheckStatus | 'all';
  setFilterStatus: (v: ReferenceCheckStatus | 'all') => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  rt: Record<string, string>;
  commonT: Record<string, string>;
  onOpenDetail: (rc: ReferenceCheckItem) => void;
  onSendReminder: (rc: ReferenceCheckItem) => void;
}

export default function ReferenceChecksTable({
  filteredChecks,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  rt,
  commonT,
  onOpenDetail,
  onSendReminder,
}: ReferenceChecksTableProps) {
  const allStatuses: (ReferenceCheckStatus | 'all')[] = ['all', 'Pending', 'Sent', 'Completed', 'Expired', 'Declined'];

  const getStatusLabel = (status: ReferenceCheckStatus): string => {
    const key = status.toLowerCase() as string;
    return rt[key] || status;
  };

  const getRelationshipLabel = (rel: string): string => {
    const keyMap: Record<string, string> = {
      Manager: rt.relationshipManager,
      Colleague: rt.relationshipColleague,
      'Direct Report': rt.relationshipDirectReport,
      Other: rt.relationshipOther,
    };
    return keyMap[rel] || rel;
  };

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReferenceCheckStatus | 'all')}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={rt.status} />
          </SelectTrigger>
          <SelectContent>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? (rt.allStatuses || 'All Statuses') : getStatusLabel(s as ReferenceCheckStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={rt.searchPlaceholder || 'Search candidate or reference...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Reference Checks Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            {rt.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.candidateName}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.referenceName}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{rt.relationship}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{rt.company}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.status}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{rt.rating}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{rt.sentDate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{rt.completedDate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.actions || commonT.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredChecks.map((rc) => {
                  const StatusIcon = statusIcons[rc.status];
                  return (
                    <tr
                      key={rc.id}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => onOpenDetail(rc)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-600 text-white text-[9px]">
                              {getInitials(rc.candidateName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium block">{rc.candidateName}</span>
                            <span className="text-[10px] text-muted-foreground">{rc.candidateEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="text-sm font-medium block">{rc.referenceName}</span>
                          <span className="text-[10px] text-muted-foreground">{rc.referenceEmail}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-sm">{getRelationshipLabel(rc.relationship)}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-sm">{rc.referenceCompany}</span>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px] gap-1', statusColors[rc.status])}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(rc.status)}
                        </Badge>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <StarRating rating={rc.rating} />
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{rc.sentDate || '\u2014'}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{rc.completedDate || '\u2014'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => onOpenDetail(rc)}
                          >
                            <Eye className="h-3 w-3 me-1" />
                            {rt.viewDetails}
                          </Button>
                          {(rc.status === 'Pending' || rc.status === 'Sent') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => onSendReminder(rc)}
                            >
                              <RefreshCw className="h-3 w-3 me-1" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredChecks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{rt.noReferenceChecks}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
