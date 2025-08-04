/**
 * Simplified hook for timeline processing - no web workers, no complex caching
 */

import { useState, useCallback } from 'react';
import {
  RawTimelineData,
} from '@/lib/types/item-timeline';

export function useTimelineProcessor() {
  // Use the legacy compatibility function for now
  return useLegacyTimelineProcessor();
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useTimelineProcessor with new types instead
 */
export function useLegacyTimelineProcessor() {
  const [processedTimeline, setProcessedTimeline] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);

  const processTimeline = useCallback(
    async (
      timelineData: RawTimelineData,
      options: { selectedPlayerId: number; includeUndoEvents?: boolean }
    ) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setError(null);
      setProcessedTimeline(null);
      
      const startTime = performance.now();

      setTimeout(async () => {
        try {
          const { processPlayerItemTimeline } = await import(
            '@/lib/utils/item-timeline-processor'
          );
          const result = processPlayerItemTimeline(timelineData, options);
          
          setProcessedTimeline(result);
          setProcessingTime(performance.now() - startTime);
          setError(null);
        } catch (err) {
          console.error('Timeline processing error:', err);
          setError(err instanceof Error ? err.message : 'Processing failed');
        } finally {
          setIsProcessing(false);
        }
      }, 0);
    },
    [isProcessing]
  );

  return {
    processedTimeline,
    isProcessing,
    error,
    processingTime,
    cacheHitRate: 0, // No caching in simplified version
    processTimeline,
  };
}
