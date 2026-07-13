'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  Cat,
  ChevronRight,
  Crown,
  Flame,
  Gem,
  History,
  Layers,
  Link2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useWebUser } from '@/lib/hooks/use-web-user';
import { api } from '@/../convex/_generated/api';
import { HextechPanel } from '@/components/ui/hextech-panel';
import { PanelSkeleton } from '@/components/ui/skeleton';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import {
  RuneIcon,
  RuneTreeIcon,
  StatShardIcon,
} from '@/components/ui/rune-display';
import { ItemSlot } from '@/components/match-history/item-slots';
import { SummonerSpell } from '@/components/match-history/summoner-spells';
import { GameCard, timeAgo } from '@/components/highelo/game-card';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { platformLabel } from '@/lib/highelo/regions';
import { parseMetaStats, winratePct } from '@/lib/highelo/meta-stats';
import { writeLastViewedProfile } from '@/lib/highelo/last-profile';
import { cn } from '@/lib/utils';
import type { ProfileParams } from './profile-data';

const STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};

function gamesLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`;
}

/** Winrate text tone — emerald above ~52%, red below ~48%, gold between
 *  (self-contained mirror of the Meta Report's scale). */
function winrateTone(pct: number): string {
  if (pct >= 52) return 'text-emerald-300';
  if (pct <= 48) return 'text-red-300';
  return 'text-hx-gold';
}

/** Winrate bar-fill tone, paired with {@link winrateTone}. */
function barTone(pct: number): string {
  if (pct >= 52) return 'bg-emerald-400/70';
  if (pct <= 48) return 'bg-red-400/60';
  return 'bg-hx-gold/70';
}

function GroupStats({ games, wins }: { games: number; wins: number }) {
  return (
    <span className="text-xs tracking-wide text-hx-gold/60">
      {gamesLabel(games)} · {Math.round((wins / games) * 100)}% WR
    </span>
  );
}

/** Ordered completed-item purchases, onetricks-style A → B → C. */
function BuildPathRow({
  path,
  games,
  wins,
}: {
  path: number[];
  games: number;
  wins: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {path.map((itemId, i) => (
          <Fragment key={`${itemId}-${i}`}>
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-hx-gold/40"
                aria-hidden
              />
            )}
            <ItemSlot itemId={itemId} size="lg" />
          </Fragment>
        ))}
      </div>
      <GroupStats games={games} wins={wins} />
    </div>
  );
}

type RunePageGroup = {
  keystoneId: number;
  secondaryStyleId: number;
  summonerSpells: number[];
  games: number;
  wins: number;
  primaryRunes?: number[];
  secondaryRunes?: number[];
  statShards?: number[];
};

/**
 * Full rune page + summoner spells. Rows ingested before the build-snapshot
 * enrichment only carry the keystone and secondary style; they render the
 * old compact form until the backfill patches them.
 */
function RunePageRow({ page }: { page: RunePageGroup }) {
  const { secondaryRunes, statShards } = page;
  const keystoneId = page.primaryRunes?.[0] ?? page.keystoneId;
  const primaryMinors = page.primaryRunes?.slice(1) ?? [];
  const full =
    primaryMinors.length > 0 &&
    secondaryRunes !== undefined &&
    statShards !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5">
        <RuneIcon runeId={keystoneId} size="md" variant="keystone" />
        {primaryMinors.map((id) => (
          <RuneIcon key={id} runeId={id} size="sm" />
        ))}
      </div>
      {full && secondaryRunes && statShards ? (
        <>
          <div className="flex items-center gap-1.5 border-l border-hx-gold-dark/30 pl-4">
            <RuneTreeIcon treeId={page.secondaryStyleId} size="sm" />
            {secondaryRunes.map((id) => (
              <RuneIcon key={id} runeId={id} size="sm" />
            ))}
          </div>
          <div className="flex items-center gap-1 border-l border-hx-gold-dark/30 pl-4">
            {statShards.map((id, i) => (
              <StatShardIcon key={`${id}-${i}`} statShardId={id} size="md" />
            ))}
          </div>
        </>
      ) : (
        <span className="text-sm text-hx-gold">
          {STYLE_NAMES[page.secondaryStyleId] ?? 'Unknown'} secondary
        </span>
      )}
      <div className="flex items-center gap-1 border-l border-hx-gold-dark/30 pl-4">
        {page.summonerSpells.map((id) => (
          <SummonerSpell key={id} spellId={id} size="md" />
        ))}
      </div>
      <GroupStats games={page.games} wins={page.wins} />
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <HighEloTabs />
      {children}
    </div>
  );
}

function NotFound() {
  return (
    <Shell>
      <HextechPanel title="Player Not Found" className="mt-2">
        <p className="py-6 text-center text-sm text-hx-gold/60">
          This summoner isn&apos;t on the Master+ Yuumi ladder.
        </p>
        <div className="pb-4 text-center">
          <Link
            href="/players"
            className="btn-hextech rounded-sm px-4 py-2 text-xs"
          >
            Back to the ladder
          </Link>
        </div>
      </HextechPanel>
    </Shell>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-16 text-center">
      <div className="hex-title text-lg text-hx-gold-bright">{value}</div>
      <div className="mt-0.5 hex-label">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] tracking-wide">{sub}</div>}
    </div>
  );
}

// ---------- honors ----------

type Honor = {
  icon: ComponentType<{ className?: string }>;
  label: string;
};

const GAMES_MILESTONES: ReadonlyArray<[number, string]> = [
  [500, 'Yuumi Devotee · 500+ games'],
  [250, 'Book Club Regular · 250+ games'],
  [100, 'Century Cat · 100+ games'],
  [50, 'Committed · 50+ games'],
];

/**
 * Earned badges, derived purely from the profile payload. Positive-only:
 * an empty row simply doesn't render.
 */
function computeHonors(
  player: {
    gamesCount: number;
    wins: number;
    killsTotal: number;
    deathsTotal: number;
    assistsTotal: number;
    position: number | null;
  },
  recentGames: ReadonlyArray<{ win: boolean; deaths: number }>
): Honor[] {
  const honors: Honor[] = [];
  if (typeof player.position === 'number' && player.position > 0) {
    if (player.position <= 10) {
      honors.push({ icon: Crown, label: 'Top 10 Yuumi worldwide' });
    } else if (player.position <= 100) {
      honors.push({ icon: Crown, label: 'Top 100 Yuumi worldwide' });
    }
  }
  const milestone = GAMES_MILESTONES.find(
    ([games]) => player.gamesCount >= games
  );
  if (milestone) honors.push({ icon: Cat, label: milestone[1] });
  if (player.gamesCount >= 20) {
    const winrate = (player.wins / player.gamesCount) * 100;
    if (winrate >= 60) {
      honors.push({ icon: Sparkles, label: 'Dominant · 60%+ winrate' });
    } else if (winrate >= 55) {
      honors.push({ icon: Sparkles, label: 'Winning Cat · 55%+ winrate' });
    }
  }
  let streak = 0;
  for (const game of recentGames) {
    if (!game.win) break;
    streak++;
  }
  if (streak >= 3) {
    honors.push({ icon: Flame, label: `${streak}-game win streak` });
  }
  if (recentGames.some((game) => game.win && game.deaths === 0)) {
    honors.push({ icon: ShieldCheck, label: 'Untouchable · deathless win' });
  }
  if (player.gamesCount >= 10 && player.deathsTotal > 0) {
    const kda = (player.killsTotal + player.assistsTotal) / player.deathsTotal;
    if (kda >= 8) {
      honors.push({ icon: Trophy, label: 'KDA Machine · 8+ average' });
    }
  }
  return honors;
}

// ---------- LP form sparkline ----------

const SPARK_W = 300;
const SPARK_H = 64;
const SPARK_PAD = 6;

/** Inline LP-over-time sparkline from daily ladder snapshots. */
function LpSparkline({
  points,
}: {
  points: ReadonlyArray<{ takenAt: number; lp: number }>;
}) {
  const lps = points.map((p) => p.lp);
  const min = Math.min(...lps);
  const max = Math.max(...lps);
  // A flat line still needs a visible range to sit mid-chart.
  const range = max - min || 20;
  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? SPARK_W / 2
        : (i / (points.length - 1)) * (SPARK_W - SPARK_PAD * 2) + SPARK_PAD;
    const y =
      SPARK_H - SPARK_PAD - ((p.lp - min) / range) * (SPARK_H - SPARK_PAD * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const last = coords[coords.length - 1];
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="h-16 w-full text-hx-magic"
      role="img"
      aria-label={`LP over time, from ${min} to ${max}`}
    >
      <polygon
        points={`${SPARK_PAD},${SPARK_H} ${line} ${SPARK_W - SPARK_PAD},${SPARK_H}`}
        fill="currentColor"
        opacity="0.12"
      />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />}
    </svg>
  );
}

function shortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Gain/loss coloring for the LP-form header chip. */
function cnDelta(delta: number): string {
  return `hex-title text-sm ${delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`;
}

// ---------- account: supporter badge, refresh, icon-verified linking ----------

/** Gem chip shown when a verified supporter owns this profile. */
function SupporterBadge({ puuid }: { puuid: string }) {
  const isSupporter = useQuery(api.webauth.getSupporterBadge, { puuid });
  if (!isSupporter) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-hx-magic/50 bg-hx-magic/10 px-2 py-0.5 align-middle text-[10px] tracking-widest text-hx-magic-bright uppercase shadow-[0_0_12px_oklch(0.7_0.15_200_/_0.25)]">
      <Gem className="h-3 w-3" aria-hidden />
      Supporter
    </span>
  );
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Refresh + account controls under the identity header: manual refresh
 * with the shared 5-minute cooldown, auto-refresh for the verified
 * subscribed owner, and the icon-challenge linking flow (equip a starter
 * icon 0-29 we pick — never the current one — then verify).
 */
function ProfileAccountRow({ puuid }: { puuid: string }) {
  const { user, token, refresh: refreshMe } = useWebUser();
  const refreshPlayer = useAction(api.highelo.refreshPlayer);
  const startLink = useAction(api.webauth.startAccountLink);
  const verifyLink = useAction(api.webauth.verifyAccountLink);
  const unlink = useMutation(api.webauth.unlinkAccount);

  const [busy, setBusy] = useState(false);
  const [nextAllowedAt, setNextAllowedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [challenge, setChallenge] = useState<{
    iconId: number;
    expiresAt: number;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ddVersion, setDdVersion] = useState<string | null>(null);

  // Ticking clock for the cooldown / challenge countdowns.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  // Full ddragon version for profile-icon images (e.g. '16.13.1').
  useEffect(() => {
    fetch('/api/data-dragon/version')
      .then((res) => res.json())
      .then((data: { version?: string }) => {
        if (typeof data.version === 'string') setDdVersion(data.version);
      })
      .catch(() => {});
  }, []);

  const isOwner = user?.linkedPuuid === puuid;
  const doRefresh = useCallback(async () => {
    setBusy(true);
    try {
      const result = await refreshPlayer({
        puuid,
        ...(token ? { token } : {}),
      });
      setNextAllowedAt(result.nextAllowedAt);
    } catch {
      setNotice('Refresh is unavailable right now.');
    } finally {
      setBusy(false);
    }
  }, [refreshPlayer, puuid, token]);

  // Subscriber perk: keep the owner's profile fresh while they watch it.
  const autoRefresh = Boolean(user?.subscribed && isOwner);
  useEffect(() => {
    if (!autoRefresh) return;
    void doRefresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void doRefresh();
    }, 90_000);
    return () => clearInterval(timer);
  }, [autoRefresh, doRefresh]);

  const cooldownLeft = nextAllowedAt - now;
  const pending =
    challenge ??
    (user?.pendingLink && user.pendingLink.puuid === puuid
      ? {
          iconId: user.pendingLink.iconId,
          expiresAt: user.pendingLink.expiresAt,
        }
      : null);

  return (
    <div className="hex-card mt-3 rounded-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void doRefresh()}
          disabled={busy || cooldownLeft > 0}
          className="btn-hextech inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', busy && 'animate-spin')}
            aria-hidden
          />
          {cooldownLeft > 0
            ? `Refresh in ${formatCountdown(cooldownLeft)}`
            : 'Refresh profile'}
        </button>
        {autoRefresh && (
          <span className="inline-flex items-center gap-1 text-[11px] tracking-wide text-hx-magic-bright">
            <Zap className="h-3 w-3" aria-hidden /> Auto-refresh on
          </span>
        )}
        <span className="flex-1" />
        {user && isOwner && !user.subscribed && (
          <button
            type="button"
            onClick={() => {
              void fetch(
                `/api/stripe/checkout?return=${encodeURIComponent(window.location.pathname)}`,
                { method: 'POST' }
              )
                .then((res) => res.json())
                .then((data: { url?: string; error?: string }) => {
                  if (data.url) window.location.assign(data.url);
                  else setNotice(data.error ?? 'Subscriptions open soon.');
                })
                .catch(() => setNotice('Subscriptions open soon.'));
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-hx-magic/50 bg-hx-magic/10 px-3 py-1.5 text-xs text-hx-magic-bright transition-colors hover:bg-hx-magic/20"
          >
            <Gem className="h-3.5 w-3.5" aria-hidden />
            Support for 1€/mo — unlock auto-refresh
          </button>
        )}
        {user && isOwner && (
          <span className="inline-flex items-center gap-2 text-[11px] tracking-wide text-hx-gold/60">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            Verified — this is you
            <button
              type="button"
              onClick={() => {
                if (token) void unlink({ token }).then(refreshMe);
              }}
              className="text-hx-gold/40 underline-offset-2 hover:underline"
            >
              Unlink
            </button>
          </span>
        )}
        {user && !isOwner && !pending && (
          <button
            type="button"
            onClick={() => {
              if (!token) return;
              setNotice(null);
              startLink({ token, puuid })
                .then((result) => setChallenge(result))
                .catch(() =>
                  setNotice('Could not start verification — try again later.')
                );
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-hx-gold-dark/40 px-3 py-1.5 text-xs text-hx-gold/70 transition-colors hover:border-hx-gold hover:text-hx-gold-bright"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            This is my account
          </button>
        )}
        {!user && (
          <a
            href={`/api/auth/discord/login?return=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.pathname : '/'
            )}`}
            className="text-[11px] tracking-wide text-hx-gold/50 underline-offset-2 hover:underline"
          >
            Sign in with Discord to claim this profile
          </a>
        )}
      </div>

      {/* Icon-challenge verification */}
      {user && !isOwner && pending && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-hx-gold-dark/30 pt-3">
          {ddVersion && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/profileicon/${pending.iconId}.png`}
              alt={`Summoner icon ${pending.iconId}`}
              width={48}
              height={48}
              className="rounded-sm border border-hx-gold/50"
            />
          )}
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-hx-gold/70">
            In the League client, change this account&apos;s summoner icon to
            the starter icon shown here, save, then verify.
            <span className="ml-1 text-hx-gold/40">
              Challenge expires in {formatCountdown(pending.expiresAt - now)}.
            </span>
          </div>
          <button
            type="button"
            disabled={busy || pending.expiresAt < now}
            onClick={() => {
              if (!token) return;
              setBusy(true);
              setNotice(null);
              verifyLink({ token })
                .then((result) => {
                  if (result.linked) {
                    setChallenge(null);
                    refreshMe();
                  } else if (result.reason === 'icon_mismatch') {
                    setNotice(
                      "Icon doesn't match yet — save it in the client, wait a few seconds, and try again."
                    );
                  } else {
                    setChallenge(null);
                    setNotice('Challenge expired — start again.');
                  }
                })
                .catch(() => setNotice('Verification failed — try again.'))
                .finally(() => setBusy(false));
            }}
            className="btn-hextech rounded-sm px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      )}
      {notice && (
        <p className="mt-2 text-[11px] tracking-wide text-amber-300/90">
          {notice}
        </p>
      )}
    </div>
  );
}

