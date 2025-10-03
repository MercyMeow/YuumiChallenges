'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { Award, ChevronDown } from 'lucide-react';
import { formatMatchTime } from '@/lib/utils/time';
import { ExtendedMatchParticipant } from './types';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const CHALLENGE_GROUPS: Array<{
  name: string;
  keywords: string[];
}> = [
  {
    name: 'Combat',
    keywords: ['kill', 'damage', 'assist', 'blood', 'fight', 'legendary'],
  },
  {
    name: 'Objectives',
    keywords: ['baron', 'dragon', 'tower', 'inhib', 'rift', 'objective'],
  },
  {
    name: 'Economy',
    keywords: ['gold', 'cs', 'income', 'bounty', 'xp', 'level'],
  },
  {
    name: 'Vision & Utility',
    keywords: ['vision', 'ward', 'utility', 'cc', 'shield', 'heal'],
  },
  {
    name: 'Support & Teamplay',
    keywords: ['support', 'ally', 'team', 'protect'],
  },
];

const TIME_KEYWORDS = ['time', 'duration', 'timestamp', 'length'];
const MILLISECOND_HINTS = ['millis', 'ms'];
const SECOND_HINTS = ['second'];

const formatChallengeValue = (key: string, value: number) => {
  const lowerKey = key.toLowerCase();
  const isTimeLike = TIME_KEYWORDS.some((hint) => lowerKey.includes(hint));

  if (!isTimeLike) {
    return {
      display: numberFormatter.format(value),
      numeric: value,
    };
  }

  const treatAsMilliseconds = MILLISECOND_HINTS.some((hint) =>
    lowerKey.includes(hint)
  );
  const treatAsSeconds = SECOND_HINTS.some((hint) => lowerKey.includes(hint));

  const milliseconds = treatAsMilliseconds
    ? value
    : treatAsSeconds
      ? value * 1000
      : value * 1000;

  return {
    display: formatMatchTime(milliseconds),
    numeric: milliseconds,
  };
};

const formatChallengeLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

const getChallengeGroup = (key: string) => {
  const normalized = key.toLowerCase();

  if (normalized.startsWith('swarm')) {
    return 'Swarm';
  }

  for (const group of CHALLENGE_GROUPS) {
    if (group.keywords.some((keyword) => normalized.includes(keyword))) {
      return group.name;
    }
  }

  return 'Miscellaneous';
};

interface ChallengeEntry {
  key: string;
  label: string;
  displayValue: string;
  numericValue: number | null;
}

const ChallengeStatCard = ({
  entry,
  highlight = false,
}: {
  entry: ChallengeEntry;
  highlight?: boolean;
}) => (
  <div
    className={`flex flex-col gap-2 rounded-xl border border-white/10 px-4 py-3 ${
      highlight
        ? 'bg-gradient-to-br from-purple-500/25 via-purple-500/10 to-transparent'
        : 'bg-black/25'
    }`}
  >
    <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
      {entry.label}
    </span>
    <span
      className={`text-xl font-semibold ${highlight ? 'text-white' : 'text-white/80'}`}
    >
      {entry.displayValue}
    </span>
  </div>
);

export function ChallengesTab({
  selectedPlayerData,
}: {
  selectedPlayerData?: ExtendedMatchParticipant | null | undefined;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedEntries = useMemo<ChallengeEntry[]>(() => {
    if (!selectedPlayerData?.challenges) {
      return [];
    }

    return Object.entries(selectedPlayerData.challenges)
      .filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value)
      )
      .map(([key, value]) => {
        const formatted = formatChallengeValue(key, value as number);
        return {
          key,
          label: formatChallengeLabel(key),
          displayValue: formatted.display,
          numericValue: formatted.numeric,
        };
      })
      .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0));
  }, [selectedPlayerData?.challenges]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) {
      return normalizedEntries;
    }
    const query = searchTerm.toLowerCase();
    return normalizedEntries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.key.toLowerCase().includes(query)
    );
  }, [normalizedEntries, searchTerm]);

  const highlightEntries = useMemo(
    () => filteredEntries.slice(0, 6),
    [filteredEntries]
  );
  const highlightKeys = useMemo(
    () => new Set(highlightEntries.map((entry) => entry.key)),
    [highlightEntries]
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, ChallengeEntry[]>();

    for (const entry of filteredEntries) {
      const groupName = getChallengeGroup(entry.key);
      const bucket = groups.get(groupName) ?? [];
      bucket.push(entry);
      groups.set(groupName, bucket);
    }

    groups.forEach((entries, groupName) => {
      const sorted = [...entries].sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      groups.set(groupName, sorted);
    });

    return groups;
  }, [filteredEntries]);

  const orderedGroupNames = useMemo(() => {
    const predefinedOrder = [
      'Combat',
      'Objectives',
      'Economy',
      'Vision & Utility',
      'Support & Teamplay',
      'Swarm',
      'Miscellaneous',
    ];

    const existingGroups = Array.from(groupedEntries.keys());
    const sortedExisting = existingGroups
      .filter((group) => !predefinedOrder.includes(group))
      .sort();

    return [
      ...predefinedOrder.filter((group) => groupedEntries.has(group)),
      ...sortedExisting,
    ];
  }, [groupedEntries]);

  if (!selectedPlayerData) {
    return (
      <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
        <CardContent className="py-12 text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-white/40" />
          <p className="text-white/60">
            Click on a player in the Overview tab to see their challenges
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasFilteredResults = filteredEntries.length > 0;
  const displayName =
    selectedPlayerData.riotIdGameName && selectedPlayerData.riotIdTagline
      ? `${selectedPlayerData.riotIdGameName}#${selectedPlayerData.riotIdTagline}`
      : (selectedPlayerData.summonerName ?? 'Unknown Summoner');

  return (
    <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3 text-white">
          <ChampionIcon
            championId={selectedPlayerData.championName}
            size="md"
          />
          <span>{displayName}</span>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/60">
            {normalizedEntries.length} tracked challenges
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label
            htmlFor="challenge-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50"
          >
            Search challenges
          </label>
          <Input
            id="challenge-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by name, keyword, or Riot code"
            className="border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
          />
        </div>

        {highlightEntries.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
              Standout metrics
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {highlightEntries.map((entry) => (
                <ChallengeStatCard key={entry.key} entry={entry} highlight />
              ))}
            </div>
          </div>
        ) : null}

        {!hasFilteredResults ? (
          <p className="text-sm text-white/60">
            No challenges match your current filters.
          </p>
        ) : null}

        {orderedGroupNames.map((groupName) => {
          const entries = groupedEntries.get(groupName);
          if (!entries || entries.length === 0) {
            return null;
          }

          return (
            <details
              key={groupName}
              className="group rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              open={
                highlightKeys.size > 0 &&
                entries.some((entry) => highlightKeys.has(entry.key))
              }
            >
              <summary className="flex cursor-pointer select-none items-center justify-between gap-3 text-sm font-semibold text-white">
                <span>{groupName}</span>
                <span className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/40">
                  <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">
                    {entries.length} entries
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:-rotate-180" />
                </span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {entries.map((entry) => (
                  <ChallengeStatCard key={entry.key} entry={entry} />
                ))}
              </div>
            </details>
          );
        })}
      </CardContent>
    </Card>
  );
}
