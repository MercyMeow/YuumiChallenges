/**
 * Custom hook for managing player selection state
 * Handles auto-selection of Yuumi and player comparison logic
 */

import { useState, useMemo } from 'react';
import { MatchDetailsSuccessPayload } from '@/components/match-details';

export function usePlayerSelection(data: MatchDetailsSuccessPayload | null) {
  const [selectedPlayerOverride, setSelectedPlayer] = useState<number | null>(
    null
  );
  const [comparePlayer, setComparePlayer] = useState<number | null>(null);

  // Auto-select Yuumi player if present (derived during render instead of
  // setting state in an effect; an explicit selection always wins)
  const autoSelectedPlayer = useMemo(() => {
    if (!data?.matchData?.info?.participants) return null;

    const yuumiIndex = data.matchData.info.participants.findIndex(
      (participant) => participant.championName?.toLowerCase() === 'yuumi'
    );

    if (yuumiIndex !== -1) {
      console.log('🐱 Auto-selecting Yuumi player at index:', yuumiIndex);
      return yuumiIndex;
    }
    return null;
  }, [data]);

  const selectedPlayer = selectedPlayerOverride ?? autoSelectedPlayer;

  // Get selected player data
  const selectedPlayerData = useMemo(() => {
    if (!data?.matchData?.info?.participants || selectedPlayer === null) {
      return null;
    }
    return data.matchData.info.participants[selectedPlayer];
  }, [data, selectedPlayer]);

  // Get compare player data
  const comparePlayerData = useMemo(() => {
    if (!data?.matchData?.info?.participants || comparePlayer === null) {
      return null;
    }
    return data.matchData.info.participants[comparePlayer];
  }, [data, comparePlayer]);

  return {
    selectedPlayer,
    comparePlayer,
    setSelectedPlayer,
    setComparePlayer,
    selectedPlayerData,
    comparePlayerData,
  };
}
