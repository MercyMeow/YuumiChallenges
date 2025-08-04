/**
 * Simplified Item Timeline Data Processing
 * 
 * Clean, reliable data processing with minimal complexity and maximum maintainability.
 */

import {
  RawTimelineData,
  RawTimelineEvent,
  ItemEvent,
  ProcessingOptions,
  ProcessingResult,
  ItemEventType,
  SUPPORT_EVOLUTIONS,
} from '@/lib/types/item-timeline';
import { formatMillisecondsToTime } from '@/lib/utils/match-timeline-utils';

/**
 * Format timestamp to MM:SS format
 */
function formatTimestamp(milliseconds: number): string {
  return formatMillisecondsToTime(milliseconds);
}

/**
 * Check if item is a support evolution item
 */
function isSupportEvolution(itemId: number): boolean {
  return itemId in SUPPORT_EVOLUTIONS;
}

/**
 * Filter and validate raw timeline events for item events only
 */
function getItemEvents(events: RawTimelineEvent[], participantId: number): RawTimelineEvent[] {
  const itemEventTypes: ItemEventType[] = ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_DESTROYED', 'ITEM_UNDO'];
  
  return events.filter(event => 
    itemEventTypes.includes(event.type as ItemEventType) &&
    event.itemId > 0 &&
    event.participantId === participantId
  );
}

/**
 * Transform raw event to processed item event
 */
function transformEvent(rawEvent: RawTimelineEvent): ItemEvent {
  const isEvolution = isSupportEvolution(rawEvent.itemId);
  const evolutionStage: 'base' | 'tier1' | 'tier2' | 'tier3' | undefined = isEvolution ? SUPPORT_EVOLUTIONS[rawEvent.itemId]?.stage : undefined;
  
  const event: ItemEvent = {
    type: rawEvent.type as ItemEventType,
    timestamp: rawEvent.timestamp,
    timeFormatted: formatTimestamp(rawEvent.timestamp),
    itemId: rawEvent.itemId,
    isEvolution,
  };
  
  if (evolutionStage !== undefined) {
    (event as any).evolutionStage = evolutionStage;
  }
  
  return event;
}

/**
 * Calculate timeline statistics
 */
function calculateStats(events: ItemEvent[]) {
  return {
    purchases: events.filter(e => e.type === 'ITEM_PURCHASED').length,
    sales: events.filter(e => e.type === 'ITEM_SOLD').length,
    destructions: events.filter(e => e.type === 'ITEM_DESTROYED').length,
    evolutions: events.filter(e => e.isEvolution).length,
  };
}

/**
 * Main processing function - transforms raw timeline data into clean player timeline
 */
