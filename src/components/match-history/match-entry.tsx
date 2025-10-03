'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { MatchData } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { formatSecondsToTime } from '@/lib/utils/match-timeline-utils';
import { Clock, Trophy, Target, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MatchEntryProps {
  match: MatchData;
  compact?: boolean;
}

export function MatchEntry({ match, compact = false }: MatchEntryProps) {
  const kda =
    match.deaths > 0
      ? ((match.kills + match.assists) / match.deaths).toFixed(2)
      : 'Perfect';

  const kdaRatio =
    match.deaths > 0 ? (match.kills + match.assists) / match.deaths : 99;

  const getKDAColor = (ratio: number) => {
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const getWinColor = (win: boolean) => {
    return win
      ? 'border-l-green-500 bg-green-500/5'
      : 'border-l-red-500 bg-red-500/5';
  };

  const getGameModeDisplay = (gameMode: string, queueId: number) => {
    // Common queue ID mappings
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo',
      440: 'Ranked Flex',
      400: 'Normal Draft',
      430: 'Normal Blind',
      450: 'ARAM',
      900: 'ARURF',
      1020: 'One for All',
      1300: 'Nexus Blitz',
      1400: 'Ultimate Spellbook',
    };

    return queueMap[queueId] || gameMode || 'Custom';
  };

  if (compact) {
    return (
      <Link href={`/match/${match.match_id}`} className="group block">
        <div
          className={`flex items-center justify-between rounded-lg border-l-4 p-3 ${getWinColor(match.win)} cursor-pointer backdrop-blur-sm transition-all duration-200 hover:bg-white/10 group-hover:border-white/20`}
        >
          <div className="flex items-center space-x-3">
            <ChampionIcon championId={match.champion} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{match.champion}</span>
              <span className="text-xs text-white/60">
                {getGameModeDisplay(match.game_mode, match.queue_id)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className={`text-sm font-bold ${getKDAColor(kdaRatio)}`}>
                {match.kills}/{match.deaths}/{match.assists}
              </div>
              <div className="text-xs text-white/60">KDA: {kda}</div>
            </div>

            <Badge
              variant={match.win ? 'default' : 'destructive'}
              className="text-xs"
            >
              {match.win ? 'Win' : 'Loss'}
            </Badge>

            <ExternalLink className="h-3 w-3 text-white/40 transition-colors group-hover:text-white/60" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/match/${match.match_id}`} className="group block">
      <div
        className={`rounded-lg border-l-4 p-4 ${getWinColor(match.win)} cursor-pointer border border-white/10 bg-black/20 backdrop-blur-md transition-all duration-200 hover:bg-white/10 group-hover:border-white/20`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ChampionIcon championId={match.champion} size="md" />
            <div>
              <h4 className="font-semibold text-white">{match.champion}</h4>
              <p className="text-sm text-white/60">
                {getGameModeDisplay(match.game_mode, match.queue_id)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center space-x-1 text-white/60">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {formatSecondsToTime(match.duration)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Game Duration</p>
              </TooltipContent>
            </Tooltip>

            <Badge
              variant={match.win ? 'default' : 'destructive'}
              className="px-3 py-1"
            >
              <Trophy className="mr-1 h-3 w-3" />
              {match.win ? 'Victory' : 'Defeat'}
            </Badge>

            <ExternalLink className="h-4 w-4 text-white/40 transition-colors group-hover:text-white/60" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${getKDAColor(kdaRatio)}`}>
              {match.kills} / {match.deaths} / {match.assists}
            </div>
            <p className="text-xs text-white/60">K / D / A</p>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${getKDAColor(kdaRatio)}`}>
              {kda}
            </div>
            <p className="text-xs text-white/60">KDA Ratio</p>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {formatDistanceToNow(new Date(match.game_creation), {
                addSuffix: true,
              })}
            </div>
            <p className="text-xs text-white/60">Played</p>
          </div>
        </div>

        {!match.analyzed_for_challenges && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Target className="h-4 w-4" />
              <span className="text-xs">Pending challenge analysis</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
