/**
 * Runes Tab Component
 * Displays player rune selections and stats
 * Extracted from match details page
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { RuneTreeDisplay } from '@/components/ui/rune-display';
import { Users } from 'lucide-react';
import { ExtendedMatchParticipant } from './types';

interface RunesTabProps {
  selectedPlayerData: ExtendedMatchParticipant | null | undefined;
}

export const RunesTab = memo(function RunesTab({
  selectedPlayerData,
}: RunesTabProps) {
  if (!selectedPlayerData) {
    return (
      <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
        <CardContent className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-white/40" />
          <p className="text-white/60">
            Click on a player in the Overview tab to see their runes and
            contributions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <ChampionIcon
            championId={selectedPlayerData.championName}
            size="md"
          />
          {selectedPlayerData.riotIdGameName}#{selectedPlayerData.riotIdTagline}{' '}
          - Runes & Perks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          const perks = selectedPlayerData.perks;
          if (!perks?.styles || !perks.statPerks) {
            return (
              <div className="rounded border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-200">
                Rune information is unavailable for this participant.
              </div>
            );
          }

          const normalizedPerks = {
            styles: perks.styles,
            statPerks: {
              offense: perks.statPerks.offense ?? 0,
              flex: perks.statPerks.flex ?? 0,
              defense: perks.statPerks.defense ?? 0,
            },
          };

          type NormalizedRuneDetail = {
            runeId: number;
            statType: string;
            value: number;
          };

          const rawDetails = selectedPlayerData.runes?.details;
          const byRuneId: Record<number, NormalizedRuneDetail[]> = {};

          if (Array.isArray(rawDetails)) {
            for (const detail of rawDetails) {
              if (!detail || typeof detail.runeId !== 'number') {
                continue;
              }

              const statType =
                typeof detail.statType === 'string'
                  ? detail.statType
                  : String(detail.statType ?? '');

              const rawValue = detail.value;
              let value = 0;
              if (typeof rawValue === 'number') {
                value = Number.isFinite(rawValue) ? rawValue : 0;
              } else if (typeof rawValue === 'string') {
                const parsed = Number(rawValue);
                value = Number.isFinite(parsed) ? parsed : 0;
              }

              const normalizedDetail: NormalizedRuneDetail = {
                runeId: detail.runeId,
                statType,
                value,
              };

              if (!byRuneId[normalizedDetail.runeId]) {
                byRuneId[normalizedDetail.runeId] = [];
              }
              byRuneId[normalizedDetail.runeId]!.push(normalizedDetail);
            }
          }

          return (
            <RuneTreeDisplay
              perks={normalizedPerks}
              className="mt-2"
              runeDetailsByRuneId={byRuneId}
            />
          );
        })()}
      </CardContent>
    </Card>
  );
});
