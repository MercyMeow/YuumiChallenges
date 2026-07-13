'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import {
  Activity,
  Globe,
  History,
  Sparkles,
  Swords,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import { RuneIcon } from '@/components/ui/rune-display';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { timeAgo } from '@/components/highelo/game-card';
import { useRuneData } from '@/hooks/use-rune-data';
import { platformLabel } from '@/lib/highelo/regions';
import {
  avgKda,
  parseMetaStats,
  winratePct,
  type ChampionStat,
  type MetaScope,
  type MetaStats,
  type WinCount,
} from '@/lib/highelo/meta-stats';
import {
  ADC_MATCHUPS,
  SUPPORT_MATCHUPS,
  ADC_CHAMPIONS,
  SUPPORT_CHAMPIONS,
} from '@/lib/matchups';
import { cn } from '@/lib/utils';

// Groups under this many games are hidden outright; between this and
// SOLID_SAMPLE_GAMES they render dimmed with a low-sample marker.
const MIN_SHOWN_GAMES = 5;
const SOLID_SAMPLE_GAMES = 20;
// Sorting a board by winrate only makes sense past a floor of games.
const WINRATE_SORT_MIN_GAMES = 10;

type Scope = 'window' | 'season';
type BoardSort = 'games' | 'winrate';

function winrateTone(pct: number): string {
  if (pct >= 52) return 'text-emerald-300';
  if (pct <= 48) return 'text-red-300';
  return 'text-hx-gold';
}

function barTone(pct: number): string {
  if (pct >= 52) return 'bg-emerald-400/70';
  if (pct <= 48) return 'bg-red-400/60';
  return 'bg-hx-gold/70';
}

