/**
 * Item Timeline Data Processing Utilities
 * 
 * This module provides functions to process and transform League of Legends
 * timeline data into structured item purchase/sale/destruction events for
 * individual players, with support for evolution detection and time formatting.
 */

import {
  RawTimelineData,
  RawTimelineEvent,
  ItemTimelineEvent,
  PlayerItemTimeline,
  ProcessedItemTimeline,
  TimelineProcessingOptions,
  TimelineProcessingError,
  ItemEventType,
  SupportItemEvolution,
  SUPPORT_ITEM_EVOLUTIONS,
  TimelineEventGroup,
  ItemTimelineDisplayConfig
} from '@/lib/types/item-timeline';
import { formatMillisecondsToTime } from '@/lib/utils/match-timeline-utils';

/**
 * Convert milliseconds timestamp to MM:SS format
 * @deprecated Use formatMillisecondsToTime from match-timeline-utils instead
 */
export function formatTimestamp(milliseconds: number): string {
  return formatMillisecondsToTime(milliseconds);
}

/**
 * Convert milliseconds to seconds
 */
export function millisecondsToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

/**
 * Check if an item ID is a support item that can evolve
 */
export function isSupportItem(itemId: number): boolean {
  return itemId in SUPPORT_ITEM_EVOLUTIONS;
}

/**
 * Get support item evolution information
 */
export function getSupportItemEvolution(itemId: number): SupportItemEvolution | null {
  return SUPPORT_ITEM_EVOLUTIONS[itemId] || null;
}

/**
 * Detect if an item purchase is part of a support item evolution chain
 */
export function detectItemEvolution(
  currentEvent: RawTimelineEvent,
  previousEvents: ItemTimelineEvent[]
): { isEvolution: boolean; evolutionChain?: SupportItemEvolution } {
  if (!currentEvent.itemId || currentEvent.type !== 'ITEM_PURCHASED') {
    return { isEvolution: false };
  }

  const evolution = getSupportItemEvolution(currentEvent.itemId);
  if (!evolution) {
    return { isEvolution: false };
  }

  // Check if this is the first item in the chain (base item)
  if (evolution.stage === 'base') {
    return { isEvolution: true, evolutionChain: evolution };
  }

  // For evolved items, check if the previous item in the chain was purchased
  const previousItemId = evolution.fromItemId;
  const hasPrerequisite = previousEvents.some(event => 
    event.itemId === previousItemId && 
    event.type === 'ITEM_PURCHASED' &&
    !previousEvents.some(laterEvent => 
      laterEvent.itemId === previousItemId && 
      laterEvent.type === 'ITEM_SOLD' &&
      laterEvent.timestamp > event.timestamp
    )
  );

  if (hasPrerequisite) {
    return { 
      isEvolution: true, 
      evolutionChain: evolution 
    };
  } else {
    return { 
      isEvolution: false 
    };
  }
}

/**
 * Filter timeline events for item-related events only
 */
export function filterItemEvents(events: RawTimelineEvent[]): RawTimelineEvent[] {
  const itemEventTypes: ItemEventType[] = ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_DESTROYED', 'ITEM_UNDO'];
  
  return events.filter(event => 
    itemEventTypes.includes(event.type as ItemEventType) &&
    event.itemId !== undefined &&
    event.itemId !== 0 &&
    event.participantId !== undefined
  );
}

/**
 * Filter events for a specific participant
 */
export function filterEventsForParticipant(
  events: RawTimelineEvent[], 
  participantId: number
): RawTimelineEvent[] {
  // Convert 0-indexed participantId to 1-indexed for Riot API
  const riotParticipantId = participantId + 1;
  
  return events.filter(event => event.participantId === riotParticipantId);
}

/**
 * Transform raw timeline event to processed item timeline event
 */
