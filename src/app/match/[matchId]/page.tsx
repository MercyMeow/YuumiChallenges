'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from '@/components/match-history/item-slots';
import { SummonerSpells } from '@/components/match-history/summoner-spells';
import {
  RuneTreeDisplay,
  RuneIcon,
  StatShardIcon,
} from '@/components/ui/rune-display';
import { ItemTimelineDisplay } from '@/components/match-history/item-timeline-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineEventItem } from '@/components/match-history/timeline-event-item';
import { useTimelineProcessor } from '@/lib/hooks/use-timeline-processor';
import {
  getGameModeDisplayName,
  getGameModeCategoryColor,
} from '@/lib/utils/game-modes';
import { createDefaultProcessingOptions } from '@/lib/utils/item-timeline-processor';
import { formatMatchTime } from '@/lib/utils/time';
import { detectSupportItemCompletion } from '@/lib/utils/match-timeline-utils';
import { RawTimelineData } from '@/lib/types/item-timeline';
import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  Target,
  Gamepad2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Swords,
  Eye,
  Activity,
  Award,
  Users,
  BarChart3,
  GitCompare,
  X,
  Sparkles,
  Crown,
  Timer,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchDetailsData {
  matchData: {
    metadata: {
      dataVersion: string;
      matchId: string;
      participants: string[];
    };
    info: {
      gameId: number;
      gameCreation: number;
      gameDuration: number;
      gameMode: string;
      gameType: string;
      queueId: number;
      mapId: number;
      participants: Array<{
        puuid: string;
        summonerName: string;
        riotIdGameName?: string;
        riotIdTagline?: string;
        championName: string;
        championId: number;
        teamId: number;
        kills: number;
        deaths: number;
        assists: number;
        goldEarned: number;
        goldSpent: number;
        totalMinionsKilled: number;
        neutralMinionsKilled: number;
        totalAllyJungleMinionsKilled: number;
        totalEnemyJungleMinionsKilled: number;
        visionScore: number;
        visionWardsBoughtInGame: number;
        detectorWardsPlaced: number;
        wardsPlaced: number;
        wardsKilled: number;
        champLevel: number;
        totalDamageDealt: number;
        totalDamageDealtToChampions: number;
        totalDamageTaken: number;
        magicDamageDealt: number;
        physicalDamageDealt: number;
        trueDamageDealt: number;
        magicDamageDealtToChampions: number;
        physicalDamageDealtToChampions: number;
        trueDamageDealtToChampions: number;
        magicDamageTaken: number;
        physicalDamageTaken: number;
        trueDamageTaken: number;
        damageSelfMitigated: number;
        totalHeal: number;
        totalHealsOnTeammates: number;
        totalUnitsHealed: number;
        totalDamageShieldedOnTeammates: number;
        timeCCingOthers: number;
        totalTimeCCDealt: number;
        totalTimeSpentDead: number;
        longestTimeSpentLiving: number;
        firstBloodKill: boolean;
        firstBloodAssist: boolean;
        firstTowerKill: boolean;
        firstTowerAssist: boolean;
        turretKills: number;
        turretTakedowns: number;
        inhibitorKills: number;
        inhibitorTakedowns: number;
        baronKills: number;
        dragonKills: number;
        doubleKills: number;
        tripleKills: number;
        quadraKills: number;
        pentaKills: number;
        largestKillingSpree: number;
        largestMultiKill: number;
        largestCriticalStrike: number;
        // Additional available fields we will render
        damageDealtToObjectives?: number;
        damageDealtToTurrets?: number;
        bountyLevel?: number;
        killingSprees?: number;
        timePlayed?: number;
        win: boolean;
        item0: number;
        item1: number;
        item2: number;
        item3: number;
        item4: number;
        item5: number;
        item6: number;
        itemsPurchased: number;
        consumablesPurchased: number;
        summoner1Id: number;
        summoner2Id: number;
        summoner1Casts: number;
        summoner2Casts: number;
        // Ensure these optional ability cast counters exist (API normalization guarantees numbers)
        spell1Casts?: number;
        spell2Casts?: number;
        spell3Casts?: number;
        spell4Casts?: number;
        individualPosition: string;
        teamPosition: string;
        // Riot exposes tons of rich keys under challenges; keep as bag
        challenges: Record<string, any>;
        perks: {
          statPerks: {
            defense: number;
            flex: number;
            offense: number;
          };
          styles: Array<{
            description: string;
            selections: Array<{
              perk: number;
              var1: number;
              var2: number;
              var3: number;
            }>;
            style: number;
          }>;
        };
      }>;
      teams: Array<{
        teamId: number;
        win: boolean;
        bans: Array<{
          championId: number;
          pickTurn: number;
        }>;
        objectives: {
          baron: { first: boolean; kills: number };
          champion: { first: boolean; kills: number };
          dragon: { first: boolean; kills: number };
          inhibitor: { first: boolean; kills: number };
          riftHerald: { first: boolean; kills: number };
          tower: { first: boolean; kills: number };
          // Additional objectives (e.g., atakhan, horde) may exist; allow arbitrary keys
          [key: string]: { first: boolean; kills: number } | any;
        };
        // Optional feats block present in example data
        feats?: Record<string, { featState: number }>;
      }>;
    };
  };
  timelineData?: {
    metadata: any;
    info: {
      frameInterval: number;
      frames: Array<{
        timestamp: number;
        events: Array<any>;
        participantFrames: Record<
          string,
          {
            championStats: any;
            currentGold: number;
            totalGold: number;
            level: number;
            xp: number;
            minionsKilled: number;
            jungleMinionsKilled: number;
            damageStats: any;
            position?: { x: number; y: number };
          }
        >;
      }>;
    };
  };
}