/** Winrate as a labelled gold/emerald/red bar, the report's core mark. */
function WinrateBar({ stat }: { stat: WinCount }) {
  const pct = winratePct(stat);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-hx-black/60 sm:w-24">
        <div
          className={cn('h-full', barTone(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn('w-9 text-right text-sm tabular-nums', winrateTone(pct))}
      >
        {pct}%
      </span>
    </div>
  );
}

function gamesLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`;
}

/** Big number + engraved label, for the pulse row. */
function PulseTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="hex-card flex flex-col items-center gap-1 rounded-sm px-3 py-4 text-center">
      <div className="hex-title text-xl text-hx-gold-bright sm:text-2xl">
        {value}
      </div>
      <div className="hex-label">{label}</div>
      {sub && (
        <div className="text-[11px] tracking-wide text-hx-gold/50">{sub}</div>
      )}
    </div>
  );
}

const SYNERGY_TONE: Record<string, string> = {
  Excellent: 'border-emerald-400/50 text-emerald-300',
  'Very Good': 'border-emerald-400/40 text-emerald-300/90',
  Good: 'border-hx-gold/50 text-hx-gold-bright',
  Average: 'border-hx-gold-dark/50 text-hx-gold/60',
  Situational: 'border-amber-400/40 text-amber-300/90',
  Poor: 'border-red-400/50 text-red-300',
};

const DIFFICULTY_TONE: Record<string, string> = {
  Easy: 'border-emerald-400/50 text-emerald-300',
  Medium: 'border-hx-gold/50 text-hx-gold-bright',
  Hard: 'border-red-400/50 text-red-300',
};

/** "Guide: …" chip — the static guide's verdict beside the live number. */
function GuideChip({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] tracking-wider uppercase',
        tone
      )}
    >
      Guide: {label}
    </span>
  );
}

function LowSampleMark() {
  return (
    <span
      className="text-[10px] tracking-wider text-hx-gold/40 uppercase"
      title="Fewer than 20 games — treat with caution"
    >
      low sample
    </span>
  );
}

/** Champion icon + name + games + winrate row shared by the boards. */
function ChampionRow({
  champion,
  stat,
  extra,
  chip,
}: {
  champion: string;
  stat: WinCount;
  extra?: ReactNode;
  chip?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-hx-gold-dark/15 py-2 last:border-b-0',
        stat.games < SOLID_SAMPLE_GAMES && 'opacity-70'
      )}
    >
      <DataDragonImage
        championId={champion}
        type="icon"
        width={32}
        height={32}
        className="shrink-0 rounded-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-hx-gold-bright">
            {champion}
          </span>
          {chip}
          {stat.games < SOLID_SAMPLE_GAMES && <LowSampleMark />}
        </div>
        <div className="text-[11px] tracking-wide text-hx-gold/50">
          {gamesLabel(stat.games)}
          {extra}
        </div>
      </div>
      <WinrateBar stat={stat} />
    </div>
  );
}

function SortToggle({
  sort,
  onChange,
}: {
  sort: BoardSort;
  onChange: (sort: BoardSort) => void;
}) {
  return (
    <div className="flex gap-1">
      {(['games', 'winrate'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            'rounded-sm border px-2 py-1 text-[10px] tracking-widest uppercase transition-colors',
            sort === value
              ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
              : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
          )}
        >
          {value === 'games' ? 'Most played' : 'Winrate'}
        </button>
      ))}
    </div>
  );
}

function sortBoard<T extends WinCount>(entries: T[], sort: BoardSort): T[] {
  const shown = entries.filter((e) => e.games >= MIN_SHOWN_GAMES);
  if (sort === 'games') {
    return [...shown].sort((a, b) => b.games - a.games);
  }
  return [...shown]
    .filter((e) => e.games >= WINRATE_SORT_MIN_GAMES)
    .sort((a, b) => winratePct(b) - winratePct(a) || b.games - a.games);
}

/** One Enemy Threats column (supports or ADCs), hardest matchups first. */
function ThreatColumn({
  heading,
  entries,
  chipFor,
}: {
  heading: string;
  entries: ChampionStat[];
  chipFor: (champion: string) => ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 hex-label">{heading}</div>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-hx-gold/50">
          Not enough games yet.
        </p>
      ) : (
        entries.map((entry) => (
          <ChampionRow
            key={entry.champion}
            champion={entry.champion}
            stat={entry}
            chip={chipFor(entry.champion)}
          />
        ))
      )}
    </div>
  );
}

export function StatsClient() {
  const raw = useQuery(api.meta.getMetaStats);
  const { getRuneById } = useRuneData();
  const [scope, setScope] = useState<Scope>('window');
  const [duoSort, setDuoSort] = useState<BoardSort>('games');
  const [threatSort, setThreatSort] = useState<BoardSort>('games');

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period (site-wide pattern).
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (raw !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [raw]);
  if (raw !== undefined && timedOut) setTimedOut(false);

  const stats: MetaStats | null = useMemo(
    () => (raw === undefined || raw === null ? null : parseMetaStats(raw)),
    [raw]
  );
  const data: MetaScope | null = stats ? stats[scope] : null;

  const duos = useMemo(
    () => (data ? sortBoard(data.duos, duoSort).slice(0, 15) : []),
    [data, duoSort]
  );
  const enemySupports = useMemo(
    () =>
      data
        ? sortBoard(
            data.enemies.filter(
              (e) =>
                e.champion !== 'Yuumi' && SUPPORT_CHAMPIONS.includes(e.champion)
            ),
            threatSort
          ).slice(0, 12)
        : [],
    [data, threatSort]
  );
  const enemyAdcs = useMemo(
    () =>
      data
        ? sortBoard(
            data.enemies.filter((e) => ADC_CHAMPIONS.includes(e.champion)),
            threatSort
          ).slice(0, 12)
        : [],
    [data, threatSort]
  );

  // Pulse row derivations.
  const totals = data?.totals ?? { games: 0, wins: 0 };
  const patchDelta = useMemo(() => {
    if (!stats) return null;
    const [current, previous] = stats.patchWindow;
    if (!current || !previous) return null;
    const cur = stats.patchTrend.find((p) => p.patch === current);
    const prev = stats.patchTrend.find((p) => p.patch === previous);
    if (!cur || !prev || cur.games < 50 || prev.games < 50) return null;
    return { patch: current, delta: winratePct(cur) - winratePct(prev) };
  }, [stats]);
  const bestDuo = useMemo(() => {
    if (!data) return null;
    const eligible = data.duos.filter((d) => d.games >= SOLID_SAMPLE_GAMES);
    if (eligible.length === 0) return null;
    return eligible.reduce((best, d) =>
      winratePct(d) > winratePct(best) ? d : best
    );
  }, [data]);

  const keystones = data
    ? data.keystones.filter((k) => k.games >= MIN_SHOWN_GAMES)
    : [];
  const maxDurationGames = data
    ? Math.max(1, ...data.durations.map((d) => d.games))
    : 1;
  const regions = data
    ? data.regions.filter((r) => r.games >= MIN_SHOWN_GAMES)
    : [];
  const trend = stats
    ? stats.patchTrend.filter((p) => p.games >= MIN_SHOWN_GAMES)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="Forged from Master+ games">
        The Meta Report
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        Duo synergies, matchups, keystones and scaling — aggregated from every
        Master+ solo queue Yuumi game the feed has seen, recomputed hourly
      </p>

      <HighEloTabs />

      {stats === null ? (
        timedOut || raw === null ? (
          <p className="py-16 text-center text-sm text-hx-gold/60">
            {raw === null
              ? 'The meta report is still being computed — check back within the hour.'
              : 'The meta report is unavailable right now — please try again later.'}
          </p>
        ) : (
          <div className="space-y-4" aria-busy>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="hex-card h-24 animate-pulse rounded-sm opacity-50"
                />
              ))}
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="hex-card h-52 animate-pulse rounded-sm opacity-50"
              />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Scope toggle */}
          <div className="mb-6 flex justify-center gap-1">
            {(
              [
                { value: 'window', label: 'Current patches' },
                { value: 'season', label: 'Full season' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                aria-pressed={scope === option.value}
                className={cn(
                  'rounded-sm border px-4 py-1.5 text-xs tracking-widest uppercase transition-colors',
                  scope === option.value
                    ? 'border-hx-magic bg-hx-magic/10 text-hx-magic-bright'
                    : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Pulse row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PulseTile
              label="Games analyzed"
              value={totals.games.toLocaleString('en-US')}
              sub={
                scope === 'window' && stats.patchWindow.length > 0
                  ? `patch ${stats.patchWindow.join(' & ')}`
                  : 'this season'
              }
            />
            <PulseTile
              label="Ladder winrate"
              value={
                <span className={winrateTone(winratePct(totals))}>
                  {winratePct(totals)}%
                </span>
              }
              sub="all Master+ Yuumis"
            />
            <PulseTile
              label="Patch over patch"
              value={
                patchDelta ? (
                  <span
                    className={
                      patchDelta.delta >= 0
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }
                  >
                    {patchDelta.delta > 0 ? '+' : ''}
                    {patchDelta.delta}%
                  </span>
                ) : (
                  '–'
                )
              }
              sub={
                patchDelta
                  ? `winrate shift on ${patchDelta.patch}`
                  : 'needs more games'
              }
            />
            <PulseTile
              label="Best duo"
              value={
                bestDuo ? (
                  <span className="flex items-center justify-center gap-2">
                    <DataDragonImage
                      championId={bestDuo.champion}
                      type="icon"
                      width={28}
                      height={28}
                      className="rounded-sm"
                    />
                    <span
                      className={winrateTone(winratePct(bestDuo))}
                    >{`${winratePct(bestDuo)}%`}</span>
                  </span>
                ) : (
                  '–'
                )
              }
              sub={
                bestDuo
                  ? `${bestDuo.champion} · ${gamesLabel(bestDuo.games)}`
                  : 'needs more games'
              }
            />
          </div>

          {/* Duo synergy board */}
          <HextechPanel
            title="Duo Synergy Board"
            icon={<Users className="h-4 w-4" aria-hidden />}
            className="mt-6"
            action={<SortToggle sort={duoSort} onChange={setDuoSort} />}
          >
            <p className="mb-3 text-[11px] tracking-wide text-hx-gold/50">
              Yuumi&apos;s winrate by bot-lane ally, with her average KDA
              alongside — and what the guide says about the pairing.
            </p>
            {duos.length === 0 ? (
              <p className="py-6 text-center text-sm text-hx-gold/60">
                Not enough games yet — the feed is still gathering data.
              </p>
            ) : (
              duos.map((duo) => {
                const synergy = ADC_MATCHUPS[duo.champion]?.synergy;
                return (
                  <ChampionRow
                    key={duo.champion}
                    champion={duo.champion}
                    stat={duo}
                    extra={<> · {avgKda(duo)} avg KDA</>}
                    chip={
                      synergy ? (
                        <GuideChip
                          label={synergy}
                          tone={
                            SYNERGY_TONE[synergy] ??
                            'border-hx-gold-dark/50 text-hx-gold/60'
                          }
                        />
                      ) : undefined
                    }
                  />
                );
              })
            )}
          </HextechPanel>

          {/* Enemy threats */}
          <HextechPanel
            title="Enemy Threats"
            icon={<Swords className="h-4 w-4" aria-hidden />}
            className="mt-6"
            action={<SortToggle sort={threatSort} onChange={setThreatSort} />}
          >
            <p className="mb-3 text-[11px] tracking-wide text-hx-gold/50">
              Yuumi&apos;s winrate when a champion appears anywhere on the enemy
              team — low numbers mark real threats. Guide chips show the matchup
              page&apos;s difficulty rating for comparison.
            </p>
            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
              <ThreatColumn
                heading="Enemy Supports"
                entries={enemySupports}
                chipFor={(champion) => {
                  const difficulty = SUPPORT_MATCHUPS[champion]?.difficulty;
                  return difficulty ? (
                    <GuideChip
                      label={difficulty}
                      tone={
                        DIFFICULTY_TONE[difficulty] ??
                        'border-hx-gold-dark/50 text-hx-gold/60'
                      }
                    />
                  ) : undefined;
                }}
              />
              <ThreatColumn
                heading="Enemy Carries"
                entries={enemyAdcs}
                chipFor={() => undefined}
              />
            </div>
          </HextechPanel>

          {/* Keystones + scaling, side by side on wide screens */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <HextechPanel
              title="Keystone Winrates"
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
            >
              {keystones.length === 0 ? (
                <p className="py-6 text-center text-sm text-hx-gold/60">
                  Not enough games yet.
                </p>
              ) : (
                keystones.map((keystone) => (
                  <div
                    key={keystone.id}
                    className={cn(
                      'flex items-center gap-3 border-b border-hx-gold-dark/15 py-2 last:border-b-0',
                      keystone.games < SOLID_SAMPLE_GAMES && 'opacity-70'
                    )}
                  >
                    <RuneIcon
                      runeId={keystone.id}
                      size="md"
                      variant="keystone"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-sm font-semibold text-hx-gold-bright">
                          {getRuneById(keystone.id)?.name ??
                            `Rune ${keystone.id}`}
                        </span>
                        {keystone.games < SOLID_SAMPLE_GAMES && (
                          <LowSampleMark />
                        )}
                      </div>
                      <div className="text-[11px] tracking-wide text-hx-gold/50">
                        {gamesLabel(keystone.games)}
                      </div>
                    </div>
                    <WinrateBar stat={keystone} />
                  </div>
                ))
              )}
            </HextechPanel>

            <HextechPanel
              title="Does Yuumi Scale?"
              icon={<TrendingUp className="h-4 w-4" aria-hidden />}
            >
              <p className="mb-3 text-[11px] tracking-wide text-hx-gold/50">
                Winrate by game length — the definitive answer, one bar per
                bracket.
              </p>
              <div className="space-y-2.5">
                {data?.durations.map((bucket) => {
                  const pct = winratePct(bucket);
                  return (
                    <div key={bucket.key} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-right text-xs tracking-wide text-hx-gold/60 tabular-nums">
                        {bucket.key}m
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-hx-black/60">
                        <div
                          className={cn('h-full', barTone(pct))}
                          style={{
                            width: `${bucket.games === 0 ? 0 : pct}%`,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          'w-9 shrink-0 text-right text-sm tabular-nums',
                          winrateTone(pct)
                        )}
                      >
                        {bucket.games === 0 ? '–' : `${pct}%`}
                      </span>
                      <span
                        className="w-20 shrink-0 text-right text-[10px] tracking-wide text-hx-gold/40"
                        style={{
                          opacity:
                            0.5 + (bucket.games / maxDurationGames) * 0.5,
                        }}
                      >
                        {gamesLabel(bucket.games)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </HextechPanel>
          </div>

          {/* Patch trend + regions */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <HextechPanel
              title="Patch Trend"
              icon={<History className="h-4 w-4" aria-hidden />}
            >
              {trend.length === 0 ? (
                <p className="py-6 text-center text-sm text-hx-gold/60">
                  Not enough games yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {trend.map((patch) => {
                    const pct = winratePct(patch);
                    return (
                      <div
                        key={patch.patch}
                        className="flex items-center gap-3"
                      >
                        <span className="w-12 shrink-0 text-xs tracking-wide text-hx-gold/70 tabular-nums">
                          {patch.patch}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-sm bg-hx-black/60">
                          <div
                            className={cn('h-full', barTone(pct))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'w-9 shrink-0 text-right text-sm tabular-nums',
                            winrateTone(pct)
                          )}
                        >
                          {pct}%
                        </span>
                        <span className="w-20 shrink-0 text-right text-[10px] tracking-wide text-hx-gold/40">
                          {gamesLabel(patch.games)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </HextechPanel>

            <HextechPanel
              title="Around the World"
              icon={<Globe className="h-4 w-4" aria-hidden />}
            >
              {regions.length === 0 ? (
                <p className="py-6 text-center text-sm text-hx-gold/60">
                  Not enough games yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {regions.map((region) => {
                    const pct = winratePct(region);
                    return (
                      <div
                        key={region.platform}
                        className="flex flex-col items-center gap-0.5 rounded-sm px-2 py-2.5 hex-card-inset"
                      >
                        <span className="hex-chip-magic">
                          {platformLabel(region.platform)}
                        </span>
                        <span
                          className={cn(
                            'hex-title text-base',
                            winrateTone(pct)
                          )}
                        >
                          {pct}%
                        </span>
                        <span className="text-[10px] tracking-wide text-hx-gold/40">
                          {gamesLabel(region.games)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </HextechPanel>
          </div>

          {/* Provenance */}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-center text-[11px] tracking-wide text-hx-gold/40">
            <Activity className="h-3 w-3" aria-hidden />
            Computed {timeAgo(stats.computedAt)} from{' '}
            {stats.scanned.toLocaleString('en-US')} stored games · refreshed
            hourly · winrates are from the Yuumi player&apos;s perspective
          </p>
        </>
      )}
    </div>
  );
}
