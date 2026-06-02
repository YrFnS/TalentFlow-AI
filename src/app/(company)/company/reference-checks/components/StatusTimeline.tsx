// @ts-nocheck
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReferenceCheckStatus } from './types';

export default function StatusTimeline({ status, t }: { status: ReferenceCheckStatus; t: Record<string, string> }) {
  const steps = [
    { key: 'requested', label: t.pending || 'Requested', completed: true },
    { key: 'sent', label: t.sent || 'Sent', completed: ['Sent', 'Completed', 'Expired', 'Declined'].includes(status) },
    { key: 'inProgress', label: t.inProgress || 'In Progress', completed: ['Completed', 'Declined'].includes(status) },
    { key: 'completed', label: t.completed || 'Completed', completed: status === 'Completed' },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                step.completed
                  ? 'bg-slate-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 min-w-[24px] mt-[-16px]',
                steps[i + 1].completed
                  ? 'bg-slate-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
