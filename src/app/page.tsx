'use client';

import { useState, type CSSProperties } from 'react';
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
import { BEST_ITEMS } from '@/lib/builds/yuumi';
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
import { MythicShopRotationPanel } from '@/components/mythic-shop/MythicShopRotationPanel';

const PATCH = '15.18';

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
    description: 'The most consistent build for general use. Great poke and sustain.',
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
      secondary: ['RevitalizeRune', 'Revitalize'],
      shards: ['AdaptiveForce', 'AdaptiveForce', 'HealthScaling'],
    },
    items: BEST_ITEMS,
    skillOrder: {
      priority: 'R > Q > E > W',
      levels: ['Q', 'E', 'Q', 'W', 'Q', 'R', 'Q', 'E', 'Q', 'E', 'R', 'E', 'E', 'W', 'W', 'R', 'W', 'W'],
      notes: 'Max Q for poke damage, E second for utility. Take W at level 4 for attachment flexibility.',
    },
  },
  {
    id: 'guardian-sustain',
    name: 'Guardian Sustain',
    description: 'Defensive build for hard engage lanes. Prioritizes survival and shields.',
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
        { id: 3011, name: "Chemtech Putrifier", reason: "Anti-heal utility for the team" },
        { id: 3504, name: "Ardent Censer", reason: "Attack speed boost for your carry" },
        { id: 3107, name: "Redemption", reason: "Team-wide healing in fights" },
      ],
      situational: BEST_ITEMS.situational,
    },
    skillOrder: {
      priority: 'R > E > Q > W',
      levels: ['E', 'Q', 'E', 'W', 'E', 'R', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'Q', 'W', 'W', 'R', 'W', 'W'],
      notes: 'Max E first for stronger shields and heals. Take Q second for some poke. Defensive playstyle.',
    },
  },
  {
    id: 'aggressive-comet',
    name: 'Aggressive Comet',
    description: 'High damage build for lanes where you can poke freely. Snowball potential.',
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
        { id: 6655, name: "Luden's Companion", reason: "Burst damage on poke" },
        { id: 3089, name: "Rabadon's Deathcap", reason: "Maximize AP for healing and damage" },
        { id: 3135, name: "Void Staff", reason: "Magic penetration for tanks" },
      ],
      situational: [
        { id: 3165, name: "Morellonomicon", reason: "Anti-heal when needed" },
        { id: 3157, name: "Zhonya's Hourglass", reason: "Survive burst when detached" },
        { id: 3102, name: "Banshee's Veil", reason: "Block key CC abilities" },
      ],
    },
    skillOrder: {
      priority: 'R > Q > E > W',
      levels: ['Q', 'E', 'Q', 'W', 'Q', 'R', 'Q', 'Q', 'E', 'E', 'R', 'E', 'E', 'W', 'W', 'R', 'W', 'W'],
      notes: 'Full Q max for maximum poke damage. Very aggressive playstyle - play around your Q cooldowns.',
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

export default function YuumiGuide() {
  const [selectedBuild, setSelectedBuild] = useState<string>(BUILDS[0]?.id ?? '');
  const [selectedSupport, setSelectedSupport] = useState<string>('');
  const [selectedADC, setSelectedADC] = useState<string>('');
  const [matchupType, setMatchupType] = useState<'enemy' | 'ally'>('enemy');

  const currentBuild = BUILDS.find((b) => b.id === selectedBuild) ?? BUILDS[0];
  const currentPatch = PATCH;

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
          items: build.items.starter.map((item) => ({ id: item.id.toString(), count: 1 })),
        },
        {
          type: 'Core Items',
          items: build.items.core.map((item) => ({ id: item.id.toString(), count: 1 })),
        },
        {
          type: 'Situational Items',
          items: build.items.situational.map((item) => ({ id: item.id.toString(), count: 1 })),
        },
      ],
    };

    const blob = new Blob([JSON.stringify(itemset, null, 2)], { type: 'application/json' });
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
      case 'Easy': return 'bg-green-600 text-white border-green-600';
      case 'Medium': return 'bg-yellow-600 text-white border-yellow-600';
      case 'Hard': return 'bg-red-600 text-white border-red-600';
      default: return 'bg-gray-600 text-white border-gray-600';
    }
  };

  const getSynergyColor = (synergy: string) => {
    switch (synergy) {
      case 'Excellent': return 'bg-green-600 text-white border-green-600';
      case 'Very Good': return 'bg-blue-600 text-white border-blue-600';
      case 'Good': return 'bg-yellow-600 text-white border-yellow-600';
      case 'Poor': return 'bg-red-600 text-white border-red-600';
      default: return 'bg-gray-600 text-white border-gray-600';
    }
  };

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
    const containerStyle: CSSProperties = { width: `${size}px`, height: `${size}px` };

    const content = (
      <div
        className={`relative overflow-hidden rounded-lg border-2 bg-black/30 transition-all duration-200 ${
          isSelected
            ? 'border-purple-400 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400 ring-offset-2 ring-offset-black'
            : 'border-white/20'
        } ${interactive ? 'group-hover:border-purple-300/60' : ''}`}
        style={containerStyle}
      >
        <DataDragonImage championId={championName} type="icon" width={size} height={size} alt={label} className="h-full w-full" />
        {showLabel && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/80 px-1 py-1 text-center text-[11px] font-medium text-white">
            {label}
          </div>
        )}
      </div>
    );

    if (!interactive) {
      return <div className={`flex flex-col items-center ${showLabel ? 'gap-1' : ''}`}>{content}</div>;
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex flex-col items-center ${showLabel ? 'gap-1' : ''} text-white/80 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
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
              <th className="w-12 border-b border-white/20 pb-1 text-left text-white/60">Skill</th>
              {Array.from({ length: 18 }, (_, i) => (
                <th key={i} className="border-b border-white/20 pb-1 text-center text-white/60 w-6">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['Q', 'W', 'E', 'R'].map((skill) => (
              <tr key={skill}>
                <td className="py-1">
                  <div className="flex items-center gap-1">
                    <AbilityIcon championId="Yuumi" ability={skill as 'Q' | 'W' | 'E' | 'R'} size={16} />
                    <span className={`font-medium ${skillColors[skill]}`}>{skill}</span>
                  </div>
                </td>
                {levels.map((levelSkill, idx) => (
                  <td key={idx} className="py-1 text-center">
                    {levelSkill === skill ? (
                      <div className={`mx-auto h-2.5 w-2.5 rounded-full ${dotColors[skill]}`} />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <YuumiIcon size="xl" />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Yuumi Guide</h1>
              <p className="mt-2 text-xl text-white/80">Best builds, runes, and matchups for Patch {currentPatch}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-white/70">
            <Badge variant="outline" className="border-purple-400/40 text-purple-300">Patch {currentPatch}</Badge>
            <Badge variant="outline" className="border-blue-400/40 text-blue-300">Support</Badge>
            <Link href="/admin">
              <Badge variant="outline" className="cursor-pointer border-white/20 text-white/60 hover:border-white/40 hover:text-white">
                <Settings className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="builds" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2">
            <TabsTrigger value="builds" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Builds
            </TabsTrigger>
            <TabsTrigger value="matchups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Matchups
            </TabsTrigger>
          </TabsList>

          {/* Builds Tab */}
          <TabsContent value="builds" className="space-y-6">
            {/* Build Selector */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {BUILDS.map((build) => (
                <button
                  key={build.id}
                  onClick={() => setSelectedBuild(build.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    selectedBuild === build.id
                      ? `${build.borderColor} bg-gradient-to-br ${build.color} ring-2 ring-white/20`
                      : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-black/30'
                  }`}
                >
                  {build.isRecommended && (
                    <Badge className="absolute -top-2 right-2 bg-purple-600">Recommended</Badge>
                  )}
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`rounded-lg p-2 ${selectedBuild === build.id ? 'bg-white/20' : 'bg-white/10'}`}>
                      {build.icon}
                    </div>
                    <h3 className="font-bold text-white">{build.name}</h3>
                  </div>
                  <p className="text-sm text-white/70">{build.description}</p>
                </button>
              ))}
            </div>

            {/* Selected Build Details */}
            {currentBuild && (
              <Card className={`border-2 ${currentBuild.borderColor} bg-black/30 backdrop-blur`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg bg-gradient-to-br ${currentBuild.color} p-2`}>
                        {currentBuild.icon}
                      </div>
                      <div>
                        <span className="text-xl">{currentBuild.name}</span>
                        <p className="text-sm font-normal text-white/60">{currentBuild.description}</p>
                      </div>
                    </div>
                    <Button onClick={() => downloadItemset(currentBuild)} className="bg-purple-600 hover:bg-purple-700">
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
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-300">
                        <span className="rounded bg-purple-500/20 p-1">🔮</span>
                        Runes
                      </h3>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 text-center">
                          <Badge className="bg-purple-600">{currentBuild.runes.name}</Badge>
                        </div>
                        <div className="space-y-3 text-sm text-white/80">
                          <div>
                            <span className="text-white/60">Primary: </span>
                            <span className="text-yellow-300">{currentBuild.runes.primaryTree}</span>
                          </div>
                          <div className="pl-4 text-xs text-white/60">
                            • {currentBuild.runes.keystone}
                            {currentBuild.runes.primary.map((r, i) => (
                              <span key={i}> • {r}</span>
                            ))}
                          </div>
                          <div>
                            <span className="text-white/60">Secondary: </span>
                            <span className="text-green-300">{currentBuild.runes.secondaryTree}</span>
                          </div>
                          <div className="pl-4 text-xs text-white/60">
                            {currentBuild.runes.secondary.map((r, i) => (
                              <span key={i}>• {r} </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-green-300">
                        <span className="rounded bg-green-500/20 p-1">⚔️</span>
                        Items
                      </h3>
                      <div className="space-y-3">
                        {/* Starter */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-purple-300">Starter</div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.starter.map((item) => (
                              <div key={item.id} className="group relative">
                                <ItemSlot itemId={item.id} size="md" />
                                <div className="absolute -bottom-1 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white group-hover:block">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Core */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-green-300">Core</div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.core.map((item) => (
                              <div key={item.id} className="group relative">
                                <ItemSlot itemId={item.id} size="md" />
                                <div className="absolute -bottom-1 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white group-hover:block">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Situational */}
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="mb-2 text-xs font-medium text-yellow-300">Situational</div>
                          <div className="flex flex-wrap gap-2">
                            {currentBuild.items.situational.map((item) => (
                              <div key={item.id} className="group relative">
                                <ItemSlot itemId={item.id} size="md" />
                                <div className="absolute -bottom-1 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white group-hover:block">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skill Order Section */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-300">
                        <span className="rounded bg-blue-500/20 p-1">📖</span>
                        Skill Order
                      </h3>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 text-center">
                          <Badge variant="outline" className="border-blue-400 text-blue-300">
                            {currentBuild.skillOrder.priority}
                          </Badge>
                        </div>
                        <SkillOrderTable levels={currentBuild.skillOrder.levels} />
                        <p className="mt-3 text-xs text-white/60">{currentBuild.skillOrder.notes}</p>
                      </div>
                    </div>
                  </div>

                  {/* Item Details (expandable) */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-3 font-semibold text-white">Item Details</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {[...currentBuild.items.starter, ...currentBuild.items.core, ...currentBuild.items.situational].map((item) => (
                        <div key={item.id} className="flex items-start gap-2 rounded bg-white/5 p-2">
                          <ItemSlot itemId={item.id} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-white">{item.name}</div>
                            <div className="text-xs text-white/60">{item.reason}</div>
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
            <Card className="border-white/10 bg-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Matchup Guide</CardTitle>
                <p className="text-white/70">Click on a champion to see detailed tips and strategies.</p>
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
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="enemy">Enemy Supports</TabsTrigger>
                    <TabsTrigger value="ally">Ally ADCs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="enemy" className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-purple-300">Support Champions</h3>
                      <div className="mb-6 grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                        {SUPPORT_CHAMPIONS.map((champion) => (
                          <ChampionImage
                            key={champion}
                            championName={champion}
                            isSelected={selectedSupport === champion}
                            onClick={() => {
                              setSelectedSupport(selectedSupport === champion ? '' : champion);
                              setSelectedADC('');
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedSupport && supportMatchup ? (
                      <Card className="border-white/10 bg-black/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg text-white">
                            <div className="flex items-center gap-3">
                              <ChampionImage championName={selectedSupport} isSelected={true} size={40} interactive={false} showLabel={false} />
                              <span>Playing Against {formatChampionName(selectedSupport)}</span>
                            </div>
                            <Badge className={`border ${getDifficultyColor(supportMatchup.difficulty)}`}>{supportMatchup.difficulty}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold text-purple-300">Tips:</h4>
                            <ul className="space-y-1 text-sm text-white/80">
                              {supportMatchup.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="mt-1 text-purple-400">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {supportMatchup.notes && (
                            <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-white/80">
                              <span className="font-semibold text-purple-200">Note:</span>
                              <p className="mt-1 text-white/75">{supportMatchup.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-white/10 bg-black/20">
                        <CardContent className="py-8 text-center">
                          <Shield className="mx-auto mb-4 h-12 w-12 text-white/40" />
                          <p className="text-white/70">Select a support champion to see matchup details.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ally" className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-blue-300">ADC Champions</h3>
                      <div className="mb-6 grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                        {ADC_CHAMPIONS.map((champion) => (
                          <ChampionImage
                            key={champion}
                            championName={champion}
                            isSelected={selectedADC === champion}
                            onClick={() => {
                              setSelectedADC(selectedADC === champion ? '' : champion);
                              setSelectedSupport('');
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedADC && adcMatchup ? (
                      <Card className="border-white/10 bg-black/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg text-white">
                            <div className="flex items-center gap-3">
                              <ChampionImage championName={selectedADC} isSelected={true} size={40} interactive={false} showLabel={false} />
                              <span>Playing With {formatChampionName(selectedADC)}</span>
                            </div>
                            <Badge className={`border ${getSynergyColor(adcMatchup.synergy)}`}>{adcMatchup.synergy} Synergy</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold text-purple-300">Synergy Tips:</h4>
                            <ul className="space-y-1 text-sm text-white/80">
                              {adcMatchup.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="mt-1 text-purple-400">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {adcMatchup.playstyle && (
                            <div>
                              <h4 className="mb-2 font-semibold text-blue-300">Playstyle:</h4>
                              <p className="text-sm text-white/80">{adcMatchup.playstyle}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-white/10 bg-black/20">
                        <CardContent className="py-8 text-center">
                          <Users className="mx-auto mb-4 h-12 w-12 text-white/40" />
                          <p className="text-white/70">Select an ADC champion to see synergy details.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <MythicShopRotationPanel />
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-xs text-white/50">
          <span>Yuumi Guide • Patch {currentPatch} • Data from OP.GG, U.GG, LoLalytics</span>
          <div className="flex items-center gap-4">
            <Link href="/match" className="hover:text-white hover:underline">
              Match lookup
            </Link>
            <Link href="/gallery" className="hover:text-white hover:underline">
              Rule GIF Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
