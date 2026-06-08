// @ts-nocheck
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/store/i18n-store';
import { interviewStatuses } from './interview-types';

interface InterviewFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  getStatusLabel: (status: string) => string;
}

export default function InterviewFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  getStatusLabel,
}: InterviewFiltersProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t.common.search}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder={t.interviews.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.interviews.allStatuses}</SelectItem>
          {interviewStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {getStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
