import { cn } from '@/lib/utils';

/**
 * Hextech skeleton primitives — the site-wide loading language. Loading
 * states render shimmering ghosts of the content they become (no
 * spinners):
 *  - Skeleton: bare block for lines, icons, avatars, table cells.
 *  - PanelSkeleton: hex-card ghost standing in for a whole panel/card.
 *  - SkeletonLines: quick stack of text-like lines inside a panel.
 */

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('animate-pulse rounded-sm bg-hx-gold/10', className)}
      {...props}
    />
  );
}

/** Framed hex-card ghost; size it via height/width classes in className. */
function PanelSkeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('hex-card animate-pulse rounded-sm opacity-50', className)}
      {...props}
    />
  );
}

/** Stack of text-like lines; the last line runs short, like real prose. */
function SkeletonLines({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export { Skeleton, PanelSkeleton, SkeletonLines };
