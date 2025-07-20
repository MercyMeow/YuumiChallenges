'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

interface Participant {
  puuid: string;
  summonerId: string;
  summonerName: string;
  summonerLevel: number;
  riotIdName: string;
  riotIdTagline: string;
  championId: number;
  championName: string;
  champLevel: number;
  championTransform: number;
  teamId: number;
  teamPosition: string;
  individualPosition: string;
  spell1Id: number;
  spell2Id: number;
  perks: Record<string, unknown>;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealtToChampions: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  magicDamageDealtToChampions: number;
  physicalDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;
  totalHeal: number;
  totalUnitsHealed: number;
  damageSelfMitigated: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  killingSprees: number;
  goldEarned: number;
  goldSpent: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsPlaced: number;
  wardsKilled: number;
  detectorWardsPlaced: number;
  turretKills: number;
  turretTakedowns: number;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  baronKills: number;
  dragonKills: number;
  totalTimeCCDealt: number;
  timeCCingOthers: number;
  totalTimeSpentDead: number;
  timePlayed: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  unrealKills: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;
  bountyLevel: number;
  totalAllyJungleMinionsKilled: number;
  totalEnemyJungleMinionsKilled: number;
  consumablesPurchased: number;
  itemsPurchased: number;
  challenges?: Record<string, unknown>;
  profileIcon: number;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  eligibleForProgression: boolean;
}

interface Team {
  teamId: number;
  win: boolean;
  bans: Array<{ championId: number; pickTurn: number }>;
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
}

interface MatchDetails {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameStartTimestamp: number;
  gameEndTimestamp: number;
  gameMode: string;
  gameType: string;
  gameVersion: string;
  mapId: number;
  platformId: string;
  queueId: number;
  tournamentCode?: string;
  participants: Participant[];
  teams: Team[];
  metadata: {
    dataVersion: string;
    participants: string[];
  };
  localData: {
    id: string;
    match_id: string;
    summoner_id: string;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    duration: number;
    game_mode: string;
    queue_id: number;
    game_creation: Date;
    analyzed_for_challenges?: boolean;
    created_at: Date;
  } | null;
}

