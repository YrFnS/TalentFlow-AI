// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

type OnboardingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

interface OnboardingFiltersBarProps {
  filterStatus: OnboardingStatus | 'all';
  searchQuery: string;
  onFilterStatusChange: (status: OnboardingStatus | 'all') => void;
  onSearchChange: (query: string) => void;
}

export default function OnboardingFiltersBar({
  filterStatus,
  searchQuery,
  onFilterStatusChange,
  onSearchChange,
}: OnboardingFiltersBarProps) {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  const allFilterStatuses: (OnboardingStatus | 'all')[] = ['all', 'Pending', 'In Progress', 'Completed', 'Overdue'];

  const getStatusLabel = (status: OnboardingStatus): string => {
    const key = status === 'In Progress' ? 'inProgress' : status.toLowerCase();
    return ot[key] || status;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as OnboardingStatus | 'all')}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder={ot.filterByStatus} />
        </SelectTrigger>
        <SelectContent>
          {allFilterStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'all' ? ot.allStatuses : getStatusLabel(s as OnboardingStatus)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={ot.searchByName}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
        />
      </div>
    </div>
  );
}
