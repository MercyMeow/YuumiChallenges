/**
 * Match Timeline Utility Functions
 *
 * Comprehensive TypeScript utilities for League of Legends match timeline processing,
 * including advanced time formatting and support item detection system.
 *
 * @module MatchTimelineUtils
 * @version 1.0.0
 */

import {
  SUPPORT_EVOLUTIONS,
  EvolutionStage,
  RawTimelineData,
  RawTimelineEvent,
  RawTimelineFrame,
} from '@/lib/types/item-timeline-new';

const TIMELINE_DEBUG_ENABLED = process.env.NEXT_PUBLIC_TIMELINE_DEBUG === '1';
const timelineDebug: Pick<Console, 'group' | 'groupEnd' | 'log' | 'warn'> =
  TIMELINE_DEBUG_ENABLED
    ? console
    : {
        group: () => undefined,
        groupEnd: () => undefined,
        log: () => undefined,
        warn: () => undefined,
      };

// =============================================
// TIME FORMATTING UTILITIES
// =============================================

/**
 * Configuration options for time formatting functions
 */
export interface TimeFormatOptions {
  /** Whether to show leading zero for minutes < 10 (e.g., "01:05" vs "1:05") */
  padMinutes?: boolean;
  /** Custom separator between minutes and seconds */
  separator?: string;
  /** Maximum value to display before showing overflow indicator */
  maxMinutes?: number;
  /** String to show when time exceeds maxMinutes */
  overflowText?: string;
}

/**
 * Default time formatting options
 */
const DEFAULT_TIME_OPTIONS: Required<TimeFormatOptions> = {
  padMinutes: false,
  separator: ':',
  maxMinutes: 999,
  overflowText: '999:59+',
};

/**
 * Convert milliseconds to MM:SS format with comprehensive error handling
 *
 * @param milliseconds - Time in milliseconds (can be negative, null, or undefined)
 * @param options - Formatting options
 * @returns Formatted time string (e.g., "1:05", "65:42")
 *
 * @example
 * ```typescript
 * formatMillisecondsToTime(65000) // "1:05"
 * formatMillisecondsToTime(125000) // "2:05"
 * formatMillisecondsToTime(-1000) // "0:00"
 * formatMillisecondsToTime(null) // "0:00"
 * formatMillisecondsToTime(3665000, { padMinutes: true }) // "61:05"
 * ```
 */
