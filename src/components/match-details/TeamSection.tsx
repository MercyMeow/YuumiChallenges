/**
 * Team Section Component
 * Hextech panel listing one team's players plus a totals summary.
 * Memoized to prevent re-renders when props haven't changed.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  ExtendedMatchData,
  TeamTotals,
  ExtendedMatchParticipant,
} from './types';
import { PlayerCard } from './PlayerCard';

interface TeamSectionProps {
  teamName: string;
  teamColor: 'blue' | 'red';
  participants: ExtendedMatchParticipant[];
  teamTotals: TeamTotals;
  matchData: ExtendedMatchData;
  selectedPlayer: number | null;
  comparePlayer: number | null;
  setSelectedPlayer: (index: number | null) => void;
  setComparePlayer: (index: number | null) => void;
  getKDAColor: (kills: number, deaths: number, assists: number) => string;
  formatNumber: (num: number) => string;
}

export const TeamSection = memo(function TeamSection({
  teamName,
  teamColor,
  participants,
  teamTotals,
  matchData,
  selectedPlayer,
  comparePlayer,
  setSelectedPlayer,
  setComparePlayer,
  getKDAColor,
  formatNumber,
}: TeamSectionProps) {
  const isBlue = teamColor === 'blue';
  const teamData = matchData.info.teams.find(
    (team) => team.teamId === (isBlue ? 100 : 200)
  );

  return (
    <section className="hex-card relative rounded-sm">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hx-gold-dark/40 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              'h-2.5 w-2.5 shrink-0 rotate-45',
              isBlue
                ? 'bg-sky-400 shadow-[0_0_8px] shadow-sky-400/60'
                : 'bg-red-400 shadow-[0_0_8px] shadow-red-400/60'
            )}
          />
          <h2
            className={cn(
              'truncate hex-title text-sm sm:text-base',
              isBlue ? 'text-sky-300' : 'text-red-300'
            )}
          >
            {teamName}
          </h2>
          {teamData && (
            <span
              className={cn(
                'hex-title text-xs',
                teamData.win ? 'text-emerald-300' : 'text-red-300/80'
              )}
            >
              {teamData.win ? 'Victory' : 'Defeat'}
            </span>
          )}
        </div>
        <div className="text-xs tracking-wide text-hx-gold/60">
          {teamTotals.kills} kills · {formatNumber(teamTotals.gold)} gold ·{' '}
          {formatNumber(teamTotals.damage)} damage
        </div>
      </header>
      <div className="space-y-2 p-3 sm:p-4">
        {participants.map((participant, index) => (
          <PlayerCard
            key={index}
            participant={participant}
            teamColor={teamColor}
            teamTotals={teamTotals}
            matchData={matchData}
            selectedPlayer={selectedPlayer}
            comparePlayer={comparePlayer}
            setSelectedPlayer={setSelectedPlayer}
            setComparePlayer={setComparePlayer}
            getKDAColor={getKDAColor}
            formatNumber={formatNumber}
          />
        ))}
      </div>
    </section>
  );
});
