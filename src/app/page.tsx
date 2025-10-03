'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MatchLandingPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = matchId.trim();
    if (!normalized.length) {
      return;
    }

    router.push('/match/' + encodeURIComponent(normalized));
  };

  return (
    <main className="via-background/95 flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background px-6 py-16">
      <div className="w-full max-w-xl space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Yuumi Match Viewer
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
          Paste any ranked match ID to explore matchups, timelines, gold swings,
          and Yuumi-specific insights without leaving the browser.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={matchId}
            onChange={(event) => setMatchId(event.target.value)}
            placeholder="e.g. EUW1_7481411158"
            aria-label="Match identifier"
            className="text-center"
            spellCheck={false}
            autoComplete="off"
          />
          <Button type="submit" className="w-full">
            View Match Details
          </Button>
        </form>
      </div>
    </main>
  );
}
