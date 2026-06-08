// @ts-nocheck
'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssessmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sa: Record<string, string>;
}

export default function AssessmentFilters({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  sa,
}: AssessmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={sa.selectSkills + '...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 me-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="CUSTOM">{sa.custom}</SelectItem>
          <SelectItem value="CODING">{sa.coding}</SelectItem>
          <SelectItem value="SITUATIONAL">{sa.situational}</SelectItem>
          <SelectItem value="BEHAVIORAL">{sa.behavioral}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
