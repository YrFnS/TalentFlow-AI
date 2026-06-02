// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ListEditorProps {
  label: string;
  items: string[];
  placeholder: string;
  numberColor: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}

export default function ListEditor({ label, items, placeholder, numberColor, onAdd, onRemove, onUpdate }: ListEditorProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs">
          + Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded-full text-xs flex items-center justify-center flex-shrink-0', numberColor)}>
              {i + 1}
            </div>
            <Input
              placeholder={placeholder}
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              className="flex-1"
            />
            {items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(i)}>
                ×
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
