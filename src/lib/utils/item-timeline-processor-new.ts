/**
 * Simplified Item Timeline Processing
 * 
 * Clean, efficient processing of League of Legends timeline data.
 * Focuses on core functionality without overengineering.
 */

import {
  RawTimelineData,
  RawTimelineEvent,
  ItemEvent,
  PlayerTimeline,
  ProcessingOptions,
  ProcessingResult,
  ItemEventType,
  formatTimestamp,
  isSupportEvolution,
  getEvolutionStage,
} from '@/lib/types/item-timeline-new';

// ==================== CORE PROCESSING ====================

export function processItemTimeline(
  timelineData: RawTimelineData,
  options: ProcessingOptions
): ProcessingResult {
  try {
    // Validate participant ID
    if (options.participantId < 1 || options.participantId > 10) {
      return {
        success: false,
        error: `Invalid participant ID: ${options.participantId}. Must be between 1-10.`
      };
    }

    // Collect all item events for the player
    const allEvents: RawTimelineEvent[] = [];
    for (const frame of timelineData.info.frames) {
      const itemEvents = getItemEvents(frame.events, options.participantId);  
      allEvents.push(...itemEvents);
    }

    // Transform events
    let events = allEvents.map(transformEvent);
    
    // Filter undo events if requested
    if (!options.includeUndoEvents) {
      events = events.filter(event => event.type !== 'ITEM_UNDO');
    }

    // Sort chronologically
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Build result
    const timeline: PlayerTimeline = {
      participantId: options.participantId,
      events,
      stats: calculateStats(events)
    };

    return { success: true, data: timeline };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    };
  }
}

// ==================== EVENT FILTERING ====================

function getItemEvents(events: readonly RawTimelineEvent[], participantId: number): RawTimelineEvent[] {
  const itemEventTypes: readonly ItemEventType[] = ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_DESTROYED', 'ITEM_UNDO'];
  
  return events.filter(event =>
    event.participantId === participantId &&
    itemEventTypes.includes(event.type as ItemEventType) &&
    typeof event.itemId === 'number' &&
    event.itemId > 0
  );
}

// ==================== EVENT TRANSFORMATION ====================

function transformEvent(rawEvent: RawTimelineEvent): ItemEvent {
  const itemId = rawEvent.itemId!;
  const isEvolution = isSupportEvolution(itemId);
  
  const baseEvent: ItemEvent = {
    type: rawEvent.type as ItemEventType,
    timestamp: rawEvent.timestamp,
    timeFormatted: formatTimestamp(rawEvent.timestamp),
    itemId,
    isEvolution
  };

  // Only add evolutionStage if it exists
  if (isEvolution) {
    const stage = getEvolutionStage(itemId);
    if (stage) {
      (baseEvent as any).evolutionStage = stage;
    }
  }

  return baseEvent;
}

// ==================== STATISTICS ====================

function calculateStats(events: readonly ItemEvent[]) {
  const purchases = events.filter(e => e.type === 'ITEM_PURCHASED').length;
  const sales = events.filter(e => e.type === 'ITEM_SOLD').length;
  const destructions = events.filter(e => e.type === 'ITEM_DESTROYED').length;
  const evolutions = events.filter(e => e.isEvolution).length;

  return { purchases, sales, destructions, evolutions };
}

// ==================== LEGACY COMPATIBILITY ====================

// Maintain compatibility with existing components
export interface LegacyTimelineProcessingOptions {
  selectedPlayerId: number;  // 0-indexed
  includeUndoEvents?: boolean;
  groupConsecutiveEvents?: boolean;
  detectEvolutions?: boolean;
  timeFormat?: 'MM:SS' | 'seconds' | 'milliseconds';
}

export interface LegacyPlayerItemTimeline {
  playerId: number;
  participantId: number;
  events: Array<{
    type: ItemEventType;
    timestamp: number;
    timeFormatted: string;
    participantId: number;
    itemId: number;
    itemName?: string;
    isEvolution?: boolean;
    evolutionChain?: {
      stage: string;
      chainName: string;
    };
  }>;
  totalPurchases: number;
  totalSales: number;
  totalDestructions: number;
  supportItemEvolutions: any[];
  firstItemTimestamp?: number;
  finalBuildTimestamp?: number;
}

export interface LegacyProcessedItemTimeline {
  playerTimeline: LegacyPlayerItemTimeline;
  totalFrames: number;
  matchDuration: number;
  processingOptions: LegacyTimelineProcessingOptions;
  errors: any[];
}

/**
 * Legacy wrapper function for backward compatibility
 * Converts 0-indexed player ID to 1-indexed and transforms result format
 */
export function processPlayerItemTimeline(
  timelineData: RawTimelineData,
  options: LegacyTimelineProcessingOptions
): LegacyProcessedItemTimeline {
  // Convert 0-indexed to 1-indexed participant ID
  const participantId = options.selectedPlayerId + 1;
  
  const processingOptions: ProcessingOptions = {
    participantId,
    ...(options.includeUndoEvents !== undefined && { includeUndoEvents: options.includeUndoEvents })
  };

  const result = processItemTimeline(timelineData, processingOptions);

  // Transform back to legacy format
  if (result.success && result.data) {
    const { events, stats } = result.data;
    
    const legacyEvents = events.map(event => {
      const legacyEvent: any = {
        type: event.type,
        timestamp: event.timestamp,
        timeFormatted: event.timeFormatted,
        participantId: result.data!.participantId,
        itemId: event.itemId,
        isEvolution: event.isEvolution
      };

      // Only add evolutionChain if it's an evolution
      if (event.isEvolution && event.evolutionStage) {
        legacyEvent.evolutionChain = {
          stage: event.evolutionStage,
          chainName: 'Support Item'
        };
      }

      return legacyEvent;
    });

    const playerTimeline: LegacyPlayerItemTimeline = {
      playerId: options.selectedPlayerId,
      participantId: result.data.participantId,
      events: legacyEvents,
      totalPurchases: stats.purchases,
      totalSales: stats.sales,
      totalDestructions: stats.destructions,
      supportItemEvolutions: events.filter(e => e.isEvolution),
    };

    // Only add optional timestamps if they exist
    const firstPurchase = events.find(e => e.type === 'ITEM_PURCHASED');
    if (firstPurchase) {
      playerTimeline.firstItemTimestamp = firstPurchase.timestamp;
    }

    const lastPurchase = events.filter(e => e.type === 'ITEM_PURCHASED').pop();
    if (lastPurchase) {
      playerTimeline.finalBuildTimestamp = lastPurchase.timestamp;
    }

    return {
      playerTimeline,
      totalFrames: timelineData.info.frames.length,
      matchDuration: timelineData.info.frames[timelineData.info.frames.length - 1]?.timestamp || 0,
      processingOptions: options,
      errors: []
    };
  }

  // Return empty result for errors
  return {
    playerTimeline: {
      playerId: options.selectedPlayerId,
      participantId: participantId,
      events: [],
      totalPurchases: 0,
      totalSales: 0,
      totalDestructions: 0,
      supportItemEvolutions: [],
    },
    totalFrames: 0,
    matchDuration: 0,
    processingOptions: options,
    errors: result.error ? [{ message: result.error }] : []
  };
}

// ==================== UTILITIES ====================

export function createDefaultProcessingOptions(participantId: number): ProcessingOptions {
  return {
    participantId,
    includeUndoEvents: false
  };
}