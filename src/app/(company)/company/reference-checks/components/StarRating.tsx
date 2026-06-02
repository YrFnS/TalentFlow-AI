// @ts-nocheck
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ rating, max = 5, size = 'sm' }: { rating: number | null; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  if (rating === null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  );
}
