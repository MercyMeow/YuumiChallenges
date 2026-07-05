/**
 * Team Objectives Component
 * Displays team feats, support quest completion, and objective breakdowns for both teams
 * Extracted from match details page
 * Memoized to prevent re-renders when props haven't changed
 */

import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { ExtendedMatchTeam, SupportItemCompletionTimes } from './types';
import { objectKeys } from './utils';

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
  return (
    <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="h-5 w-5" />
          Team Objectives
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Team Feats (if available) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {blueTeamData?.feats &&
            objectKeys(blueTeamData.feats).map((featKey) => {
              const featName = String(featKey);
              return (
                <Badge
                  key={`blue-${featName}`}
                  className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-300"
                >
                  🔵 {featName.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              );
            })}
          {redTeamData?.feats &&
            objectKeys(redTeamData.feats).map((featKey) => {
              const featName = String(featKey);
              return (
                <Badge
                  key={`red-${featName}`}
                  className="border-red-500/30 bg-red-500/10 text-xs text-red-300"
                >
                  🔴 {featName.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              );
            })}
          {/* Support Quest completion badge for selected player */}
          <Badge className="border-purple-500/30 bg-purple-500/10 text-xs text-purple-300">
            Support quest completed at{' '}
            {(() => {
              const questTime =
                supportItemCompletionTimes?.tier2 ??
                supportItemCompletionTimes?.tier3 ??
                supportItemCompletionTimes?.tier1 ??
                null;
              return questTime ? formatMatchTime(questTime) : '-';
            })()}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="mb-4 font-semibold text-blue-400">Blue Team</h4>
            <div className="grid grid-cols-3 gap-4">
              {blueTeamData?.objectives &&
                objectKeys(blueTeamData.objectives).map((key) => {
                  const objective = blueTeamData.objectives[key];
                  return (
                    <div
                      key={String(key)}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center"
                    >
                      <div className="text-2xl font-bold text-white">
                        {objective?.kills ?? 0}
                      </div>
                      <div className="text-xs capitalize text-white/60">
                        {String(key)}
                      </div>
                      {objective?.first && (
                        <Badge className="mt-1 bg-yellow-500/20 text-xs text-yellow-400">
                          First
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-red-400">Red Team</h4>
            <div className="grid grid-cols-3 gap-4">
              {redTeamData?.objectives &&
                objectKeys(redTeamData.objectives).map((key) => {
                  const objective = redTeamData.objectives[key];
                  return (
                    <div
                      key={String(key)}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center"
                    >
                      <div className="text-2xl font-bold text-white">
                        {objective?.kills ?? 0}
                      </div>
                      <div className="text-xs capitalize text-white/60">
                        {String(key)}
                      </div>
                      {objective?.first && (
                        <Badge className="mt-1 bg-yellow-500/20 text-xs text-yellow-400">
                          First
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