export function ProfileClient({ params }: { params: ProfileParams | null }) {
  const profile = useQuery(api.highelo.getPlayerProfile, params ?? 'skip');
  // Daily ladder snapshots (form sparkline) and the meta blob (ladder-
  // average comparison); both render progressively when they arrive.
  const snapshots = useQuery(
    api.meta.getPlayerSnapshots,
    profile ? { puuid: profile.player.puuid } : 'skip'
  );
  const metaRaw = useQuery(api.meta.getMetaStats);

  // Remember this profile so the ladder page can offer a "continue" pin.
  useEffect(() => {
    if (!profile) return;
    writeLastViewedProfile({
      puuid: profile.player.puuid,
      platform: profile.player.platform,
      gameName: profile.player.gameName,
      tagLine: profile.player.tagLine,
    });
  }, [profile]);

  const ladderWinrate = useMemo(() => {
    const parsed = metaRaw == null ? null : parseMetaStats(metaRaw);
    const totals = parsed?.window.totals;
    return totals && totals.games >= 100 ? winratePct(totals) : null;
  }, [metaRaw]);

  const honors = useMemo(
    () => (profile ? computeHonors(profile.player, profile.recentGames) : []),
    [profile]
  );

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (params === null || profile !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [params, profile]);
  // Render-time reset keeps the React Compiler happy (same pattern as the
  // games feed).
  if (profile !== undefined && timedOut) setTimedOut(false);

  if (params === null || profile === null) {
    return <NotFound />;
  }

  if (profile === undefined) {
    return (
      <Shell>
        {timedOut ? (
          <p className="py-10 text-center text-sm text-hx-gold/60">
            This profile is unavailable right now — please try again later.
          </p>
        ) : (
          <div className="space-y-4" aria-busy>
            <PanelSkeleton className="h-28" />
            {Array.from({ length: 3 }, (_, i) => (
              <PanelSkeleton key={i} className="h-40" />
            ))}
          </div>
        )}
      </Shell>
    );
  }

  const { player } = profile;
  // Deploy-skew guard: a client built with the new schema can briefly talk
  // to a deployment whose profile query predates these fields — treat every
  // newly-added field as possibly-undefined and degrade gracefully.
  const buildPaths = profile.buildPaths ?? [];
  const patchSplits = profile.patchSplits ?? [];
  const records = profile.records ?? null;
  const winrate =
    player.gamesCount > 0
      ? Math.round((player.wins / player.gamesCount) * 100)
      : 0;
  const kda =
    player.deathsTotal === 0
      ? 'Perfect'
      : (
          (player.killsTotal + player.assistsTotal) /
          player.deathsTotal
        ).toFixed(2);
  const showPosition =
    typeof player.position === 'number' && player.position > 0;
  const showRegionPosition =
    typeof player.regionPosition === 'number' && player.regionPosition > 0;
  const winrateDelta =
    ladderWinrate !== null && player.gamesCount >= 20
      ? winrate - ladderWinrate
      : null;
  const firstSnap = snapshots?.[0];
  const lastSnap = snapshots?.[snapshots.length - 1];
  const lpDelta = firstSnap && lastSnap ? lastSnap.lp - firstSnap.lp : 0;

  return (
    <Shell>
      {/* Identity header */}
      <div className="hex-card flex flex-wrap items-center gap-4 rounded-sm p-4 sm:p-5">
        <Image
          src={`/images/ranked/${player.tier.toLowerCase()}.png`}
          alt={player.tier}
          width={72}
          height={72}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="hex-title text-xl text-hx-gold-bright sm:text-2xl">
            {player.gameName}
            <span className="ml-1.5 text-sm font-normal tracking-normal text-hx-gold/50">
              #{player.tagLine}
            </span>
            <SupporterBadge puuid={player.puuid} />
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs tracking-wide text-hx-gold/60">
            <span className="hex-chip-magic">
              {platformLabel(player.platform)}
            </span>
            <span className="capitalize">{player.tier.toLowerCase()}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat label="LP" value={player.lp} />
          {showPosition && (
            <Stat label="Yuumi worldwide" value={`#${player.position}`} />
          )}
          {showRegionPosition && (
            <Stat
              label={`In ${platformLabel(player.platform)}`}
              value={`#${player.regionPosition}`}
            />
          )}
          <Stat
            label={`${player.gamesCount} games`}
            value={player.gamesCount < 5 ? 'Early season' : `${winrate}%`}
            sub={
              winrateDelta !== null ? (
                <span
                  className={
                    winrateDelta >= 0 ? 'text-emerald-300' : 'text-red-300'
                  }
                >
                  {winrateDelta >= 0 ? '+' : ''}
                  {winrateDelta}% vs ladder
                </span>
              ) : undefined
            }
          />
          <Stat label="Avg KDA" value={kda} />
        </div>

        {/* Honors — earned badges, hidden when none apply */}
        {honors.length > 0 && (
          <div className="flex w-full flex-wrap gap-1.5 border-t border-hx-gold-dark/30 pt-3">
            {honors.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-sm border border-hx-gold-dark/40 bg-hx-gold/5 px-2.5 py-1 text-[11px] tracking-wide text-hx-gold-bright"
              >
                <Icon className="h-3.5 w-3.5 text-hx-gold" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Refresh, supporter CTA, and icon-verified account linking */}
      <ProfileAccountRow puuid={player.puuid} />

      {/* LP form — appears once at least two daily snapshots exist */}
      {snapshots && snapshots.length >= 2 && firstSnap && lastSnap && (
        <HextechPanel
          title="LP Form"
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          className="mt-6"
          action={
            <span className={cnDelta(lpDelta)}>
              {lpDelta >= 0 ? '+' : ''}
              {lpDelta} LP
            </span>
          }
        >
          <LpSparkline points={snapshots} />
          <div className="mt-1 flex justify-between text-[10px] tracking-wide text-hx-gold/40">
            <span>{shortDate(firstSnap.takenAt)}</span>
            <span>
              {shortDate(lastSnap.takenAt)} · {lastSnap.lp} LP
            </span>
          </div>
        </HextechPanel>
      )}

      {/* Season Journey — per-patch winrate splits, newest patch first.
          Hidden (empty array) against a deployment that predates patchSplits. */}
      {patchSplits.length > 0 && (
        <HextechPanel
          title="Season Journey"
          icon={<History className="h-4 w-4" aria-hidden />}
          className="mt-6"
        >
          <div className="space-y-2">
            {patchSplits.map((split) => {
              const pct = winratePct(split);
              return (
                <div key={split.patch} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs tracking-wide text-hx-gold/70 tabular-nums">
                    {split.patch}
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
                    {gamesLabel(split.games)}
                  </span>
                </div>
              );
            })}
          </div>
        </HextechPanel>
      )}

      {/* Records — season highlights; skipped entirely when the deployment
          predates the records field, or the player has no wins yet. */}
      {records && (records.longestWinStreak > 0 || records.bestGame) && (
        <HextechPanel
          title="Records"
          icon={<Trophy className="h-4 w-4" aria-hidden />}
          className="mt-6"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {records.longestWinStreak > 0 && (
              <div className="flex items-center gap-3 rounded-sm px-3 py-3 hex-card-inset">
                <Flame className="h-6 w-6 shrink-0 text-hx-gold" aria-hidden />
                <div className="min-w-0">
                  <div className="hex-title text-lg text-hx-gold-bright">
                    {records.longestWinStreak}
                    {records.longestWinStreak === 1 ? ' win' : ' wins'}
                  </div>
                  <div className="mt-0.5 hex-label">Longest win streak</div>
                </div>
              </div>
            )}
            {records.bestGame && (
              <Link
                href={`/match/${records.bestGame.matchId}`}
                className="flex items-center gap-3 rounded-sm px-3 py-3 hex-card-inset transition-colors hover:border-hx-gold"
              >
                <Sparkles
                  className="h-6 w-6 shrink-0 text-hx-gold"
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="hex-title text-lg text-hx-gold-bright">
                    {records.bestGame.kills} / {records.bestGame.deaths} /{' '}
                    {records.bestGame.assists}
                  </div>
                  <div className="mt-0.5 text-[11px] tracking-wide text-hx-gold/60">
                    Best game · {records.bestGame.patch} ·{' '}
                    {timeAgo(records.bestGame.gameCreation)}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </HextechPanel>
      )}

      {/* Common builds */}
      <HextechPanel
        title="Common Builds"
        icon={<Layers className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.builds.length === 0 &&
        buildPaths.length === 0 &&
        profile.runePages.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No build data yet — games are still being ingested.
          </p>
        ) : (
          <div className="space-y-4">
            {buildPaths.length > 0 && (
              <div className="space-y-3">
                <div className="hex-label">Build Path</div>
                {buildPaths.map((entry) => (
                  <BuildPathRow
                    key={entry.path.join(',')}
                    path={entry.path}
                    games={entry.games}
                    wins={entry.wins}
                  />
                ))}
              </div>
            )}
            {profile.builds.length > 0 && (
              <div
                className={
                  buildPaths.length > 0
                    ? 'space-y-3 border-t border-hx-gold-dark/30 pt-4'
                    : 'space-y-3'
                }
              >
                <div className="hex-label">Final Items</div>
                {profile.builds.map((build) => (
                  <div
                    key={build.items.join(',')}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="flex gap-1">
                      {build.items.map((itemId, i) => (
                        <ItemSlot
                          key={`${itemId}-${i}`}
                          itemId={itemId}
                          size="lg"
                        />
                      ))}
                    </div>
                    <GroupStats games={build.games} wins={build.wins} />
                  </div>
                ))}
              </div>
            )}
            {profile.runePages.length > 0 && (
              <div className="space-y-3 border-t border-hx-gold-dark/30 pt-4">
                <div className="hex-label">Runes &amp; Summoners</div>
                {profile.runePages.map((page) => (
                  <RunePageRow
                    key={`${(page.primaryRunes ?? [page.keystoneId]).join(',')}-${page.secondaryStyleId}-${page.summonerSpells.join(',')}`}
                    page={page}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </HextechPanel>

      {/* Duo partners */}
      <HextechPanel
        title="Duo Partners"
        icon={<Users className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.duos.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No duo data yet — games are still being ingested.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.duos.map((duo) => (
              <div key={duo.champion} className="flex items-center gap-3">
                <DataDragonImage
                  championId={duo.champion}
                  type="icon"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
                <span className="flex-1 text-sm font-semibold text-hx-gold-bright">
                  {duo.champion}
                </span>
                <span className="text-xs tracking-wide text-hx-gold/60">
                  {gamesLabel(duo.games)} ·{' '}
                  {Math.round((duo.wins / duo.games) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </HextechPanel>

      {/* Recent games */}
      <HextechPanel
        title="Recent Games"
        icon={<Trophy className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.recentGames.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No games recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.recentGames.map((game) => (
              <GameCard key={game._id} game={game} showBuild />
            ))}
          </div>
        )}
      </HextechPanel>
    </Shell>
  );
}
