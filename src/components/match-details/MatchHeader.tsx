/**
 * Match Header Component
 * Displays match metadata: game mode, duration, result, and match ID
 * Extracted from match details page
 * Memoized to prevent re-renders when props haven't changed
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gamepad2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ExtendedMatchData, ExtendedMatchTeam } from './types';
import { formatDuration } from './utils';

interface MatchHeaderProps {
  matchData: ExtendedMatchData;
  matchId: string;
  gameMode: string;
  gameModeColor: string;
  blueTeamData?: ExtendedMatchTeam | undefined;
  redTeamData?: ExtendedMatchTeam | undefined;
}

export const MatchHeader = memo(function MatchHeader({
  matchData,
  matchId,
  gameMode,
  gameModeColor,
  blueTeamData,
  redTeamData,
}: MatchHeaderProps) {
  return (
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
                {formatDistanceToNow(new Date(matchData.info.gameCreation), {
                  addSuffix: true,
                })}
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
  );
});
