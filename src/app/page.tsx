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
import RuneTabs from '@/components/RuneTabs';
import { yuumiRunePages1518 } from '@/lib/runes/yuumi';
import { BEST_RUNES, BEST_ITEMS } from '@/lib/builds/yuumi';
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
  Package,
  Sparkles,
  Target,
  Settings,
} from 'lucide-react';

const PATCH = '15.18';

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

// Default skill order data
const DEFAULT_SKILL_ORDER = {
  name: 'Standard',
  description: 'Max Q first for poke, then E for utility',
  levels: ['Q', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'E', 'Q', 'E', 'R', 'Q', 'E', 'W', 'W', 'R', 'W', 'W'],
  isRecommended: true,
};

export default function YuumiGuide() {
  const [selectedSupport, setSelectedSupport] = useState<string>('');
  const [selectedADC, setSelectedADC] = useState<string>('');
  const [matchupType, setMatchupType] = useState<'enemy' | 'ally'>('enemy');

  const supportMatchup = isSupportMatchupKey(selectedSupport)
    ? SUPPORT_MATCHUPS[selectedSupport]
    : undefined;
  const adcMatchup = isAdcMatchupKey(selectedADC)
    ? ADC_MATCHUPS[selectedADC]
    : undefined;

  // Use static data (Convex integration available via admin panel)
  const items = BEST_ITEMS;
  const currentPatch = PATCH;

  const downloadItemset = () => {
    const itemset = {
      title: 'Yuumi Support - Best Build',
      type: 'custom',
      map: 'SR',
      mode: 'CLASSIC',
      priority: false,
      sortrank: 0,
      blocks: [
        {
          type: 'Starter Items',
          recMath: false,
          minSummonerLevel: -1,
          maxSummonerLevel: -1,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
          items: items.starter.map((item) => ({
            id: item.id.toString(),
            count: 1,
          })),
        },
        {
          type: 'Core Items',
          recMath: false,
          minSummonerLevel: -1,
          maxSummonerLevel: -1,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
          items: items.core.map((item) => ({
            id: item.id.toString(),
            count: 1,
          })),
        },
        {
          type: 'Situational Items',
          recMath: false,
          minSummonerLevel: -1,
          maxSummonerLevel: -1,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
          items: items.situational.map((item) => ({
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
    a.download = 'yuumi-support-itemset.json';
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
            ? 'border-purple-400 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400 ring-offset-2 ring-offset-black'
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
        {showLabel ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/80 px-1 py-1 text-center text-[11px] font-medium text-white">
            {label}
          </div>
        ) : null}
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
        className={`group flex flex-col items-center ${
          showLabel ? 'gap-1' : ''
        } text-white/80 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          isSelected ? 'scale-105' : 'hover:scale-105'
        }`}
        aria-pressed={isSelected}
        aria-label={`View matchup details for ${label}`}
      >
        {content}
      </button>
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
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Yuumi Guide
              </h1>
              <p className="mt-2 text-xl text-white/80">
                Best builds, runes, and matchups for Patch {currentPatch}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-white/70">
            <Badge variant="outline" className="border-purple-400/40 text-purple-300">
              Patch {currentPatch}
            </Badge>
            <Badge variant="outline" className="border-blue-400/40 text-blue-300">
              Support
            </Badge>
            <Link href="/admin">
              <Badge variant="outline" className="cursor-pointer border-white/20 text-white/60 hover:border-white/40 hover:text-white">
                <Settings className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items
            </TabsTrigger>
            <TabsTrigger value="runes" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Runes
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Skill Order
            </TabsTrigger>
            <TabsTrigger value="matchups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Matchups
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card className="border-white/10 bg-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Best Items</span>
                  <Button
                    onClick={downloadItemset}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Itemset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-white/90">
                {/* Starter Items */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-purple-300">
                    Starter Items
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {items.starter.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <ItemSlot itemId={item.id} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-white/70">
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Items */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-green-300">
                    Core Items
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {items.core.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <ItemSlot itemId={item.id} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-white/70">
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Situational Items */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-yellow-300">
                    Situational Items
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.situational.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <ItemSlot itemId={item.id} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-white/70">
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Runes Tab */}
          <TabsContent value="runes" className="space-y-6">
            <Card className="border-white/10 bg-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">
                  Runes (Patch {currentPatch})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90">
                <RuneTabs best={BEST_RUNES} options={yuumiRunePages1518} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skill Order Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card className="border-white/10 bg-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Skill Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-white/90">
                {/* Skill Priority */}
                <div className="rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-purple-300">
                    Skill Priority
                  </h3>
                  <div className="flex items-center gap-4 text-lg">
                    <div className="flex items-center gap-2">
                      <AbilityIcon championId="Yuumi" ability="R" size={32} />
                      <span className="font-bold text-red-300">R</span>
                    </div>
                    <span className="text-white/40">&gt;</span>
                    <div className="flex items-center gap-2">
                      <AbilityIcon championId="Yuumi" ability="Q" size={32} />
                      <span className="font-bold text-blue-300">Q</span>
                    </div>
                    <span className="text-white/40">&gt;</span>
                    <div className="flex items-center gap-2">
                      <AbilityIcon championId="Yuumi" ability="E" size={32} />
                      <span className="font-bold text-yellow-300">E</span>
                    </div>
                    <span className="text-white/40">&gt;</span>
                    <div className="flex items-center gap-2">
                      <AbilityIcon championId="Yuumi" ability="W" size={32} />
                      <span className="font-bold text-green-300">W</span>
                    </div>
                  </div>
                </div>

                {/* Skill Order Table */}
                <div className="rounded-lg bg-white/5 p-4">
                  <h4 className="mb-3 font-semibold text-green-300">
                    Level-by-Level Skill Order
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="w-16 border-b border-white/20 pb-2 text-left text-xs font-medium text-white/60">
                            Skill
                          </th>
                          {Array.from({ length: 18 }, (_, i) => (
                            <th
                              key={i + 1}
                              className={`border-b border-white/20 pb-2 text-center text-xs font-medium text-white/60 ${i < 17 ? 'border-r border-white/10' : ''}`}
                            >
                              {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['Q', 'W', 'E', 'R'].map((skill) => {
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
                            <tr key={skill}>
                              <td className="border-b border-white/10 py-2">
                                <div className="flex items-center gap-2">
                                  <AbilityIcon
                                    championId="Yuumi"
                                    ability={skill as 'Q' | 'W' | 'E' | 'R'}
                                    size={20}
                                  />
                                  <span className={`text-xs font-medium ${skillColors[skill]}`}>
                                    {skill}
                                  </span>
                                </div>
                              </td>
                              {DEFAULT_SKILL_ORDER.levels.map((levelSkill: string, idx: number) => (
                                <td
                                  key={idx}
                                  className={`border-b border-white/10 py-2 text-center ${idx < 17 ? 'border-r border-white/10' : ''}`}
                                >
                                  {levelSkill === skill ? (
                                    <div className={`mx-auto h-3 w-3 rounded-full ${dotColors[skill]}`} />
                                  ) : (
                                    <div className="mx-auto h-3 w-3" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Skill Order Notes */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <h4 className="mb-2 font-semibold text-blue-300">Why This Order?</h4>
                  <div className="space-y-2 text-sm text-white/80">
                    <p>
                      <strong>Q Max First:</strong> Prowling Projectile is your main poke and damage ability. Maxing it increases damage and slow effectiveness.
                    </p>
                    <p>
                      <strong>E Second:</strong> Zoomies provides shields, attack speed, and movement speed. More levels = stronger utility.
                    </p>
                    <p>
                      <strong>W Last:</strong> You and Me! is mainly for attachment. The scaling on this ability is less impactful early.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matchups Tab */}
          <TabsContent value="matchups" className="space-y-6">
            <Card className="border-white/10 bg-black/30 backdrop-blur">
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
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="enemy">Enemy Supports</TabsTrigger>
                    <TabsTrigger value="ally">Ally ADCs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="enemy" className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-purple-300">
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
                      <Card className="border-white/10 bg-black/20">
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
                                Playing Against {formatChampionName(selectedSupport)}
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
                          <p className="text-white/70">
                            Select a support champion to see matchup details.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ally" className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-blue-300">
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
                      <Card className="border-white/10 bg-black/20">
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
        <div className="mt-12 flex items-center justify-between text-xs text-white/50">
          <span>
            Yuumi Guide • Patch {currentPatch} • Data from OP.GG, U.GG, LoLalytics
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/gallery"
              className="hover:text-white hover:underline"
            >
              Rule GIF Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
