// @ts-nocheck
import { cn } from '@/lib/utils';

export default function CircularProgress({ value, size = 56, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    return 'text-amber-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className={cn('transition-all duration-700', getColor(value))}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', getColor(value))}>{value}%</span>
    </div>
  );
}
