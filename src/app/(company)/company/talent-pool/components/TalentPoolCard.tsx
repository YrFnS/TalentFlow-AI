// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryColors, categoryIcons } from './mock-data';
import type { Pool } from './types';

interface TalentPoolCardProps {
  pool: Pool;
  isActive: boolean;
  onSelect: (poolId: string) => void;
  t: Record<string, string>;
}

export default function TalentPoolCard({ pool, isActive, onSelect, t }: TalentPoolCardProps) {
  return (
    <Card
      className="border-border/50 card-hover-lift cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-all"
      onClick={() => onSelect(pool.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{categoryIcons[pool.category]}</span>
            <h3 className="font-semibold text-sm truncate">{pool.name}</h3>
          </div>
          <Badge className={cn('text-[10px]', categoryColors[pool.category])}>
            {t[`category${pool.category}`] || pool.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pool.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {pool.memberCount} {t.members}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {pool.lastActivity}
          </div>
        </div>
        {isActive && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
              ✓ Filtering
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
