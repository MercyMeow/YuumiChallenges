/**
 * Match Header Component
 * Hextech plate with game mode, duration, result, and match ID.
 * Memoized to prevent re-renders when props haven't changed.
 */

import { memo } from 'react';
import { Clock, Swords } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
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
    <section className="hex-card-elevated hex-corners relative rounded-sm px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 hex-title text-xl text-hx-gold-bright sm:text-2xl">
            <Swords className="h-5 w-5 shrink-0 text-hx-gold" aria-hidden />
            Match Details
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn('hex-chip', gameModeColor)}>{gameMode}</span>
            <span className="hex-chip">
              <Clock className="h-3 w-3" aria-hidden />
              {formatDuration(matchData.info.gameDuration)}
            </span>
            {blueTeamData?.win && (
              <span className="hex-chip border-sky-400/50 text-sky-300">
                Blue Victory
              </span>
            )}
            {redTeamData?.win && (
              <span className="hex-chip border-red-400/50 text-red-300">
                Red Victory
              </span>
            )}
            <span className="text-xs tracking-wide text-hx-gold/60">
              {formatDistanceToNow(new Date(matchData.info.gameCreation), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="hex-label">Match ID</div>
          <div className="mt-0.5 truncate font-mono text-xs text-hx-parchment/80">
            {matchId}
          </div>
        </div>
      </div>
    </section>
  );
});
