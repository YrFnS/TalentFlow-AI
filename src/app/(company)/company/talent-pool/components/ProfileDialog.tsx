// @ts-nocheck
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Mail, Phone, FileText, Briefcase, Star, Clock, Users,
  Eye, UserPlus, Tag, X,
  StickyNote,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { categoryColors } from './mock-data';
import type { Pool, Candidate, ActivityEntry } from './types';

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    call: Phone,
    note: StickyNote,
    job: Briefcase,
    pool: Users,
  };
  const colorMap: Record<string, string> = {
    email: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950',
    call: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
    note: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
    job: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950',
    pool: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950',
  };
  const Icon = iconMap[type] || FileText;
  const color = colorMap[type] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950';
  return (
    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', color)}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  pools: Pool[];
  onRemoveFromPool: (candidateId: string, poolId: string) => void;
  onAddToPool: (candidate: Candidate) => void;
  onEngage: (candidate: Candidate) => void;
  t: Record<string, string>;
}

export default function ProfileDialog({
  open, onOpenChange,
  candidate, pools,
  onRemoveFromPool, onAddToPool, onEngage, t,
}: ProfileDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-teal-600" />
            {t.viewProfile}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {/* Candidate Info Card */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-lg">
                    {getInitials(candidate.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{candidate.name}</h3>
                  <p className="text-sm text-muted-foreground">{candidate.currentTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                      {candidate.matchScore}% Match
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{candidate.availability}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { onOpenChange(false); onAddToPool(candidate); }}>
                    <UserPlus className="h-3 w-3 me-1" />
                    {t.addToPool}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs text-teal-600 dark:text-teal-400" onClick={() => { onOpenChange(false); onEngage(candidate); }}>
                    <Mail className="h-3 w-3 me-1" />
                    {t.engage}
                  </Button>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.map(skill => (
                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {candidate.tags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.tags}</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                        <Tag className="h-2.5 w-2.5 me-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pools */}
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t.activePools}</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.poolIds.map(pid => {
                    const pool = pools.find(p => p.id === pid);
                    if (!pool) return null;
                    return (
                      <div key={pid} className="flex items-center gap-1">
                        <Badge className={cn('text-[10px] gap-0.5', categoryColors[pool.category])}>
                          {pool.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => onRemoveFromPool(candidate.id, pool.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meta */}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t.lastContacted}: {candidate.lastContacted}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.activityTimeline}
            </h3>
            {candidate.activityTimeline.length > 0 ? (
              <div className="space-y-3">
                {candidate.activityTimeline.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <ActivityIcon type={entry.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{entry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noCandidates}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
