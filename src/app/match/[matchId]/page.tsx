'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from '@/components/match-history/item-slots';
import { SummonerSpells } from '@/components/match-history/summoner-spells';
import { RuneTreeDisplay, RuneIcon } from '@/components/ui/rune-display';
import { TimelineEventItem } from '@/components/match-history/timeline-event-item';
import { getGameModeDisplayName, getGameModeCategoryColor } from '@/lib/utils/game-modes';
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
  Coins
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
        individualPosition: string;
        teamPosition: string;
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
        };
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
        participantFrames: Record<string, {
          championStats: any;
          currentGold: number;
          totalGold: number;
          level: number;
          xp: number;
          minionsKilled: number;
          jungleMinionsKilled: number;
          damageStats: any;
          position?: { x: number; y: number };
        }>;
      }>;
    };
  };
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  
  const [data, setData] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [comparePlayer, setComparePlayer] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!matchId) return;

    const fetchMatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/match-details/${matchId}`);
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        red: { damage: 0, taken: 0, gold: 0, kills: 0 }
      };
    }

    const blueTeam = data.matchData.info.participants.filter(p => p.teamId === 100);
    const redTeam = data.matchData.info.participants.filter(p => p.teamId === 200);

    const blueTotals = {
      damage: blueTeam.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0),
      taken: blueTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: blueTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: blueTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    const redTotals = {
      damage: redTeam.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0),
      taken: redTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: redTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: redTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    return { blue: blueTotals, red: redTotals };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-white/60" />
            <span className="ml-4 text-xl text-white/60">Loading comprehensive match data...</span>
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
            <AlertCircle className="h-12 w-12 text-red-400 mr-4" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Error Loading Match</h2>
              <p className="text-white/60">{error || 'No match data found'}</p>
              <Button 
                onClick={() => window.history.back()} 
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
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
    matchData.info.queueId === 420 || matchData.info.queueId === 440 ? 'ranked' : 
    matchData.info.queueId === 450 ? 'aram' : 'normal'
  );

  const blueTeam = matchData.info.participants.filter(p => p.teamId === 100);
  const redTeam = matchData.info.participants.filter(p => p.teamId === 200);
  const blueTeamData = matchData.info.teams.find(t => t.teamId === 100);
  const redTeamData = matchData.info.teams.find(t => t.teamId === 200);

  const selectedPlayerData = selectedPlayer !== null 
    ? matchData.info.participants[selectedPlayer] 
    : null;
    
  const comparePlayerData = comparePlayer !== null 
    ? matchData.info.participants[comparePlayer] 
    : null;

  const PlayerCard = ({ participant, teamColor, teamTotals }: any) => {
    const isSelected = selectedPlayer === matchData.info.participants.indexOf(participant);
    const isComparing = comparePlayer === matchData.info.participants.indexOf(participant);
    const playerIndex = matchData.info.participants.indexOf(participant);
    
    const items = [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
      participant.item6
    ];

    const kda = participant.deaths > 0 
      ? ((participant.kills + participant.assists) / participant.deaths).toFixed(2)
      : (participant.kills + participant.assists).toFixed(0);

    const killParticipation = teamTotals.kills > 0
      ? Math.round(((participant.kills + participant.assists) / teamTotals.kills) * 100)
      : 0;

    return (
      <div 
        className={cn(
          "p-4 rounded-lg border transition-all cursor-pointer",
          teamColor === 'blue' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20',
          isSelected && 'ring-2 ring-purple-500',
          isComparing && 'ring-2 ring-yellow-500',
          "hover:bg-opacity-40"
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
              <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full px-1.5 text-xs font-bold text-white">
                {participant.champLevel}
              </div>
            </div>
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                {participant.riotIdGameName && participant.riotIdTagline 
                  ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                  : participant.summonerName
                }
                {participant.firstBloodKill && (
                  <Badge className="bg-red-500/20 text-red-400 text-xs">First Blood</Badge>
                )}
                {participant.largestMultiKill >= 5 && (
                  <Badge className="bg-purple-500/20 text-purple-400 text-xs">Penta Kill</Badge>
                )}
              </div>
              <div className="text-sm text-white/60">{participant.championName} • {participant.individualPosition}</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* KDA & Stats */}
            <div className="text-center">
              <div className={`font-bold text-lg ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}>
                {participant.kills}/{participant.deaths}/{participant.assists}
              </div>
              <div className="text-xs text-white/60">{kda} KDA • {killParticipation}% KP</div>
            </div>

            {/* Damage */}
            <div className="text-center">
              <div className="text-orange-400 font-semibold">
                {formatNumber(participant.totalDamageDealtToChampions)}
              </div>
              <div className="text-xs text-white/60">Damage</div>
              <Progress 
                value={(participant.totalDamageDealtToChampions / teamTotals.damage) * 100} 
                className="h-1 mt-1 w-16"
              />
            </div>

            {/* Gold */}
            <div className="text-center">
              <div className="text-yellow-400 font-semibold">
                {formatNumber(participant.goldEarned)}
              </div>
              <div className="text-xs text-white/60">Gold</div>
              <Progress 
                value={(participant.goldEarned / teamTotals.gold) * 100} 
                className="h-1 mt-1 w-16"
              />
            </div>

            {/* CS */}
            <div className="text-center">
              <div className="text-purple-400 font-semibold">
                {participant.totalMinionsKilled + participant.neutralMinionsKilled}
              </div>
              <div className="text-xs text-white/60">CS ({((participant.totalMinionsKilled + participant.neutralMinionsKilled) / (matchData.info.gameDuration / 60)).toFixed(1)}/m)</div>
            </div>

            {/* Vision */}
            <div className="text-center">
              <div className="text-pink-400 font-semibold">
                {participant.visionScore}
              </div>
              <div className="text-xs text-white/60">Vision</div>
            </div>

            {/* Items */}
            <ItemSlots items={items} size="sm" />

            {/* Summoner Spells */}
            <SummonerSpells 
              spell1Id={participant.summoner1Id}
              spell2Id={participant.summoner2Id}
              size="xs"
            />

            {/* Keystone Rune */}
            {participant.perks?.styles?.[0]?.selections?.[0] && (
              <div className="flex flex-col items-center gap-1">
                <RuneIcon 
                  runeId={participant.perks.styles[0].selections[0].perk}
                  size="sm"
                  variant="keystone"
                />
                <div className="text-xs text-purple-400">Keystone</div>
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse opacity-50 animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="mb-4 text-white/60 hover:text-white border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card className="bg-black/20 backdrop-blur-md border border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <Gamepad2 className="h-6 w-6" />
                    Enhanced Match Details
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-white/60">
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
                      {formatDistanceToNow(new Date(matchData.info.gameCreation), { addSuffix: true })}
                    </span>
                    {blueTeamData?.win && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Blue Victory
                      </Badge>
                    )}
                    {redTeamData?.win && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        Red Victory
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Match ID</div>
                  <div className="font-mono text-white text-sm">{matchId}</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/20 backdrop-blur-md border border-white/10 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
              <Users className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white/10">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Stats
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white/10">
              <Activity className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-white/10">
              <Award className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="runes" className="data-[state=active]:bg-white/10">
              <Sparkles className="h-4 w-4 mr-2" />
              Runes & Perks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Blue Team */}
            <Card className="bg-black/20 backdrop-blur-md border border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
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
                  />
                ))}
              </CardContent>
            </Card>

            {/* Red Team */}
            <Card className="bg-black/20 backdrop-blur-md border border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
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
                  />
                ))}
              </CardContent>
            </Card>

            {/* Team Objectives */}
            <Card className="bg-black/20 backdrop-blur-md border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Team Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-4">Blue Team</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {blueTeamData?.objectives && Object.entries(blueTeamData.objectives).map(([key, obj]) => (
                        <div key={key} className="text-center p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                          <div className="text-2xl font-bold text-white">{obj.kills}</div>
                          <div className="text-xs text-white/60 capitalize">{key}</div>
                          {obj.first && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">First</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold mb-4">Red Team</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {redTeamData?.objectives && Object.entries(redTeamData.objectives).map(([key, obj]) => (
                        <div key={key} className="text-center p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                          <div className="text-2xl font-bold text-white">{obj.kills}</div>
                          <div className="text-xs text-white/60 capitalize">{key}</div>
                          {obj.first && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">First</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Stats Tab */}
          <TabsContent value="details" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <ChampionIcon championId={selectedPlayerData.championName} size="md" />
                    {selectedPlayerData.riotIdGameName}#{selectedPlayerData.riotIdTagline} - Detailed Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Combat Stats */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                        <Swords className="h-5 w-5" />
                        Combat
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Damage Dealt</span>
                          <span className="text-white font-medium">{formatNumber(selectedPlayerData.totalDamageDealt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Damage to Champions</span>
                          <span className="text-orange-400 font-medium">{formatNumber(selectedPlayerData.totalDamageDealtToChampions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Physical Damage</span>
                          <span className="text-white">{formatNumber(selectedPlayerData.physicalDamageDealtToChampions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Magic Damage</span>
                          <span className="text-white">{formatNumber(selectedPlayerData.magicDamageDealtToChampions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">True Damage</span>
                          <span className="text-white">{formatNumber(selectedPlayerData.trueDamageDealtToChampions)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Damage Taken</span>
                          <span className="text-white">{formatNumber(selectedPlayerData.totalDamageTaken)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Damage Mitigated</span>
                          <span className="text-green-400">{formatNumber(selectedPlayerData.damageSelfMitigated)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Healing Done</span>
                          <span className="text-green-400">{formatNumber(selectedPlayerData.totalHeal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">CC Time Dealt</span>
                          <span className="text-white">{selectedPlayerData.totalTimeCCDealt}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Economy Stats */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Economy
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold Earned</span>
                          <span className="text-yellow-400 font-medium">{formatNumber(selectedPlayerData.goldEarned)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold Spent</span>
                          <span className="text-white">{formatNumber(selectedPlayerData.goldSpent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Gold/Min</span>
                          <span className="text-white">{Math.round(selectedPlayerData.goldEarned / (matchData.info.gameDuration / 60))}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Minion Kills</span>
                          <span className="text-white">{selectedPlayerData.totalMinionsKilled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Jungle CS</span>
                          <span className="text-white">{selectedPlayerData.neutralMinionsKilled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Enemy Jungle CS</span>
                          <span className="text-purple-400">{selectedPlayerData.totalEnemyJungleMinionsKilled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">CS/Min</span>
                          <span className="text-white">{((selectedPlayerData.totalMinionsKilled + selectedPlayerData.neutralMinionsKilled) / (matchData.info.gameDuration / 60)).toFixed(1)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Items Purchased</span>
                          <span className="text-white">{selectedPlayerData.itemsPurchased}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Consumables</span>
                          <span className="text-white">{selectedPlayerData.consumablesPurchased}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vision & Objectives */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-pink-400 flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Vision & Objectives
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Vision Score</span>
                          <span className="text-pink-400 font-medium">{selectedPlayerData.visionScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Wards Placed</span>
                          <span className="text-white">{selectedPlayerData.wardsPlaced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Control Wards</span>
                          <span className="text-white">{selectedPlayerData.detectorWardsPlaced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Wards Killed</span>
                          <span className="text-white">{selectedPlayerData.wardsKilled}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Turret Kills</span>
                          <span className="text-white">{selectedPlayerData.turretKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Inhibitor Kills</span>
                          <span className="text-white">{selectedPlayerData.inhibitorKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Baron Kills</span>
                          <span className="text-purple-400">{selectedPlayerData.baronKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Dragon Kills</span>
                          <span className="text-orange-400">{selectedPlayerData.dragonKills}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Time Dead</span>
                          <span className="text-red-400">{selectedPlayerData.totalTimeSpentDead}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Longest Life</span>
                          <span className="text-green-400">{selectedPlayerData.longestTimeSpentLiving}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Multikills & Streaks */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Achievements
                      </h3>
                      <div className="space-y-2">
                        {selectedPlayerData.pentaKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Penta Kills</span>
                            <span className="text-purple-400 font-bold">{selectedPlayerData.pentaKills}</span>
                          </div>
                        )}
                        {selectedPlayerData.quadraKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Quadra Kills</span>
                            <span className="text-purple-400">{selectedPlayerData.quadraKills}</span>
                          </div>
                        )}
                        {selectedPlayerData.tripleKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Triple Kills</span>
                            <span className="text-blue-400">{selectedPlayerData.tripleKills}</span>
                          </div>
                        )}
                        {selectedPlayerData.doubleKills > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Double Kills</span>
                            <span className="text-white">{selectedPlayerData.doubleKills}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/60">Killing Spree</span>
                          <span className="text-white">{selectedPlayerData.largestKillingSpree}</span>
                        </div>
                        {selectedPlayerData.largestCriticalStrike > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Largest Crit</span>
                            <span className="text-orange-400">{selectedPlayerData.largestCriticalStrike}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-white/60">Summoner 1 Casts</span>
                          <span className="text-white">{selectedPlayerData.summoner1Casts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Summoner 2 Casts</span>
                          <span className="text-white">{selectedPlayerData.summoner2Casts}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">Click on a player in the Overview tab to see their detailed stats</p>
                </CardContent>
              </Card>
            )}

            {/* Comparison View */}
            {comparePlayerData && selectedPlayerData && (
              <Card className="bg-black/20 backdrop-blur-md border border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <GitCompare className="h-5 w-5 text-yellow-400" />
                    Player Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Player 1 */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-4">
                        <span className="font-medium text-white">{selectedPlayerData.riotIdGameName}</span>
                        <ChampionIcon championId={selectedPlayerData.championName} size="sm" />
                      </div>
                    </div>
                    
                    {/* Stat Names */}
                    <div className="text-center">
                      <h4 className="text-white/60 mb-4">Stat Comparison</h4>
                    </div>
                    
                    {/* Player 2 */}
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-4">
                        <ChampionIcon championId={comparePlayerData.championName} size="sm" />
                        <span className="font-medium text-white">{comparePlayerData.riotIdGameName}</span>
                      </div>
                    </div>

                    {/* Comparison Rows */}
                    {[
                      { label: 'KDA', value1: `${selectedPlayerData.kills}/${selectedPlayerData.deaths}/${selectedPlayerData.assists}`, value2: `${comparePlayerData.kills}/${comparePlayerData.deaths}/${comparePlayerData.assists}` },
                      { label: 'Damage to Champions', value1: formatNumber(selectedPlayerData.totalDamageDealtToChampions), value2: formatNumber(comparePlayerData.totalDamageDealtToChampions) },
                      { label: 'Gold Earned', value1: formatNumber(selectedPlayerData.goldEarned), value2: formatNumber(comparePlayerData.goldEarned) },
                      { label: 'CS', value1: selectedPlayerData.totalMinionsKilled + selectedPlayerData.neutralMinionsKilled, value2: comparePlayerData.totalMinionsKilled + comparePlayerData.neutralMinionsKilled },
                      { label: 'Vision Score', value1: selectedPlayerData.visionScore, value2: comparePlayerData.visionScore },
                      { label: 'Damage Taken', value1: formatNumber(selectedPlayerData.totalDamageTaken), value2: formatNumber(comparePlayerData.totalDamageTaken) },
                      { label: 'Healing Done', value1: formatNumber(selectedPlayerData.totalHeal), value2: formatNumber(comparePlayerData.totalHeal) },
                    ].map((stat, index) => (
                      <React.Fragment key={index}>
                        <div className="text-right">
                          <span className={cn(
                            "font-medium",
                            stat.value1 > stat.value2 ? "text-green-400" : "text-white/60"
                          )}>
                            {stat.value1}
                          </span>
                        </div>
                        <div className="text-center text-white/40 text-sm">
                          {stat.label}
                        </div>
                        <div className="text-left">
                          <span className={cn(
                            "font-medium",
                            stat.value2 > stat.value1 ? "text-green-400" : "text-white/60"
                          )}>
                            {stat.value2}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            {timelineData ? (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Match Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {timelineData.info.frames.map((frame, frameIndex) => {
                        const minutes = Math.floor(frame.timestamp / 60000);
                        const importantEvents = frame.events.filter((e: any) => 
                          ['CHAMPION_KILL', 'ELITE_MONSTER_KILL', 'BUILDING_KILL', 'DRAGON_SOUL_GIVEN'].includes(e.type)
                        );

                        if (importantEvents.length === 0) return null;

                        return (
                          <div key={frameIndex} className="border-l-2 border-white/20 pl-4 ml-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-white rounded-full -ml-[1.25rem]"></div>
                              <Badge variant="outline" className="text-white/60">
                                {minutes}:00
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {importantEvents.map((event: any, eventIndex: number) => (
                                <TimelineEventItem
                                  key={eventIndex}
                                  event={event}
                                  participants={matchData.info.participants}
                                  participantPuuids={matchData.metadata.participants}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardContent className="py-12 text-center">
                  <Timer className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">Timeline data not available for this match</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <ChampionIcon championId={selectedPlayerData.championName} size="md" />
                    {selectedPlayerData.riotIdGameName}#{selectedPlayerData.riotIdTagline} - Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(selectedPlayerData.challenges || {}).map(([key, value]) => {
                      if (typeof value !== 'number' || value === 0) return null;
                      
                      // Format challenge names
                      const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();
                      
                      return (
                        <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-xs text-white/60 mb-1">{formattedKey}</div>
                          <div className="text-lg font-semibold text-white">
                            {typeof value === 'number' && value % 1 !== 0 
                              ? value.toFixed(2)
                              : value.toString()
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">Click on a player in the Overview tab to see their challenges</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Runes Tab */}
          <TabsContent value="runes" className="space-y-6">
            {selectedPlayerData ? (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <ChampionIcon championId={selectedPlayerData.championName} size="md" />
                    {selectedPlayerData.riotIdGameName}#{selectedPlayerData.riotIdTagline} - Runes & Perks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RuneTreeDisplay 
                    perks={selectedPlayerData.perks}
                    className="p-6 bg-gradient-to-br from-purple-500/5 to-blue-600/5 border border-purple-500/20 rounded-lg"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 backdrop-blur-md border border-white/10">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">Click on a player in the Overview tab to see their runes</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}