export function transformTimelineEvent(
  rawEvent: RawTimelineEvent,
  previousEvents: ItemTimelineEvent[] = [],
  options: TimelineProcessingOptions
): ItemTimelineEvent | null {
  if (!rawEvent.itemId || !rawEvent.participantId) {
    return null;
  }

  // Detect evolution if enabled
  let isEvolution = false;
  let evolutionChain: SupportItemEvolution | undefined;
  
  if (options.detectEvolutions !== false) {
    const evolutionResult = detectItemEvolution(rawEvent, previousEvents);
    isEvolution = evolutionResult.isEvolution;
    evolutionChain = evolutionResult.evolutionChain;
  }

  // Format timestamp based on options
  let timeFormatted: string;
  switch (options.timeFormat) {
    case 'seconds':
      timeFormatted = millisecondsToSeconds(rawEvent.timestamp).toString();
      break;
    case 'milliseconds':
      timeFormatted = rawEvent.timestamp.toString();
      break;
    case 'MM:SS':
    default:
      timeFormatted = formatTimestamp(rawEvent.timestamp);
      break;
  }

  const baseEvent: ItemTimelineEvent = {
    type: rawEvent.type as ItemEventType,
    timestamp: rawEvent.timestamp,
    timeFormatted,
    participantId: rawEvent.participantId,
    itemId: rawEvent.itemId,
    isEvolution
  };

  // Only add evolutionChain if it exists to comply with exactOptionalPropertyTypes
  if (evolutionChain) {
    baseEvent.evolutionChain = evolutionChain;
  }

  return baseEvent;
}

/**
 * Process raw timeline data for a specific player
 */
export function processPlayerItemTimeline(
  timelineData: RawTimelineData,
  options: TimelineProcessingOptions
): ProcessedItemTimeline {
  const errors: TimelineProcessingError[] = [];
  const processedEvents: ItemTimelineEvent[] = [];
  
  // Validate selected player ID
  if (options.selectedPlayerId < 0 || options.selectedPlayerId > 9) {
    errors.push({
      type: 'INVALID_PARTICIPANT_ID',
      message: `Invalid participant ID: ${options.selectedPlayerId}. Must be between 0-9.`
    });
    
    return {
      playerTimeline: createEmptyPlayerTimeline(options.selectedPlayerId),
      totalFrames: 0,
      matchDuration: 0,
      processingOptions: options,
      errors
    };
  }

  // Process each frame
  timelineData.info.frames.forEach((frame, frameIndex) => {
    try {
      // Filter for item events
      const itemEvents = filterItemEvents(frame.events);
      
      // Filter for selected participant
      const playerEvents = filterEventsForParticipant(itemEvents, options.selectedPlayerId);
      
      // Transform each event
      playerEvents.forEach((rawEvent, eventIndex) => {
        try {
          const transformedEvent = transformTimelineEvent(
            rawEvent, 
            processedEvents, 
            options
          );
          
          if (transformedEvent) {
            processedEvents.push(transformedEvent);
          }
        } catch (error) {
          const errorObj: TimelineProcessingError = {
            type: 'INVALID_TIMESTAMP',
            message: `Failed to process event at frame ${frameIndex}, event ${eventIndex}: ${error}`,
            frameIndex,
            eventIndex
          };
          
          // Only add optional properties if they have defined values
          if (rawEvent.itemId !== undefined) {
            errorObj.itemId = rawEvent.itemId;
          }
          if (rawEvent.participantId !== undefined) {
            errorObj.participantId = rawEvent.participantId;
          }
          
          errors.push(errorObj);
        }
      });
    } catch (error) {
      errors.push({
        type: 'MISSING_ITEM_DATA',
        message: `Failed to process frame ${frameIndex}: ${error}`,
        frameIndex
      });
    }
  });

  // Sort events by timestamp
  processedEvents.sort((a, b) => a.timestamp - b.timestamp);

  // Group consecutive events if enabled
  const finalEvents = options.groupConsecutiveEvents 
    ? groupConsecutiveEvents(processedEvents)
    : processedEvents;

  // Filter out undo events if not included
  const filteredEvents = options.includeUndoEvents 
    ? finalEvents 
    : finalEvents.filter(event => event.type !== 'ITEM_UNDO');

  // Calculate statistics
  const purchaseEvents = filteredEvents.filter(e => e.type === 'ITEM_PURCHASED');
  const saleEvents = filteredEvents.filter(e => e.type === 'ITEM_SOLD');
  const destructionEvents = filteredEvents.filter(e => e.type === 'ITEM_DESTROYED');
  const evolutionEvents = filteredEvents.filter(e => e.isEvolution);

  const playerTimeline: PlayerItemTimeline = {
    playerId: options.selectedPlayerId,
    participantId: options.selectedPlayerId + 1,
    events: filteredEvents,
    totalPurchases: purchaseEvents.length,
    totalSales: saleEvents.length,
    totalDestructions: destructionEvents.length,
    supportItemEvolutions: evolutionEvents
  };

  // Only add optional timestamp properties if they have values
  if (purchaseEvents.length > 0) {
    const firstPurchase = purchaseEvents[0];
    const lastPurchase = purchaseEvents[purchaseEvents.length - 1];
    
    if (firstPurchase) {
      playerTimeline.firstItemTimestamp = firstPurchase.timestamp;
    }
    if (lastPurchase) {
      playerTimeline.finalBuildTimestamp = lastPurchase.timestamp;
    }
  }

  const lastFrame = timelineData.info.frames[timelineData.info.frames.length - 1];
  const matchDuration = lastFrame ? lastFrame.timestamp : 0;

  return {
    playerTimeline,
    totalFrames: timelineData.info.frames.length,
    matchDuration,
    processingOptions: options,
    errors
  };
}

