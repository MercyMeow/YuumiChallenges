'use client';

export default function GlobalError({
  error: _error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Something went wrong!</h2>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
        >
          Try again
        </button>
      </div>
    </div>
  );
}