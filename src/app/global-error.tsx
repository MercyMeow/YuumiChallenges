'use client';

import { MagicalBackground } from '@/components/ui/magical-background';

export default function GlobalError({
  error: _error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MagicalBackground>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-landing-text-primary mb-4">500</h1>
          <h2 className="text-2xl font-semibold text-landing-text-primary mb-6">Something went wrong!</h2>
          <p className="text-landing-text-secondary mb-8">
            An unexpected error occurred.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md bg-yuumi-purple hover:bg-yuumi-purple/90 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yuumi-purple transition-all duration-300"
          >
            Try again
          </button>
        </div>
      </div>
    </MagicalBackground>
  );
}