/**
 * Group consecutive events that happen at the same timestamp
 */
export function groupConsecutiveEvents(events: ItemTimelineEvent[]): ItemTimelineEvent[] {
  if (events.length <= 1) return events;

  const grouped: ItemTimelineEvent[] = [];
  const firstEvent = events[0];
  if (!firstEvent) return events;
  
  let currentGroup: ItemTimelineEvent[] = [firstEvent];

  for (let i = 1; i < events.length; i++) {
    const currentEvent = events[i];
    const lastInGroup = currentGroup[currentGroup.length - 1];

    if (!currentEvent || !lastInGroup) continue;

    // If timestamps are the same (within 1 second), add to current group
    if (Math.abs(currentEvent.timestamp - lastInGroup.timestamp) <= 1000) {
      currentGroup.push(currentEvent);
    } else {
      // Process current group and start new one
      grouped.push(...processEventGroup(currentGroup));
      currentGroup = [currentEvent];
    }
  }

  // Process final group
  grouped.push(...processEventGroup(currentGroup));

  return grouped;
}

/**
 * Process a group of events that occurred at the same time
 * Handles item replacements and upgrades intelligently
 */
function processEventGroup(eventGroup: ItemTimelineEvent[]): ItemTimelineEvent[] {
  if (eventGroup.length === 1) return eventGroup;

  // Sort by event type priority: SOLD -> PURCHASED -> DESTROYED
  const eventTypePriority = {
    'ITEM_SOLD': 1,
    'ITEM_PURCHASED': 2,
    'ITEM_DESTROYED': 3,
    'ITEM_UNDO': 4
  };

  return eventGroup.sort((a, b) => 
    eventTypePriority[a.type] - eventTypePriority[b.type]
  );
}

/**
 * Create empty player timeline for error cases
 */
function createEmptyPlayerTimeline(playerId: number): PlayerItemTimeline {
  return {
    playerId,
    participantId: playerId + 1,
    events: [],
    totalPurchases: 0,
    totalSales: 0,
    totalDestructions: 0,
    supportItemEvolutions: [],
  };
}

/**
 * Group timeline events by time intervals for display
 */
export function groupEventsByTimeInterval(
  events: ItemTimelineEvent[],
  intervalMinutes: number = 1
): TimelineEventGroup[] {
  if (events.length === 0) return [];

  const intervalMs = intervalMinutes * 60 * 1000;
  const groups: TimelineEventGroup[] = [];
  
  // Find the earliest timestamp to establish intervals
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  
  if (!firstEvent || !lastEvent) return [];
  
  const firstTimestamp = firstEvent.timestamp;
  const lastTimestamp = lastEvent.timestamp;
  
  // Create interval groups
  for (let timestamp = firstTimestamp; timestamp <= lastTimestamp; timestamp += intervalMs) {
    const intervalStart = timestamp;
    const intervalEnd = timestamp + intervalMs;
    
    const intervalEvents = events.filter(event => 
      event.timestamp >= intervalStart && event.timestamp < intervalEnd
    );
    
    if (intervalEvents.length > 0) {
      const startFormatted = formatTimestamp(intervalStart);
      const endFormatted = formatTimestamp(intervalEnd);
      
      groups.push({
        timeInterval: `${startFormatted}-${endFormatted}`,
        startTimestamp: intervalStart,
        endTimestamp: intervalEnd,
        events: intervalEvents,
        eventCount: intervalEvents.length,
        hasEvolutions: intervalEvents.some(e => e.isEvolution)
      });
    }
  }
  
  return groups;
}

/**
 * Create default processing options
 */
export function createDefaultProcessingOptions(
  selectedPlayerId: number
): TimelineProcessingOptions {
  return {
    selectedPlayerId,
    includeUndoEvents: false,
    groupConsecutiveEvents: true,
    detectEvolutions: true,
    timeFormat: 'MM:SS'
  };
}

/**
 * Create default display configuration
 */
export function createDefaultDisplayConfig(): ItemTimelineDisplayConfig {
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