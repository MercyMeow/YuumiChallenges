'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  YuumiIcon,
  AbilityIcon,
  DataDragonImage,
} from '@/components/ui/datadragon-image';
import { ItemSlot } from '@/components/match-history/item-slots';
import { BuildRunes } from '@/components/BuildRunes';
import { BEST_ITEMS } from '@/lib/builds/yuumi';
import {
  fetchAutoBuild,
  RUNE_STYLE_NAMES,
  type AutoBuild,
} from '@/lib/builds/auto-build';
import { toGuidePatch } from '@/lib/utils/live-patch';
import {
  SUPPORT_CHAMPIONS,
  ADC_CHAMPIONS,
  SUPPORT_MATCHUPS,
  ADC_MATCHUPS,
} from '@/lib/matchups/index';
import {
  Download,
  Shield,
  Users,
  Layers,
  Settings,
  Star,
  Zap,
} from 'lucide-react';

const PATCH = '16.13';

// Build type definition
interface Build {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  isRecommended?: boolean;
  runes: {
    name: string;
    primaryTree: string;
    keystone: string;
    primary: string[];
    secondaryTree: string;
    secondary: string[];
    shards: string[];
  };
  items: {
    starter: ReadonlyArray<{ id: number; name: string; reason: string }>;
    core: ReadonlyArray<{ id: number; name: string; reason: string }>;
    situational: ReadonlyArray<{ id: number; name: string; reason: string }>;
  };
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
}