export default function MatchDetailsPage({ params }: PageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setMatchId(resolvedParams.matchId);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    const fetchMatchDetails = async () => {
      if (!matchId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/match/${matchId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch match details');
        }

        const data = await response.json();
        setMatch(data.match);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && matchId) {
      fetchMatchDetails();
    }
  }, [status, matchId, router]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGameModeDisplay = (gameMode: string, queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo',
      440: 'Ranked Flex',
      400: 'Normal Draft',
      430: 'Normal Blind',
      450: 'ARAM',
      900: 'ARURF',
      1020: 'One for All',
      1300: 'Nexus Blitz',
      1400: 'Ultimate Spellbook'
    };
    
    return queueMap[queueId] || gameMode || 'Custom';
  };

  const calculateKDA = (participant: Participant) => {
    return participant.deaths > 0 
      ? ((participant.kills + participant.assists) / participant.deaths).toFixed(2)
      : 'Perfect';
  };

  const getKDAColor = (participant: Participant) => {
    const ratio = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : 99;
    
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load match details'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.back()}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Find the current user's participant data
  // For now, we'll need to check by summoner name or use the localData
  // This would ideally be improved by storing the user's summoner puuid in the session
  const currentUserParticipant = match.participants?.find(
    (p) => match.localData && p.puuid === match.localData.summoner_id
  );

  // Sort participants by team
  const team1 = match.participants?.filter((p) => p.teamId === 100) || [];
  const team2 = match.participants?.filter((p) => p.teamId === 200) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      {/* Animated particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4 text-white/60 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Match History
            </Button>

            <div className="bg-black/20 backdrop-blur-md rounded-lg border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Match Details</h1>
                  <p className="text-white/60">
                    {getGameModeDisplay(match.gameMode, match.queueId)} • {formatDuration(match.gameDuration)} • {' '}
                    {formatDistanceToNow(new Date(match.gameCreation), { addSuffix: true })}
                  </p>
                </div>
                {match.gameVersion && (
                  <Badge variant="outline" className="text-white/60">
                    Patch {match.gameVersion.split('.').slice(0, 2).join('.')}
                  </Badge>
                )}
              </div>

              {/* Team Summary */}
              <div className="grid grid-cols-2 gap-4">
                {match.teams?.map((team) => (
                  <div
                    key={team.teamId}
                    className={`p-4 rounded-lg ${
                      team.win ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {team.teamId === 100 ? 'Blue Team' : 'Red Team'}
                      </span>
                      <Badge variant={team.win ? 'default' : 'destructive'}>
                        {team.win ? 'Victory' : 'Defeat'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-white/60">Kills</p>
                        <p className="font-bold text-white">{team.objectives.champion.kills}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Towers</p>
                        <p className="font-bold text-white">{team.objectives.tower.kills}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Dragons</p>
                        <p className="font-bold text-white">{team.objectives.dragon.kills}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Barons</p>
                        <p className="font-bold text-white">{team.objectives.baron.kills}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">Inhibitors</p>
                        <p className="font-bold text-white">{team.objectives.inhibitor.kills}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-black/20 backdrop-blur-md border border-purple-500/20">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statistics">Detailed Stats</TabsTrigger>
              <TabsTrigger value="damage">Damage</TabsTrigger>
              <TabsTrigger value="vision">Vision & Control</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              {currentUserParticipant?.challenges && (
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Teams Display */}
              {[
                { team: team1, name: 'Blue Team', teamId: 100 },
                { team: team2, name: 'Red Team', teamId: 200 }
              ].map(({ team, name, teamId }) => (
                <Card key={teamId} className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {team.map((participant) => {
                        const isCurrentUser = match.localData && participant.puuid === match.localData.summoner_id;
                        
                        return (
                          <div
                            key={participant.puuid}
                            className={`p-4 rounded-lg border ${
                              isCurrentUser 
                                ? 'bg-purple-500/10 border-purple-500/30' 
                                : 'bg-black/10 border-white/10'
                            } ${
                              participant.win 
                                ? 'border-l-4 border-l-green-500' 
                                : 'border-l-4 border-l-red-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <ChampionIcon championId={participant.championName} size="md" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-white">
                                      {participant.riotIdName || participant.summonerName}
                                    </span>
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-white/60">
                                    {participant.championName} • Level {participant.champLevel}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-6">
                                {/* KDA */}
                                <div className="text-center">
                                  <div className={`font-bold ${getKDAColor(participant)}`}>
                                    {participant.kills}/{participant.deaths}/{participant.assists}
                                  </div>
                                  <p className="text-xs text-white/60">
                                    {calculateKDA(participant)} KDA
                                  </p>
                                </div>

                                {/* CS */}
                                <div className="text-center">
                                  <div className="font-bold text-white">
                                    {participant.totalMinionsKilled + participant.neutralMinionsKilled}
                                  </div>
                                  <p className="text-xs text-white/60">CS</p>
                                </div>

                                {/* Gold */}
                                <div className="text-center">
                                  <div className="font-bold text-yellow-400">
                                    {(participant.goldEarned / 1000).toFixed(1)}k
                                  </div>
                                  <p className="text-xs text-white/60">Gold</p>
                                </div>

                                {/* Damage */}
                                <div className="text-center">
                                  <div className="font-bold text-orange-400">
                                    {(participant.totalDamageDealtToChampions / 1000).toFixed(1)}k
                                  </div>
                                  <p className="text-xs text-white/60">Damage</p>
                                </div>

                                {/* Items */}
                                <div className="flex space-x-1">
                                  {[0, 1, 2, 3, 4, 5, 6].map((slot) => {
                                    const itemId = participant[`item${slot}` as keyof Participant] as number;
                                    return (
                                      <div
                                        key={slot}
                                        className={`w-8 h-8 rounded ${
                                          itemId > 0
                                            ? 'bg-gray-700 border border-white/20'
                                            : 'bg-black/20 border border-white/10'
                                        }`}
                                      >
                                        {/* Item icon would go here */}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Multi-kills and achievements */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {participant.firstBloodKill && (
                                <Badge variant="outline" className="text-red-400 border-red-400">
                                  First Blood
                                </Badge>
                              )}
                              {participant.pentaKills > 0 && (
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                                  Pentakill x{participant.pentaKills}
                                </Badge>
                              )}
                              {participant.quadraKills > 0 && (
                                <Badge variant="outline" className="text-orange-400 border-orange-400">
                                  Quadrakill x{participant.quadraKills}
                                </Badge>
                              )}
                              {participant.tripleKills > 0 && (
                                <Badge variant="outline" className="text-blue-400 border-blue-400">
                                  Triple Kill x{participant.tripleKills}
                                </Badge>
                              )}
                              {participant.largestKillingSpree > 5 && (
                                <Badge variant="outline" className="text-purple-400 border-purple-400">
                                  Killing Spree: {participant.largestKillingSpree}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Detailed Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Combat Statistics</CardTitle>
                  <CardDescription className="text-white/60">
                    Detailed combat performance for all players
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-2 text-white/60">Player</th>
                          <th className="text-center p-2 text-white/60">K/D/A</th>
                          <th className="text-center p-2 text-white/60">Damage Dealt</th>
                          <th className="text-center p-2 text-white/60">Damage Taken</th>
                          <th className="text-center p-2 text-white/60">Healing</th>
                          <th className="text-center p-2 text-white/60">CC Time</th>
                          <th className="text-center p-2 text-white/60">Gold/min</th>
                          <th className="text-center p-2 text-white/60">CS/min</th>
                        </tr>
                      </thead>
                      <tbody>
                        {match.participants?.map((p) => {
                          const gameMinutes = match.gameDuration / 60;
                          const isCurrentUser = match.localData && p.puuid === match.localData.summoner_id;
                          
                          return (
                            <tr 
                              key={p.puuid} 
                              className={`border-b border-white/5 ${
                                isCurrentUser ? 'bg-purple-500/5' : ''
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  <ChampionIcon championId={p.championName} size="xs" />
                                  <span className="text-white">
                                    {p.riotIdName || p.summonerName}
                                  </span>
                                </div>
                              </td>
                              <td className={`text-center p-2 font-bold ${getKDAColor(p)}`}>
                                {p.kills}/{p.deaths}/{p.assists}
                              </td>
                              <td className="text-center p-2 text-orange-400">
                                {(p.totalDamageDealtToChampions / 1000).toFixed(1)}k
                              </td>
                              <td className="text-center p-2 text-red-400">
                                {(p.totalDamageTaken / 1000).toFixed(1)}k
                              </td>
                              <td className="text-center p-2 text-green-400">
                                {(p.totalHeal / 1000).toFixed(1)}k
                              </td>
                              <td className="text-center p-2 text-blue-400">
                                {p.totalTimeCCDealt}s
                              </td>
                              <td className="text-center p-2 text-yellow-400">
                                {(p.goldEarned / gameMinutes).toFixed(0)}
                              </td>
                              <td className="text-center p-2 text-white">
                                {((p.totalMinionsKilled + p.neutralMinionsKilled) / gameMinutes).toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Damage Tab */}
            <TabsContent value="damage" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Damage Dealt to Champions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.participants
                        ?.sort((a, b) => b.totalDamageDealtToChampions - a.totalDamageDealtToChampions)
                        .map((p) => {
                          const maxDamage = Math.max(...match.participants.map((p) => p.totalDamageDealtToChampions));
                          const percentage = (p.totalDamageDealtToChampions / maxDamage) * 100;
                          
                          return (
                            <div key={p.puuid} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{p.summonerName}</span>
                                <span className="text-orange-400 font-bold">
                                  {p.totalDamageDealtToChampions.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                              <div className="flex justify-between text-xs text-white/60">
                                <span>Physical: {((p.physicalDamageDealtToChampions / p.totalDamageDealtToChampions) * 100).toFixed(0)}%</span>
                                <span>Magic: {((p.magicDamageDealtToChampions / p.totalDamageDealtToChampions) * 100).toFixed(0)}%</span>
                                <span>True: {((p.trueDamageDealtToChampions / p.totalDamageDealtToChampions) * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Damage Taken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.participants
                        ?.sort((a, b) => b.totalDamageTaken - a.totalDamageTaken)
                        .map((p) => {
                          const maxDamage = Math.max(...match.participants.map((p) => p.totalDamageTaken));
                          const percentage = (p.totalDamageTaken / maxDamage) * 100;
                          
                          return (
                            <div key={p.puuid} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{p.summonerName}</span>
                                <span className="text-red-400 font-bold">
                                  {p.totalDamageTaken.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                              <div className="text-xs text-white/60">
                                Mitigated: {p.damageSelfMitigated.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Vision Tab */}
            <TabsContent value="vision" className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Vision Control</CardTitle>
                  <CardDescription className="text-white/60">
                    Ward placement and vision score statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-2 text-white/60">Player</th>
                          <th className="text-center p-2 text-white/60">Vision Score</th>
                          <th className="text-center p-2 text-white/60">Wards Placed</th>
                          <th className="text-center p-2 text-white/60">Wards Killed</th>
                          <th className="text-center p-2 text-white/60">Control Wards</th>
                          <th className="text-center p-2 text-white/60">Vision/min</th>
                        </tr>
                      </thead>
                      <tbody>
                        {match.participants
                          ?.sort((a, b) => b.visionScore - a.visionScore)
                          .map((p) => {
                            const gameMinutes = match.gameDuration / 60;
                            const isCurrentUser = match.localData && p.puuid === match.localData.summoner_id;
                            
                            return (
                              <tr 
                                key={p.puuid} 
                                className={`border-b border-white/5 ${
                                  isCurrentUser ? 'bg-purple-500/5' : ''
                                }`}
                              >
                                <td className="p-2">
                                  <div className="flex items-center space-x-2">
                                    <ChampionIcon championId={p.championName} size="xs" />
                                    <span className="text-white">
                                      {p.riotIdName || p.summonerName}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-center p-2 text-purple-400 font-bold">
                                  {p.visionScore}
                                </td>
                                <td className="text-center p-2 text-blue-400">
                                  {p.wardsPlaced}
                                </td>
                                <td className="text-center p-2 text-red-400">
                                  {p.wardsKilled}
                                </td>
                                <td className="text-center p-2 text-green-400">
                                  {p.visionWardsBoughtInGame}
                                </td>
                                <td className="text-center p-2 text-white">
                                  {(p.visionScore / gameMinutes).toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objectives Tab */}
            <TabsContent value="objectives" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Structure Damage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.participants
                        ?.sort((a, b) => b.damageDealtToTurrets - a.damageDealtToTurrets)
                        .map((p) => {
                          const maxDamage = Math.max(...match.participants.map((p) => p.damageDealtToTurrets));
                          const percentage = maxDamage > 0 ? (p.damageDealtToTurrets / maxDamage) * 100 : 0;
                          
                          return (
                            <div key={p.puuid} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-white">{p.summonerName}</span>
                                <div className="flex items-center space-x-4">
                                  <span className="text-yellow-400 font-bold">
                                    {p.damageDealtToTurrets.toLocaleString()}
                                  </span>
                                  <div className="flex space-x-2 text-xs">
                                    {p.turretKills > 0 && (
                                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                                        {p.turretKills} Turrets
                                      </Badge>
                                    )}
                                    {p.inhibitorKills > 0 && (
                                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                                        {p.inhibitorKills} Inhibs
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Objective Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {match.participants?.map((p) => {
                        const isCurrentUser = match.localData && p.puuid === match.localData.summoner_id;
                        
                        return (
                          <div 
                            key={p.puuid} 
                            className={`p-3 rounded-lg border ${
                              isCurrentUser 
                                ? 'bg-purple-500/10 border-purple-500/30' 
                                : 'bg-black/10 border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <ChampionIcon championId={p.championName} size="xs" />
                                <span className="text-white text-sm">
                                  {p.riotIdName || p.summonerName}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {p.dragonKills > 0 && (
                                <Badge variant="outline" className="justify-center">
                                  🐉 Dragons: {p.dragonKills}
                                </Badge>
                              )}
                              {p.baronKills > 0 && (
                                <Badge variant="outline" className="justify-center">
                                  👑 Barons: {p.baronKills}
                                </Badge>
                              )}
                              {p.firstTowerKill && (
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400 justify-center">
                                  First Tower
                                </Badge>
                              )}
                              {p.firstBloodKill && (
                                <Badge variant="outline" className="text-red-400 border-red-400 justify-center">
                                  First Blood
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Challenges Tab (if available) */}
            {currentUserParticipant?.challenges && (
              <TabsContent value="challenges" className="space-y-6">
                <Card className="bg-black/20 backdrop-blur-md border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Your Challenges</CardTitle>
                    <CardDescription className="text-white/60">
                      Performance in various gameplay challenges this match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(currentUserParticipant.challenges).map(([key, value]) => {
                        // Format challenge names
                        const formatChallengeName = (name: string) => {
                          return name
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim();
                        };

                        return (
                          <div
                            key={key}
                            className="p-4 rounded-lg bg-black/20 border border-white/10"
                          >
                            <h4 className="text-sm font-medium text-white/80 mb-1">
                              {formatChallengeName(key)}
                            </h4>
                            <p className="text-2xl font-bold text-purple-400">
                              {typeof value === 'number' 
                                ? value.toLocaleString() 
                                : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}