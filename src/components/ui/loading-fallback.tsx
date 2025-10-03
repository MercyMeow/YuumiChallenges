/**
 * Shared Loading Component
 * Reusable loading fallback for Suspense boundaries
 */

import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingFallback({
  message = 'Loading...',
  size = 'md',
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-white/60`} />
      <span className="ml-3 text-white/60">{message}</span>
    </div>
  );
}
