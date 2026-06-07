/**
 * Custom hook for managing timeline data processing
 * Consolidates timeline processing and support item detection
 */

import { useEffect, useMemo } from 'react';
import { useSimpleTimelineProcessor } from '@/lib/hooks/use-timeline-processor-new';
import { createDefaultProcessingOptions } from '@/lib/utils/item-timeline-processor-new';
import { detectSupportItemCompletionFromRaw } from '@/lib/utils/match-timeline-utils';
import { RawTimelineData } from '@/lib/types/item-timeline-new';

export function useTimelineData(
  rawTimelineData: RawTimelineData | null,
  selectedPlayer: number | null,
  comparePlayer: number | null
) {
  const {
    timeline: processedTimeline,
    isProcessing,
    error: timelineError,
    processTimeline,
  } = useSimpleTimelineProcessor();

  // Process timeline for selected player
  useEffect(() => {
    if (!rawTimelineData || selectedPlayer === null) return;
    const processingOptions = createDefaultProcessingOptions(
      selectedPlayer + 1
    );
    processTimeline(rawTimelineData, processingOptions);
  }, [rawTimelineData, selectedPlayer, processTimeline]);

  // Support item completion times for selected player
  const supportItemCompletionTimes = useMemo(() => {
    if (!rawTimelineData || selectedPlayer === null) return null;
    return detectSupportItemCompletionFromRaw(
      rawTimelineData,
      selectedPlayer + 1
    );
  }, [rawTimelineData, selectedPlayer]);

  // Support item completion times for compare player
  const compareSupportItemCompletionTimes = useMemo(() => {
    if (!rawTimelineData || comparePlayer === null) return null;
    return detectSupportItemCompletionFromRaw(
      rawTimelineData,
      comparePlayer + 1
    );
  }, [rawTimelineData, comparePlayer]);

  return {
    processedTimeline,
    isProcessing,
    timelineError,
    supportItemCompletionTimes,
    compareSupportItemCompletionTimes,
  };
}