// Move PlayerCard component outside to prevent hook rule violations
const PlayerCard = memo(
  ({
    participant,
    teamColor,
    teamTotals,
    matchData,
    selectedPlayer,
    comparePlayer,
    setSelectedPlayer,
    setComparePlayer,
    getKDAColor,
    formatNumber,
  }: {
    participant: any;
    teamColor: string;
    teamTotals: any;
    matchData: any;
    selectedPlayer: number | null;
    comparePlayer: number | null;
    setSelectedPlayer: (index: number | null) => void;
    setComparePlayer: (index: number | null) => void;
    getKDAColor: (kills: number, deaths: number, assists: number) => string;
    formatNumber: (num: number) => string;
  }) => {
    const isSelected =
      selectedPlayer === matchData.info.participants.indexOf(participant);
    const isComparing =
      comparePlayer === matchData.info.participants.indexOf(participant);
    const playerIndex = matchData.info.participants.indexOf(participant);

    const items = [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
      participant.item6,
    ];

    const kda =
      participant.deaths > 0
        ? (
            (participant.kills + participant.assists) /
            participant.deaths
          ).toFixed(2)
        : (participant.kills + participant.assists).toFixed(0);

    const killParticipation =
      teamTotals.kills > 0
        ? Math.round(
            ((participant.kills + participant.assists) / teamTotals.kills) * 100
          )
        : 0;

    return (
      <div
        className={cn(
          'cursor-pointer rounded-lg border p-4 transition-all',
          teamColor === 'blue'
            ? 'border-blue-500/20 bg-blue-500/5'
            : 'border-red-500/20 bg-red-500/5',
          isSelected && 'ring-2 ring-purple-500',
          isComparing && 'ring-2 ring-yellow-500',
          'hover:bg-opacity-40'
        )}
        onClick={() => {
          if (isSelected) {
            setSelectedPlayer(null);
          } else {
            setSelectedPlayer(playerIndex);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ChampionIcon championId={participant.championName} size="lg" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-black/80 px-1.5 text-xs font-bold text-white">
                {participant.champLevel}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium text-white">
                {participant.riotIdGameName && participant.riotIdTagline
                  ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                  : participant.summonerName}
                {participant.firstBloodKill && (
                  <Badge className="bg-red-500/20 text-xs text-red-400">
                    First Blood
                  </Badge>
                )}
                {participant.largestMultiKill >= 5 && (
                  <Badge className="bg-purple-500/20 text-xs text-purple-400">
                    Penta Kill
                  </Badge>
                )}
              </div>
              <div className="text-sm text-white/60">
                {participant.championName} • {participant.individualPosition}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* KDA & Stats */}
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}
              >
                {participant.kills}/{participant.deaths}/{participant.assists}
              </div>
              <div className="text-xs text-white/60">
                {kda} KDA • {killParticipation}% KP
              </div>
            </div>

            {/* Damage */}
            <div className="text-center">
              <div className="font-semibold text-orange-400">
                {formatNumber(participant.totalDamageDealtToChampions)}
              </div>
              <div className="text-xs text-white/60">Damage</div>
              <Progress
                value={
                  teamTotals.damage > 0
                    ? (participant.totalDamageDealtToChampions /
                        teamTotals.damage) *
                      100
                    : 0
                }
                className="mt-1 h-1 w-16"
              />
              {/* DPM + Team Share */}
              <div className="mt-1 flex items-center justify-center gap-2">
                <Badge className="text-xxs border-orange-500/30 bg-orange-500/10 text-orange-300">
                  DPM{' '}
                  {Math.round(
                    participant.challenges?.damagePerMinute ??
                      participant.totalDamageDealtToChampions /
                        Math.max(1, matchData.info.gameDuration / 60)
                  )}
                </Badge>
                <Badge className="text-xxs border-blue-500/30 bg-blue-500/10 text-blue-300">
                  {teamTotals.damage > 0
                    ? Math.round(
                        (participant.totalDamageDealtToChampions /
                          teamTotals.damage) *
                          100
                      )
                    : participant.challenges?.teamDamagePercentage
                      ? Math.round(
                          participant.challenges.teamDamagePercentage * 100
                        )
                      : 0}
                  %
                </Badge>
              </div>
            </div>

            {/* Gold */}
            <div className="text-center">
              <div className="font-semibold text-yellow-400">
                {formatNumber(participant.goldEarned)}
              </div>
              <div className="text-xs text-white/60">Gold</div>
              <Progress
                value={
                  teamTotals.gold > 0
                    ? (participant.goldEarned / teamTotals.gold) * 100
                    : 0
                }
                className="mt-1 h-1 w-16"
              />
              <div className="mt-1">
                <Badge className="text-xxs border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                  {Math.round(
                    participant.goldEarned /
                      Math.max(1, matchData.info.gameDuration / 60)
                  )}{' '}
                  gpm
                </Badge>
              </div>
            </div>

            {/* CS */}
            <div className="text-center">
              <div className="font-semibold text-purple-400">
                {participant.totalMinionsKilled +
                  participant.neutralMinionsKilled}
              </div>
              <div className="text-xs text-white/60">
                CS (
                {(
                  (participant.totalMinionsKilled +
                    participant.neutralMinionsKilled) /
                  (matchData.info.gameDuration / 60)
                ).toFixed(1)}
                /m)
              </div>
            </div>

            {/* Vision */}
            <div className="text-center">
              <div className="font-semibold text-pink-400">
                {participant.visionScore}
              </div>
              <div className="text-xs text-white/60">Vision</div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <Badge className="text-xxs border-pink-500/30 bg-pink-500/10 text-pink-300">
                  {(
                    participant.visionScore /
                    Math.max(1, matchData.info.gameDuration / 60)
                  ).toFixed(1)}
                  /m
                </Badge>
                {typeof participant.visionWardsBoughtInGame === 'number' && (
                  <Badge className="text-xxs border-purple-500/30 bg-purple-500/10 text-purple-300">
                    {participant.visionWardsBoughtInGame} pinks
                  </Badge>
                )}
              </div>
            </div>

            {/* Items */}
            <ItemSlots items={items} size="sm" />

            {/* Summoner Spells */}
            <SummonerSpells
              spell1Id={participant.summoner1Id}
              spell2Id={participant.summoner2Id}
              size="xs"
            />

            {/* Runes compact */}
            {participant.perks?.styles?.[0]?.selections?.[0] && (
              <div className="flex items-center gap-2">
                <RuneIcon
                  runeId={participant.perks.styles[0].selections[0].perk}
                  size="minor28"
                  variant="keystone"
                />
                <div className="flex items-center gap-1">
                  <StatShardIcon
                    statShardId={participant.perks.statPerks.offense}
                    size="shard24"
                  />
                  <StatShardIcon
                    statShardId={participant.perks.statPerks.flex}
                    size="shard24"
                  />
                  <StatShardIcon
                    statShardId={participant.perks.statPerks.defense}
                    size="shard24"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isComparing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparePlayer(playerIndex);
                  }}
                  className="text-xs"
                >
                  <GitCompare className="h-3 w-3" />
                </Button>
              )}
              {isComparing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparePlayer(null);
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.participant.puuid === nextProps.participant.puuid &&
      prevProps.teamColor === nextProps.teamColor &&
      prevProps.teamTotals.damage === nextProps.teamTotals.damage &&
      prevProps.teamTotals.gold === nextProps.teamTotals.gold &&
      prevProps.teamTotals.kills === nextProps.teamTotals.kills &&
      prevProps.selectedPlayer === nextProps.selectedPlayer &&
      prevProps.comparePlayer === nextProps.comparePlayer
    );
  }
);

