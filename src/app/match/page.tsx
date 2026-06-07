'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  REGIONS,
  REGION_NAMES,
  YUUMI_DISCORD_INVITE_URL,
} from '@/lib/utils/constants';
import { ExternalLink } from 'lucide-react';

type RegionValue = (typeof REGIONS)[keyof typeof REGIONS];

const VALID_REGION_PREFIXES = new Set(
  Object.values(REGIONS).map((regionValue) => regionValue.toUpperCase())
);

export default function MatchLandingPage() {
  const router = useRouter();
  const [region, setRegion] = useState<RegionValue>(REGIONS.EUW1);
  const [matchId, setMatchId] = useState('');
  const [matchIdError, setMatchIdError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = matchId.trim();
    setMatchIdError('');
    if (!normalized.length) {
      return;
    }

    const fullMatchIdMatch = normalized.match(/^([A-Za-z0-9]+)_(\d+)$/);
    if (fullMatchIdMatch) {
      const [, rawRegion, rawMatchNumber] = fullMatchIdMatch;
      if (!rawRegion || !rawMatchNumber) {
        setMatchIdError('Enter a valid match ID.');
        return;
      }

      const normalizedRegion = rawRegion.toUpperCase();
      if (!VALID_REGION_PREFIXES.has(normalizedRegion)) {
        setMatchIdError('Unrecognized region prefix.');
        return;
      }

      router.push(
        '/match/' + encodeURIComponent(`${normalizedRegion}_${rawMatchNumber}`)
      );
      return;
    }

    router.push(
      '/match/' + encodeURIComponent(`${region.toUpperCase()}_${normalized}`)
    );
  };

  return (
    <main className="via-background/95 flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background px-6 py-16">
      <div className="w-full max-w-md">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Yuumi Match Viewer
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base lg:mx-0">
            Enter any ranked match ID to explore matchups, timelines, gold
            swings, and Yuumi-specific insights without leaving the browser.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Select
                value={region}
                onValueChange={(value) => setRegion(value as RegionValue)}
              >
                <SelectTrigger className="w-44 shrink-0">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {REGION_NAMES[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={matchId}
                onChange={(event) => {
                  setMatchId(event.target.value);
                  if (matchIdError) {
                    setMatchIdError('');
                  }
                }}
                placeholder="Match ID (e.g. 7481411158)"
                aria-label="Match identifier"
                aria-invalid={Boolean(matchIdError)}
                className="flex-1"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {matchIdError && (
              <p className="text-sm text-destructive" role="alert">
                {matchIdError}
              </p>
            )}
            <Button type="submit" className="w-full">
              View Match Details
            </Button>
          </form>
          <Button asChild variant="outline" className="w-full">
            <a
              href={YUUMI_DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the Yuumi Mains Discord
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
