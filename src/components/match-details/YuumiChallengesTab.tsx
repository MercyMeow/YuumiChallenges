'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ItemSlots } from '@/components/match-history/item-slots';
import { RuneIcon, StatShardIcon } from '@/components/ui/rune-display';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import {
  evaluateYuumiChallenges,
  EvaluatedCategory,
  ChallengeStatus,
} from './yuumi-challenge-evaluator';
import { ExtendedMatchParticipant, ExtendedMatchData } from './types';
import { cn } from '@/lib/utils';
import {
  Award,
  BadgeCheck,
  CircleOff,
  ClipboardList,
  Sparkles,
  Swords,
  HeartPulse,
  Eye,
  Gauge,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SummaryTotals = {
  total: number;
  achieved: number;
  likely: number;
  manual: number;
};

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits });
const formatRate = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits });

const STATUS_META: Record<
  ChallengeStatus,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    chipClass: string;
  }
> = {
  achieved: {
    label: 'Completed',
    icon: BadgeCheck,
    badgeClass:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_-10px_rgba(16,185,129,0.8)]',
    chipClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  },
  likely: {
    label: 'Likely',
    icon: Sparkles,
    badgeClass:
      'border-sky-500/40 bg-sky-500/15 text-sky-200 shadow-[0_0_20px_-12px_rgba(14,165,233,0.7)]',
    chipClass: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  },
  manual: {
    label: 'Manual Check',
    icon: ClipboardList,
    badgeClass:
      'border-amber-500/40 bg-amber-500/15 text-amber-200 shadow-[0_0_18px_-12px_rgba(245,158,11,0.6)]',
    chipClass: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
  not_met: {
    label: 'Unmet',
    icon: CircleOff,
    badgeClass:
      'border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-[0_0_14px_-12px_rgba(244,63,94,0.6)]',
    chipClass: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  },
};

const CARD_ACCENTS: Record<ChallengeStatus, string> = {
  achieved:
    'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent',
  likely:
    'border-sky-500/40 bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-transparent',
  manual:
    'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
  not_met: 'border-white/10 bg-white/5',
};

interface YuumiChallengesTabProps {
  selectedPlayerData?: ExtendedMatchParticipant | null;
  matchData: ExtendedMatchData;
}

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  accentClass?: string;
}

const StatTile = ({
  icon: Icon,
  label,
  value,
  sublabel,
  accentClass,
}: StatTileProps) => (
  <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/60">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className={cn('mt-2 text-xl font-semibold text-white', accentClass)}>
      {value}
    </div>
    {sublabel ? <div className="text-xs text-white/60">{sublabel}</div> : null}
  </div>
);

