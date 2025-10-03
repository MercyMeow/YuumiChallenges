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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-landing-text-primary">
            500
          </h1>
          <h2 className="mb-6 text-2xl font-semibold text-landing-text-primary">
            Something went wrong!
          </h2>
          <p className="mb-8 text-landing-text-secondary">
            An unexpected error occurred.
          </p>
          <button
            onClick={() => reset()}
            className="hover:bg-yuumi-purple/90 inline-flex items-center rounded-md border border-transparent bg-yuumi-purple px-6 py-3 text-base font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-purple focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    </MagicalBackground>
  );
}
