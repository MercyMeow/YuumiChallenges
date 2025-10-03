/**
 * Team Section Component
 * Displays a team card with all participants
 * Extracted from match details page
 * Memoized to prevent re-renders when props haven't changed
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  const borderColor =
    teamColor === 'blue' ? 'border-blue-500/20' : 'border-red-500/20';
  const titleColor = teamColor === 'blue' ? 'text-blue-400' : 'text-red-400';
  const dotColor = teamColor === 'blue' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <Card className={`${borderColor} bg-black/20 backdrop-blur-md`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${titleColor}`}>
          <div className={`h-4 w-4 rounded-full ${dotColor}`}></div>
          {teamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
});
