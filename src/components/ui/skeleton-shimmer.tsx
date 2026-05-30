import { cn } from "@/lib/utils"

interface SkeletonShimmerProps extends React.ComponentProps<"div"> {
  /** Shape variant: 'line' for text, 'circle' for avatars, 'card' for card placeholders */
  variant?: "line" | "circle" | "card";
  /** Number of lines to render (only applies to 'line' variant) */
  lines?: number;
}

function SkeletonShimmer({
  className,
  variant = "line",
  lines = 1,
  ...props
}: SkeletonShimmerProps) {
  if (variant === "circle") {
    return (
      <div
        data-slot="skeleton-shimmer"
        className={cn("skeleton-shimmer rounded-full", className)}
        {...props}
      />
    )
  }

  if (variant === "card") {
    return (
      <div
        data-slot="skeleton-shimmer"
        className={cn(
          "skeleton-shimmer rounded-xl p-5 space-y-3",
          className
        )}
        {...props}
      >
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded" />
        <div className="skeleton-shimmer h-3 w-full rounded" />
        <div className="skeleton-shimmer h-3 w-5/6 rounded" />
      </div>
    )
  }

  // Line variant — render multiple lines
  if (lines > 1) {
    return (
      <div data-slot="skeleton-shimmer" className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton-shimmer h-4 rounded",
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      data-slot="skeleton-shimmer"
      className={cn("skeleton-shimmer h-4 rounded", className)}
      {...props}
    />
  )
}

export { SkeletonShimmer }