export function processItemTimeline(
  timelineData: RawTimelineData,
  options: ProcessingOptions
): ProcessingResult {
  try {
    // Validate participant ID
    if (options.participantId < 1 || options.participantId > 10) {
      return {
        success: false,
        error: `Invalid participant ID: ${options.participantId}. Must be 1-10.`,
      };
    }

    // Collect all events across frames
    const allEvents: RawTimelineEvent[] = [];
    
    for (const frame of timelineData.info.frames) {
      const itemEvents = getItemEvents(frame.events, options.participantId);
      allEvents.push(...itemEvents);
    }

    // Transform events
    let events = allEvents.map(transformEvent);

    // Filter out undo events if not requested
    if (!options.includeUndoEvents) {
      events = events.filter(event => event.type !== 'ITEM_UNDO');
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate statistics
    const stats = calculateStats(events);

    return {
      success: true,
      data: {
        participantId: options.participantId,
        events,
        stats,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}

/**
 * Legacy compatibility function - wraps new simple processor
 * @deprecated Use processItemTimeline instead
 */
export function processPlayerItemTimeline(
  timelineData: RawTimelineData,
  options: { selectedPlayerId: number; includeUndoEvents?: boolean }
) {
  const includeUndoEvents: boolean | undefined = options.includeUndoEvents;
  const result = processItemTimeline(timelineData, {
    participantId: options.selectedPlayerId + 1, // Convert 0-indexed to 1-indexed
    includeUndoEvents,
  });

  if (!result.success || !result.data) {
    // Return legacy format for error cases
    return {
      playerTimeline: {
        playerId: options.selectedPlayerId,
        participantId: options.selectedPlayerId + 1,
        events: [],
        totalPurchases: 0,
        totalSales: 0,
        totalDestructions: 0,
        supportItemEvolutions: [],
      },
      totalFrames: 0,
      matchDuration: 0,
      processingOptions: options,
      errors: [{ type: 'MISSING_ITEM_DATA' as const, message: result.error || 'Unknown error' }],
    };
  }

  // Transform new format to legacy format for compatibility
  const { data } = result;
  const evolutionEvents = data.events.filter(e => e.isEvolution);
  
  return {
    playerTimeline: {
      playerId: options.selectedPlayerId,
      participantId: data.participantId,
      events: data.events.map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        timeFormatted: event.timeFormatted,
        participantId: data.participantId,
        itemId: event.itemId,
        isEvolution: event.isEvolution,
        evolutionChain: event.isEvolution && event.evolutionStage ? {
          stage: event.evolutionStage,
          chainName: SUPPORT_EVOLUTIONS[event.itemId]?.name || 'Unknown',
        } : undefined,
      })),
      totalPurchases: data.stats.purchases,
      totalSales: data.stats.sales,
      totalDestructions: 0, // Not tracked in simplified version
      supportItemEvolutions: evolutionEvents.map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        timeFormatted: event.timeFormatted,
        participantId: data.participantId,
        itemId: event.itemId,
        isEvolution: true,
      })),
    },
    totalFrames: timelineData.info.frames.length,
    matchDuration: timelineData.info.frames[timelineData.info.frames.length - 1]?.timestamp || 0,
    processingOptions: options,
    errors: [],
  };
}

/**
 * Legacy format timestamp function
 * @deprecated Use processItemTimeline instead
 */
export function legacyFormatTimestamp(milliseconds: number): string {
  return formatMillisecondsToTime(milliseconds);
}

/**
 * Legacy utility functions for backward compatibility
 * @deprecated Use the simplified processItemTimeline function instead
 */
export function createDefaultProcessingOptions(selectedPlayerId: number) {
  return {
    selectedPlayerId,
    includeUndoEvents: false,
    groupConsecutiveEvents: true,
    detectEvolutions: true,
    timeFormat: 'MM:SS' as const
  };
}

export function createDefaultDisplayConfig() {
  return {
    showItemIcons: true,
    showItemNames: true,
    showTimestamps: true,
    showEvolutionChains: true,
    groupByTimeInterval: false,
    timeInterval: 1,
    maxEventsPerGroup: 10,
    highlightEvolutions: true,
    compactView: false
  };
}

export function groupEventsByTimeInterval(events: any[], intervalMinutes: number = 1) {
  // Simplified grouping for backward compatibility
  if (events.length === 0) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const groups: any[] = [];
  
  let currentGroup: any[] = [];
  let currentIntervalStart = events[0]?.timestamp || 0;
  
  for (const event of events) {
    if (event.timestamp - currentIntervalStart >= intervalMs) {
      if (currentGroup.length > 0) {
        groups.push({
          timeInterval: `${formatTimestamp(currentIntervalStart)}-${formatTimestamp(currentIntervalStart + intervalMs)}`,
          startTimestamp: currentIntervalStart,
          endTimestamp: currentIntervalStart + intervalMs,
          events: currentGroup,
          eventCount: currentGroup.length,
          hasEvolutions: currentGroup.some(e => e.isEvolution)
        });
      }
      currentGroup = [event];
      currentIntervalStart = event.timestamp;
    } else {
      currentGroup.push(event);
    }
  }
  
  // Add final group
  if (currentGroup.length > 0) {
    groups.push({
      timeInterval: `${formatTimestamp(currentIntervalStart)}-${formatTimestamp(currentIntervalStart + intervalMs)}`,
      startTimestamp: currentIntervalStart,
      endTimestamp: currentIntervalStart + intervalMs,
      events: currentGroup,
      eventCount: currentGroup.length,
      hasEvolutions: currentGroup.some(e => e.isEvolution)
    });
  }
  
  return groups;
}