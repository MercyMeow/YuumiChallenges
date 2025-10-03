'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from '@/components/match-history/item-slots';
import { SummonerSpells } from '@/components/match-history/summoner-spells';
import {
  getGameModeDisplayName,
  getGameModeCategoryColor,
} from '@/lib/utils/game-modes';
import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  Trophy,
  Target,
  Gamepad2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface MatchDetailsData {
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
      totalMinionsKilled: number;
      neutralMinionsKilled: number;
      visionScore: number;
      champLevel: number;
      totalDamageDealtToChampions: number;
      totalDamageDealt: number;
      totalDamageTaken: number;
      wardsPlaced: number;
      wardsKilled: number;
      firstBloodKill: boolean;
      firstTowerKill: boolean;
      win: boolean;
      item0: number;
      item1: number;
      item2: number;
      item3: number;
      item4: number;
      item5: number;
      item6: number;
      summoner1Id: number;
      summoner2Id: number;
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
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [matchData, setMatchData] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setMatchData(result.matchData);
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
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-white/60" />
            <span className="ml-4 text-xl text-white/60">
              Loading match details...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="mr-4 h-12 w-12 text-red-400" />
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">
                Error Loading Match
              </h2>
              <p className="text-white/60">{error}</p>
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

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              No Match Data Found
            </h2>
            <p className="text-white/60">
              The requested match could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      {/* Animated particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-pulse rounded-full bg-purple-400 opacity-60"></div>
        <div className="animation-delay-1000 absolute right-1/3 top-3/4 h-1 w-1 animate-pulse rounded-full bg-blue-400 opacity-40"></div>
        <div className="animation-delay-2000 absolute left-1/2 top-1/2 h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 opacity-50"></div>
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
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
                    Match Details
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
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Match ID</div>
                  <div className="font-mono text-white">{matchId}</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Teams Overview */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Blue Team */}
          <Card className="border border-blue-500/20 bg-black/20 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                  <CardTitle className="text-blue-400">Blue Team</CardTitle>
                  {blueTeamData?.win && (
                    <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                      <Trophy className="mr-1 h-3 w-3" />
                      Victory
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blueTeam.map((participant, index) => {
                  const items = [
                    participant.item0,
                    participant.item1,
                    participant.item2,
                    participant.item3,
                    participant.item4,
                    participant.item5,
                    participant.item6,
                  ];

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ChampionIcon
                          championId={participant.championName}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-white">
                            {participant.riotIdGameName &&
                            participant.riotIdTagline
                              ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                              : participant.summonerName}
                          </div>
                          <div className="text-sm text-white/60">
                            {participant.championName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* KDA */}
                        <div className="text-center">
                          <div
                            className={`font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}
                          >
                            {participant.kills}/{participant.deaths}/
                            {participant.assists}
                          </div>
                          <div className="text-xs text-white/60">KDA</div>
                        </div>

                        {/* Items */}
                        <ItemSlots items={items} size="sm" />

                        {/* Summoner Spells */}
                        <SummonerSpells
                          spell1Id={participant.summoner1Id}
                          spell2Id={participant.summoner2Id}
                          size="xs"
                        />

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-semibold text-yellow-400">
                              {formatNumber(participant.goldEarned)}
                            </div>
                            <div className="text-white/60">Gold</div>
                          </div>
                          <div>
                            <div className="font-semibold text-purple-400">
                              {participant.totalMinionsKilled +
                                participant.neutralMinionsKilled}
                            </div>
                            <div className="text-white/60">CS</div>
                          </div>
                          <div>
                            <div className="font-semibold text-pink-400">
                              {participant.visionScore}
                            </div>
                            <div className="text-white/60">Vision</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Red Team */}
          <Card className="border border-red-500/20 bg-black/20 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  <CardTitle className="text-red-400">Red Team</CardTitle>
                  {redTeamData?.win && (
                    <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                      <Trophy className="mr-1 h-3 w-3" />
                      Victory
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redTeam.map((participant, index) => {
                  const items = [
                    participant.item0,
                    participant.item1,
                    participant.item2,
                    participant.item3,
                    participant.item4,
                    participant.item5,
                    participant.item6,
                  ];

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ChampionIcon
                          championId={participant.championName}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-white">
                            {participant.riotIdGameName &&
                            participant.riotIdTagline
                              ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                              : participant.summonerName}
                          </div>
                          <div className="text-sm text-white/60">
                            {participant.championName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* KDA */}
                        <div className="text-center">
                          <div
                            className={`font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}
                          >
                            {participant.kills}/{participant.deaths}/
                            {participant.assists}
                          </div>
                          <div className="text-xs text-white/60">KDA</div>
                        </div>

                        {/* Items */}
                        <ItemSlots items={items} size="sm" />

                        {/* Summoner Spells */}
                        <SummonerSpells
                          spell1Id={participant.summoner1Id}
                          spell2Id={participant.summoner2Id}
                          size="xs"
                        />

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-semibold text-yellow-400">
                              {formatNumber(participant.goldEarned)}
                            </div>
                            <div className="text-white/60">Gold</div>
                          </div>
                          <div>
                            <div className="font-semibold text-purple-400">
                              {participant.totalMinionsKilled +
                                participant.neutralMinionsKilled}
                            </div>
                            <div className="text-white/60">CS</div>
                          </div>
                          <div>
                            <div className="font-semibold text-pink-400">
                              {participant.visionScore}
                            </div>
                            <div className="text-white/60">Vision</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Objectives */}
        {(blueTeamData || redTeamData) && (
          <Card className="mb-8 border border-white/10 bg-black/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5" />
                Team Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="mb-4 font-semibold text-blue-400">
                    Blue Team
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {blueTeamData?.objectives &&
                      Object.entries(blueTeamData.objectives).map(
                        ([key, obj]) => (
                          <div key={key} className="text-center">
                            <div className="text-lg font-bold text-white">
                              {obj.kills}
                            </div>
                            <div className="text-xs capitalize text-white/60">
                              {key}
                            </div>
                            {obj.first && (
                              <div className="text-xs text-yellow-400">
                                First
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-4 font-semibold text-red-400">Red Team</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {redTeamData?.objectives &&
                      Object.entries(redTeamData.objectives).map(
                        ([key, obj]) => (
                          <div key={key} className="text-center">
                            <div className="text-lg font-bold text-white">
                              {obj.kills}
                            </div>
                            <div className="text-xs capitalize text-white/60">
                              {key}
                            </div>
                            {obj.first && (
                              <div className="text-xs text-yellow-400">
                                First
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