PlayerCard.displayName = 'PlayerCard';

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [data, setData] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [comparePlayer, setComparePlayer] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  // Unified timeline sub-view: 'combat' | 'items'
  const [activeTimelineView, setActiveTimelineView] = useState<
    'combat' | 'items'
  >('combat');

  // Add timeline processor hook
  const { processedTimeline, isProcessing, processingTime, processTimeline } =
    useTimelineProcessor();

  useEffect(() => {
    if (!matchId) return;

    const fetchMatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Allow forcing example data via query param during dev
        const url = new URL(window.location.href);
        const useExample = url.searchParams.get('useExample') === '1';
        const apiUrl = `/api/match-details/${matchId}${useExample ? '?useExample=1' : ''}`;

        const response = await fetch(apiUrl, { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch match details');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  // Support quest completion times for compare player (mirror of selected player computation)
  const compareSupportItemCompletionTimes = useMemo(() => {
    if (
      !processedTimeline?.playerTimeline?.events ||
      !data?.matchData?.info?.participants ||
      comparePlayer === null
    ) {
      return null;
    }

    const player = data.matchData.info.participants[comparePlayer];
    if (!player) {
      return null;
    }

    // Reuse the same events; processor currently runs per selected player,
    // but detectSupportItemCompletion only needs events and the player's chain mapping.
    // If per-participant events segmentation is required later, adapt here.
    return detectSupportItemCompletion(
      player,
      processedTimeline.playerTimeline.events
    );
  }, [processedTimeline, data?.matchData?.info?.participants, comparePlayer]);

  const formatDuration = (seconds: number) => {
    return formatMatchTime(seconds * 1000); // Convert seconds to milliseconds
  };

  const getKDAColor = (kills: number, deaths: number, assists: number) => {
    const ratio = deaths > 0 ? (kills + assists) / deaths : 99;
    if (ratio >= 5) return 'text-purple-400';
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Calculate team totals for percentage calculations
  const teamTotals = useMemo(() => {
    if (!data?.matchData?.info?.participants) {
      return {
        blue: { damage: 0, taken: 0, gold: 0, kills: 0 },
        red: { damage: 0, taken: 0, gold: 0, kills: 0 },
      };
    }

    const blueTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 100
    );
    const redTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 200
    );

    const blueTotals = {
      damage: blueTeam.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        0
      ),
      taken: blueTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: blueTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: blueTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    const redTotals = {
      damage: redTeam.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        0
      ),
      taken: redTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: redTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: redTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    return { blue: blueTotals, red: redTotals };
  }, [data]);

  // Effect to process item timeline for selected player using Web Worker
  useEffect(() => {
    // Ensure we have timeline frames before attempting to process
    if (
      !data?.timelineData ||
      !data.timelineData.info ||
      !Array.isArray(data.timelineData.info.frames) ||
      data.timelineData.info.frames.length === 0 ||
      selectedPlayer === null
    ) {
      return;
    }

    const rawTimelineData: RawTimelineData = {
      metadata: data.timelineData.metadata,
      info: {
        frameInterval: data.timelineData.info.frameInterval,
        frames: data.timelineData.info.frames.map((frame) => ({
          timestamp: frame.timestamp,
          events: frame.events || [],
          participantFrames: frame.participantFrames || {},
        })),
      },
    };

    const processingOptions = createDefaultProcessingOptions(selectedPlayer);

    // Trigger async processing
    processTimeline(rawTimelineData, processingOptions);
  }, [data?.timelineData, selectedPlayer, processTimeline]);

  // Calculate support item completion times for selected player
  const supportItemCompletionTimes = useMemo(() => {
    if (
      !processedTimeline?.playerTimeline?.events ||
      !data?.matchData?.info?.participants ||
      selectedPlayer === null
    ) {
      return null;
    }

    const selectedPlayerData = data.matchData.info.participants[selectedPlayer];
    if (!selectedPlayerData) {
      return null;
    }

    return detectSupportItemCompletion(
      selectedPlayerData,
      processedTimeline.playerTimeline.events
    );
  }, [processedTimeline, data?.matchData?.info?.participants, selectedPlayer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-white/60" />
            <span className="ml-4 text-xl text-white/60">
              Loading comprehensive match data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="mr-4 h-12 w-12 text-red-400" />
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">
                Error Loading Match
              </h2>
              <p className="text-white/60">{error || 'No match data found'}</p>
              <Button
                onClick={() => window.history.back()}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const matchData = data.matchData;
  const timelineData = data.timelineData;

  const gameMode = getGameModeDisplayName(matchData.info.queueId);
  const gameModeColor = getGameModeCategoryColor(
    matchData.info.queueId === 420 || matchData.info.queueId === 440
      ? 'ranked'
      : matchData.info.queueId === 450
        ? 'aram'
        : 'normal'
  );

  const blueTeam = matchData.info.participants.filter((p) => p.teamId === 100);
  const redTeam = matchData.info.participants.filter((p) => p.teamId === 200);
  const blueTeamData = matchData.info.teams.find((t) => t.teamId === 100);
  const redTeamData = matchData.info.teams.find((t) => t.teamId === 200);

  const selectedPlayerData =
    selectedPlayer !== null
      ? matchData.info.participants[selectedPlayer]
      : null;

  const comparePlayerData =
    comparePlayer !== null ? matchData.info.participants[comparePlayer] : null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      {/* Animated particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-pulse rounded-full bg-purple-400 opacity-60"></div>
        <div className="animation-delay-1000 absolute right-1/3 top-3/4 h-1 w-1 animate-pulse rounded-full bg-blue-400 opacity-40"></div>
        <div className="animation-delay-2000 absolute left-1/2 top-1/2 h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 opacity-50"></div>
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mb-4 border-white/20 text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-white">
                    <Gamepad2 className="h-6 w-6" />
                    Enhanced Match Details
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-4 text-white/60">
                    <Badge
                      variant="outline"
                      className={`${gameModeColor} border-current`}
                    >
                      {gameMode}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(matchData.info.gameDuration)}
                    </div>
                    <span>
                      {formatDistanceToNow(
                        new Date(matchData.info.gameCreation),
                        { addSuffix: true }
                      )}
                    </span>
                    {blueTeamData?.win && (
                      <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-400">
                        Blue Victory
                      </Badge>
                    )}
                    {redTeamData?.win && (
                      <Badge className="border-red-500/30 bg-red-500/20 text-red-400">
                        Red Victory
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Match ID</div>
                  <div className="font-mono text-sm text-white">{matchId}</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-white/10 p-1 backdrop-blur-md">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Detailed Stats
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white"
            >
              <Activity className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white"
            >
              <Award className="mr-2 h-4 w-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger
              value="runes"
              className="rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Runes & Perks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Blue Team */}
            <Card className="border border-blue-500/20 bg-black/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                  Blue Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {blueTeam.map((participant, index) => (
                  <PlayerCard
                    key={index}
                    participant={participant}
                    teamColor="blue"
                    teamTotals={teamTotals.blue}
                    matchData={matchData}
                    selectedPlayer={selectedPlayer}
                    comparePlayer={comparePlayer}
                    setSelectedPlayer={setSelectedPlayer}
                    setComparePlayer={setComparePlayer}
                    getKDAColor={getKDAColor}
                    formatNumber={formatNumber}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Red Team */}
            <Card className="border border-red-500/20 bg-black/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  Red Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {redTeam.map((participant, index) => (
                  <PlayerCard
                    key={index}
                    participant={participant}
                    teamColor="red"
                    teamTotals={teamTotals.red}
                    matchData={matchData}
                    selectedPlayer={selectedPlayer}
                    comparePlayer={comparePlayer}
                    setSelectedPlayer={setSelectedPlayer}
                    setComparePlayer={setComparePlayer}
                    getKDAColor={getKDAColor}
                    formatNumber={formatNumber}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Team Objectives */}
            <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5" />
                  Team Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Team Feats (if available) */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {blueTeamData?.feats &&
                    Object.entries(blueTeamData.feats).map(([feat]: any) => (
                      <Badge
                        key={`blue-${feat}`}
                        className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-300"
                      >
                        🔵 {feat.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    ))}
                  {redTeamData?.feats &&
                    Object.entries(redTeamData.feats).map(([feat]: any) => (
                      <Badge
                        key={`red-${feat}`}
                        className="border-red-500/30 bg-red-500/10 text-xs text-red-300"
                      >
                        🔴 {feat.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="mb-4 font-semibold text-blue-400">
                      Blue Team
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {blueTeamData?.objectives &&
                        Object.entries(blueTeamData.objectives).map(
                          ([key, obj]: any) => (
                            <div
                              key={key}
                              className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center"
                            >
                              <div className="text-2xl font-bold text-white">
                                {obj?.kills ?? 0}
                              </div>
                              <div className="text-xs capitalize text-white/60">
                                {key}
                              </div>
                              {obj?.first && (
                                <Badge className="mt-1 bg-yellow-500/20 text-xs text-yellow-400">
                                  First
                                </Badge>
                              )}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-4 font-semibold text-red-400">
                      Red Team
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {redTeamData?.objectives &&
                        Object.entries(redTeamData.objectives).map(
                          ([key, obj]: any) => (
                            <div
                              key={key}
                              className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center"
                            >
                              <div className="text-2xl font-bold text-white">
                                {obj?.kills ?? 0}
                              </div>
                              <div className="text-xs capitalize text-white/60">
                                {key}
                              </div>
                              {obj?.first && (
                                <Badge className="mt-1 bg-yellow-500/20 text-xs text-yellow-400">
                                  First
                                </Badge>
                              )}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Stats Tab */}
          <TabsContent value="details" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <ChampionIcon
                      championId={selectedPlayerData.championName}
                      size="md"
                    />
                    {selectedPlayerData.riotIdGameName}#
                    {selectedPlayerData.riotIdTagline} - Detailed Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Combat Stats */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-400">
                        <Swords className="h-5 w-5" />
                        Combat
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Total Damage Dealt
                          </span>
                          <span className="font-medium text-white">
                            {formatNumber(selectedPlayerData.totalDamageDealt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Damage to Champions
                          </span>
                          <span className="font-medium text-orange-400">
                            {formatNumber(
                              selectedPlayerData.totalDamageDealtToChampions
                            )}
                          </span>
                        </div>
                        {/* Dealt breakdown (total) */}
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Total Physical Dealt
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.physicalDamageDealt
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Total Magic Dealt
                          </span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.magicDamageDealt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Total True Dealt
                          </span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.trueDamageDealt)}
                          </span>
                        </div>
                        {/* To champions breakdown (existing) */}
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Physical to Champions
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.physicalDamageDealtToChampions
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Magic to Champions
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.magicDamageDealtToChampions
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            True to Champions
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.trueDamageDealtToChampions
                            )}
                          </span>
                        </div>

                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Damage Taken</span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.totalDamageTaken)}
                          </span>
                        </div>
                        {/* Taken breakdown */}
                        <div className="flex justify-between">
                          <span className="text-white/60">Physical Taken</span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.physicalDamageTaken
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Magic Taken</span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.magicDamageTaken)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">True Taken</span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.trueDamageTaken)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Damage Mitigated
                          </span>
                          <span className="text-green-400">
                            {formatNumber(
                              selectedPlayerData.damageSelfMitigated
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Healing Done</span>
                          <span className="text-green-400">
                            {formatNumber(selectedPlayerData.totalHeal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">CC Time Dealt</span>
                          <span className="text-white">
                            {selectedPlayerData.totalTimeCCDealt}s
                          </span>
                        </div>
                        <Separator className="my-2" />
                        {/* Objective damage */}
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Damage to Objectives
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.damageDealtToObjectives ?? 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Damage to Turrets
                          </span>
                          <span className="text-white">
                            {formatNumber(
                              selectedPlayerData.damageDealtToTurrets ?? 0
                            )}
                          </span>
                        </div>
                        {/* DPM / Team Share */}
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Damage per Minute
                          </span>
                          <span className="text-orange-300">
                            {Math.round(
                              selectedPlayerData.challenges?.damagePerMinute ??
                                selectedPlayerData.totalDamageDealtToChampions /
                                  Math.max(1, matchData.info.gameDuration / 60)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Team Damage Share
                          </span>
                          <span className="text-blue-300">
                            {(() => {
                              const team =
                                selectedPlayerData.teamId === 100
                                  ? teamTotals.blue
                                  : teamTotals.red;
                              const share =
                                team.damage > 0
                                  ? Math.round(
                                      (selectedPlayerData.totalDamageDealtToChampions /
                                        team.damage) *
                                        100
                                    )
                                  : selectedPlayerData.challenges
                                        ?.teamDamagePercentage
                                    ? Math.round(
                                        selectedPlayerData.challenges
                                          .teamDamagePercentage * 100
                                      )
                                    : 0;
                              return `${share}%`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Economy Stats */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-400">
                        <Coins className="h-5 w-5" />
                        Economy
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold Earned</span>
                          <span className="font-medium text-yellow-400">
                            {formatNumber(selectedPlayerData.goldEarned)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold Spent</span>
                          <span className="text-white">
                            {formatNumber(selectedPlayerData.goldSpent)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold/Min</span>
                          <span className="text-white">
                            {Math.round(
                              selectedPlayerData.goldEarned /
                                Math.max(1, matchData.info.gameDuration / 60)
                            )}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Minion Kills</span>
                          <span className="text-white">
                            {selectedPlayerData.totalMinionsKilled}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Jungle CS</span>
                          <span className="text-white">
                            {selectedPlayerData.neutralMinionsKilled}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Ally Jungle CS</span>
                          <span className="text-white">
                            {selectedPlayerData.totalAllyJungleMinionsKilled}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Enemy Jungle CS</span>
                          <span className="text-purple-400">
                            {selectedPlayerData.totalEnemyJungleMinionsKilled}
                          </span>
                        </div>
                        {/* Early efficiency from challenges when present */}
                        <div className="flex justify-between">
                          <span className="text-white/60">Lane CS @10</span>
                          <span className="text-white">
                            {selectedPlayerData.challenges
                              ?.laneMinionsFirst10Minutes ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Jungle CS @10</span>
                          <span className="text-white">
                            {Math.round(
                              selectedPlayerData.challenges
                                ?.jungleCsBefore10Minutes ?? 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Max CS Lead vs Opp
                          </span>
                          <span className="text-white">
                            {selectedPlayerData.challenges
                              ?.maxCsAdvantageOnLaneOpponent ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">CS/Min</span>
                          <span className="text-white">
                            {(
                              (selectedPlayerData.totalMinionsKilled +
                                selectedPlayerData.neutralMinionsKilled) /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1)}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Items Purchased</span>
                          <span className="text-white">
                            {selectedPlayerData.itemsPurchased}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Consumables</span>
                          <span className="text-white">
                            {selectedPlayerData.consumablesPurchased}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vision & Objectives */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-pink-400">
                        <Eye className="h-5 w-5" />
                        Vision & Objectives
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Vision Score</span>
                          <span className="font-medium text-pink-400">
                            {selectedPlayerData.visionScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Vision Score / Min
                          </span>
                          <span className="text-pink-300">
                            {(
                              selectedPlayerData.visionScore /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Wards Placed</span>
                          <span className="text-white">
                            {selectedPlayerData.wardsPlaced}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Control Wards Placed
                          </span>
                          <span className="text-white">
                            {selectedPlayerData.detectorWardsPlaced}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Vision Wards Bought
                          </span>
                          <span className="text-white">
                            {selectedPlayerData.visionWardsBoughtInGame}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Wards Killed</span>
                          <span className="text-white">
                            {selectedPlayerData.wardsKilled}
                          </span>
                        </div>

                        {/* Support Quest Completed (custom stat) */}
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Support Quest Completed
                          </span>
                          {(() => {
                            const questCompleteMs =
                              supportItemCompletionTimes?.tier3 ??
                              supportItemCompletionTimes?.tier2 ??
                              supportItemCompletionTimes?.tier1 ??
                              null;

                            return (
                              <span
                                className={
                                  questCompleteMs
                                    ? 'text-green-300'
                                    : 'text-white/40'
                                }
                              >
                                {questCompleteMs
                                  ? formatMatchTime(questCompleteMs)
                                  : '—'}
                              </span>
                            );
                          })()}
                        </div>

                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Turret Kills</span>
                          <span className="text-white">
                            {selectedPlayerData.turretKills}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Inhibitor Kills</span>
                          <span className="text-white">
                            {selectedPlayerData.inhibitorKills}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Baron Kills</span>
                          <span className="text-purple-400">
                            {selectedPlayerData.baronKills}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Dragon Kills</span>
                          <span className="text-orange-400">
                            {selectedPlayerData.dragonKills}
                          </span>
                        </div>
                        <Separator className="my-2" />

                        {/* Comparison block for Support Quest Completed when a compare player is selected */}
                        {comparePlayerData && (
                          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2">
                            <span className="text-white/60">
                              Support Quest Completed (Compare)
                            </span>
                            <div className="flex items-center gap-4">
                              {/* Selected Player value */}
                              {(() => {
                                const questSelected =
                                  supportItemCompletionTimes?.tier3 ??
                                  supportItemCompletionTimes?.tier2 ??
                                  supportItemCompletionTimes?.tier1 ??
                                  null;
                                return (
                                  <span
                                    className={
                                      questSelected
                                        ? 'text-green-300'
                                        : 'text-white/40'
                                    }
                                  >
                                    {questSelected
                                      ? formatMatchTime(questSelected)
                                      : '—'}
                                  </span>
                                );
                              })()}
                              <span className="text-white/30">vs</span>
                              {/* Compare Player value */}
                              {(() => {
                                const questCompare =
                                  compareSupportItemCompletionTimes?.tier3 ??
                                  compareSupportItemCompletionTimes?.tier2 ??
                                  compareSupportItemCompletionTimes?.tier1 ??
                                  null;
                                return (
                                  <span
                                    className={
                                      questCompare
                                        ? 'text-green-300'
                                        : 'text-white/40'
                                    }
                                  >
                                    {questCompare
                                      ? formatMatchTime(questCompare)
                                      : '—'}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-white/60">Time Dead</span>
                          <span className="text-red-400">
                            {selectedPlayerData.totalTimeSpentDead}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Longest Life</span>
                          <span className="text-green-400">
                            {selectedPlayerData.longestTimeSpentLiving}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Support Item Progression */}
                    {supportItemCompletionTimes &&
                      Object.values(supportItemCompletionTimes).some(
                        (time) => time !== null
                      ) && (
                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                            <Sparkles className="h-5 w-5" />
                            Support Item Progression
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(supportItemCompletionTimes).map(
                              ([tier, timestamp]) => {
                                if (timestamp === null) return null;

                                const tierNames = {
                                  base: 'Support Item Started',
                                  tier1: 'Tier 1 Evolution',
                                  tier2: 'Tier 2 Evolution',
                                  tier3: 'Final Evolution',
                                };

                                return (
                                  <div
                                    key={tier}
                                    className="flex justify-between"
                                  >
                                    <span className="text-white/60">
                                      {
                                        tierNames[
                                          tier as keyof typeof tierNames
                                        ]
                                      }
                                    </span>
                                    <span className="font-medium text-cyan-400">
                                      {formatMatchTime(timestamp)}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                    {/* Multikills & Streaks */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-400">
                        <Crown className="h-5 w-5" />
                        Achievements
                      </h3>
                      <div className="space-y-2">
                        {selectedPlayerData.pentaKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Penta Kills</span>
                            <span className="font-bold text-purple-400">
                              {selectedPlayerData.pentaKills}
                            </span>
                          </div>
                        )}
                        {selectedPlayerData.quadraKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Quadra Kills</span>
                            <span className="text-purple-400">
                              {selectedPlayerData.quadraKills}
                            </span>
                          </div>
                        )}
                        {selectedPlayerData.tripleKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Triple Kills</span>
                            <span className="text-blue-400">
                              {selectedPlayerData.tripleKills}
                            </span>
                          </div>
                        )}
                        {selectedPlayerData.doubleKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Double Kills</span>
                            <span className="text-white">
                              {selectedPlayerData.doubleKills}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/60">Killing Spree</span>
                          <span className="text-white">
                            {selectedPlayerData.largestKillingSpree}
                          </span>
                        </div>
                        {selectedPlayerData.largestCriticalStrike > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Largest Crit</span>
                            <span className="text-orange-400">
                              {selectedPlayerData.largestCriticalStrike}
                            </span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Summoner 1 Casts
                          </span>
                          <span className="text-white">
                            {selectedPlayerData.summoner1Casts}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Summoner 2 Casts
                          </span>
                          <span className="text-white">
                            {selectedPlayerData.summoner2Casts}
                          </span>
                        </div>
                        {/* Champion Ability Casts */}
                        <Separator className="my-2" />
                        <h4 className="text-sm font-semibold text-white/80">
                          Abilities
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-2">
                            <span className="text-white/60">Q casts</span>
                            <span className="text-white">
                              {selectedPlayerData.spell1Casts ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-2">
                            <span className="text-white/60">W casts</span>
                            <span className="text-white">
                              {selectedPlayerData.spell2Casts ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-2">
                            <span className="text-white/60">E casts</span>
                            <span className="text-white">
                              {selectedPlayerData.spell3Casts ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-2">
                            <span className="text-white/60">R casts</span>
                            <span className="text-white">
                              {selectedPlayerData.spell4Casts ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-white/40" />
                  <p className="text-white/60">
                    Click on a player in the Overview tab to see their detailed
                    stats
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comparison View */}
            {comparePlayerData && selectedPlayerData && (
              <Card className="border border-yellow-500/20 bg-black/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <GitCompare className="h-5 w-5 text-yellow-400" />
                    Player Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Player Headers */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium text-white">
                            {selectedPlayerData.riotIdGameName}
                          </span>
                          <ChampionIcon
                            championId={selectedPlayerData.championName}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-white/60">Player Comparison</h4>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <ChampionIcon
                            championId={comparePlayerData.championName}
                            size="sm"
                          />
                          <span className="font-medium text-white">
                            {comparePlayerData.riotIdGameName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Combat Stats Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div></div>
                        <div className="text-center">
                          <h4 className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-400">
                            <Swords className="h-4 w-4" />
                            Combat
                          </h4>
                        </div>
                        <div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {[
                          {
                            label: 'KDA',
                            value1: `${selectedPlayerData.kills}/${selectedPlayerData.deaths}/${selectedPlayerData.assists}`,
                            value2: `${comparePlayerData.kills}/${comparePlayerData.deaths}/${comparePlayerData.assists}`,
                            isNumeric: false,
                          },
                          {
                            label: 'Total Damage Dealt',
                            value1: formatNumber(
                              selectedPlayerData.totalDamageDealt
                            ),
                            value2: formatNumber(
                              comparePlayerData.totalDamageDealt
                            ),
                            numValue1: selectedPlayerData.totalDamageDealt,
                            numValue2: comparePlayerData.totalDamageDealt,
                          },
                          {
                            label: 'Damage to Champions',
                            value1: formatNumber(
                              selectedPlayerData.totalDamageDealtToChampions
                            ),
                            value2: formatNumber(
                              comparePlayerData.totalDamageDealtToChampions
                            ),
                            numValue1:
                              selectedPlayerData.totalDamageDealtToChampions,
                            numValue2:
                              comparePlayerData.totalDamageDealtToChampions,
                          },
                          {
                            label: 'Physical Damage Dealt',
                            value1: formatNumber(
                              selectedPlayerData.physicalDamageDealt
                            ),
                            value2: formatNumber(
                              comparePlayerData.physicalDamageDealt
                            ),
                            numValue1: selectedPlayerData.physicalDamageDealt,
                            numValue2: comparePlayerData.physicalDamageDealt,
                          },
                          {
                            label: 'Magic Damage Dealt',
                            value1: formatNumber(
                              selectedPlayerData.magicDamageDealt
                            ),
                            value2: formatNumber(
                              comparePlayerData.magicDamageDealt
                            ),
                            numValue1: selectedPlayerData.magicDamageDealt,
                            numValue2: comparePlayerData.magicDamageDealt,
                          },
                          {
                            label: 'True Damage Dealt',
                            value1: formatNumber(
                              selectedPlayerData.trueDamageDealt
                            ),
                            value2: formatNumber(
                              comparePlayerData.trueDamageDealt
                            ),
                            numValue1: selectedPlayerData.trueDamageDealt,
                            numValue2: comparePlayerData.trueDamageDealt,
                          },
                          {
                            label: 'Damage Taken',
                            value1: formatNumber(
                              selectedPlayerData.totalDamageTaken
                            ),
                            value2: formatNumber(
                              comparePlayerData.totalDamageTaken
                            ),
                            numValue1: selectedPlayerData.totalDamageTaken,
                            numValue2: comparePlayerData.totalDamageTaken,
                          },
                          {
                            label: 'Damage Mitigated',
                            value1: formatNumber(
                              selectedPlayerData.damageSelfMitigated
                            ),
                            value2: formatNumber(
                              comparePlayerData.damageSelfMitigated
                            ),
                            numValue1: selectedPlayerData.damageSelfMitigated,
                            numValue2: comparePlayerData.damageSelfMitigated,
                          },
                          {
                            label: 'Healing Done',
                            value1: formatNumber(selectedPlayerData.totalHeal),
                            value2: formatNumber(comparePlayerData.totalHeal),
                            numValue1: selectedPlayerData.totalHeal,
                            numValue2: comparePlayerData.totalHeal,
                          },
                          {
                            label: 'CC Time Dealt',
                            value1: `${selectedPlayerData.totalTimeCCDealt}s`,
                            value2: `${comparePlayerData.totalTimeCCDealt}s`,
                            numValue1: selectedPlayerData.totalTimeCCDealt,
                            numValue2: comparePlayerData.totalTimeCCDealt,
                          },
                          {
                            label: 'Damage to Objectives',
                            value1: formatNumber(
                              selectedPlayerData.damageDealtToObjectives ?? 0
                            ),
                            value2: formatNumber(
                              comparePlayerData.damageDealtToObjectives ?? 0
                            ),
                            numValue1:
                              selectedPlayerData.damageDealtToObjectives ?? 0,
                            numValue2:
                              comparePlayerData.damageDealtToObjectives ?? 0,
                          },
                          {
                            label: 'Damage to Turrets',
                            value1: formatNumber(
                              selectedPlayerData.damageDealtToTurrets ?? 0
                            ),
                            value2: formatNumber(
                              comparePlayerData.damageDealtToTurrets ?? 0
                            ),
                            numValue1:
                              selectedPlayerData.damageDealtToTurrets ?? 0,
                            numValue2:
                              comparePlayerData.damageDealtToTurrets ?? 0,
                          },
                          {
                            label: 'DPM',
                            value1: Math.round(
                              selectedPlayerData.challenges?.damagePerMinute ??
                                selectedPlayerData.totalDamageDealtToChampions /
                                  Math.max(1, matchData.info.gameDuration / 60)
                            ).toString(),
                            value2: Math.round(
                              comparePlayerData.challenges?.damagePerMinute ??
                                comparePlayerData.totalDamageDealtToChampions /
                                  Math.max(1, matchData.info.gameDuration / 60)
                            ).toString(),
                            numValue1: Math.round(
                              selectedPlayerData.challenges?.damagePerMinute ??
                                selectedPlayerData.totalDamageDealtToChampions /
                                  Math.max(1, matchData.info.gameDuration / 60)
                            ),
                            numValue2: Math.round(
                              comparePlayerData.challenges?.damagePerMinute ??
                                comparePlayerData.totalDamageDealtToChampions /
                                  Math.max(1, matchData.info.gameDuration / 60)
                            ),
                          },
                        ].map((stat, index) => (
                          <React.Fragment key={index}>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'font-medium',
                                  stat.isNumeric === false ||
                                    (stat.numValue1 ?? stat.value1) >
                                      (stat.numValue2 ?? stat.value2)
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value1}
                              </span>
                            </div>
                            <div className="text-center text-xs text-white/40">
                              {stat.label}
                            </div>
                            <div className="text-left">
                              <span
                                className={cn(
                                  'font-medium',
                                  stat.isNumeric === false ||
                                    (stat.numValue2 ?? stat.value2) >
                                      (stat.numValue1 ?? stat.value1)
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value2}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Economy Stats Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div></div>
                        <div className="text-center">
                          <h4 className="flex items-center justify-center gap-2 text-sm font-semibold text-yellow-400">
                            <Coins className="h-4 w-4" />
                            Economy
                          </h4>
                        </div>
                        <div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {[
                          {
                            label: 'Gold Earned',
                            value1: formatNumber(selectedPlayerData.goldEarned),
                            value2: formatNumber(comparePlayerData.goldEarned),
                            numValue1: selectedPlayerData.goldEarned,
                            numValue2: comparePlayerData.goldEarned,
                          },
                          {
                            label: 'Gold Spent',
                            value1: formatNumber(selectedPlayerData.goldSpent),
                            value2: formatNumber(comparePlayerData.goldSpent),
                            numValue1: selectedPlayerData.goldSpent,
                            numValue2: comparePlayerData.goldSpent,
                          },
                          {
                            label: 'Gold/Min',
                            value1: Math.round(
                              selectedPlayerData.goldEarned /
                                Math.max(1, matchData.info.gameDuration / 60)
                            ).toString(),
                            value2: Math.round(
                              comparePlayerData.goldEarned /
                                Math.max(1, matchData.info.gameDuration / 60)
                            ).toString(),
                            numValue1: Math.round(
                              selectedPlayerData.goldEarned /
                                Math.max(1, matchData.info.gameDuration / 60)
                            ),
                            numValue2: Math.round(
                              comparePlayerData.goldEarned /
                                Math.max(1, matchData.info.gameDuration / 60)
                            ),
                          },
                          {
                            label: 'CS',
                            value1: (
                              selectedPlayerData.totalMinionsKilled +
                              selectedPlayerData.neutralMinionsKilled
                            ).toString(),
                            value2: (
                              comparePlayerData.totalMinionsKilled +
                              comparePlayerData.neutralMinionsKilled
                            ).toString(),
                            numValue1:
                              selectedPlayerData.totalMinionsKilled +
                              selectedPlayerData.neutralMinionsKilled,
                            numValue2:
                              comparePlayerData.totalMinionsKilled +
                              comparePlayerData.neutralMinionsKilled,
                          },
                          {
                            label: 'Minion Kills',
                            value1:
                              selectedPlayerData.totalMinionsKilled.toString(),
                            value2:
                              comparePlayerData.totalMinionsKilled.toString(),
                            numValue1: selectedPlayerData.totalMinionsKilled,
                            numValue2: comparePlayerData.totalMinionsKilled,
                          },
                          {
                            label: 'Jungle CS',
                            value1:
                              selectedPlayerData.neutralMinionsKilled.toString(),
                            value2:
                              comparePlayerData.neutralMinionsKilled.toString(),
                            numValue1: selectedPlayerData.neutralMinionsKilled,
                            numValue2: comparePlayerData.neutralMinionsKilled,
                          },
                          {
                            label: 'Enemy Jungle CS',
                            value1:
                              selectedPlayerData.totalEnemyJungleMinionsKilled.toString(),
                            value2:
                              comparePlayerData.totalEnemyJungleMinionsKilled.toString(),
                            numValue1:
                              selectedPlayerData.totalEnemyJungleMinionsKilled,
                            numValue2:
                              comparePlayerData.totalEnemyJungleMinionsKilled,
                          },
                          {
                            label: 'CS/Min',
                            value1: (
                              (selectedPlayerData.totalMinionsKilled +
                                selectedPlayerData.neutralMinionsKilled) /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1),
                            value2: (
                              (comparePlayerData.totalMinionsKilled +
                                comparePlayerData.neutralMinionsKilled) /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1),
                            numValue1:
                              (selectedPlayerData.totalMinionsKilled +
                                selectedPlayerData.neutralMinionsKilled) /
                              Math.max(1, matchData.info.gameDuration / 60),
                            numValue2:
                              (comparePlayerData.totalMinionsKilled +
                                comparePlayerData.neutralMinionsKilled) /
                              Math.max(1, matchData.info.gameDuration / 60),
                          },
                          {
                            label: 'Items Purchased',
                            value1:
                              selectedPlayerData.itemsPurchased.toString(),
                            value2: comparePlayerData.itemsPurchased.toString(),
                            numValue1: selectedPlayerData.itemsPurchased,
                            numValue2: comparePlayerData.itemsPurchased,
                          },
                          {
                            label: 'Consumables',
                            value1:
                              selectedPlayerData.consumablesPurchased.toString(),
                            value2:
                              comparePlayerData.consumablesPurchased.toString(),
                            numValue1: selectedPlayerData.consumablesPurchased,
                            numValue2: comparePlayerData.consumablesPurchased,
                          },
                        ].map((stat, index) => (
                          <React.Fragment key={index}>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'font-medium',
                                  (stat.numValue1 ??
                                    parseFloat(stat.value1.toString())) >
                                    (stat.numValue2 ??
                                      parseFloat(stat.value2.toString()))
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value1}
                              </span>
                            </div>
                            <div className="text-center text-xs text-white/40">
                              {stat.label}
                            </div>
                            <div className="text-left">
                              <span
                                className={cn(
                                  'font-medium',
                                  (stat.numValue2 ??
                                    parseFloat(stat.value2.toString())) >
                                    (stat.numValue1 ??
                                      parseFloat(stat.value1.toString()))
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value2}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Vision & Objectives Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div></div>
                        <div className="text-center">
                          <h4 className="flex items-center justify-center gap-2 text-sm font-semibold text-pink-400">
                            <Eye className="h-4 w-4" />
                            Vision & Objectives
                          </h4>
                        </div>
                        <div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {[
                          {
                            label: 'Vision Score',
                            value1: selectedPlayerData.visionScore.toString(),
                            value2: comparePlayerData.visionScore.toString(),
                            numValue1: selectedPlayerData.visionScore,
                            numValue2: comparePlayerData.visionScore,
                          },
                          {
                            label: 'Vision Score/Min',
                            value1: (
                              selectedPlayerData.visionScore /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1),
                            value2: (
                              comparePlayerData.visionScore /
                              Math.max(1, matchData.info.gameDuration / 60)
                            ).toFixed(1),
                            numValue1:
                              selectedPlayerData.visionScore /
                              Math.max(1, matchData.info.gameDuration / 60),
                            numValue2:
                              comparePlayerData.visionScore /
                              Math.max(1, matchData.info.gameDuration / 60),
                          },
                          {
                            label: 'Wards Placed',
                            value1: selectedPlayerData.wardsPlaced.toString(),
                            value2: comparePlayerData.wardsPlaced.toString(),
                            numValue1: selectedPlayerData.wardsPlaced,
                            numValue2: comparePlayerData.wardsPlaced,
                          },
                          {
                            label: 'Control Wards',
                            value1:
                              selectedPlayerData.detectorWardsPlaced.toString(),
                            value2:
                              comparePlayerData.detectorWardsPlaced.toString(),
                            numValue1: selectedPlayerData.detectorWardsPlaced,
                            numValue2: comparePlayerData.detectorWardsPlaced,
                          },
                          {
                            label: 'Wards Killed',
                            value1: selectedPlayerData.wardsKilled.toString(),
                            value2: comparePlayerData.wardsKilled.toString(),
                            numValue1: selectedPlayerData.wardsKilled,
                            numValue2: comparePlayerData.wardsKilled,
                          },
                          {
                            label: 'Turret Kills',
                            value1: selectedPlayerData.turretKills.toString(),
                            value2: comparePlayerData.turretKills.toString(),
                            numValue1: selectedPlayerData.turretKills,
                            numValue2: comparePlayerData.turretKills,
                          },
                          {
                            label: 'Inhibitor Kills',
                            value1:
                              selectedPlayerData.inhibitorKills.toString(),
                            value2: comparePlayerData.inhibitorKills.toString(),
                            numValue1: selectedPlayerData.inhibitorKills,
                            numValue2: comparePlayerData.inhibitorKills,
                          },
                          {
                            label: 'Baron Kills',
                            value1: selectedPlayerData.baronKills.toString(),
                            value2: comparePlayerData.baronKills.toString(),
                            numValue1: selectedPlayerData.baronKills,
                            numValue2: comparePlayerData.baronKills,
                          },
                          {
                            label: 'Dragon Kills',
                            value1: selectedPlayerData.dragonKills.toString(),
                            value2: comparePlayerData.dragonKills.toString(),
                            numValue1: selectedPlayerData.dragonKills,
                            numValue2: comparePlayerData.dragonKills,
                          },
                          {
                            label: 'Time Dead',
                            value1: `${selectedPlayerData.totalTimeSpentDead}s`,
                            value2: `${comparePlayerData.totalTimeSpentDead}s`,
                            numValue1: selectedPlayerData.totalTimeSpentDead,
                            numValue2: comparePlayerData.totalTimeSpentDead,
                            isReverse: true, // Lower is better for time dead
                          },
                          {
                            label: 'Longest Life',
                            value1: `${selectedPlayerData.longestTimeSpentLiving}s`,
                            value2: `${comparePlayerData.longestTimeSpentLiving}s`,
                            numValue1:
                              selectedPlayerData.longestTimeSpentLiving,
                            numValue2: comparePlayerData.longestTimeSpentLiving,
                          },
                        ].map((stat, index) => (
                          <React.Fragment key={index}>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'font-medium',
                                  stat.isReverse
                                    ? (stat.numValue1 ??
                                        parseFloat(stat.value1.toString())) <
                                      (stat.numValue2 ??
                                        parseFloat(stat.value2.toString()))
                                      ? 'text-green-400'
                                      : 'text-white/60'
                                    : (stat.numValue1 ??
                                          parseFloat(stat.value1.toString())) >
                                        (stat.numValue2 ??
                                          parseFloat(stat.value2.toString()))
                                      ? 'text-green-400'
                                      : 'text-white/60'
                                )}
                              >
                                {stat.value1}
                              </span>
                            </div>
                            <div className="text-center text-xs text-white/40">
                              {stat.label}
                            </div>
                            <div className="text-left">
                              <span
                                className={cn(
                                  'font-medium',
                                  stat.isReverse
                                    ? (stat.numValue2 ??
                                        parseFloat(stat.value2.toString())) <
                                      (stat.numValue1 ??
                                        parseFloat(stat.value1.toString()))
                                      ? 'text-green-400'
                                      : 'text-white/60'
                                    : (stat.numValue2 ??
                                          parseFloat(stat.value2.toString())) >
                                        (stat.numValue1 ??
                                          parseFloat(stat.value1.toString()))
                                      ? 'text-green-400'
                                      : 'text-white/60'
                                )}
                              >
                                {stat.value2}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div></div>
                        <div className="text-center">
                          <h4 className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-400">
                            <Crown className="h-4 w-4" />
                            Achievements
                          </h4>
                        </div>
                        <div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {[
                          {
                            label: 'Penta Kills',
                            value1: selectedPlayerData.pentaKills.toString(),
                            value2: comparePlayerData.pentaKills.toString(),
                            numValue1: selectedPlayerData.pentaKills,
                            numValue2: comparePlayerData.pentaKills,
                          },
                          {
                            label: 'Quadra Kills',
                            value1: selectedPlayerData.quadraKills.toString(),
                            value2: comparePlayerData.quadraKills.toString(),
                            numValue1: selectedPlayerData.quadraKills,
                            numValue2: comparePlayerData.quadraKills,
                          },
                          {
                            label: 'Triple Kills',
                            value1: selectedPlayerData.tripleKills.toString(),
                            value2: comparePlayerData.tripleKills.toString(),
                            numValue1: selectedPlayerData.tripleKills,
                            numValue2: comparePlayerData.tripleKills,
                          },
                          {
                            label: 'Double Kills',
                            value1: selectedPlayerData.doubleKills.toString(),
                            value2: comparePlayerData.doubleKills.toString(),
                            numValue1: selectedPlayerData.doubleKills,
                            numValue2: comparePlayerData.doubleKills,
                          },
                          {
                            label: 'Killing Spree',
                            value1:
                              selectedPlayerData.largestKillingSpree.toString(),
                            value2:
                              comparePlayerData.largestKillingSpree.toString(),
                            numValue1: selectedPlayerData.largestKillingSpree,
                            numValue2: comparePlayerData.largestKillingSpree,
                          },
                          {
                            label: 'Largest Crit',
                            value1:
                              selectedPlayerData.largestCriticalStrike.toString(),
                            value2:
                              comparePlayerData.largestCriticalStrike.toString(),
                            numValue1: selectedPlayerData.largestCriticalStrike,
                            numValue2: comparePlayerData.largestCriticalStrike,
                          },
                          {
                            label: 'Summoner 1 Casts',
                            value1:
                              selectedPlayerData.summoner1Casts.toString(),
                            value2: comparePlayerData.summoner1Casts.toString(),
                            numValue1: selectedPlayerData.summoner1Casts,
                            numValue2: comparePlayerData.summoner1Casts,
                          },
                          {
                            label: 'Summoner 2 Casts',
                            value1:
                              selectedPlayerData.summoner2Casts.toString(),
                            value2: comparePlayerData.summoner2Casts.toString(),
                            numValue1: selectedPlayerData.summoner2Casts,
                            numValue2: comparePlayerData.summoner2Casts,
                          },
                          {
                            label: 'Q Casts',
                            value1: (
                              selectedPlayerData.spell1Casts ?? 0
                            ).toString(),
                            value2: (
                              comparePlayerData.spell1Casts ?? 0
                            ).toString(),
                            numValue1: selectedPlayerData.spell1Casts ?? 0,
                            numValue2: comparePlayerData.spell1Casts ?? 0,
                          },
                          {
                            label: 'W Casts',
                            value1: (
                              selectedPlayerData.spell2Casts ?? 0
                            ).toString(),
                            value2: (
                              comparePlayerData.spell2Casts ?? 0
                            ).toString(),
                            numValue1: selectedPlayerData.spell2Casts ?? 0,
                            numValue2: comparePlayerData.spell2Casts ?? 0,
                          },
                          {
                            label: 'E Casts',
                            value1: (
                              selectedPlayerData.spell3Casts ?? 0
                            ).toString(),
                            value2: (
                              comparePlayerData.spell3Casts ?? 0
                            ).toString(),
                            numValue1: selectedPlayerData.spell3Casts ?? 0,
                            numValue2: comparePlayerData.spell3Casts ?? 0,
                          },
                          {
                            label: 'R Casts',
                            value1: (
                              selectedPlayerData.spell4Casts ?? 0
                            ).toString(),
                            value2: (
                              comparePlayerData.spell4Casts ?? 0
                            ).toString(),
                            numValue1: selectedPlayerData.spell4Casts ?? 0,
                            numValue2: comparePlayerData.spell4Casts ?? 0,
                          },
                        ].map((stat, index) => (
                          <React.Fragment key={index}>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'font-medium',
                                  (stat.numValue1 ??
                                    parseFloat(stat.value1.toString())) >
                                    (stat.numValue2 ??
                                      parseFloat(stat.value2.toString()))
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value1}
                              </span>
                            </div>
                            <div className="text-center text-xs text-white/40">
                              {stat.label}
                            </div>
                            <div className="text-left">
                              <span
                                className={cn(
                                  'font-medium',
                                  (stat.numValue2 ??
                                    parseFloat(stat.value2.toString())) >
                                    (stat.numValue1 ??
                                      parseFloat(stat.value1.toString()))
                                    ? 'text-green-400'
                                    : 'text-white/60'
                                )}
                              >
                                {stat.value2}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab (Unified: Combat | Items) */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Timer className="h-5 w-5" />
                    Match Timeline
                    {processingTime > 0 && (
                      <Badge className="ml-2 bg-green-500/20 text-xs text-green-400">
                        Processed in {processingTime.toFixed(0)}ms
                      </Badge>
                    )}
                  </CardTitle>
                  {/* Segmented toggle */}
                  <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-1">
                    <button
                      type="button"
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm transition-colors',
                        activeTimelineView === 'combat'
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => setActiveTimelineView('combat')}
                    >
                      Combat
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm transition-colors',
                        activeTimelineView === 'items'
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => setActiveTimelineView('items')}
                    >
                      Items
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Combat View */}
                {activeTimelineView === 'combat' && (
                  <>
                    {!timelineData ? (
                      <div className="py-12 text-center">
                        <Timer className="mx-auto mb-4 h-12 w-12 text-white/40" />
                        <p className="text-white/60">
                          Timeline data not available for this match
                        </p>
                      </div>
                    ) : isProcessing ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="mr-3 h-8 w-8 animate-spin text-white/60" />
                        <span className="text-white/60">
                          Processing timeline data...
                        </span>
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                          {timelineData.info.frames.map((frame, frameIndex) => {
                            const formattedTime = formatMatchTime(
                              frame.timestamp
                            );
                            const importantEvents = (frame.events || []).filter(
                              (e: any) =>
                                [
                                  'CHAMPION_KILL',
                                  'ELITE_MONSTER_KILL',
                                  'BUILDING_KILL',
                                  'DRAGON_SOUL_GIVEN',
                                ].includes(e.type)
                            );
                            if (importantEvents.length === 0) return null;
                            return (
                              <div
                                key={frameIndex}
                                className="ml-2 border-l-2 border-white/20 pl-4"
                              >
                                <div className="mb-2 flex items-center gap-2">
                                  <div className="-ml-[1.25rem] h-2 w-2 rounded-full bg-white"></div>
                                  <Badge
                                    variant="outline"
                                    className="text-white/60"
                                  >
                                    {formattedTime}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {importantEvents.map(
                                    (event: any, eventIndex: number) => (
                                      <TimelineEventItem
                                        key={eventIndex}
                                        event={event}
                                        participants={
                                          matchData.info.participants
                                        }
                                        participantPuuids={
                                          matchData.metadata.participants
                                        }
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}

                {/* Items View */}
                {activeTimelineView === 'items' && (
                  <>
                    {!selectedPlayerData ? (
                      <div className="py-12 text-center">
                        <Coins className="mx-auto mb-4 h-12 w-12 text-white/40" />
                        <p className="text-white/60">
                          Click on a player in the Overview tab to see their
                          item timeline
                        </p>
                      </div>
                    ) : !data?.timelineData ? (
                      <div className="py-12 text-center">
                        <Coins className="mx-auto mb-4 h-12 w-12 text-white/40" />
                        <p className="text-white/60">
                          Item timeline requires detailed match timeline data
                        </p>
                      </div>
                    ) : processedTimeline?.playerTimeline ? (
                      <ItemTimelineDisplay
                        playerTimeline={processedTimeline.playerTimeline}
                        config={{
                          showItemIcons: true,
                          showItemNames: true,
                          showTimestamps: true,
                          showEvolutionChains: true,
                          highlightEvolutions: true,
                          groupByTimeInterval: false,
                          compactView: false,
                        }}
                        className="w-full"
                        maxHeight={600}
                      />
                    ) : (
                      <div className="py-12 text-center">
                        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-white/60" />
                        <p className="text-white/60">
                          Processing item timeline...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Removed separate Item Timeline tab in favor of unified toggle above */}

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <ChampionIcon
                      championId={selectedPlayerData.championName}
                      size="md"
                    />
                    {selectedPlayerData.riotIdGameName}#
                    {selectedPlayerData.riotIdTagline} - Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(selectedPlayerData.challenges || {}).map(
                      ([key, value]) => {
                        if (typeof value !== 'number' || value === 0)
                          return null;

                        // Format challenge names
                        const formattedKey = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())
                          .trim();

                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <div className="mb-1 text-xs text-white/60">
                              {formattedKey}
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {typeof value === 'number' && value % 1 !== 0
                                ? value.toFixed(2)
                                : value.toString()}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardContent className="py-12 text-center">
                  <Award className="mx-auto mb-4 h-12 w-12 text-white/40" />
                  <p className="text-white/60">
                    Click on a player in the Overview tab to see their
                    challenges
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Runes Tab */}
          <TabsContent value="runes" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <ChampionIcon
                      championId={selectedPlayerData.championName}
                      size="md"
                    />
                    {selectedPlayerData.riotIdGameName}#
                    {selectedPlayerData.riotIdTagline} - Runes & Perks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RuneTreeDisplay
                    perks={selectedPlayerData.perks}
                    className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-600/5 p-6"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
                <CardContent className="py-12 text-center">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-white/40" />
                  <p className="text-white/60">
                    Click on a player in the Overview tab to see their runes
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
