// @ts-nocheck
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { categoryColors } from './mock-data';
import type { Pool, Candidate } from './types';

interface AddToPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  pools: Pool[];
  selectedPoolIds: string[];
  onSelectedPoolIdsChange: (ids: string[]) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  tags: string;
  onTagsChange: (val: string) => void;
  onConfirm: () => void;
  t: Record<string, string>;
}

export default function AddToPoolDialog({
  open, onOpenChange,
  candidate, pools,
  selectedPoolIds, onSelectedPoolIdsChange,
  notes, onNotesChange,
  tags, onTagsChange,
  onConfirm, t,
}: AddToPoolDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-600" />
            {t.addToPool}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Candidate Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px]">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{candidate.name}</p>
              <p className="text-xs text-muted-foreground">{candidate.currentTitle}</p>
            </div>
          </div>

          {/* Pool Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.selectPools}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pools.map(pool => {
                const isSelected = selectedPoolIds.includes(pool.id);
                return (
                  <label
                    key={pool.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/30'
                        : 'border-border/50 hover:border-teal-200 dark:hover:border-teal-800'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectedPoolIdsChange([...selectedPoolIds, pool.id]);
                        } else {
                          onSelectedPoolIdsChange(selectedPoolIds.filter(id => id !== pool.id));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{pool.name}</span>
                        <Badge className={cn('text-[9px]', categoryColors[pool.category])}>
                          {t[`category${pool.category}`] || pool.category}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pool.memberCount} {t.members}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.notes}</label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t.notes}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.tags}</label>
            <Input
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder={t.tags}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{t.cancel || 'Cancel'}</Button>
          </DialogClose>
          <Button
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={onConfirm}
            disabled={selectedPoolIds.length === 0}
          >
            <UserPlus className="h-3.5 w-3.5 me-1.5" />
            {t.addToPool}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
