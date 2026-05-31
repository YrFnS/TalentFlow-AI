// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Mail, Eye, Clock, Tag } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { categoryColors } from './mock-data';
import type { Pool, Candidate } from './types';

interface CandidateCardProps {
  candidate: Candidate;
  pools: Pool[];
  onAddToPool: (candidate: Candidate) => void;
  onEngage: (candidate: Candidate) => void;
  onViewProfile: (candidate: Candidate) => void;
  t: Record<string, string>;
}

export default function CandidateCard({ candidate, pools, onAddToPool, onEngage, onViewProfile, t }: CandidateCardProps) {
  return (
    <Card className="border-border/50 card-hover-lift">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm truncate">{candidate.name}</h3>
              <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 shrink-0 ms-2">
                {candidate.matchScore}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{candidate.currentTitle}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 4).map(skill => (
            <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 4 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{candidate.skills.length - 4}
            </Badge>
          )}
        </div>

        {/* Pool Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.poolIds.map(pid => {
            const pool = pools.find(p => p.id === pid);
            if (!pool) return null;
            return (
              <Badge key={pid} className={cn('text-[10px] gap-0.5', categoryColors[pool.category])}>
                {pool.name}
              </Badge>
            );
          })}
        </div>

        {/* Tags */}
        {candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {candidate.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t.lastContacted}: {candidate.lastContacted}
          </span>
          <Badge variant="outline" className="text-[9px] px-1 py-0">{candidate.availability}</Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-t border-border/30 pt-3">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={() => onAddToPool(candidate)}>
            <UserPlus className="h-3 w-3 me-1" />
            {t.addToPool}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1 text-teal-600 dark:text-teal-400 hover:text-teal-700" onClick={() => onEngage(candidate)}>
            <Mail className="h-3 w-3 me-1" />
            {t.engage}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onViewProfile(candidate)}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
