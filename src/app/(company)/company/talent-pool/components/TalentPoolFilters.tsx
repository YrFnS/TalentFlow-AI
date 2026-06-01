// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import type { Pool } from './types';

interface TalentPoolFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterPool: string;
  onFilterPoolChange: (val: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (val: string) => void;
  filterAvailability: string;
  onFilterAvailabilityChange: (val: string) => void;
  filterSkills: string;
  onFilterSkillsChange: (val: string) => void;
  onClearFilters: () => void;
  pools: Pool[];
  t: Record<string, string>;
}

export default function TalentPoolFilters({
  searchQuery, onSearchChange,
  filterPool, onFilterPoolChange,
  filterCategory, onFilterCategoryChange,
  filterAvailability, onFilterAvailabilityChange,
  filterSkills, onFilterSkillsChange,
  onClearFilters,
  pools, t,
}: TalentPoolFiltersProps) {
  const hasActiveFilters = filterPool !== 'all' || filterCategory !== 'all' || filterAvailability !== 'all' || filterSkills || searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.searchCandidates}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
        />
      </div>
      <Select value={filterPool} onValueChange={onFilterPoolChange}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder={t.filterByPool} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.filterByPool}</SelectItem>
          {pools.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder={t.category} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.category}</SelectItem>
          <SelectItem value="Silver">{t.categorySilver}</SelectItem>
          <SelectItem value="Gold">{t.categoryGold}</SelectItem>
          <SelectItem value="Platinum">{t.categoryPlatinum}</SelectItem>
          <SelectItem value="General">{t.categoryGeneral}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterAvailability} onValueChange={onFilterAvailabilityChange}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Availability" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Availability</SelectItem>
          <SelectItem value="Actively looking">Actively looking</SelectItem>
          <SelectItem value="Open to offers">Open to offers</SelectItem>
          <SelectItem value="Passive">Passive</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder={t.filterBySkills}
        value={filterSkills}
        onChange={(e) => onFilterSkillsChange(e.target.value)}
        className="w-32 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={onClearFilters}
        >
          <X className="h-3 w-3 me-1" />
          {t.clearFilters || 'Clear'}
        </Button>
      )}
    </div>
  );
}