const renderCategory = (category: EvaluatedCategory) => {
  const headerBadges = [
    {
      label: 'Completed',
      value: category.stats.achieved,
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    },
    {
      label: 'Likely',
      value: category.stats.likely,
      className: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    },
    {
      label: 'Manual',
      value: category.stats.manual,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    },
  ].filter((badge) => badge.value > 0);

  return (
    <Card
      key={category.key}
      className="border border-white/10 bg-gradient-to-br from-slate-900/65 via-slate-900/40 to-slate-900/30 backdrop-blur-lg"
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3 text-white">
              {category.name}
            </CardTitle>
            <p className="mt-1 text-sm text-white/60">{category.description}</p>
          </div>
          {headerBadges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {headerBadges.map((badge) => (
                <Badge
                  key={`${category.key}-${badge.label}`}
                  className={cn(
                    'border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    badge.className
                  )}
                >
                  {badge.label}: {badge.value}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {category.challenges.map((challenge) => {
            const statusMeta = STATUS_META[challenge.status];
            const StatusIcon = statusMeta.icon;
            const metaChips: string[] = [];

            if (challenge.manual) {
              metaChips.push('Manual verification');
            }
            if (challenge.meta.build) {
              metaChips.push(`Build: ${challenge.meta.build}`);
            }
            if (challenge.meta.gamemode) {
              metaChips.push(`Mode: ${challenge.meta.gamemode}`);
            }
            if (challenge.meta.runes?.length) {
              metaChips.push(`Runes: ${challenge.meta.runes.join(', ')}`);
            }
            if (challenge.meta.items?.length) {
              metaChips.push(`Items: ${challenge.meta.items.join(', ')}`);
            }

            return (
              <div
                key={challenge.id}
                className={cn(
                  'rounded-xl border px-4 py-4 transition-all duration-200 hover:border-white/40 hover:shadow-[0_18px_32px_-28px_rgba(148,163,184,0.65)]',
                  CARD_ACCENTS[challenge.status]
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-1 gap-3">
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border text-lg',
                        statusMeta.badgeClass
                      )}
                    >
                      <StatusIcon className="h-6 w-6" />
                    </span>
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {challenge.name}
                        </h3>
                        <p className="text-sm text-white/70">
                          {challenge.requirement}
                        </p>
                      </div>
                      {challenge.note ? (
                        <p className="text-sm text-white/80">
                          {challenge.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                      statusMeta.chipClass
                    )}
                  >
                    {statusMeta.label}
                  </Badge>
                </div>

                {challenge.evidence.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {challenge.evidence.map((item) => (
                        <div
                          key={`${challenge.id}-${item.label}`}
                          className="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-lg"
                        >
                          <div className="relative z-10">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                'mt-1 block text-lg font-bold',
                                item.accent === 'positive' &&
                                  'text-emerald-300',
                                item.accent === 'negative' && 'text-rose-300',
                                !item.accent && 'text-white'
                              )}
                            >
                              {item.value}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100',
                              item.accent === 'positive' &&
                                'bg-gradient-to-br from-emerald-500/10 to-transparent',
                              item.accent === 'negative' &&
                                'bg-gradient-to-br from-rose-500/10 to-transparent'
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {metaChips.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {metaChips.map((chip) => (
                      <Badge
                        key={`${challenge.id}-${chip}`}
                        variant="outline"
                        className="border-white/15 bg-white/5 text-xs font-medium uppercase tracking-wide text-white/70"
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export function YuumiChallengesTab({
  selectedPlayerData,
  matchData,
}: YuumiChallengesTabProps) {
  const evaluation = useMemo(() => {
    if (!selectedPlayerData) {
      return null;
    }

    return evaluateYuumiChallenges({
      participant: selectedPlayerData,
      matchData,
    });
  }, [selectedPlayerData, matchData]);

  if (!selectedPlayerData) {
    return (
      <Card className="border-white/10 bg-black/20 backdrop-blur">
        <CardContent className="py-12 text-center text-white/70">
          <Award className="mx-auto mb-4 h-12 w-12 text-white/40" />
          <p>
            Select a player from the overview to inspect Yuumi challenge
            eligibility.
          </p>
        </CardContent>
      </Card>
    );
  }

  const durationSeconds =
    selectedPlayerData.timePlayed ?? matchData.info?.gameDuration ?? 0;
  const durationMinutes = Math.max(durationSeconds / 60, 1);
  const kills = selectedPlayerData.kills ?? 0;
  const deaths = selectedPlayerData.deaths ?? 0;
  const assists = selectedPlayerData.assists ?? 0;
  const kdaRatio = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const killScore = kills + assists - deaths;
  const takedownsPerMinute = (kills + assists) / durationMinutes;
  const damage = selectedPlayerData.totalDamageDealtToChampions ?? 0;
  const healing = selectedPlayerData.totalHealsOnTeammates ?? 0;
  const shielding = selectedPlayerData.totalDamageShieldedOnTeammates ?? 0;
  const visionScore = selectedPlayerData.visionScore ?? 0;
  const visionPerMinute = visionScore / durationMinutes;

  const playerName =
    selectedPlayerData.riotIdGameName && selectedPlayerData.riotIdTagline
      ? `${selectedPlayerData.riotIdGameName}#${selectedPlayerData.riotIdTagline}`
      : (selectedPlayerData.summonerName ?? 'Unknown Summoner');
  const role = (
    selectedPlayerData.teamPosition ??
    selectedPlayerData.individualPosition ??
    'UNKNOWN'
  ).toUpperCase();

  const items = [
    selectedPlayerData.item0,
    selectedPlayerData.item1,
    selectedPlayerData.item2,
    selectedPlayerData.item3,
    selectedPlayerData.item4,
    selectedPlayerData.item5,
    selectedPlayerData.item6,
  ];

  const perks = selectedPlayerData.perks;
  const primaryStyle = perks?.styles?.find(
    (style) => style.description === 'primaryStyle'
  );
  const secondaryStyle = perks?.styles?.find(
    (style) => style.description === 'subStyle'
  );
  const keystone = primaryStyle?.selections?.[0];
  const primarySelections = primaryStyle?.selections?.slice(1) ?? [];
  const secondarySelections = secondaryStyle?.selections ?? [];
  const statPerks = perks?.statPerks;

  const summaryTotals = evaluation?.reduce<SummaryTotals>(
    (acc, category) => {
      acc.total += category.stats.total;
      acc.achieved += category.stats.achieved;
      acc.likely += category.stats.likely;
      acc.manual += category.stats.manual;
      return acc;
    },
    { total: 0, achieved: 0, likely: 0, manual: 0 }
  ) ?? { total: 0, achieved: 0, likely: 0, manual: 0 };

  const summaryBadges = [
    {
      label: 'Completed',
      value: summaryTotals.achieved,
      className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    },
    {
      label: 'Likely',
      value: summaryTotals.likely,
      className: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
    },
    {
      label: 'Manual',
      value: summaryTotals.manual,
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-gradient-to-br from-purple-500/20 via-indigo-600/10 to-slate-900/60 shadow-[0_40px_120px_-60px_rgba(79,70,229,0.85)] backdrop-blur-lg">
        <CardHeader className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ChampionIcon
                  championId={selectedPlayerData.championName}
                  size="lg"
                />
                <span className="absolute -bottom-1 -right-1 rounded-full border border-white/10 bg-black/80 px-2 text-xs font-semibold text-white">
                  Lv {selectedPlayerData.champLevel}
                </span>
              </div>
              <div>
                <CardTitle className="text-white">{playerName}</CardTitle>
                <p className="text-sm text-white/60">
                  {selectedPlayerData.championName} • {role}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {summaryBadges.map((badge) => (
                <Badge
                  key={badge.label}
                  className={cn(
                    'border px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur',
                    badge.className,
                    badge.value === 0 && 'opacity-60'
                  )}
                >
                  {badge.label}: {badge.value}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile
              icon={Target}
              label="Scoreline"
              value={`${kills}/${deaths}/${assists}`}
              sublabel={`KDA ${formatRate(kdaRatio, 2)}`}
            />
            <StatTile
              icon={Gauge}
              label="Impact"
              value={`${killScore >= 0 ? '+' : ''}${killScore}`}
              sublabel={`${formatRate(takedownsPerMinute, 2)} K+A per min`}
              accentClass={
                killScore >= 0 ? 'text-emerald-200' : 'text-rose-300'
              }
            />
            <StatTile
              icon={Swords}
              label="Damage"
              value={formatNumber(damage)}
              sublabel="To champions"
            />
            <StatTile
              icon={HeartPulse}
              label="Allied Support"
              value={formatNumber(healing)}
              sublabel={`Shields ${formatNumber(shielding)}`}
            />
            <StatTile
              icon={Eye}
              label="Vision"
              value={formatNumber(visionScore)}
              sublabel={`${formatRate(visionPerMinute, 2)} per min`}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Final Build
              </h3>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
                <ItemSlots items={items} size="lg" gridLayout />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Quick Stats
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-wide text-white/60">
                    Match Length
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {formatRate(durationMinutes, 1)} min
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-wide text-white/60">
                    Role
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Rune Setup
            </h3>
            <div className="mt-3 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Primary Path
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {keystone ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full border border-white/20 bg-white/10 p-2">
                          <RuneIcon
                            runeId={keystone.perk}
                            size="md"
                            variant="keystone"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="border-white/20 bg-black/85 text-white">
                        Keystone
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                  {primarySelections.map((selection) => (
                    <RuneIcon
                      key={`primary-${selection.perk}`}
                      runeId={selection.perk}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Secondary Path
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {secondarySelections.map((selection) => (
                    <RuneIcon
                      key={`secondary-${selection.perk}`}
                      runeId={selection.perk}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
              {statPerks ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Stat Shards
                  </p>
                  <div className="flex items-center gap-2">
                    <StatShardIcon
                      statShardId={statPerks.offense}
                      size="shard24"
                    />
                    <StatShardIcon
                      statShardId={statPerks.flex}
                      size="shard24"
                    />
                    <StatShardIcon
                      statShardId={statPerks.defense}
                      size="shard24"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {evaluation && evaluation.length > 0 ? (
        evaluation.map((category) => renderCategory(category))
      ) : (
        <Card className="border-white/10 bg-black/20 backdrop-blur">
          <CardContent className="py-10 text-center text-white/70">
            <p>No Yuumi challenge data available for this match.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
