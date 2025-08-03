'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from '@/components/match-history/item-slots';
import { SummonerSpells } from '@/components/match-history/summoner-spells';
import { getGameModeDisplayName, getGameModeCategoryColor } from '@/lib/utils/game-modes';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  Trophy, 
  Target,
  Gamepad2,
  Loader2,
  AlertCircle,
  ArrowLeft
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
            <span className="ml-4 text-xl text-white/60">Loading match details...</span>
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
            <AlertCircle className="h-12 w-12 text-red-400 mr-4" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Error Loading Match</h2>
              <p className="text-white/60">{error}</p>
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

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-white mb-2">No Match Data Found</h2>
            <p className="text-white/60">The requested match could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const gameMode = getGameModeDisplayName(matchData.info.queueId);
  const gameModeColor = getGameModeCategoryColor(
    matchData.info.queueId === 420 || matchData.info.queueId === 440 ? 'ranked' : 
    matchData.info.queueId === 450 ? 'aram' : 'normal'
  );

  const blueTeam = matchData.info.participants.filter(p => p.teamId === 100);
  const redTeam = matchData.info.participants.filter(p => p.teamId === 200);
  const blueTeamData = matchData.info.teams.find(t => t.teamId === 100);
  const redTeamData = matchData.info.teams.find(t => t.teamId === 200);

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse opacity-50 animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="mb-8">
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
                    Match Details
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Blue Team */}
          <Card className="bg-black/20 backdrop-blur-md border border-blue-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <CardTitle className="text-blue-400">Blue Team</CardTitle>
                  {blueTeamData?.win && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Trophy className="h-3 w-3 mr-1" />
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
                    participant.item6
                  ];


                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <ChampionIcon championId={participant.championName} size="md" />
                        <div>
                          <div className="font-medium text-white">
                            {participant.riotIdGameName && participant.riotIdTagline 
                              ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                              : participant.summonerName
                            }
                          </div>
                          <div className="text-sm text-white/60">{participant.championName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* KDA */}
                        <div className="text-center">
                          <div className={`font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}>
                            {participant.kills}/{participant.deaths}/{participant.assists}
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
                            <div className="text-yellow-400 font-semibold">
                              {formatNumber(participant.goldEarned)}
                            </div>
                            <div className="text-white/60">Gold</div>
                          </div>
                          <div>
                            <div className="text-purple-400 font-semibold">
                              {participant.totalMinionsKilled + participant.neutralMinionsKilled}
                            </div>
                            <div className="text-white/60">CS</div>
                          </div>
                          <div>
                            <div className="text-pink-400 font-semibold">
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
          <Card className="bg-black/20 backdrop-blur-md border border-red-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <CardTitle className="text-red-400">Red Team</CardTitle>
                  {redTeamData?.win && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Trophy className="h-3 w-3 mr-1" />
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
                    participant.item6
                  ];


                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <ChampionIcon championId={participant.championName} size="md" />
                        <div>
                          <div className="font-medium text-white">
                            {participant.riotIdGameName && participant.riotIdTagline 
                              ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                              : participant.summonerName
                            }
                          </div>
                          <div className="text-sm text-white/60">{participant.championName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* KDA */}
                        <div className="text-center">
                          <div className={`font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}>
                            {participant.kills}/{participant.deaths}/{participant.assists}
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
                            <div className="text-yellow-400 font-semibold">
                              {formatNumber(participant.goldEarned)}
                            </div>
                            <div className="text-white/60">Gold</div>
                          </div>
                          <div>
                            <div className="text-purple-400 font-semibold">
                              {participant.totalMinionsKilled + participant.neutralMinionsKilled}
                            </div>
                            <div className="text-white/60">CS</div>
                          </div>
                          <div>
                            <div className="text-pink-400 font-semibold">
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
          <Card className="bg-black/20 backdrop-blur-md border border-white/10 mb-8">
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
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-white">{obj.kills}</div>
                        <div className="text-xs text-white/60 capitalize">{key}</div>
                        {obj.first && <div className="text-xs text-yellow-400">First</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-red-400 font-semibold mb-4">Red Team</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {redTeamData?.objectives && Object.entries(redTeamData.objectives).map(([key, obj]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-white">{obj.kills}</div>
                        <div className="text-xs text-white/60 capitalize">{key}</div>
                        {obj.first && <div className="text-xs text-yellow-400">First</div>}
                      </div>
                    ))}
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