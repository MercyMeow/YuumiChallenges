/**
 * Simplified Timeline Processor Hook
 *
 * Clean, efficient React hook for processing item timeline data.
 * Eliminates unnecessary complexity while maintaining reliability.
 */

import { useState, useCallback } from 'react';
import {
  RawTimelineData,
  ProcessingOptions,
  PlayerTimeline,
} from '@/lib/types/item-timeline-new';
import { processItemTimeline } from '@/lib/utils/item-timeline-processor-new';
import type {
  LegacyProcessedItemTimeline,
  LegacyTimelineProcessingOptions,
} from '@/lib/utils/item-timeline-processor-new';

// ==================== HOOK INTERFACE ====================

interface UseSimpleTimelineProcessorResult {
  timeline: PlayerTimeline | null;
  isProcessing: boolean;
  error: string | null;
  processTimeline: (data: RawTimelineData, options: ProcessingOptions) => void;
}

// ==================== MAIN HOOK ====================

export function useSimpleTimelineProcessor(): UseSimpleTimelineProcessorResult {
  const [timeline, setTimeline] = useState<PlayerTimeline | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processTimelineData = useCallback(
    (timelineData: RawTimelineData, options: ProcessingOptions) => {
      setIsProcessing(true);
      setError(null);
      setTimeline(null);

      // Use setTimeout to prevent blocking the UI
      setTimeout(() => {
        const result = processItemTimeline(timelineData, options);

        if (result.success && result.data) {
          setTimeline(result.data);
          setError(null);
        } else {
          setTimeline(null);
          setError(result.error || 'Processing failed');
        }

        setIsProcessing(false);
      }, 0);
    },
    []
  );

  return {
    timeline,
    isProcessing,
    error,
    processTimeline: processTimelineData,
  };
}

// ==================== LEGACY COMPATIBILITY ====================

/**
 * Legacy hook interface for backward compatibility
 */
interface UseLegacyTimelineProcessorResult {
  processedTimeline: LegacyProcessedItemTimeline | null;
  isProcessing: boolean;
  error: string | null;
  processingTime: number;
  cacheHitRate: number;
  processTimeline: (
    timelineData: RawTimelineData,
    options: LegacyTimelineProcessingOptions
  ) => void;
}

/**
 * Legacy wrapper hook that maintains the old API
 */
export function useTimelineProcessor(): UseLegacyTimelineProcessorResult {
  const [legacyResult, setLegacyResult] =
    useState<LegacyProcessedItemTimeline | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime] = useState(0);

  const processLegacyTimeline = useCallback(
    async (
      timelineData: RawTimelineData,
      options: LegacyTimelineProcessingOptions
    ) => {
      setIsProcessing(true);
      setError(null);
      setLegacyResult(null);

      setTimeout(async () => {
        try {
          // Use the legacy compatibility function
          const { processPlayerItemTimeline } =
            await import('@/lib/utils/item-timeline-processor-new');

          const result = processPlayerItemTimeline(timelineData, options);
          setLegacyResult(result);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Processing failed');
          setLegacyResult(null);
        } finally {
          setIsProcessing(false);
        }
      }, 0);
    },
    []
  );

  return {
    processedTimeline: legacyResult,
    isProcessing,
    error,
    processingTime,
    cacheHitRate: 0,
    processTimeline: processLegacyTimeline,
  };
}
