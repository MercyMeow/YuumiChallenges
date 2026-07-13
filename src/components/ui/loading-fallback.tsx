/**
 * Shared loading fallback for Suspense boundaries and page-level waits.
 * Skeleton-based (site-wide convention: loading states are shimmering
 * ghosts, not spinners); `message` is kept for screen readers.
 */

import { PanelSkeleton, Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PANEL_COUNT: Record<'sm' | 'md' | 'lg', number> = {
  sm: 1,
  md: 2,
  lg: 3,
};

export function LoadingFallback({
  message = 'Loading...',
  size = 'md',
}: LoadingFallbackProps) {
  return (
    <div className="space-y-3 py-8" role="status" aria-busy>
      <span className="sr-only">{message}</span>
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: PANEL_COUNT[size] }, (_, i) => (
        <PanelSkeleton key={i} className="h-28" />
      ))}
    </div>
  );
}
