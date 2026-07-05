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
import { ArrowLeft, ExternalLink, Search, Swords } from 'lucide-react';
import Link from 'next/link';

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
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to px-6 py-16">
      <div className="w-full max-w-lg duration-500 animate-in fade-in slide-in-from-bottom-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-yuumi-purple transition-colors hover:text-yuumi-blue"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>

        <div className="relative">
          <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-r from-yuumi-purple/40 to-yuumi-blue/40 opacity-40 blur-sm" />
          <div className="relative rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-md">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yuumi-purple/20">
                <Swords className="h-8 w-8 text-yuumi-purple" />
              </div>
              <h1 className="bg-linear-to-r from-landing-text-primary via-yuumi-purple to-yuumi-blue bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                Yuumi Match Viewer
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-landing-text-secondary sm:text-base">
                Enter any ranked match ID to explore matchups, timelines, gold
                swings, and Yuumi-specific insights without leaving the browser.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={region}
                  onValueChange={(value) => setRegion(value as RegionValue)}
                >
                  <SelectTrigger className="w-full shrink-0 border-white/20 bg-white/5 text-white sm:w-44">
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
                  className="flex-1 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              {matchIdError && (
                <p className="text-sm text-red-300" role="alert">
                  {matchIdError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-linear-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
              >
                <Search className="mr-2 h-4 w-4" />
                View Match Details
              </Button>
            </form>

            <Button
              asChild
              variant="outline"
              className="mt-3 w-full border-white/20 text-white hover:bg-white/10"
            >
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
      </div>
    </main>
  );
}
