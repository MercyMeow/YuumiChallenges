'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { AbilityIcon, DataDragonImage } from '@/components/ui/datadragon-image';
import { ItemSlot } from '@/components/match-history/item-slots';
import { BuildRunes } from '@/components/BuildRunes';
import { DEFAULT_BUILDS, type DefaultBuild } from '@/lib/builds/default-builds';
import {
  fetchAutoBuild,
  RUNE_STYLE_NAMES,
  type AutoBuild,
} from '@/lib/builds/auto-build';
import {
  fetchGuideBuilds,
  type GuideBuildDoc,
} from '@/lib/builds/guide-builds';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { formatCountdown, useNowMs } from '@/lib/mythic-shop/countdown';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import {
  fetchMythicRotation,
  skinLoadingUrl,
  type MythicRotation,
} from '@/lib/mythic-shop/rotation';
import {
  SUPPORT_CHAMPIONS,
  ADC_CHAMPIONS,
  SUPPORT_MATCHUPS,
  ADC_MATCHUPS,
} from '@/lib/matchups/index';
import { cn } from '@/lib/utils';
import {
  Clock,
  Download,
  ExternalLink,
  Layers,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Swords,
  Users,
  Zap,
} from 'lucide-react';

const PATCH = '16.13';

const RIOT_PATCH_NOTES_URL =
  'https://www.leagueoflegends.com/en-us/news/tags/patch-notes/';

type Build = DefaultBuild;

const BUILD_ICONS: Record<string, ReactNode> = {
  star: <Star className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
};

// Static fallback builds; Convex guideBuilds (seeded + admin-curated)
// replaces these when reachable.
const BUILDS: Build[] = DEFAULT_BUILDS;

const QUICK_TIPS: ReadonlyArray<{ title: string; tip: string }> = [
  {
    title: 'Attach Wisely',
    tip: 'Ride the ally who carries fights — your presence multiplies their impact.',
  },
  {
    title: 'Passive Prowess',
    tip: 'Detach for empowered autos when safe; the shield and mana are free value.',
  },
  {
    title: 'Ultimate Timing',
    tip: 'Final Chapter turns fights — channel where multiple allies collect the heals and roots.',
  },
  {
    title: 'Vision & Safety',
    tip: 'Carry control wards. A dead cat heals nobody.',
  },
];

const CHAMPION_LABEL_OVERRIDES: Record<string, string> = {
  Kaisa: "Kai'Sa",
  KogMaw: "Kog'Maw",
  Velkoz: "Vel'Koz",
};

const formatChampionName = (name: string) =>
  CHAMPION_LABEL_OVERRIDES[name] ??
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();

const isSupportMatchupKey = (
  value: string
): value is keyof typeof SUPPORT_MATCHUPS =>
  Object.prototype.hasOwnProperty.call(SUPPORT_MATCHUPS, value);

const isAdcMatchupKey = (value: string): value is keyof typeof ADC_MATCHUPS =>
  Object.prototype.hasOwnProperty.call(ADC_MATCHUPS, value);

const DIFFICULTY_CHIP: Record<string, string> = {
  Easy: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300',
  Medium: 'border-amber-400/60 bg-amber-500/10 text-amber-300',
  Hard: 'border-red-400/60 bg-red-500/10 text-red-300',
};

const SYNERGY_CHIP: Record<string, string> = {
  Excellent: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300',
  'Very Good': 'border-hx-magic/60 bg-hx-magic/10 text-hx-magic-bright',
  Good: 'border-amber-400/60 bg-amber-500/10 text-amber-300',
  Average: 'border-hx-gold-dark bg-hx-gold/10 text-hx-gold',
  Situational: 'border-hx-gold-dark bg-hx-gold/10 text-hx-gold',
  Poor: 'border-red-400/60 bg-red-500/10 text-red-300',
};

function docToBuild(doc: GuideBuildDoc): Build {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    isRecommended: doc.isRecommended,
    runes: doc.runes,
    items: doc.items,
    skillOrder: doc.skillOrder,
  };
}