// Sample builds data - this would come from Convex when connected
const BUILDS: Build[] = [
  {
    id: 'standard-aery',
    name: 'Standard Aery',
    description:
      'The most consistent build for general use. Great poke and sustain.',
    icon: <Star className="h-5 w-5" />,
    color: 'from-purple-500/20 to-blue-500/20',
    borderColor: 'border-purple-500/30',
    isRecommended: true,
    runes: {
      name: 'Summon Aery',
      primaryTree: 'Sorcery',
      keystone: 'SummonAery',
      primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
      secondaryTree: 'Resolve',
      secondary: ['FontOfLife', 'Revitalize'],
      shards: ['AbilityHaste', 'AdaptiveForce', 'HealthScaling'],
    },
    items: BEST_ITEMS,
    skillOrder: {
      priority: 'Q > E > W',
      levels: [
        'Q',
        'E',
        'Q',
        'E',
        'Q',
        'R',
        'Q',
        'E',
        'Q',
        'E',
        'R',
        'E',
        'W',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Max Q for poke damage, E second for sustain. Take W after E is maxed.',
    },
  },
  {
    id: 'guardian-sustain',
    name: 'Guardian Sustain',
    description:
      'Defensive build for hard engage lanes. Prioritizes survival and shields.',
    icon: <Shield className="h-5 w-5" />,
    color: 'from-green-500/20 to-teal-500/20',
    borderColor: 'border-green-500/30',
    runes: {
      name: 'Guardian',
      primaryTree: 'Resolve',
      keystone: 'Guardian',
      primary: ['FontOfLife', 'BonePlating', 'Revitalize'],
      secondaryTree: 'Sorcery',
      secondary: ['ManaflowBand', 'Transcendence'],
      shards: ['AdaptiveForce', 'Armor', 'HealthScaling'],
    },
    items: {
      starter: BEST_ITEMS.starter,
      core: [
        {
          id: 6617,
          name: 'Moonstone Renewer',
          reason: 'Chains heals/shields across the team in extended fights',
        },
        {
          id: 3107,
          name: 'Redemption',
          reason: 'Team-wide AoE healing and map impact from range',
        },
        {
          id: 3222,
          name: "Mikael's Blessing",
          reason: 'Cleanse the hard CC that threatens your host',
        },
      ],
      situational: BEST_ITEMS.situational,
    },
    skillOrder: {
      priority: 'R > E > Q > W',
      levels: [
        'E',
        'Q',
        'E',
        'W',
        'E',
        'R',
        'E',
        'Q',
        'E',
        'Q',
        'R',
        'Q',
        'Q',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Max E first for stronger shields and heals. Take Q second for some poke. Defensive playstyle.',
    },
  },
  {
    id: 'aggressive-comet',
    name: 'Aggressive Comet',
    description:
      'High damage build for lanes where you can poke freely. Snowball potential.',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/30',
    runes: {
      name: 'Arcane Comet',
      primaryTree: 'Sorcery',
      keystone: 'ArcaneComet',
      primary: ['ManaflowBand', 'AbsoluteFocus', 'Scorch'],
      secondaryTree: 'Domination',
      secondary: ['CheapShot', 'UltimateHunter'],
      shards: ['AdaptiveForce', 'AdaptiveForce', 'Armor'],
    },
    items: {
      starter: BEST_ITEMS.starter,
      core: [
        { id: 6655, name: "Luden's Companion", reason: 'Burst damage on poke' },
        {
          id: 3089,
          name: "Rabadon's Deathcap",
          reason: 'Maximize AP for healing and damage',
        },
        { id: 3135, name: 'Void Staff', reason: 'Magic penetration for tanks' },
      ],
      situational: [
        { id: 3165, name: 'Morellonomicon', reason: 'Anti-heal when needed' },
        {
          id: 3157,
          name: "Zhonya's Hourglass",
          reason: 'Survive burst when detached',
        },
        { id: 3102, name: "Banshee's Veil", reason: 'Block key CC abilities' },
      ],
    },
    skillOrder: {
      priority: 'R > Q > E > W',
      levels: [
        'Q',
        'E',
        'Q',
        'W',
        'Q',
        'R',
        'Q',
        'Q',
        'E',
        'E',
        'R',
        'E',
        'E',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Full Q max for maximum poke damage. Very aggressive playstyle - play around your Q cooldowns.',
    },
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
      className={`relative overflow-hidden rounded-lg border-2 bg-black/30 transition-all duration-200 ${
        isSelected
          ? 'border-purple-400 shadow-lg ring-2 shadow-purple-500/30 ring-purple-400 ring-offset-2 ring-offset-black'
          : 'border-white/20'
      } ${interactive ? 'group-hover:border-purple-300/60' : ''}`}
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/80 px-1 py-1 text-center text-[11px] font-medium text-white">
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
      className={`group flex flex-col items-center ${showLabel ? 'gap-1' : ''} text-white/80 transition-transform duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-400 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      aria-pressed={isSelected}
      aria-label={`View matchup details for ${label}`}
    >
      {content}
    </button>
  );
};

// Skill Order Table Component
const SkillOrderTable = ({ levels }: { levels: string[] }) => {
  const skillColors: Record<string, string> = {
    Q: 'text-blue-300',
    W: 'text-green-300',
    E: 'text-yellow-300',
    R: 'text-red-300',
  };
  const dotColors: Record<string, string> = {
    Q: 'bg-blue-400',
    W: 'bg-green-400',
    E: 'bg-yellow-400',
    R: 'bg-red-400',
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-12 border-b border-white/20 pb-1 text-left text-white/60">
              Skill
            </th>
            {Array.from({ length: 18 }, (_, i) => (
              <th
                key={i}
                className="w-6 border-b border-white/20 pb-1 text-center text-white/60"
              >
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['Q', 'W', 'E', 'R'].map((skill) => (
            <tr key={skill}>
              <td className="py-1">
                <div className="flex items-center gap-1">
                  <AbilityIcon
                    championId="Yuumi"
                    ability={skill as 'Q' | 'W' | 'E' | 'R'}
                    size={16}
                  />
                  <span className={`font-medium ${skillColors[skill]}`}>
                    {skill}
                  </span>
                </div>
              </td>
              {levels.map((levelSkill, idx) => (
                <td key={idx} className="py-1 text-center">
                  {levelSkill === skill ? (
                    <div
                      className={`mx-auto h-2.5 w-2.5 rounded-full ${dotColors[skill]}`}
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
};
export default function YuumiGuide() {
  const [selectedBuild, setSelectedBuild] = useState<string>(
    BUILDS[0]?.id ?? ''
  );
  const [selectedSupport, setSelectedSupport] = useState<string>('');
  const [selectedADC, setSelectedADC] = useState<string>('');
  const [matchupType, setMatchupType] = useState<'enemy' | 'ally'>('enemy');
  const [livePatch, setLivePatch] = useState<string | null>(null);
  const [autoBuild, setAutoBuild] = useState<AutoBuild | null>(null);

  // Follow the live patch from Data Dragon; PATCH stays as the patch the
  // build data was last verified against.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/data-dragon/version')
      .then((res) => res.json())
      .then((data: { version?: string }) => {
        if (cancelled || typeof data.version !== 'string') return;
        setLivePatch(toGuidePatch(data.version));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scraped build from Convex (daily cron); static data is the fallback.
  useEffect(() => {
    let cancelled = false;
    fetchAutoBuild().then((build) => {
      if (!cancelled && build) setAutoBuild(build);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Overlay the auto build onto the recommended build only; the alternative
  // builds stay hand-curated.
  const displayBuilds = useMemo(() => {
    if (!autoBuild) return BUILDS;
    return BUILDS.map((build) => {
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
  }, [autoBuild]);

  const currentBuild =
    displayBuilds.find((b) => b.id === selectedBuild) ?? displayBuilds[0];
  const currentPatch = livePatch ?? PATCH;
  // Warn when the displayed build (auto-scraped when present, else static)
  // trails the live patch.
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-600 text-white border-green-600';
      case 'Medium':
        return 'bg-yellow-600 text-white border-yellow-600';
      case 'Hard':
        return 'bg-red-600 text-white border-red-600';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  const getSynergyColor = (synergy: string) => {
    switch (synergy) {
      case 'Excellent':
        return 'bg-green-600 text-white border-green-600';
      case 'Very Good':
        return 'bg-blue-600 text-white border-blue-600';
      case 'Good':
        return 'bg-yellow-600 text-white border-yellow-600';
      case 'Poor':
        return 'bg-red-600 text-white border-red-600';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  return (
    <div className="min-h-screen hex-page-bg">
      {/* Hero: Yuumi splash framed like an old-client banner */}
      <div className="relative overflow-hidden border-b border-hx-gold-dark/60">
        <Image
          src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_0.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_20%] opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-hx-black/30 via-hx-black/70 to-hx-black" />
        <div className="absolute inset-x-0 bottom-0 hex-divider" />
        <div className="relative container mx-auto max-w-7xl px-6 pt-14 pb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-5">
            <YuumiIcon size="xl" />
            <div className="text-left">
              <h1 className="text-gradient-gold text-4xl font-black tracking-wide uppercase md:text-6xl">
                Yuumi Guide
              </h1>
              <p className="mt-2 text-lg text-landing-text-secondary md:text-xl">
                Best builds, runes, and matchups for Patch {currentPatch}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge
              variant="outline"
              className="rounded-sm border-hx-gold-dark bg-hx-black/60 text-hx-gold"
            >
              Patch {currentPatch}
            </Badge>
            {autoBuild && (
              <Badge
                variant="outline"
                className="rounded-sm border-hx-magic/60 bg-hx-black/60 text-hx-magic-bright"
                title={`Recommended build auto-updated from ${autoBuild.source} on ${new Date(autoBuild.updatedAt).toLocaleDateString()}.`}
              >
                Live build · {autoBuild.patch}
              </Badge>
            )}
            {buildDataOutdated && (
              <Badge
                variant="outline"
                className="rounded-sm border-yellow-400/40 bg-hx-black/60 text-yellow-300"
                title={`Builds were last verified on patch ${autoBuild?.patch ?? PATCH}; the meta rarely shifts for Yuumi between patches.`}
              >
                Builds verified on {autoBuild?.patch ?? PATCH}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="rounded-sm border-hx-magic/40 bg-hx-black/60 text-hx-magic"
            >
              Support
            </Badge>
            <Link href="/admin">
              <Badge
                variant="outline"
                className="cursor-pointer rounded-sm border-hx-gold-dark/50 bg-hx-black/60 text-hx-gold/70 transition-colors hover:border-hx-gold hover:text-hx-gold-bright"
              >
                <Settings className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-10">
        {/* Navigation Tabs */}
        <Tabs defaultValue="builds" className="w-full">
          <TabsList className="hex-card mb-8 grid h-12 w-full grid-cols-2 rounded-sm p-1">
            <TabsTrigger
              value="builds"
              className="flex items-center gap-2 rounded-sm hex-title text-sm data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
            >
              <Layers className="h-4 w-4" />
              Builds
            </TabsTrigger>
            <TabsTrigger
              value="matchups"
              className="flex items-center gap-2 rounded-sm hex-title text-sm data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
            >
              <Users className="h-4 w-4" />
              Matchups
            </TabsTrigger>
          </TabsList>

          {/* Builds Tab */}
          <TabsContent value="builds" className="space-y-6">
            {/* Build Selector */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {displayBuilds.map((build) => (
                <button
                  key={build.id}
                  onClick={() => setSelectedBuild(build.id)}
                  className={`relative rounded-sm p-4 text-left transition-all duration-200 ${
                    selectedBuild === build.id
                      ? 'hex-card-elevated hex-corners'
                      : 'hex-card hover:border-hx-gold/70'
                  }`}
                >
                  {build.isRecommended && (
                    <Badge className="absolute -top-2 right-2 rounded-sm border border-hx-gold bg-hx-black text-hx-gold-bright">
                      Recommended
                    </Badge>
                  )}
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`rounded-sm p-2 ${selectedBuild === build.id ? 'bg-hx-gold/20 text-hx-gold-bright' : 'bg-hx-gold/10 text-hx-gold'}`}
                    >
                      {build.icon}
                    </div>
                    <h3 className="hex-title text-base">{build.name}</h3>
                  </div>
                  <p className="text-sm text-landing-text-secondary">
                    {build.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Selected Build Details */}
            {currentBuild && (
              <Card className="hex-card-elevated hex-corners rounded-sm border-0">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-4 text-hx-parchment">
                    <div className="flex items-center gap-3">
                      <div className="rounded-sm bg-hx-gold/15 p-2 text-hx-gold">
                        {currentBuild.icon}
                      </div>
                      <div>
                        <span className="hex-title text-xl">
                          {currentBuild.name}
                        </span>
                        <p className="text-sm font-normal text-landing-text-secondary">
                          {currentBuild.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadItemset(currentBuild)}
                      className="btn-hextech rounded-sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Itemset
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Three Column Layout: Runes | Items | Skill Order */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Runes Section */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 hex-title text-base text-hx-gold">
                        <span className="rounded bg-purple-500/20 p-1">🔮</span>
                        Runes
                      </h3>
                      <BuildRunes runes={currentBuild.runes} />
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 hex-title text-base text-hx-magic-bright">
                        <span className="rounded bg-green-500/20 p-1">⚔️</span>
                        Items
                      </h3>
                      <div className="space-y-3">
                        {/* Starter */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-purple-300">
                            Starter
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.starter.map((item) => (
                              <ItemSlot
                                key={item.id}
                                itemId={item.id}
                                size="md"
                              />
                            ))}
                          </div>
                        </div>
                        {/* Core */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-green-300">
                            Core
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.core.map((item) => (
                              <ItemSlot
                                key={item.id}
                                itemId={item.id}
                                size="md"
                              />
                            ))}
                          </div>
                        </div>
                        {/* Situational */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-yellow-300">
                            Situational
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.situational.map((item) => (
                              <ItemSlot
                                key={item.id}
                                itemId={item.id}
                                size="md"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skill Order Section */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 hex-title text-base text-hx-magic">
                        <span className="rounded bg-blue-500/20 p-1">📖</span>
                        Skill Order
                      </h3>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 text-center">
                          <Badge
                            variant="outline"
                            className="border-blue-400 text-blue-300"
                          >
                            {currentBuild.skillOrder.priority}
                          </Badge>
                        </div>
                        <SkillOrderTable
                          levels={currentBuild.skillOrder.levels}
                        />
                        <p className="mt-3 text-xs text-white/60">
                          {currentBuild.skillOrder.notes}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item Details (expandable) */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-3 font-semibold text-white">
                      Item Details
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        ...currentBuild.items.starter,
                        ...currentBuild.items.core,
                        ...currentBuild.items.situational,
                      ].map((item, i) => (
                        <div
                          key={`${item.id}-${i}`}
                          className="flex items-start gap-2 rounded bg-white/5 p-2"
                        >
                          <ItemSlot itemId={item.id} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-white">
                              {item.name}
                            </div>
                            <div className="text-xs text-white/60">
                              {item.reason}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Matchups Tab */}
          <TabsContent value="matchups" className="space-y-6">
            <Card className="hex-card rounded-sm border-0">
              <CardHeader>
                <CardTitle className="text-white">Matchup Guide</CardTitle>
                <p className="text-white/70">
                  Click on a champion to see detailed tips and strategies.
                </p>
              </CardHeader>
              <CardContent className="text-white/90">
                <Tabs
                  value={matchupType}
                  onValueChange={(value) => {
                    setMatchupType(value as 'enemy' | 'ally');
                    setSelectedSupport('');
                    setSelectedADC('');
                  }}
                  className="w-full"
                >
                  <TabsList className="hex-card mb-6 grid h-11 w-full grid-cols-2 rounded-sm p-1">
                    <TabsTrigger
                      value="enemy"
                      className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      Enemy Supports
                    </TabsTrigger>
                    <TabsTrigger
                      value="ally"
                      className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      Ally ADCs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="enemy" className="space-y-6">
                    <div>
                      <h3 className="mb-4 hex-title text-base text-hx-gold">
                        Support Champions
                      </h3>
                      <div className="mb-6 grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
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
                    </div>

                    {selectedSupport && supportMatchup ? (
                      <Card className="hex-card rounded-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg text-white">
                            <div className="flex items-center gap-3">
                              <ChampionImage
                                championName={selectedSupport}
                                isSelected={true}
                                size={40}
                                interactive={false}
                                showLabel={false}
                              />
                              <span>
                                Playing Against{' '}
                                {formatChampionName(selectedSupport)}
                              </span>
                            </div>
                            <Badge
                              className={`border ${getDifficultyColor(supportMatchup.difficulty)}`}
                            >
                              {supportMatchup.difficulty}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold text-purple-300">
                              Tips:
                            </h4>
                            <ul className="space-y-1 text-sm text-white/80">
                              {supportMatchup.tips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="mt-1 text-purple-400">
                                    •
                                  </span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {supportMatchup.notes && (
                            <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-white/80">
                              <span className="font-semibold text-purple-200">
                                Note:
                              </span>
                              <p className="mt-1 text-white/75">
                                {supportMatchup.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="hex-card rounded-sm border-0">
                        <CardContent className="py-8 text-center">
                          <Shield className="mx-auto mb-4 h-12 w-12 text-white/40" />
                          <p className="text-white/70">
                            Select a support champion to see matchup details.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ally" className="space-y-6">
                    <div>
                      <h3 className="mb-4 hex-title text-base text-hx-magic">
                        ADC Champions
                      </h3>
                      <div className="mb-6 grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
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
                    </div>

                    {selectedADC && adcMatchup ? (
                      <Card className="hex-card rounded-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg text-white">
                            <div className="flex items-center gap-3">
                              <ChampionImage
                                championName={selectedADC}
                                isSelected={true}
                                size={40}
                                interactive={false}
                                showLabel={false}
                              />
                              <span>
                                Playing With {formatChampionName(selectedADC)}
                              </span>
                            </div>
                            <Badge
                              className={`border ${getSynergyColor(adcMatchup.synergy)}`}
                            >
                              {adcMatchup.synergy} Synergy
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold text-purple-300">
                              Synergy Tips:
                            </h4>
                            <ul className="space-y-1 text-sm text-white/80">
                              {adcMatchup.tips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="mt-1 text-purple-400">
                                    •
                                  </span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {adcMatchup.playstyle && (
                            <div>
                              <h4 className="mb-2 font-semibold text-blue-300">
                                Playstyle:
                              </h4>
                              <p className="text-sm text-white/80">
                                {adcMatchup.playstyle}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="hex-card rounded-sm border-0">
                        <CardContent className="py-8 text-center">
                          <Users className="mx-auto mb-4 h-12 w-12 text-white/40" />
                          <p className="text-white/70">
                            Select an ADC champion to see synergy details.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 hex-divider" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-hx-gold/60">
          <span>
            Yuumi Guide • Patch {currentPatch} • Data from OP.GG, U.GG,
            LoLalytics
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/match"
              className="transition-colors hover:text-hx-gold-bright"
            >
              Match lookup
            </Link>
            <Link
              href="/mythic-shop"
              className="transition-colors hover:text-hx-gold-bright"
            >
              Mythic Shop
            </Link>
            <Link
              href="/gallery"
              className="transition-colors hover:text-hx-gold-bright"
            >
              Rule GIF Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
