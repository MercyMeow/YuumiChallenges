'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { cn } from '@/lib/utils';
import { Swords, Coins, Eye, Crown, Users, GitCompare } from 'lucide-react';
import type {
  ExtendedMatchData,
  ExtendedMatchParticipant,
  TeamTotalsBySide,
  SupportItemCompletionTimes,
} from './types';

interface DetailedStatsTabProps {
  selectedPlayerData: ExtendedMatchParticipant | null | undefined;
  comparePlayerData: ExtendedMatchParticipant | null | undefined;
  matchData: ExtendedMatchData;
  teamTotals: TeamTotalsBySide;
  supportItemCompletionTimes: SupportItemCompletionTimes | null;
  compareSupportItemCompletionTimes: SupportItemCompletionTimes | null;
  formatNumber: (num: number) => string;
  formatMatchTime: (timestamp: number) => string;
}

export function DetailedStatsTab({
  selectedPlayerData,
  comparePlayerData,
  matchData,
  teamTotals,
  supportItemCompletionTimes,
  compareSupportItemCompletionTimes,
  formatNumber,
  formatMatchTime,
}: DetailedStatsTabProps) {
  const formatDurationFromSeconds = (seconds?: number | null): string => {
    if (seconds == null || Number.isNaN(seconds) || seconds <= 0) {
      return '—';
    }

    return formatMatchTime(seconds * 1000);
  };

  return (
    <>
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
                    <span className="text-white/60">Total Damage Dealt</span>
                    <span className="font-medium text-white">
                      {formatNumber(selectedPlayerData.totalDamageDealt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Damage to Champions</span>
                    <span className="font-medium text-orange-400">
                      {formatNumber(
                        selectedPlayerData.totalDamageDealtToChampions
                      )}
                    </span>
                  </div>
                  {/* Dealt breakdown (total) */}
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Physical Dealt</span>
                    <span className="text-white">
                      {formatNumber(selectedPlayerData.physicalDamageDealt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Magic Dealt</span>
                    <span className="text-white">
                      {formatNumber(selectedPlayerData.magicDamageDealt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total True Dealt</span>
                    <span className="text-white">
                      {formatNumber(selectedPlayerData.trueDamageDealt)}
                    </span>
                  </div>
                  {/* To champions breakdown (existing) */}
                  <div className="flex justify-between">
                    <span className="text-white/60">Physical to Champions</span>
                    <span className="text-white">
                      {formatNumber(
                        selectedPlayerData.physicalDamageDealtToChampions
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Magic to Champions</span>
                    <span className="text-white">
                      {formatNumber(
                        selectedPlayerData.magicDamageDealtToChampions
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">True to Champions</span>
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
                      {formatNumber(selectedPlayerData.physicalDamageTaken)}
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
                    <span className="text-white/60">Damage Mitigated</span>
                    <span className="text-green-400">
                      {formatNumber(selectedPlayerData.damageSelfMitigated)}
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
                      {formatDurationFromSeconds(
                        selectedPlayerData.totalTimeCCDealt
                      )}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  {/* Objective damage */}
                  <div className="flex justify-between">
                    <span className="text-white/60">Damage to Objectives</span>
                    <span className="text-white">
                      {formatNumber(
                        selectedPlayerData.damageDealtToObjectives ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Damage to Turrets</span>
                    <span className="text-white">
                      {formatNumber(
                        selectedPlayerData.damageDealtToTurrets ?? 0
                      )}
                    </span>
                  </div>
                  {/* DPM / Team Share */}
                  <div className="flex justify-between">
                    <span className="text-white/60">Damage per Minute</span>
                    <span className="text-orange-300">
                      {Math.round(
                        selectedPlayerData.challenges?.damagePerMinute ??
                          selectedPlayerData.totalDamageDealtToChampions /
                            Math.max(1, matchData.info.gameDuration / 60)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Team Damage Share</span>
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
                    <span className="text-white/60">Max CS Lead vs Opp</span>
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
                    <span className="text-white/60">Vision Score / Min</span>
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
                    <span className="text-white/60">Control Wards Placed</span>
                    <span className="text-white">
                      {selectedPlayerData.detectorWardsPlaced}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Vision Wards Bought</span>
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
                  {/* Support Quest Completed - display time with fallback */}
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      Support quest completed
                    </span>
                    <span className="text-white">
                      {(() => {
                        const questTime =
                          supportItemCompletionTimes?.tier2 ??
                          supportItemCompletionTimes?.tier3 ??
                          supportItemCompletionTimes?.tier1 ??
                          null;
                        return questTime ? formatMatchTime(questTime) : '-';
                      })()}
                    </span>
                  </div>

                  {/* Debug: Show detailed support item progression */}
                  {process.env.NODE_ENV === 'development' &&
                    supportItemCompletionTimes && (
                      <div className="mt-2 space-y-1 rounded bg-black/20 p-2 text-xs">
                        <div className="text-white/40">
                          Debug: Support Item Detection
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Tier 1 (3866):</span>
                          <span
                            className={
                              supportItemCompletionTimes.tier1
                                ? 'text-purple-400'
                                : 'text-white/30'
                            }
                          >
                            {supportItemCompletionTimes.tier1
                              ? formatMatchTime(
                                  supportItemCompletionTimes.tier1
                                )
                              : 'Not found'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Quest Complete (3866→3867):
                          </span>
                          <span
                            className={
                              supportItemCompletionTimes.tier2
                                ? 'text-yellow-400'
                                : 'text-white/30'
                            }
                          >
                            {supportItemCompletionTimes.tier2
                              ? formatMatchTime(
                                  supportItemCompletionTimes.tier2
                                )
                              : 'Not found'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">
                            Tier 3 (3869-3877):
                          </span>
                          <span
                            className={
                              supportItemCompletionTimes.tier3
                                ? 'text-green-400'
                                : 'text-white/30'
                            }
                          >
                            {supportItemCompletionTimes.tier3
                              ? formatMatchTime(
                                  supportItemCompletionTimes.tier3
                                )
                              : 'Not found'}
                          </span>
                        </div>
                      </div>
                    )}

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

                  <div className="flex justify-between">
                    <span className="text-white/60">Time Dead</span>
                    <span className="text-red-400">
                      {formatDurationFromSeconds(
                        selectedPlayerData.totalTimeSpentDead
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Longest Life</span>
                    <span className="text-green-400">
                      {formatDurationFromSeconds(
                        selectedPlayerData.longestTimeSpentLiving
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Teamplay & Utility */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-teal-300">
                  <Users className="h-5 w-5" />
                  Teamplay & Utility
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60">Heals on Teammates</span>
                    <span className="text-teal-200">
                      {formatNumber(
                        selectedPlayerData.totalHealsOnTeammates ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Shields on Teammates</span>
                    <span className="text-sky-200">
                      {formatNumber(
                        selectedPlayerData.totalDamageShieldedOnTeammates ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Units Healed</span>
                    <span className="text-white">
                      {selectedPlayerData.totalUnitsHealed ?? 0}
                    </span>
                  </div>
                  {selectedPlayerData.challenges?.effectiveHealAndShielding !==
                    undefined && (
                    <div className="flex justify-between">
                      <span className="text-white/60">
                        Effective Heal & Shielding
                      </span>
                      <span className="text-teal-100">
                        {formatNumber(
                          selectedPlayerData.challenges
                            ?.effectiveHealAndShielding ?? 0
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">Time CCing Others</span>
                    <span className="text-white">
                      {formatDurationFromSeconds(
                        selectedPlayerData.timeCCingOthers
                      )}
                    </span>
                  </div>
                </div>
              </div>

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
                    <span className="text-white/60">Summoner 1 Casts</span>
                    <span className="text-white">
                      {selectedPlayerData.summoner1Casts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Summoner 2 Casts</span>
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
              Click on a player in the Overview tab to see their detailed stats
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
                      value1: formatNumber(selectedPlayerData.totalDamageDealt),
                      value2: formatNumber(comparePlayerData.totalDamageDealt),
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
                      numValue1: selectedPlayerData.totalDamageDealtToChampions,
                      numValue2: comparePlayerData.totalDamageDealtToChampions,
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
                      value1: formatNumber(selectedPlayerData.magicDamageDealt),
                      value2: formatNumber(comparePlayerData.magicDamageDealt),
                      numValue1: selectedPlayerData.magicDamageDealt,
                      numValue2: comparePlayerData.magicDamageDealt,
                    },
                    {
                      label: 'True Damage Dealt',
                      value1: formatNumber(selectedPlayerData.trueDamageDealt),
                      value2: formatNumber(comparePlayerData.trueDamageDealt),
                      numValue1: selectedPlayerData.trueDamageDealt,
                      numValue2: comparePlayerData.trueDamageDealt,
                    },
                    {
                      label: 'Damage Taken',
                      value1: formatNumber(selectedPlayerData.totalDamageTaken),
                      value2: formatNumber(comparePlayerData.totalDamageTaken),
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
                      value1: formatDurationFromSeconds(
                        selectedPlayerData.totalTimeCCDealt
                      ),
                      value2: formatDurationFromSeconds(
                        comparePlayerData.totalTimeCCDealt
                      ),
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
                      numValue2: comparePlayerData.damageDealtToObjectives ?? 0,
                    },
                    {
                      label: 'Damage to Turrets',
                      value1: formatNumber(
                        selectedPlayerData.damageDealtToTurrets ?? 0
                      ),
                      value2: formatNumber(
                        comparePlayerData.damageDealtToTurrets ?? 0
                      ),
                      numValue1: selectedPlayerData.damageDealtToTurrets ?? 0,
                      numValue2: comparePlayerData.damageDealtToTurrets ?? 0,
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
                      value1: selectedPlayerData.totalMinionsKilled.toString(),
                      value2: comparePlayerData.totalMinionsKilled.toString(),
                      numValue1: selectedPlayerData.totalMinionsKilled,
                      numValue2: comparePlayerData.totalMinionsKilled,
                    },
                    {
                      label: 'Jungle CS',
                      value1:
                        selectedPlayerData.neutralMinionsKilled.toString(),
                      value2: comparePlayerData.neutralMinionsKilled.toString(),
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
                      value1: selectedPlayerData.itemsPurchased.toString(),
                      value2: comparePlayerData.itemsPurchased.toString(),
                      numValue1: selectedPlayerData.itemsPurchased,
                      numValue2: comparePlayerData.itemsPurchased,
                    },
                    {
                      label: 'Consumables',
                      value1:
                        selectedPlayerData.consumablesPurchased.toString(),
                      value2: comparePlayerData.consumablesPurchased.toString(),
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
                      value1: selectedPlayerData.detectorWardsPlaced.toString(),
                      value2: comparePlayerData.detectorWardsPlaced.toString(),
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
                      value1: selectedPlayerData.inhibitorKills.toString(),
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
                      value1: formatDurationFromSeconds(
                        selectedPlayerData.totalTimeSpentDead
                      ),
                      value2: formatDurationFromSeconds(
                        comparePlayerData.totalTimeSpentDead
                      ),
                      numValue1: selectedPlayerData.totalTimeSpentDead,
                      numValue2: comparePlayerData.totalTimeSpentDead,
                      isReverse: true, // Lower is better for time dead
                    },
                    {
                      label: 'Longest Life',
                      value1: formatDurationFromSeconds(
                        selectedPlayerData.longestTimeSpentLiving
                      ),
                      value2: formatDurationFromSeconds(
                        comparePlayerData.longestTimeSpentLiving
                      ),
                      numValue1: selectedPlayerData.longestTimeSpentLiving,
                      numValue2: comparePlayerData.longestTimeSpentLiving,
                    },
                    {
                      label: 'Support Quest Completed',
                      value1: (() => {
                        const questSelected =
                          supportItemCompletionTimes?.tier2 ??
                          supportItemCompletionTimes?.tier3 ??
                          supportItemCompletionTimes?.tier1 ??
                          null;
                        return questSelected
                          ? formatMatchTime(questSelected)
                          : '-';
                      })(),
                      value2: (() => {
                        const questCompare =
                          compareSupportItemCompletionTimes?.tier2 ??
                          compareSupportItemCompletionTimes?.tier3 ??
                          compareSupportItemCompletionTimes?.tier1 ??
                          null;
                        return questCompare
                          ? formatMatchTime(questCompare)
                          : '-';
                      })(),
                      numValue1: (() => {
                        const questSelected =
                          supportItemCompletionTimes?.tier2 ??
                          supportItemCompletionTimes?.tier3 ??
                          supportItemCompletionTimes?.tier1 ??
                          null;
                        return questSelected ? questSelected / 1000 : 999999; // Convert to seconds, use high number for no completion
                      })(),
                      numValue2: (() => {
                        const questCompare =
                          compareSupportItemCompletionTimes?.tier2 ??
                          compareSupportItemCompletionTimes?.tier3 ??
                          compareSupportItemCompletionTimes?.tier1 ??
                          null;
                        return questCompare ? questCompare / 1000 : 999999; // Convert to seconds, use high number for no completion
                      })(),
                      isReverse: true, // Earlier completion is better
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

              {/* Teamplay & Utility Section */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div></div>
                  <div className="text-center">
                    <h4 className="flex items-center justify-center gap-2 text-sm font-semibold text-teal-300">
                      <Users className="h-4 w-4" />
                      Teamplay & Utility
                    </h4>
                  </div>
                  <div></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {[
                    {
                      label: 'Heals on Teammates',
                      value1: formatNumber(
                        selectedPlayerData.totalHealsOnTeammates ?? 0
                      ),
                      value2: formatNumber(
                        comparePlayerData.totalHealsOnTeammates ?? 0
                      ),
                      numValue1: selectedPlayerData.totalHealsOnTeammates ?? 0,
                      numValue2: comparePlayerData.totalHealsOnTeammates ?? 0,
                    },
                    {
                      label: 'Shields on Teammates',
                      value1: formatNumber(
                        selectedPlayerData.totalDamageShieldedOnTeammates ?? 0
                      ),
                      value2: formatNumber(
                        comparePlayerData.totalDamageShieldedOnTeammates ?? 0
                      ),
                      numValue1:
                        selectedPlayerData.totalDamageShieldedOnTeammates ?? 0,
                      numValue2:
                        comparePlayerData.totalDamageShieldedOnTeammates ?? 0,
                    },
                    {
                      label: 'Units Healed',
                      value1: (
                        selectedPlayerData.totalUnitsHealed ?? 0
                      ).toString(),
                      value2: (
                        comparePlayerData.totalUnitsHealed ?? 0
                      ).toString(),
                      numValue1: selectedPlayerData.totalUnitsHealed ?? 0,
                      numValue2: comparePlayerData.totalUnitsHealed ?? 0,
                    },
                    {
                      label: 'Effective Heal & Shielding',
                      value1: formatNumber(
                        selectedPlayerData.challenges
                          ?.effectiveHealAndShielding ?? 0
                      ),
                      value2: formatNumber(
                        comparePlayerData.challenges
                          ?.effectiveHealAndShielding ?? 0
                      ),
                      numValue1:
                        selectedPlayerData.challenges
                          ?.effectiveHealAndShielding ?? 0,
                      numValue2:
                        comparePlayerData.challenges
                          ?.effectiveHealAndShielding ?? 0,
                    },
                    {
                      label: 'Time CCing Others',
                      value1: formatMatchTime(
                        Math.max(
                          0,
                          (selectedPlayerData.timeCCingOthers ?? 0) * 1000
                        )
                      ),
                      value2: formatMatchTime(
                        Math.max(
                          0,
                          (comparePlayerData.timeCCingOthers ?? 0) * 1000
                        )
                      ),
                      numValue1: selectedPlayerData.timeCCingOthers ?? 0,
                      numValue2: comparePlayerData.timeCCingOthers ?? 0,
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
                      value1: selectedPlayerData.largestKillingSpree.toString(),
                      value2: comparePlayerData.largestKillingSpree.toString(),
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
                      value1: selectedPlayerData.summoner1Casts.toString(),
                      value2: comparePlayerData.summoner1Casts.toString(),
                      numValue1: selectedPlayerData.summoner1Casts,
                      numValue2: comparePlayerData.summoner1Casts,
                    },
                    {
                      label: 'Summoner 2 Casts',
                      value1: selectedPlayerData.summoner2Casts.toString(),
                      value2: comparePlayerData.summoner2Casts.toString(),
                      numValue1: selectedPlayerData.summoner2Casts,
                      numValue2: comparePlayerData.summoner2Casts,
                    },
                    {
                      label: 'Q Casts',
                      value1: (selectedPlayerData.spell1Casts ?? 0).toString(),
                      value2: (comparePlayerData.spell1Casts ?? 0).toString(),
                      numValue1: selectedPlayerData.spell1Casts ?? 0,
                      numValue2: comparePlayerData.spell1Casts ?? 0,
                    },
                    {
                      label: 'W Casts',
                      value1: (selectedPlayerData.spell2Casts ?? 0).toString(),
                      value2: (comparePlayerData.spell2Casts ?? 0).toString(),
                      numValue1: selectedPlayerData.spell2Casts ?? 0,
                      numValue2: comparePlayerData.spell2Casts ?? 0,
                    },
                    {
                      label: 'E Casts',
                      value1: (selectedPlayerData.spell3Casts ?? 0).toString(),
                      value2: (comparePlayerData.spell3Casts ?? 0).toString(),
                      numValue1: selectedPlayerData.spell3Casts ?? 0,
                      numValue2: comparePlayerData.spell3Casts ?? 0,
                    },
                    {
                      label: 'R Casts',
                      value1: (selectedPlayerData.spell4Casts ?? 0).toString(),
                      value2: (comparePlayerData.spell4Casts ?? 0).toString(),
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
    </>
  );
}
