// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Star } from 'lucide-react';
import type { Pool } from './types';
import TalentPoolCard from './TalentPoolCard';

interface TalentPoolListProps {
  pools: Pool[];
  filterPool: string;
  onSelectPool: (poolId: string) => void;
  t: Record<string, string>;
}

export default function TalentPoolList({ pools, filterPool, onSelectPool, t }: TalentPoolListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        {t.activePools}
      </h2>
      {pools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pools.map(pool => (
            <TalentPoolCard
              key={pool.id}
              pool={pool}
              isActive={filterPool === pool.id}
              onSelect={onSelectPool}
              t={t}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t.noPools}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