export function formatMillisecondsToTime(
  milliseconds: number | null | undefined,
  options: TimeFormatOptions = {}
): string {
  const opts = { ...DEFAULT_TIME_OPTIONS, ...options };

  // Handle edge cases
  if (milliseconds == null || isNaN(milliseconds) || milliseconds < 0) {
    return `0${opts.separator}00`;
  }

  // Handle very large numbers that might cause overflow
  if (milliseconds > Number.MAX_SAFE_INTEGER) {
    return opts.overflowText;
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Handle maximum minutes overflow
  if (minutes > opts.maxMinutes) {
    return opts.overflowText;
  }

  const minutesStr = opts.padMinutes
    ? minutes.toString().padStart(2, '0')
    : minutes.toString();
  const secondsStr = seconds.toString().padStart(2, '0');

  return `${minutesStr}${opts.separator}${secondsStr}`;
}

/**
 * Convert seconds to MM:SS format with comprehensive error handling
 *
 * @param seconds - Time in seconds (can be negative, null, or undefined)
 * @param options - Formatting options
 * @returns Formatted time string (e.g., "1:05", "65:42")
 *
 * @example
 * ```typescript
 * formatSecondsToTime(65) // "1:05"
 * formatSecondsToTime(125) // "2:05"
 * formatSecondsToTime(-10) // "0:00"
 * formatSecondsToTime(null) // "0:00"
 * formatSecondsToTime(3665, { separator: 'm ' }) // "61m 05"
 * ```
 */
export function formatSecondsToTime(
  seconds: number | null | undefined,
  options: TimeFormatOptions = {}
): string {
  const opts = { ...DEFAULT_TIME_OPTIONS, ...options };

  // Handle edge cases
  if (seconds == null || isNaN(seconds) || seconds < 0) {
    return `0${opts.separator}00`;
  }

  // Handle very large numbers
  if (seconds > Number.MAX_SAFE_INTEGER / 1000) {
    return opts.overflowText;
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  // Handle maximum minutes overflow
  if (minutes > opts.maxMinutes) {
    return opts.overflowText;
  }

  const minutesStr = opts.padMinutes
    ? minutes.toString().padStart(2, '0')
    : minutes.toString();
  const secondsStr = remainingSeconds.toString().padStart(2, '0');

  return `${minutesStr}${opts.separator}${secondsStr}`;
}

/**
 * Parse MM:SS format back to milliseconds
 *
 * @param timeString - Time string in MM:SS format
 * @returns Milliseconds or null if parsing fails
 *
 * @example
 * ```typescript
 * parseTimeToMilliseconds("1:05") // 65000
 * parseTimeToMilliseconds("65:42") // 3942000
 * parseTimeToMilliseconds("invalid") // null
 * ```
 */
export function parseTimeToMilliseconds(timeString: string): number | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const parts = timeString.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (
    isNaN(minutes) ||
    isNaN(seconds) ||
    seconds >= 60 ||
    seconds < 0 ||
    minutes < 0
  ) {
    return null;
  }

  return (minutes * 60 + seconds) * 1000;
}

/**
 * Get human-readable duration between two timestamps
 *
 * @param startMs - Start time in milliseconds
 * @param endMs - End time in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * getDurationBetween(0, 65000) // "1:05"
 * getDurationBetween(65000, 125000) // "1:00"
 * ```
 */
export function getDurationBetween(
  startMs: number,
  endMs: number,
  options: TimeFormatOptions = {}
): string {
  const duration = Math.max(0, endMs - startMs);
  return formatMillisecondsToTime(duration, options);
}

// =============================================
// SUPPORT ITEM DETECTION UTILITIES
// =============================================

/**
 * Support item tier stages
 */
export type SupportItemTier = EvolutionStage;

/**
 * Support item evolution chain types
 */
export type SupportItemChainType =
  | 'world_atlas'
  | 'relic'
  | 'steel'
  | 'spectral_sickle'
  | 'spectral_spellthief';

/**
 * Support item completion information
 */
export interface SupportItemCompletion {
  /** Whether the item is a support item */
  isSupportItem: boolean;
  /** Current tier of the support item */
  tier: SupportItemTier | null;
  /** Evolution chain type */
  chainType: SupportItemChainType | null;
  /** Whether this is the final evolution */
  isFinalEvolution: boolean;
  /** Next item ID in the evolution chain (0 if final) */
  nextItemId: number;
  /** Chain name for display */
  chainName: string | null;
  /** Completion percentage (0-100) */
  completionPercentage: number;
}

export type SupportItemCompletionTimes = Record<SupportItemTier, number | null>;

export interface SupportPlayerInfo {
  readonly participantId?: number;
  readonly riotIdGameName?: string;
  readonly summonerName?: string;
  readonly [key: string]: unknown;
}

export interface SupportTimelineEvent
  extends Pick<RawTimelineEvent, 'type' | 'timestamp' | 'participantId'> {
  readonly itemId?: number | null;
  readonly [key: string]: unknown;
}

type SupportTimelineEventWithItemId = SupportTimelineEvent & {
  readonly itemId: number;
};

/**
 * Fast lookup map for support items (for O(1) performance)
 */
const SUPPORT_ITEM_LOOKUP = new Set(
  Object.keys(SUPPORT_EVOLUTIONS).map(Number)
);

/**
 * Tier mapping for completion percentage calculation
 */
const TIER_COMPLETION_MAP: Record<SupportItemTier, number> = {
  base: 25,
  tier1: 50,
  tier2: 75,
  tier3: 100,
};

/**
 * Check if an item ID is a support item (O(1) lookup)
 *
 * @param itemId - Item ID to check
 * @returns True if the item is a support item
 *
 * @example
 * ```typescript
 * isSupportItem(3850) // true (Relic Shield)
 * isSupportItem(1001) // false (Boots)
 * isSupportItem(null) // false
 * ```
 */
export function isSupportItem(itemId: number | null | undefined): boolean {
  if (itemId == null || itemId === 0) {
    return false;
  }

  return SUPPORT_ITEM_LOOKUP.has(itemId);
}

/**
 * Get support item completion stage with detailed information
 *
 * @param itemId - Item ID to analyze
 * @returns Detailed support item completion information
 *
 * @example
 * ```typescript
 * getSupportItemCompletion(3850) // { isSupportItem: true, tier: 'base', chainType: 'relic', ... }
 * getSupportItemCompletion(3853) // { isSupportItem: true, tier: 'tier2', isFinalEvolution: true, ... }
 * getSupportItemCompletion(1001) // { isSupportItem: false, tier: null, ... }
 * ```
 */
export function getSupportItemCompletion(
  itemId: number | null | undefined
): SupportItemCompletion {
  const defaultResult: SupportItemCompletion = {
    isSupportItem: false,
    tier: null,
    chainType: null,
    isFinalEvolution: false,
    nextItemId: 0,
    chainName: null,
    completionPercentage: 0,
  };

  if (!isSupportItem(itemId)) {
    return defaultResult;
  }

  const evolution = SUPPORT_EVOLUTIONS[itemId!];
  if (!evolution) {
    return defaultResult;
  }

  return {
    isSupportItem: true,
    tier: evolution.stage,
    chainType: 'world_atlas', // All current support items use world atlas system
    isFinalEvolution: evolution.stage === 'tier3',
    nextItemId: 0, // Simplified - we don't track next item IDs
    chainName: evolution.name,
    completionPercentage: TIER_COMPLETION_MAP[evolution.stage],
  };
}

/**
 * Get the next evolution item ID in the support item chain
 *
 * @param itemId - Current item ID
 * @returns Next item ID in evolution chain, or 0 if final evolution
 *
 * @example
 * ```typescript
 * getNextEvolutionItemId(3850) // 3851 (Relic Shield -> Spectral Sickle)
 * getNextEvolutionItemId(3853) // 0 (Pauldrons is final)
 * getNextEvolutionItemId(1001) // 0 (not a support item)
 * ```
 */
export function getNextEvolutionItemId(
  itemId: number | null | undefined
): number {
  if (!isSupportItem(itemId)) {
    return 0;
  }

  // Simplified: since we don't track next item IDs in the new system, just return 0
  return 0;
}

/**
 * Detect when a support item reaches its final evolution
 *
 * @param itemId - Item ID to check
 * @returns True if this is the final evolution of a support item
 *
 * @example
 * ```typescript
 * isFinalSupportItemEvolution(3853) // true (Pauldrons of Whiterock)
 * isFinalSupportItemEvolution(3857) // true (Bulwark of the Mountain)
 * isFinalSupportItemEvolution(3850) // false (Relic Shield - base item)
 * isFinalSupportItemEvolution(1001) // false (not a support item)
 * ```
 */
export function isFinalSupportItemEvolution(
  itemId: number | null | undefined
): boolean {
  const completion = getSupportItemCompletion(itemId);
  return completion.isSupportItem && completion.isFinalEvolution;
}

/**
 * Get all items in a support item evolution chain
 *
 * @param itemId - Any item ID in the chain
 * @returns Array of all item IDs in the evolution chain, ordered from base to final
 *
 * @example
 * ```typescript
 * getSupportItemChain(3851) // [3850, 3851, 3853] (Relic Shield chain)
 * getSupportItemChain(3857) // [3854, 3855, 3857] (Steel Shoulderguards chain)
 * getSupportItemChain(1001) // [] (not a support item)
 * ```
 */
export function getSupportItemChain(
  itemId: number | null | undefined
): number[] {
  if (!isSupportItem(itemId)) {
    return [];
  }

  const evolution = SUPPORT_EVOLUTIONS[itemId!];
  if (!evolution) {
    return [];
  }

  // Find all items (simplified - all use world atlas chain now)
  const chainItems = Object.entries(SUPPORT_EVOLUTIONS)
    .map(([id, evo]) => ({ id: Number(id), stage: evo.stage }))
    .sort((a, b) => {
      // Sort by dependency chain
      const stageOrder = { base: 0, tier1: 1, tier2: 2, tier3: 3 };
      return stageOrder[a.stage] - stageOrder[b.stage];
    });

  return chainItems.map((item) => item.id);
}

function createEmptyCompletionTimes(): SupportItemCompletionTimes {
  return {
    base: null,
    tier1: null,
    tier2: null,
    tier3: null,
  };
}

function hasNumericItemId(
  event: SupportTimelineEvent
): event is SupportTimelineEventWithItemId {
  return typeof event.itemId === 'number';
}

function detectSupportItemCompletionQuiet(
  playerData: SupportPlayerInfo | null | undefined,
  timelineEvents: ReadonlyArray<SupportTimelineEvent>,
  participantId?: number
): SupportItemCompletionTimes {
  const playerParticipantId =
    typeof playerData?.participantId === 'number'
      ? playerData.participantId
      : undefined;
  const targetParticipantId =
    typeof participantId === 'number' ? participantId : playerParticipantId;
  const eventsInitial = Array.isArray(timelineEvents) ? timelineEvents : [];
  const eventsForProcessing =
    targetParticipantId !== undefined &&
    eventsInitial.some((event) => typeof event.participantId === 'number')
      ? eventsInitial.filter(
          (event) => event.participantId === targetParticipantId
        )
      : eventsInitial;

  const completionTimes = createEmptyCompletionTimes();
  if (eventsForProcessing.length === 0) {
    return completionTimes;
  }

  const supportItemEvents = eventsForProcessing
    .filter(hasNumericItemId)
    .filter(
      (event) =>
        isSupportItem(event.itemId) &&
        (event.type === 'ITEM_PURCHASED' || event.type === 'ITEM_DESTROYED')
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const evolutionTracker = new Map<SupportItemTier, number>();
  let runicCompassDestructionTime: number | null = null;

  for (const event of supportItemEvents) {
    const completion = getSupportItemCompletion(event.itemId);
    if (!completion.isSupportItem || !completion.tier) {
      continue;
    }

    const currentTierTime = evolutionTracker.get(completion.tier);
    if (event.type === 'ITEM_DESTROYED' && event.itemId === 3866) {
      runicCompassDestructionTime = event.timestamp;
    }

    if (
      event.type === 'ITEM_PURCHASED' &&
      (!currentTierTime || event.timestamp < currentTierTime)
    ) {
      evolutionTracker.set(completion.tier, event.timestamp);
    }
  }

  if (runicCompassDestructionTime !== null) {
    evolutionTracker.set('tier2', runicCompassDestructionTime);
  }

  evolutionTracker.forEach((timestamp, tier) => {
    const currentValue = completionTimes[tier];
    if (currentValue === null || timestamp < currentValue) {
      completionTimes[tier] = timestamp;
    }
  });

  return completionTimes;
}

/**
 * Calculate support item completion time from timeline data
 *
 * @param playerData - Player data from match
 * @param timelineEvents - Timeline events (will be filtered for the specific player)
 * @param participantId - Optional participant ID to filter events (1-indexed, if not provided uses playerData)
 * @returns Object with completion times for different tiers
 *
 * @example
 * ```typescript
 * const completionTimes = detectSupportItemCompletion(selectedPlayerData, playerTimeline.events);
 * // { tier1: 180000, tier2: 420000, tier3: null } // 3:00 and 7:00 completion times
 * ```
 */
export function detectSupportItemCompletion(
  playerData: SupportPlayerInfo | null | undefined,
  timelineEvents: ReadonlyArray<SupportTimelineEvent>,
  participantId?: number
): SupportItemCompletionTimes {
  if (!TIMELINE_DEBUG_ENABLED) {
    return detectSupportItemCompletionQuiet(
      playerData,
      timelineEvents,
      participantId
    );
  }

  timelineDebug.group(
    '🔍 [SUPPORT QUEST DEBUG] detectSupportItemCompletion called'
  );

  const playerParticipantId =
    typeof playerData?.participantId === 'number'
      ? playerData.participantId
      : undefined;
  const targetParticipantId =
    typeof participantId === 'number' ? participantId : playerParticipantId;
  const eventsInitial = Array.isArray(timelineEvents)
    ? [...timelineEvents]
    : [];

  timelineDebug.log('📥 INPUT PARAMETERS:', {
    playerDataExists: Boolean(playerData),
    playerDataKeys: playerData
      ? Object.keys(playerData as Record<string, unknown>)
      : null,
    playerName:
      (playerData?.riotIdGameName as string | undefined) ||
      (playerData?.summonerName as string | undefined) ||
      'Unknown',
    targetParticipantId,
    providedParticipantId: participantId,
    playerDataParticipantId: playerParticipantId,
    timelineEventsLength: eventsInitial.length,
    timelineEventsType: typeof timelineEvents,
    isArray: Array.isArray(timelineEvents),
  });

  let eventsForProcessing = eventsInitial;

  if (
    targetParticipantId !== undefined &&
    eventsInitial.some((event) => typeof event.participantId === 'number')
  ) {
    const beforeFilterCount = eventsInitial.length;
    eventsForProcessing = eventsInitial.filter(
      (event) => event.participantId === targetParticipantId
    );
    timelineDebug.log('🔍 PARTICIPANT FILTERING:', {
      targetParticipantId,
      beforeFilter: beforeFilterCount,
      afterFilter: eventsForProcessing.length,
      allParticipantIds: [
        ...new Set(
          eventsInitial
            .map((event) => event.participantId)
            .filter((id): id is number => typeof id === 'number')
        ),
      ],
      filteredSample: eventsForProcessing.slice(0, 3).map((event) => ({
        type: event.type,
        itemId: event.itemId ?? null,
        participantId: event.participantId ?? null,
        timestamp: event.timestamp,
      })),
    });
  } else {
    timelineDebug.log(
      '⚠️ No participant filtering - using all events (may be pre-filtered)'
    );
  }

  if (eventsForProcessing.length > 0) {
    timelineDebug.log(
      '📋 SAMPLE TIMELINE EVENTS (first 5):',
      eventsForProcessing.slice(0, 5).map((event, index) => ({
        index,
        type: event.type,
        itemId: event.itemId ?? null,
        timestamp: event.timestamp,
        timeFormatted: formatMillisecondsToTime(event.timestamp),
        hasRequiredFields:
          typeof event.type === 'string' &&
          typeof event.itemId === 'number' &&
          typeof event.timestamp === 'number',
      }))
    );
  }

  const completionTimes = createEmptyCompletionTimes();

  if (eventsForProcessing.length === 0) {
    timelineDebug.warn(
      '⚠️ No timeline events provided - returning empty completion times'
    );
    timelineDebug.groupEnd();
    return completionTimes;
  }

  // 2. LOG ITEM FILTERING - Check what item IDs are found
  timelineDebug.group('🔎 ITEM FILTERING ANALYSIS');

  const allEventTypes = [
    ...new Set(eventsForProcessing.map((event) => event.type)),
  ];
  timelineDebug.log('📊 ALL EVENT TYPES:', allEventTypes);

  const eventsWithItemId = eventsForProcessing.filter(hasNumericItemId);
  const allItemIds = [
    ...new Set(eventsWithItemId.map((event) => event.itemId)),
  ];
  timelineDebug.log(
    '🏷️ ALL UNIQUE ITEM IDs:',
    [...allItemIds].sort((a, b) => a - b)
  );

  // **FIX: Track both purchases AND destructions for support items**
  const purchaseEvents = eventsWithItemId.filter(
    (event) => event.type === 'ITEM_PURCHASED'
  );
  const destructionEvents = eventsWithItemId.filter(
    (event) => event.type === 'ITEM_DESTROYED'
  );

  timelineDebug.log('🛒 PURCHASE EVENTS:', {
    count: purchaseEvents.length,
    itemIds: purchaseEvents.map((event) => event.itemId).sort((a, b) => a - b),
  });

  timelineDebug.log('💥 DESTRUCTION EVENTS:', {
    count: destructionEvents.length,
    itemIds: destructionEvents
      .map((event) => event.itemId)
      .sort((a, b) => a - b),
  });

  // Log events by type for debugging
  const eventsByType = allEventTypes.reduce<Record<string, number>>(
    (acc, type) => {
      acc[type] = eventsForProcessing.filter(
        (event) => event.type === type
      ).length;
      return acc;
    },
    {}
  );
  timelineDebug.log('📈 EVENTS BY TYPE:', eventsByType);

  timelineDebug.groupEnd();

  // 3. LOG SUPPORT ITEM DETECTION
  timelineDebug.group('🛡️ SUPPORT ITEM DETECTION');

  // Test current World Atlas support items
  timelineDebug.log('🌍 TESTING CURRENT WORLD ATLAS ITEMS:');
  const currentWorldAtlasItems = [
    3865, 3866, 3867, 3869, 3870, 3871, 3876, 3877,
  ];
  currentWorldAtlasItems.forEach((itemId) => {
    const completion = getSupportItemCompletion(itemId);
    const inTimeline = allItemIds.includes(itemId);
    const eventsForThisItem = eventsWithItemId.filter(
      (event) => event.itemId === itemId
    );
    timelineDebug.log(
      `  Item ${itemId} (${completion.chainName || 'Unknown'}):`,
      {
        isSupportItem: completion.isSupportItem,
        tier: completion.tier,
        chainType: completion.chainType,
        inTimeline,
        eventCount: eventsForThisItem.length,
        ...(eventsForThisItem.length > 0 && {
          eventDetails: eventsForThisItem.map((event) => ({
            type: event.type,
            timestamp: event.timestamp,
            timeFormatted: formatMillisecondsToTime(event.timestamp),
          })),
        }),
      }
    );
  });

  // Check which items in timeline are support items
  const supportItemsInTimeline = allItemIds.filter((itemId) =>
    isSupportItem(itemId)
  );
  timelineDebug.log(
    '✅ SUPPORT ITEMS FOUND IN TIMELINE:',
    supportItemsInTimeline.map((itemId) => {
      const completion = getSupportItemCompletion(itemId);
      const eventCount = eventsWithItemId.filter(
        (event) => event.itemId === itemId
      ).length;
      return {
        itemId,
        tier: completion.tier,
        chainName: completion.chainName,
        chainType: completion.chainType,
        eventCount,
      };
    })
  );

  if (supportItemsInTimeline.length === 0) {
    timelineDebug.warn('⚠️ NO SUPPORT ITEMS FOUND IN TIMELINE');
  }

  // Test if the support item lookup is working correctly
  timelineDebug.log('🔍 SUPPORT ITEM LOOKUP TEST:');
  timelineDebug.log('  SUPPORT_ITEM_LOOKUP size:', SUPPORT_ITEM_LOOKUP.size);
  timelineDebug.log(
    '  Known support items:',
    Array.from(SUPPORT_ITEM_LOOKUP).sort((a, b) => a - b)
  );

  // Test specific item from the match data (3871 - Zaz'Zak's Realmspike)
  if (allItemIds.includes(3871)) {
    timelineDebug.log("🎯 SPECIFIC TEST - Item 3871 (Zaz'Zak's Realmspike):");
    const item3871Completion = getSupportItemCompletion(3871);
    const item3871Events = eventsWithItemId.filter(
      (event) => event.itemId === 3871
    );
    timelineDebug.log('  Completion data:', item3871Completion);
    timelineDebug.log(
      '  Timeline events:',
      item3871Events.map((event) => ({
        type: event.type,
        timestamp: event.timestamp,
        timeFormatted: formatMillisecondsToTime(event.timestamp),
      }))
    );
  }

  timelineDebug.groupEnd();

  // **FIX: Enhanced timeline processing to handle evolution properly**
  timelineDebug.group('⏱️ ENHANCED TIMELINE PROCESSING');

  // Get all support item related events (purchases, destructions, evolution markers)
  const supportItemEvents = eventsWithItemId
    .filter(
      (event) =>
        isSupportItem(event.itemId) &&
        (event.type === 'ITEM_PURCHASED' || event.type === 'ITEM_DESTROYED')
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  timelineDebug.log(
    '🛡️ ALL SUPPORT ITEM EVENTS (chronological):',
    supportItemEvents.length
  );

  // Create evolution tracking map
  const evolutionTracker = new Map<SupportItemTier, number>();

  // **ENHANCED: Specifically track Runic Compass (3866) destruction as quest completion**
  let runicCompassDestructionTime: number | null = null;

  // Process events to detect tier completions
  for (const event of supportItemEvents) {
    const completion = getSupportItemCompletion(event.itemId);

    if (!completion.isSupportItem || !completion.tier) continue;

    const currentTierTime = evolutionTracker.get(completion.tier);

    timelineDebug.log(
      `📦 Processing ${event.type} of ${event.itemId} (${completion.chainName}, ${completion.tier}) at ${formatMillisecondsToTime(event.timestamp)}`
    );

    // **SPECIAL CASE: Runic Compass (3866) destruction indicates quest completion**
    if (event.type === 'ITEM_DESTROYED' && event.itemId === 3866) {
      runicCompassDestructionTime = event.timestamp;
      timelineDebug.log(
        `    🏆 QUEST COMPLETION DETECTED: Runic Compass destroyed at ${formatMillisecondsToTime(event.timestamp)}`
      );
    }

    // For purchases: this indicates tier completion
    if (event.type === 'ITEM_PURCHASED') {
      if (!currentTierTime || event.timestamp < currentTierTime) {
        evolutionTracker.set(completion.tier, event.timestamp);
        timelineDebug.log(
          `    ✅ NEW ${completion.tier} completion recorded at ${formatMillisecondsToTime(event.timestamp)}`
        );
      } else {
        timelineDebug.log(
          `    ⏭️ ${completion.tier} already completed earlier at ${formatMillisecondsToTime(currentTierTime)}`
        );
      }
    }

    // For destructions: check if this indicates evolution to next tier
    else if (event.type === 'ITEM_DESTROYED') {
      // Look for immediate purchase of higher tier item
      const nextEvents = supportItemEvents.filter(
        (nextEvent) =>
          nextEvent.timestamp >= event.timestamp &&
          nextEvent.timestamp <= event.timestamp + 1000 && // Within 1 second
          nextEvent.type === 'ITEM_PURCHASED'
      );

      if (nextEvents.length > 0) {
        timelineDebug.log(
          `    🔄 Destruction at ${formatMillisecondsToTime(event.timestamp)} followed by purchases:`,
          nextEvents.map((nextEvent) => {
            const nextCompletion = getSupportItemCompletion(nextEvent.itemId);
            return `${nextEvent.itemId} (${nextCompletion.chainName}, ${nextCompletion.tier}) at ${formatMillisecondsToTime(nextEvent.timestamp)}`;
          })
        );

        // This destruction is part of evolution - the purchase timestamps are more accurate for completion
      } else {
        timelineDebug.log(
          `    💥 Standalone destruction (no immediate evolution detected)`
        );
      }
    }
  }

  // **ENHANCED: If we detected Runic Compass destruction, use it as the primary tier2 completion time**
  if (runicCompassDestructionTime !== null) {
    evolutionTracker.set('tier2', runicCompassDestructionTime);
    timelineDebug.log(
      `🎯 OVERRIDING tier2 completion with Runic Compass destruction time: ${formatMillisecondsToTime(runicCompassDestructionTime)}`
    );
  }

  // Convert evolution tracker to completion times
  evolutionTracker.forEach((timestamp, tier) => {
    const currentValue = completionTimes[tier];
    if (currentValue === null || timestamp < currentValue) {
      completionTimes[tier] = timestamp;
    }
  });

  timelineDebug.log('📊 ENHANCED PROCESSING SUMMARY:', {
    totalSupportItemEvents: supportItemEvents.length,
    evolutionTrackerEntries: evolutionTracker.size,
    detectedCompletions: Object.values(completionTimes).filter(
      (t) => t !== null
    ).length,
  });

  timelineDebug.groupEnd();

  // 5. LOG FINAL RESULT
  timelineDebug.group('🎯 FINAL RESULTS');

  timelineDebug.log('📋 COMPLETION TIMES:', completionTimes);

  const completedTiers = (
    Object.entries(completionTimes) as Array<[SupportItemTier, number | null]>
  )
    .filter(([, timestamp]) => timestamp !== null)
    .map(([tier, timestamp]) => ({
      tier,
      timestamp: timestamp as number,
      timeFormatted: formatMillisecondsToTime(timestamp as number),
    }));

  if (completedTiers.length > 0) {
    timelineDebug.log('✅ COMPLETED TIERS:');
    completedTiers.forEach(({ tier, timestamp, timeFormatted }) => {
      timelineDebug.log(`  ${tier}: ${timeFormatted} (${timestamp}ms)`);
    });
  } else {
    timelineDebug.warn('⚠️ NO SUPPORT QUEST COMPLETIONS DETECTED');
  }

  const uncompletedTiers = (
    Object.entries(completionTimes) as Array<[SupportItemTier, number | null]>
  )
    .filter(([, timestamp]) => timestamp === null)
    .map(([tier]) => tier);

  if (uncompletedTiers.length > 0) {
    timelineDebug.log('❌ UNCOMPLETED TIERS:', uncompletedTiers);
  }

  // Log completion progression
  const progression = [...completedTiers].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  if (progression.length > 1) {
    timelineDebug.log('📈 PROGRESSION TIMELINE:');
    progression.forEach((tier, index) => {
      const nextTier = progression[index + 1];
      const timeBetween = nextTier
        ? formatMillisecondsToTime(nextTier.timestamp - tier.timestamp)
        : 'N/A';
      timelineDebug.log(
        `  ${index + 1}. ${tier.tier} at ${tier.timeFormatted} ${nextTier ? `(+${timeBetween} to next)` : '(final)'}`
      );
    });
  }

  timelineDebug.groupEnd();
  timelineDebug.groupEnd();

  return completionTimes;
}

function detectSupportItemCompletionFromRawQuiet(
  rawTimelineData: RawTimelineData | null | undefined,
  participantId: number
): SupportItemCompletionTimes {
  const completionTimes = createEmptyCompletionTimes();
  const frames = rawTimelineData?.info?.frames;

  if (!Array.isArray(frames) || frames.length === 0) {
    return completionTimes;
  }

  interface TimelineItemEventSummary {
    readonly itemId: number;
    readonly timestamp: number;
    readonly participantId: number;
  }

  const allItemPurchases: TimelineItemEventSummary[] = [];
  const allItemDestructions: TimelineItemEventSummary[] = [];

  frames.forEach((frame: RawTimelineFrame) => {
    const events = Array.isArray(frame.events) ? frame.events : [];
    events.forEach((event: RawTimelineEvent) => {
      if (
        event.participantId !== participantId ||
        typeof event.itemId !== 'number'
      ) {
        return;
      }

      const record: TimelineItemEventSummary = {
        itemId: event.itemId,
        timestamp: event.timestamp,
        participantId: event.participantId ?? participantId,
      };

      if (event.type === 'ITEM_PURCHASED') {
        allItemPurchases.push(record);
      } else if (event.type === 'ITEM_DESTROYED') {
        allItemDestructions.push(record);
      }
    });
  });

  const runicCompassDestruction = allItemDestructions.find(
    (destruction) => destruction.itemId === 3866
  );
  if (runicCompassDestruction) {
    completionTimes.tier2 = runicCompassDestruction.timestamp;
  }

  [...allItemPurchases]
    .filter((purchase) => isSupportItem(purchase.itemId))
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((purchase) => {
      const completion = getSupportItemCompletion(purchase.itemId);

      if (
        completion.isSupportItem &&
        completion.tier &&
        completionTimes[completion.tier] === null
      ) {
        completionTimes[completion.tier] = purchase.timestamp;
      }
    });

  return completionTimes;
}

/**
 * Detect support item completion from raw timeline data
 * This function processes raw timeline data directly to avoid pre-filtering issues
 *
 * @param rawTimelineData - Raw timeline data from Riot API
 * @param participantId - 1-indexed participant ID from Riot API
 * @returns Object with completion times for different tiers
 */
export function detectSupportItemCompletionFromRaw(
  rawTimelineData: RawTimelineData | null | undefined,
  participantId: number
): SupportItemCompletionTimes {
  if (!TIMELINE_DEBUG_ENABLED) {
    return detectSupportItemCompletionFromRawQuiet(
      rawTimelineData,
      participantId
    );
  }

  timelineDebug.group(
    '🔍 [RAW TIMELINE] detectSupportItemCompletionFromRaw called'
  );

  const completionTimes = createEmptyCompletionTimes();
  const frames = rawTimelineData?.info?.frames;

  if (!Array.isArray(frames) || frames.length === 0) {
    timelineDebug.warn('⚠️ No raw timeline data available');
    timelineDebug.groupEnd();
    return completionTimes;
  }

  timelineDebug.log('📥 RAW TIMELINE PROCESSING:', {
    participantId,
    totalFrames: frames.length,
    frameInterval: rawTimelineData?.info?.frameInterval,
  });

  interface TimelineItemEventSummary {
    readonly itemId: number;
    readonly timestamp: number;
    readonly participantId: number;
  }

  const allItemPurchases: TimelineItemEventSummary[] = [];
  const allItemDestructions: TimelineItemEventSummary[] = [];

  // Extract all item purchase and destruction events
  frames.forEach((frame: RawTimelineFrame) => {
    const events = Array.isArray(frame.events) ? frame.events : [];
    events.forEach((event: RawTimelineEvent) => {
      if (event.participantId !== participantId) {
        return;
      }

      if (typeof event.itemId !== 'number') {
        return;
      }

      const record: TimelineItemEventSummary = {
        itemId: event.itemId,
        timestamp: event.timestamp,
        participantId: event.participantId ?? participantId,
      };

      if (event.type === 'ITEM_PURCHASED') {
        allItemPurchases.push(record);
      } else if (event.type === 'ITEM_DESTROYED') {
        allItemDestructions.push(record);
      }
    });
  });

  timelineDebug.log('🛒 RAW ITEM PURCHASES FOUND:', {
    totalPurchases: allItemPurchases.length,
    participantId,
    itemIds: allItemPurchases
      .map((purchase) => purchase.itemId)
      .sort((a, b) => a - b),
    supportItems: allItemPurchases.filter((purchase) =>
      isSupportItem(purchase.itemId)
    ),
    chronological: [...allItemPurchases]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 10)
      .map((purchase) => ({
        itemId: purchase.itemId,
        timestamp: purchase.timestamp,
        timeFormatted: formatMillisecondsToTime(purchase.timestamp),
        isSupportItem: isSupportItem(purchase.itemId),
      })),
  });

  timelineDebug.log('💥 RAW ITEM DESTRUCTIONS FOUND:', {
    totalDestructions: allItemDestructions.length,
    participantId,
    itemIds: allItemDestructions
      .map((destruction) => destruction.itemId)
      .sort((a, b) => a - b),
    supportItems: allItemDestructions.filter((destruction) =>
      isSupportItem(destruction.itemId)
    ),
    runicCompassDestruction: allItemDestructions.find(
      (destruction) => destruction.itemId === 3866
    ),
  });

  // **ENHANCED: Check for Runic Compass (3866) destruction first**
  const runicCompassDestruction = allItemDestructions.find(
    (destruction) => destruction.itemId === 3866
  );
  if (runicCompassDestruction) {
    completionTimes.tier2 = runicCompassDestruction.timestamp;
    timelineDebug.log(
      `🏆 RAW QUEST COMPLETION - Runic Compass destroyed at ${formatMillisecondsToTime(runicCompassDestruction.timestamp)}`
    );
  }

  // Process support item purchases
  [...allItemPurchases]
    .filter((purchase) => isSupportItem(purchase.itemId))
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((purchase) => {
      const completion = getSupportItemCompletion(purchase.itemId);

      if (
        completion.isSupportItem &&
        completion.tier &&
        completionTimes[completion.tier] === null
      ) {
        completionTimes[completion.tier] = purchase.timestamp;
        timelineDebug.log(
          `✅ RAW DETECTION - ${completion.tier} completed at ${formatMillisecondsToTime(purchase.timestamp)} with item ${purchase.itemId} (${completion.chainName})`
        );
      }
    });

  timelineDebug.log('📋 RAW DETECTION RESULTS:', completionTimes);
  timelineDebug.groupEnd();

  return completionTimes;
}

// =============================================
// PARTICIPANT DATA UTILITIES
// =============================================

/**
 * Convert 1-indexed Riot API participant ID to 0-indexed array position
 *
 * @param riotParticipantId - 1-indexed participant ID from Riot API
 * @returns 0-indexed array position (0-9)
 *
 * @example
 * ```typescript
 * riotParticipantIdToArrayIndex(1) // 0
 * riotParticipantIdToArrayIndex(10) // 9
 * riotParticipantIdToArrayIndex(0) // -1 (invalid)
 * ```
 */
export function riotParticipantIdToArrayIndex(
  riotParticipantId: number
): number {
  if (riotParticipantId < 1 || riotParticipantId > 10) {
    return -1; // Invalid participant ID
  }
  return riotParticipantId - 1;
}

/**
 * Convert 0-indexed array position to 1-indexed Riot API participant ID
 *
 * @param arrayIndex - 0-indexed array position (0-9)
 * @returns 1-indexed participant ID for Riot API
 *
 * @example
 * ```typescript
 * arrayIndexToRiotParticipantId(0) // 1
 * arrayIndexToRiotParticipantId(9) // 10
 * arrayIndexToRiotParticipantId(-1) // 0 (invalid)
 * ```
 */
export function arrayIndexToRiotParticipantId(arrayIndex: number): number {
  if (arrayIndex < 0 || arrayIndex > 9) {
    return 0; // Invalid array index
  }
  return arrayIndex + 1;
}

/**
 * Validate participant mapping between different ID systems
 *
 * @param participantId - ID to validate (can be 0-indexed or 1-indexed)
 * @param isRiotId - Whether the ID is from Riot API (1-indexed) or array position (0-indexed)
 * @returns Validation result with corrected IDs
 *
 * @example
 * ```typescript
 * validateParticipantMapping(1, true) // { valid: true, arrayIndex: 0, riotId: 1 }
 * validateParticipantMapping(0, false) // { valid: true, arrayIndex: 0, riotId: 1 }
 * validateParticipantMapping(11, true) // { valid: false, arrayIndex: -1, riotId: 0 }
 * ```
 */
export function validateParticipantMapping(
  participantId: number,
  isRiotId: boolean = false
): { valid: boolean; arrayIndex: number; riotId: number } {
  if (isRiotId) {
    const arrayIndex = riotParticipantIdToArrayIndex(participantId);
    return {
      valid: arrayIndex !== -1,
      arrayIndex,
      riotId: arrayIndex !== -1 ? participantId : 0,
    };
  } else {
    const riotId = arrayIndexToRiotParticipantId(participantId);
    return {
      valid: riotId !== 0,
      arrayIndex: riotId !== 0 ? participantId : -1,
      riotId,
    };
  }
}

// =============================================
// PERFORMANCE OPTIMIZED BATCH OPERATIONS
// =============================================

/**
 * Batch process multiple items for support item detection (memoized for performance)
 */
const supportItemCache = new Map<number, SupportItemCompletion>();

/**
 * Get support item completion information with caching for performance
 *
 * @param itemId - Item ID to analyze
 * @returns Cached support item completion information
 */
export function getSupportItemCompletionCached(
  itemId: number | null | undefined
): SupportItemCompletion {
  if (itemId == null) {
    return getSupportItemCompletion(itemId);
  }

  if (supportItemCache.has(itemId)) {
    return supportItemCache.get(itemId)!;
  }

  const completion = getSupportItemCompletion(itemId);
  supportItemCache.set(itemId, completion);

  return completion;
}

/**
 * Clear the support item cache (useful for testing or memory management)
 */
export function clearSupportItemCache(): void {
  supportItemCache.clear();
}

/**
 * Batch process multiple timeline events for support items
 *
 * @param events - Array of timeline events to process
 * @returns Map of itemId to completion information
 */
export function batchProcessSupportItems<
  T extends { itemId: number | null | undefined },
>(events: ReadonlyArray<T>): Map<number, SupportItemCompletion> {
  const results = new Map<number, SupportItemCompletion>();

  for (const event of events) {
    if (typeof event.itemId !== 'number') {
      continue;
    }

    if (!results.has(event.itemId)) {
      results.set(event.itemId, getSupportItemCompletionCached(event.itemId));
    }
  }

  return results;
}

// =============================================
// TYPE GUARDS AND VALIDATORS
// =============================================

/**
 * Type guard to check if a value is a valid timestamp
 *
 * @param value - Value to check
 * @returns True if value is a valid timestamp
 */
export function isValidTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

/**
 * Type guard to check if a value is a valid support item tier
 *
 * @param value - Value to check
 * @returns True if value is a valid SupportItemTier
 */
export function isSupportItemTier(value: unknown): value is SupportItemTier {
  return (
    typeof value === 'string' &&
    ['base', 'tier1', 'tier2', 'tier3'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid support item chain type
 *
 * @param value - Value to check
 * @returns True if value is a valid SupportItemChainType
 */
export function isSupportItemChainType(
  value: unknown
): value is SupportItemChainType {
  return (
    typeof value === 'string' &&
    [
      'world_atlas',
      'relic',
      'steel',
      'spectral_sickle',
      'spectral_spellthief',
    ].includes(value)
  );
}
