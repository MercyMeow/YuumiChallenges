/**
 * Team Objectives Component
 * Hextech panel with team feats, support quest completion, and objective
 * breakdowns for both teams.
 * Memoized to prevent re-renders when props haven't changed.
 */

import { memo } from 'react';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ExtendedMatchTeam,
  SupportItemCompletionTimes,
  TeamObjectiveExtra,
} from './types';
import { objectKeys } from './utils';

const OBJECTIVE_LABELS: Record<string, string> = {
  baron: 'Baron',
  champion: 'Kills',
  dragon: 'Dragons',
  horde: 'Grubs',
  inhibitor: 'Inhibs',
  riftHerald: 'Herald',
  tower: 'Towers',
  atakhan: 'Atakhan',
};

function objectiveLabel(key: string): string {
  return OBJECTIVE_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function ObjectiveTile({
  label,
  objective,
}: {
  label: string;
  objective: TeamObjectiveExtra | undefined;
}) {
  return (
    <div className="rounded-sm px-2 py-2.5 text-center hex-card-inset">
      <div className="text-lg font-bold text-hx-parchment">
        {objective?.kills ?? 0}
      </div>
      <div className="truncate text-[10px] tracking-widest text-hx-gold/60 uppercase">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 inline-block rounded-sm px-1.5 py-px text-[9px] font-bold tracking-wider uppercase',
          objective?.first ? 'bg-hx-gold/15 text-hx-gold-bright' : 'invisible'
        )}
      >
        First
      </div>
    </div>
  );
}

function TeamObjectiveColumn({
  teamData,
  side,
}: {
  teamData: ExtendedMatchTeam | undefined;
  side: 'blue' | 'red';
}) {
  const isBlue = side === 'blue';
  return (
    <div>
      <h3
        className={cn(
          'mb-3 flex items-center gap-2 hex-title text-xs',
          isBlue ? 'text-sky-300' : 'text-red-300'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-2 w-2 rotate-45',
            isBlue ? 'bg-sky-400' : 'bg-red-400'
          )}
        />
        {isBlue ? 'Blue Team' : 'Red Team'}
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {teamData?.objectives &&
          objectKeys(teamData.objectives).map((key) => (
            <ObjectiveTile
              key={String(key)}
              label={objectiveLabel(String(key))}
              objective={teamData.objectives[key]}
            />
          ))}
      </div>
    </div>
  );
}

interface TeamObjectivesProps {
  blueTeamData: ExtendedMatchTeam | undefined;
  redTeamData: ExtendedMatchTeam | undefined;
  supportItemCompletionTimes: SupportItemCompletionTimes | null;
  formatMatchTime: (seconds: number) => string;
}

export const TeamObjectives = memo(function TeamObjectives({
  blueTeamData,
  redTeamData,
  supportItemCompletionTimes,
  formatMatchTime,
}: TeamObjectivesProps) {
  const questTime =
    supportItemCompletionTimes?.tier2 ??
    supportItemCompletionTimes?.tier3 ??
    supportItemCompletionTimes?.tier1 ??
    null;

  const featChips = [
    ...(blueTeamData?.feats
      ? objectKeys(blueTeamData.feats).map((key) => ({
          side: 'blue' as const,
          name: String(key),
        }))
      : []),
    ...(redTeamData?.feats
      ? objectKeys(redTeamData.feats).map((key) => ({
          side: 'red' as const,
          name: String(key),
        }))
      : []),
  ];

  return (
    <section className="hex-card relative rounded-sm">
      <header className="flex items-center gap-2.5 border-b border-hx-gold-dark/40 px-4 py-3 sm:px-5">
        <Target className="h-4 w-4 shrink-0 text-hx-gold" aria-hidden />
        <h2 className="truncate hex-title text-sm text-hx-gold sm:text-base">
          Team Objectives
        </h2>
      </header>
      <div className="p-4 sm:p-5">
        {(featChips.length > 0 || questTime !== null) && (
          <div className="mb-5 flex flex-wrap gap-2">
            {featChips.map(({ side, name }) => (
              <span
                key={`${side}-${name}`}
                className={cn(
                  'hex-chip',
                  side === 'blue'
                    ? 'border-sky-400/40 text-sky-300'
                    : 'border-red-400/40 text-red-300'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'h-1.5 w-1.5 rotate-45',
                    side === 'blue' ? 'bg-sky-400' : 'bg-red-400'
                  )}
                />
                {name.replace(/_/g, ' ').toLowerCase()}
              </span>
            ))}
            {questTime !== null && (
              <span className="hex-chip-magic">
                Support quest completed at {formatMatchTime(questTime)}
              </span>
            )}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <TeamObjectiveColumn teamData={blueTeamData} side="blue" />
          <TeamObjectiveColumn teamData={redTeamData} side="red" />
        </div>
      </div>
    </section>
  );
});
