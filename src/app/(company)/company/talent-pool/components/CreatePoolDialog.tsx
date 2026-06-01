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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { PoolCategory } from './types';

interface CreatePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  onPoolNameChange: (val: string) => void;
  poolDescription: string;
  onPoolDescriptionChange: (val: string) => void;
  poolCategory: PoolCategory;
  onPoolCategoryChange: (val: PoolCategory) => void;
  onConfirm: () => void;
  t: Record<string, string>;
}

const cancelKey = 'cancel' as string;

export default function CreatePoolDialog({
  open, onOpenChange,
  poolName, onPoolNameChange,
  poolDescription, onPoolDescriptionChange,
  poolCategory, onPoolCategoryChange,
  onConfirm, t,
}: CreatePoolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            {t.createPool}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.poolName}</label>
            <Input
              value={poolName}
              onChange={(e) => onPoolNameChange(e.target.value)}
              placeholder={t.poolName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.poolDescription}</label>
            <Textarea
              value={poolDescription}
              onChange={(e) => onPoolDescriptionChange(e.target.value)}
              placeholder={t.poolDescription}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.category}</label>
            <Select value={poolCategory} onValueChange={(v) => onPoolCategoryChange(v as PoolCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Silver">{t.categorySilver}</SelectItem>
                <SelectItem value="Gold">{t.categoryGold}</SelectItem>
                <SelectItem value="Platinum">{t.categoryPlatinum}</SelectItem>
                <SelectItem value="General">{t.categoryGeneral}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{t[cancelKey] || t.common?.cancel || 'Cancel'}</Button>
          </DialogClose>
          <Button
            className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={onConfirm}
            disabled={!poolName.trim()}
          >
            {t.createPool}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
