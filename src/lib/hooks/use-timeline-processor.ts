/**
 * Custom hook for optimized timeline processing using Web Workers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RawTimelineData,
  ProcessedItemTimeline,
  TimelineProcessingOptions,
} from '@/lib/types/item-timeline';

interface UseTimelineProcessorResult {
  processedTimeline: ProcessedItemTimeline | null;
  isProcessing: boolean;
  error: string | null;
  processingTime: number;
  cacheHitRate: number;
  processTimeline: (
    timelineData: RawTimelineData,
    options: TimelineProcessingOptions
  ) => void;
}

export function useTimelineProcessor(): UseTimelineProcessorResult {
  const [processedTimeline, setProcessedTimeline] =
    useState<ProcessedItemTimeline | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [cacheStats] = useState({ hits: 0, misses: 0 });

  const workerRef = useRef<Worker | null>(null);
  const processingQueueRef = useRef<
    Map<string, (result: ProcessedItemTimeline) => void>
  >(new Map());

  // Initialize worker
  useEffect(() => {
    // Disable worker path until a real worker script is implemented.
    // For reliability, force main-thread processing to avoid indefinite "processing" states.
    workerRef.current = null;

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const processTimeline = useCallback(
    async (
      timelineData: RawTimelineData,
      options: TimelineProcessingOptions
    ) => {
      // Create a unique key for this processing request
      const cacheKey = `${options.selectedPlayerId}-${JSON.stringify(options)}-${timelineData.info.frames.length}`;

      // Check if we're already processing the same request
      if (isProcessing && processingQueueRef.current.has(cacheKey)) {
        return; // Same request already in progress
      }

      // Clear any existing processed timeline when starting new processing
      setProcessedTimeline(null);
      setIsProcessing(true);
      setError(null);

      if (workerRef.current) {
        // Use Web Worker
        const promise = new Promise<ProcessedItemTimeline>(
          (resolve, reject) => {
            processingQueueRef.current.set(cacheKey, resolve);

            // Add timeout to prevent infinite processing
            setTimeout(() => {
              if (processingQueueRef.current.has(cacheKey)) {
                processingQueueRef.current.delete(cacheKey);
                reject(new Error('Processing timeout'));
              }
            }, 30000); // 30 second timeout
          }
        );

        workerRef.current.postMessage({
          type: 'PROCESS_TIMELINE',
          payload: {
            timelineData,
            options,
            cacheKey,
          },
        });

        try {
          await promise;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Processing failed');
          setIsProcessing(false);
        }
      } else {
        // Fallback to main thread with setTimeout to prevent blocking
        const startTime = performance.now();

        setTimeout(async () => {
          try {
            // Dynamic import to avoid bundling worker code in main thread
            const { processPlayerItemTimeline } = await import(
              '@/lib/utils/item-timeline-processor'
            );
            const result = processPlayerItemTimeline(timelineData, options);

            const processingTime = performance.now() - startTime;

            setProcessedTimeline(result);
            setProcessingTime(processingTime);
            setIsProcessing(false);
            setError(null);
          } catch (err) {
            console.error('Timeline processing error:', err);
            setError(err instanceof Error ? err.message : 'Processing failed');
            setIsProcessing(false);
          }
        }, 0);
      }
    },
    [isProcessing]
  );

  const cacheHitRate =
    cacheStats.hits + cacheStats.misses > 0
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
      : 0;

  return {
    processedTimeline,
    isProcessing,
    error,
    processingTime,
    cacheHitRate,
    processTimeline,
  };
}