const ChampionImage = ({
  championName,
  isSelected,
  onClick,
  size = 60,
  interactive = true,
  showLabel = true,
}: {
  championName: string;
  isSelected: boolean;
  onClick?: () => void;
  size?: number;
  interactive?: boolean;
  showLabel?: boolean;
}) => {
  const label = formatChampionName(championName);
  const containerStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm border bg-hx-black/60 transition-all duration-200',
        isSelected
          ? 'border-hx-gold-bright shadow-[0_0_14px_oklch(var(--hx-gold)_/_0.45)] ring-1 ring-hx-gold/60'
          : 'border-hx-gold-dark/60',
        interactive && !isSelected && 'group-hover:border-hx-gold'
      )}
      style={containerStyle}
    >
      <DataDragonImage
        championId={championName}
        type="icon"
        width={size}
        height={size}
        alt={label}
        className="h-full w-full"
      />
      {showLabel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-hx-black/85 px-1 py-0.5 text-center text-[10px] font-medium text-hx-parchment/90">
          {label}
        </div>
      )}
    </div>
  );

  if (!interactive) {
    return (
      <div className={`flex flex-col items-center ${showLabel ? 'gap-1' : ''}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center ${showLabel ? 'gap-1' : ''} transition-transform duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      aria-pressed={isSelected}
      aria-label={`View matchup details for ${label}`}
    >
      {content}
    </button>
  );
};

const SKILL_TEXT: Record<string, string> = {
  Q: 'text-accessible-blue',
  W: 'text-accessible-green',
  E: 'text-accessible-yellow',
  R: 'text-accessible-red',
};

const SKILL_DOT: Record<string, string> = {
  Q: 'bg-accessible-blue',
  W: 'bg-accessible-green',
  E: 'bg-accessible-yellow',
  R: 'bg-accessible-red',
};

// 18-level skill grid, old-client style: gold-lined table, diamond pips.
const SkillOrderTable = ({ levels }: { levels: string[] }) => (
  <div className="hex-scroll overflow-x-auto">
    <table className="min-w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className="w-12 border-b border-hx-gold-dark/40 pb-1 text-left font-normal text-hx-gold/50">
            Skill
          </th>
          {Array.from({ length: 18 }, (_, i) => (
            <th
              key={i}
              className="w-6 border-b border-hx-gold-dark/40 pb-1 text-center font-normal text-hx-gold/50"
            >
              {i + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {['Q', 'W', 'E', 'R'].map((skill) => (
          <tr key={skill} className="border-b border-hx-gold-dark/15">
            <td className="py-1.5">
              <div className="flex items-center gap-1.5">
                <AbilityIcon
                  championId="Yuumi"
                  ability={skill as 'Q' | 'W' | 'E' | 'R'}
                  size={16}
                />
                <span className={`font-semibold ${SKILL_TEXT[skill]}`}>
                  {skill}
                </span>
              </div>
            </td>
            {levels.map((levelSkill, idx) => (
              <td key={idx} className="py-1.5 text-center">
                {levelSkill === skill ? (
                  <div
                    className={`mx-auto h-2 w-2 rotate-45 ${SKILL_DOT[skill]} shadow-[0_0_6px_currentColor]`}
                  />
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function HeroStat({
  label,
  value,
  magic = false,
  title,
}: {
  label: string;
  value: string;
  magic?: boolean;
  title?: string | undefined;
}) {
  return (
    <div
      className="border-l border-hx-gold-dark/30 px-4 py-3 text-center first:border-l-0"
      title={title}
    >
      <div className="hex-label opacity-70">{label}</div>
      <div
        className={cn(
          'mt-0.5 truncate hex-title text-base sm:text-lg',
          magic ? 'text-hx-magic-bright' : 'text-hx-parchment'
        )}
      >
        {value}
      </div>
    </div>
  );
}

// Right rail: current Mythic Shop rotation teaser with reset countdown.
function MythicShopPreview() {
  const nowMs = useNowMs();
  const [rotation, setRotation] = useState<MythicRotation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMythicRotation().then((data) => {
      if (!cancelled) setRotation(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const featured = rotation?.items.filter((i) => i.section === 'featured');
  const display = (
    featured && featured.length > 0 ? featured : (rotation?.items ?? [])
  ).slice(0, 3);
  const nextReset = getNextResetForSection('daily', now);

  return (
    <HextechPanel
      title="Mythic Shop"
      icon={<Sparkles className="h-4 w-4" />}
      accent="magic"
      contentClassName="space-y-3 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hex-label opacity-70">Daily reset</span>
        <span className="hex-chip-magic">
          <Clock className="h-3 w-3" />
          {nowMs === null ? '—' : formatCountdown(nextReset, nowMs)}
        </span>
      </div>
      {display.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {display.map((item) => {
            const art = skinLoadingUrl(item);
            return (
              <div
                key={`${item.name}-${item.section}`}
                className="group hex-frame-art relative aspect-[3/5] overflow-hidden rounded-sm"
                title={item.name}
              >
                {art ? (
                  <Image
                    src={art}
                    alt={item.name}
                    fill
                    sizes="90px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-hx-black/60">
                    <Sparkles className="h-5 w-5 text-hx-gold/40" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hx-black via-hx-black/70 to-transparent px-1 pt-4 pb-1 text-center">
                  <span className="text-[10px] font-semibold text-hx-gold">
                    {item.costME} ME
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-hx-gold/50">
          Rotation not published yet.
        </p>
      )}
      <Link
        href="/mythic-shop"
        className="btn-hextech-magic block w-full rounded-sm px-4 py-2 text-center text-xs"
      >
        View Mythic Shop
      </Link>
    </HextechPanel>
  );
}

function PatchPanel({
  patch,
  autoBuild,
  outdated,
}: {
  patch: string;
  autoBuild: AutoBuild | null;
  outdated: boolean;
}) {
  return (
    <HextechPanel
      title="Patch Status"
      icon={<ScrollText className="h-4 w-4" />}
      contentClassName="space-y-3 p-4"
    >
      <div className="flex items-end justify-between">
        <span className="text-gradient-gold text-4xl font-black">{patch}</span>
        <span className="hex-chip-magic">
          <span
            className="h-1.5 w-1.5 rotate-45 animate-gem-pulse bg-hx-magic"
            aria-hidden
          />
          Live
        </span>
      </div>
      <div className="hex-divider" />
      <dl className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-hx-gold/60">Builds verified</dt>
          <dd className="font-semibold text-hx-parchment">
            {autoBuild?.patch ?? PATCH}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-hx-gold/60">Build data</dt>
          <dd className="font-semibold text-hx-parchment">
            {autoBuild ? `Live · ${autoBuild.source}` : 'Curated'}
          </dd>
        </div>
        {autoBuild && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-hx-gold/60">Updated</dt>
            <dd className="font-semibold text-hx-parchment">
              {new Date(autoBuild.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        )}
      </dl>
      {outdated && (
        <p className="border-l-2 border-amber-400/70 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200/90">
          Builds trail the live patch — Yuumi&apos;s meta rarely shifts between
          patches.
        </p>
      )}
      <a
        href={RIOT_PATCH_NOTES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-hextech flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2 text-xs"
      >
        Official Patch Notes
        <ExternalLink className="h-3 w-3" />
      </a>
    </HextechPanel>
  );
}

function QuickTipsPanel() {
  return (
    <HextechPanel
      title="Quick Tips"
      icon={<Star className="h-4 w-4" />}
      contentClassName="space-y-3 p-4"
    >
      {QUICK_TIPS.map((tip) => (
        <div key={tip.title} className="flex gap-2.5">
          <span
            className="mt-1.5 hex-diamond shrink-0 opacity-80"
            aria-hidden
          />
          <div>
            <div className="text-xs font-bold tracking-wide text-hx-gold">
              {tip.title}
            </div>
            <p className="text-xs leading-snug text-hx-parchment/70">
              {tip.tip}
            </p>
          </div>
        </div>
      ))}
    </HextechPanel>
  );
}

export default function YuumiGuide() {
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [selectedSupport, setSelectedSupport] = useState<string>('');
  const [selectedADC, setSelectedADC] = useState<string>('');
  const [matchupType, setMatchupType] = useState<'enemy' | 'ally'>('enemy');
  const [autoBuild, setAutoBuild] = useState<AutoBuild | null>(null);
  const [dbBuilds, setDbBuilds] = useState<Build[] | null>(null);
  const livePatch = useLivePatch();

  // Curated builds from Convex; static data is the fallback.
  useEffect(() => {
    let cancelled = false;
    fetchGuideBuilds().then((docs) => {
      if (!cancelled && docs) setDbBuilds(docs.map(docToBuild));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scraped build from Convex (daily cron) overlays the recommended one.
  useEffect(() => {
    let cancelled = false;
    fetchAutoBuild().then((build) => {
      if (!cancelled && build) setAutoBuild(build);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayBuilds = useMemo(() => {
    const base = dbBuilds ?? BUILDS;
    if (!autoBuild) return base;
    return base.map((build) => {
      if (!build.isRecommended) return build;
      return {
        ...build,
        runes: {
          ...build.runes,
          name: autoBuild.runes.keystone.name,
          primaryTree:
            (autoBuild.runes.primaryStyleId !== null
              ? RUNE_STYLE_NAMES[autoBuild.runes.primaryStyleId]
              : undefined) ?? build.runes.primaryTree,
          keystone: autoBuild.runes.keystone.key,
          primary: autoBuild.runes.primary.map((rune) => rune.key),
          secondaryTree:
            (autoBuild.runes.secondaryStyleId !== null
              ? RUNE_STYLE_NAMES[autoBuild.runes.secondaryStyleId]
              : undefined) ?? build.runes.secondaryTree,
          secondary: autoBuild.runes.secondary.map((rune) => rune.key),
          shards:
            autoBuild.runes.shardKeys.length === 3
              ? autoBuild.runes.shardKeys
              : build.runes.shards,
        },
        items: {
          ...build.items,
          core: autoBuild.coreItems.map((item) => ({
            id: item.id,
            name: item.name,
            reason: `Most-picked core item (${autoBuild.source}).`,
          })),
        },
        skillOrder: {
          ...build.skillOrder,
          priority: autoBuild.skillPriority.join(' > '),
          levels: autoBuild.skillOrder ?? build.skillOrder.levels,
        },
      };
    });
  }, [autoBuild, dbBuilds]);

  const currentBuild =
    displayBuilds.find((b) => b.id === selectedBuild) ?? displayBuilds[0];
  const currentPatch = livePatch ?? PATCH;
  const buildDataOutdated =
    livePatch !== null && livePatch !== (autoBuild?.patch ?? PATCH);

  const supportMatchup = isSupportMatchupKey(selectedSupport)
    ? SUPPORT_MATCHUPS[selectedSupport]
    : undefined;
  const adcMatchup = isAdcMatchupKey(selectedADC)
    ? ADC_MATCHUPS[selectedADC]
    : undefined;

  const downloadItemset = (build: Build) => {
    const itemset = {
      title: `Yuumi - ${build.name}`,
      type: 'custom',
      map: 'SR',
      mode: 'CLASSIC',
      priority: false,
      sortrank: 0,
      blocks: [
        {
          type: 'Starter Items',
          items: build.items.starter.map((item) => ({
            id: item.id.toString(),
            count: 1,
          })),
        },
        {
          type: 'Core Items',
          items: build.items.core.map((item) => ({
            id: item.id.toString(),
            count: 1,
          })),
        },
        {
          type: 'Situational Items',
          items: build.items.situational.map((item) => ({
            id: item.id.toString(),
            count: 1,
          })),
        },
      ],
    };

    const blob = new Blob([JSON.stringify(itemset, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yuumi-${build.id}-itemset.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 md:py-8">
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ============ Main column ============ */}
        <div className="min-w-0 space-y-12">
          {/* Hero */}
          <HextechPanel
            accent="elevated"
            contentClassName="p-0"
            className="overflow-hidden"
          >
            <div className="relative">
              {/* Splash art bleeding in from the right */}
              <div className="absolute inset-y-0 right-0 w-full lg:w-[60%]">
                <Image
                  src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_0.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="[mask-image:linear-gradient(to_left,black_50%,transparent_97%)] object-cover object-[62%_20%] opacity-40 lg:opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-hx-black/85 via-transparent to-hx-black/30" />
                {/* Yuumi's wisps */}
                <span
                  className="absolute top-[24%] right-[20%] h-2 w-2 animate-wisp rounded-full bg-hx-magic blur-[1px]"
                  aria-hidden
                />
                <span
                  className="absolute top-[55%] right-[38%] h-1.5 w-1.5 animate-wisp rounded-full bg-yuumi-purple blur-[1px] [animation-delay:2.5s]"
                  aria-hidden
                />
                <span
                  className="absolute top-[38%] right-[8%] h-1 w-1 animate-wisp rounded-full bg-yuumi-pink blur-[0.5px] [animation-delay:5s]"
                  aria-hidden
                />
              </div>

              <div className="relative z-10 px-6 py-10 md:px-10 md:py-14 lg:max-w-[55%]">
                <p className="mb-4 hex-label">
                  Guides <span className="text-hx-gold-dark">›</span> Support{' '}
                  <span className="text-hx-gold-dark">›</span> Champion
                </p>
                <h1 className="text-gradient-gold text-6xl font-black tracking-wide md:text-7xl">
                  Yuumi
                </h1>
                <p className="mt-3 hex-title text-sm tracking-[0.3em] text-hx-magic-bright md:text-base">
                  ✦ The Magical Cat ✦
                </p>
                <p className="mt-5 max-w-md text-sm text-landing-text-secondary italic md:text-base">
                  “We&apos;ll be the best of friends, forever and ever!”
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="hex-chip">
                    <Shield className="h-3 w-3" /> Support
                  </span>
                  <span className="hex-chip">
                    <Sparkles className="h-3 w-3" /> Enchanter
                  </span>
                  <span className="hex-chip-magic">Easy to learn</span>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#builds"
                    className="btn-hextech-primary rounded-sm px-7 py-2.5 text-sm"
                  >
                    View Builds
                  </a>
                  <a
                    href="#matchups"
                    className="btn-hextech rounded-sm px-7 py-2.5 text-sm"
                  >
                    Matchups
                  </a>
                </div>
              </div>

              {/* At-a-glance strip */}
              <div className="relative z-10 grid grid-cols-2 border-t border-hx-gold-dark/40 bg-hx-black/70 backdrop-blur-sm md:grid-cols-4">
                <HeroStat label="Patch" value={currentPatch} magic />
                <HeroStat label="Role" value="Support" />
                <HeroStat label="Difficulty" value="Easy" />
                <HeroStat
                  label="Build data"
                  value={
                    autoBuild
                      ? `Live · ${autoBuild.source.split(' · ')[0] ?? autoBuild.source}`
                      : 'Curated'
                  }
                  title={autoBuild?.source}
                  magic={autoBuild !== null}
                />
              </div>
            </div>
          </HextechPanel>

          {/* Builds */}
          <section id="builds" className="scroll-mt-24 space-y-6">
            <OrnateHeading eyebrow="Forge your path">
              Recommended Builds
            </OrnateHeading>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {displayBuilds.map((build) => {
                const isSelected = build.id === currentBuild?.id;
                return (
                  <button
                    key={build.id}
                    onClick={() => setSelectedBuild(build.id)}
                    className={cn(
                      'relative rounded-sm p-4 text-left transition-all duration-200',
                      isSelected
                        ? 'hex-card-elevated hex-glow-gold'
                        : 'hex-card hover:border-hx-gold/70'
                    )}
                  >
                    {build.isRecommended && (
                      <span className="absolute -top-2.5 right-3 hex-chip border-hx-gold bg-hx-black text-hx-gold-bright">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Recommended
                      </span>
                    )}
                    <div className="mb-2 flex items-center gap-2.5">
                      <span
                        className={cn(
                          'rounded-sm border border-hx-gold-dark/50 p-2',
                          isSelected
                            ? 'bg-hx-gold/20 text-hx-gold-bright'
                            : 'bg-hx-gold/10 text-hx-gold'
                        )}
                      >
                        {BUILD_ICONS[build.icon] ?? (
                          <Star className="h-5 w-5" />
                        )}
                      </span>
                      <span className="hex-title text-base">{build.name}</span>
                    </div>
                    <p className="text-sm text-landing-text-secondary">
                      {build.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {currentBuild && (
              <HextechPanel
                accent="elevated"
                title={currentBuild.name}
                icon={BUILD_ICONS[currentBuild.icon] ?? <Layers />}
                action={
                  <button
                    onClick={() => downloadItemset(currentBuild)}
                    className="btn-hextech flex items-center gap-2 rounded-sm px-4 py-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Itemset
                  </button>
                }
              >
                <p className="mb-6 text-sm text-landing-text-secondary">
                  {currentBuild.description}
                </p>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Runes */}
                  <div className="space-y-3">
                    <h3 className="hex-label">Rune Page</h3>
                    <BuildRunes runes={currentBuild.runes} />
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    <h3 className="hex-label">Item Path</h3>
                    <div className="space-y-3">
                      {(
                        [
                          ['Starter', currentBuild.items.starter],
                          ['Core', currentBuild.items.core],
                          ['Situational', currentBuild.items.situational],
                        ] as const
                      ).map(([label, items]) => (
                        <div
                          key={label}
                          className="rounded-sm p-3 hex-card-inset"
                        >
                          <div className="mb-2 hex-label opacity-70">
                            {label}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item) => (
                              <ItemSlot
                                key={item.id}
                                itemId={item.id}
                                size="md"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skill order */}
                  <div className="space-y-3">
                    <h3 className="hex-label">Skill Order</h3>
                    <div className="rounded-sm p-4 hex-card-inset">
                      <div className="mb-3 flex items-center justify-center gap-1.5">
                        {currentBuild.skillOrder.priority
                          .split(' > ')
                          .map((skill, i, arr) => (
                            <span
                              key={`${skill}-${i}`}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className={cn(
                                  'hex-title text-lg',
                                  SKILL_TEXT[skill] ?? 'text-hx-parchment'
                                )}
                              >
                                {skill}
                              </span>
                              {i < arr.length - 1 && (
                                <span className="text-hx-gold-dark">›</span>
                              )}
                            </span>
                          ))}
                      </div>
                      <SkillOrderTable
                        levels={currentBuild.skillOrder.levels}
                      />
                      <p className="mt-3 text-xs leading-relaxed text-hx-parchment/60">
                        {currentBuild.skillOrder.notes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item reasoning */}
                <div className="mt-6 rounded-sm p-4 hex-card-inset">
                  <h4 className="mb-3 hex-label">Item Details</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      ...currentBuild.items.starter,
                      ...currentBuild.items.core,
                      ...currentBuild.items.situational,
                    ].map((item, i) => (
                      <div
                        key={`${item.id}-${i}`}
                        className="flex items-start gap-2.5 rounded-sm border border-hx-gold-dark/25 bg-hx-panel/40 p-2"
                      >
                        <ItemSlot itemId={item.id} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-hx-parchment">
                            {item.name}
                          </div>
                          <div className="text-xs leading-snug text-hx-parchment/55">
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </HextechPanel>
            )}
          </section>

          {/* Matchups */}
          <section id="matchups" className="scroll-mt-24 space-y-6">
            <OrnateHeading eyebrow="Know the lane">
              Matchups & Synergies
            </OrnateHeading>

            <HextechPanel contentClassName="p-4 sm:p-6">
              <Tabs
                value={matchupType}
                onValueChange={(value) => {
                  setMatchupType(value as 'enemy' | 'ally');
                  setSelectedSupport('');
                  setSelectedADC('');
                }}
                className="w-full"
              >
                <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-sm p-1 hex-card-inset">
                  <TabsTrigger
                    value="enemy"
                    className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                  >
                    <Swords className="mr-1.5 h-3.5 w-3.5" />
                    Enemy Supports
                  </TabsTrigger>
                  <TabsTrigger
                    value="ally"
                    className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-magic/15 data-[state=active]:text-hx-magic-bright"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Ally ADCs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="enemy" className="space-y-6">
                  <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                    {SUPPORT_CHAMPIONS.map((champion) => (
                      <ChampionImage
                        key={champion}
                        championName={champion}
                        isSelected={selectedSupport === champion}
                        onClick={() => {
                          setSelectedSupport(
                            selectedSupport === champion ? '' : champion
                          );
                          setSelectedADC('');
                        }}
                      />
                    ))}
                  </div>

                  {selectedSupport && supportMatchup ? (
                    <div className="rounded-sm p-5 hex-card-inset">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ChampionImage
                            championName={selectedSupport}
                            isSelected={true}
                            size={44}
                            interactive={false}
                            showLabel={false}
                          />
                          <span className="hex-title text-base text-hx-parchment">
                            Versus {formatChampionName(selectedSupport)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'hex-chip',
                            DIFFICULTY_CHIP[supportMatchup.difficulty]
                          )}
                        >
                          {supportMatchup.difficulty}
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm text-hx-parchment/80">
                        {supportMatchup.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <span
                              className="mt-1.5 hex-diamond shrink-0 opacity-70"
                              aria-hidden
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      {supportMatchup.notes && (
                        <div className="mt-4 border-l-2 border-hx-gold/70 bg-hx-gold/5 p-3 text-sm text-hx-parchment/75">
                          <span className="hex-label">Note</span>
                          <p className="mt-1">{supportMatchup.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-sm py-10 text-center hex-card-inset">
                      <Shield className="mx-auto mb-3 h-10 w-10 text-hx-gold/30" />
                      <p className="text-sm text-hx-parchment/60">
                        Select an enemy support to reveal the matchup scroll.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ally" className="space-y-6">
                  <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                    {ADC_CHAMPIONS.map((champion) => (
                      <ChampionImage
                        key={champion}
                        championName={champion}
                        isSelected={selectedADC === champion}
                        onClick={() => {
                          setSelectedADC(
                            selectedADC === champion ? '' : champion
                          );
                          setSelectedSupport('');
                        }}
                      />
                    ))}
                  </div>

                  {selectedADC && adcMatchup ? (
                    <div className="rounded-sm p-5 hex-card-inset">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ChampionImage
                            championName={selectedADC}
                            isSelected={true}
                            size={44}
                            interactive={false}
                            showLabel={false}
                          />
                          <span className="hex-title text-base text-hx-parchment">
                            With {formatChampionName(selectedADC)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'hex-chip',
                            SYNERGY_CHIP[adcMatchup.synergy] ??
                              'border-hx-gold-dark text-hx-gold'
                          )}
                        >
                          {adcMatchup.synergy} Synergy
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm text-hx-parchment/80">
                        {adcMatchup.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <span
                              className="mt-1.5 hex-diamond shrink-0 opacity-70"
                              aria-hidden
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      {adcMatchup.playstyle && (
                        <div className="mt-4 border-l-2 border-hx-magic/70 bg-hx-magic/5 p-3 text-sm text-hx-parchment/75">
                          <span className="hex-label text-hx-magic-bright">
                            Playstyle
                          </span>
                          <p className="mt-1">{adcMatchup.playstyle}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-sm py-10 text-center hex-card-inset">
                      <Users className="mx-auto mb-3 h-10 w-10 text-hx-magic/30" />
                      <p className="text-sm text-hx-parchment/60">
                        Select an ally ADC to reveal the synergy scroll.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </HextechPanel>
          </section>
        </div>

        {/* ============ Right rail ============ */}
        <aside className="hidden space-y-6 2xl:block">
          <MythicShopPreview />
          <PatchPanel
            patch={currentPatch}
            autoBuild={autoBuild}
            outdated={buildDataOutdated}
          />
          <QuickTipsPanel />
        </aside>
      </div>

      {/* Rail content for narrower screens */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:hidden">
        <MythicShopPreview />
        <PatchPanel
          patch={currentPatch}
          autoBuild={autoBuild}
          outdated={buildDataOutdated}
        />
        <QuickTipsPanel />
      </div>
    </div>
  );
}
