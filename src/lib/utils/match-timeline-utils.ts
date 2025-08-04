/**
 * Match Timeline Utility Functions
 * 
 * Comprehensive TypeScript utilities for League of Legends match timeline processing,
 * including advanced time formatting and support item detection system.
 * 
 * @module MatchTimelineUtils
 * @version 1.0.0
 */

import { SUPPORT_ITEM_EVOLUTIONS } from '@/lib/types/item-timeline';

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
  overflowText: '999:59+'
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
  
  const minutesStr = opts.padMinutes ? minutes.toString().padStart(2, '0') : minutes.toString();
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
  
  const minutesStr = opts.padMinutes ? minutes.toString().padStart(2, '0') : minutes.toString();
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
  
  if (isNaN(minutes) || isNaN(seconds) || seconds >= 60 || seconds < 0 || minutes < 0) {
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
export type SupportItemTier = 'base' | 'tier1' | 'tier2' | 'tier3';

/**
 * Support item evolution chain types
 */
export type SupportItemChainType = 'relic' | 'steel' | 'spectral_sickle' | 'spectral_spellthief';

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

/**
 * Fast lookup map for support items (for O(1) performance)
 */
const SUPPORT_ITEM_LOOKUP = new Set(Object.keys(SUPPORT_ITEM_EVOLUTIONS).map(Number));

/**
 * Tier mapping for completion percentage calculation
 */
const TIER_COMPLETION_MAP: Record<SupportItemTier, number> = {
  base: 25,
  tier1: 50,
  tier2: 75,
  tier3: 100
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
export function getSupportItemCompletion(itemId: number | null | undefined): SupportItemCompletion {
  const defaultResult: SupportItemCompletion = {
    isSupportItem: false,
    tier: null,
    chainType: null,
    isFinalEvolution: false,
    nextItemId: 0,
    chainName: null,
    completionPercentage: 0
  };
  
  if (!isSupportItem(itemId)) {
    return defaultResult;
  }
  
  const evolution = SUPPORT_ITEM_EVOLUTIONS[itemId!];
  if (!evolution) {
    return defaultResult;
  }
  
  return {
    isSupportItem: true,
    tier: evolution.stage,
    chainType: evolution.evolutionType,
    isFinalEvolution: evolution.toItemId === 0,
    nextItemId: evolution.toItemId,
    chainName: evolution.chainName,
    completionPercentage: TIER_COMPLETION_MAP[evolution.stage]
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
export function getNextEvolutionItemId(itemId: number | null | undefined): number {
  if (!isSupportItem(itemId)) {
    return 0;
  }
  
  const evolution = SUPPORT_ITEM_EVOLUTIONS[itemId!];
  return evolution?.toItemId ?? 0;
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
export function isFinalSupportItemEvolution(itemId: number | null | undefined): boolean {
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
export function getSupportItemChain(itemId: number | null | undefined): number[] {
  if (!isSupportItem(itemId)) {
    return [];
  }
  
  const evolution = SUPPORT_ITEM_EVOLUTIONS[itemId!];
  if (!evolution) {
    return [];
  }
  
  // Find all items with the same evolution type
  const chainItems = Object.entries(SUPPORT_ITEM_EVOLUTIONS)
    .filter(([, evo]) => evo.evolutionType === evolution.evolutionType)
    .map(([id, evo]) => ({ id: Number(id), stage: evo.stage, fromItemId: evo.fromItemId, toItemId: evo.toItemId }))
    .sort((a, b) => {
      // Sort by dependency chain
      const stageOrder = { base: 0, tier1: 1, tier2: 2, tier3: 3 };
      return stageOrder[a.stage] - stageOrder[b.stage];
    });
  
  return chainItems.map(item => item.id);
}

/**
 * Calculate support item completion time from timeline data
 * 
 * @param playerData - Player data from match
 * @param timelineEvents - Timeline events for the player
 * @returns Object with completion times for different tiers
 * 
 * @example
 * ```typescript
 * const completionTimes = detectSupportItemCompletion(selectedPlayerData, playerTimeline.events);
 * // { tier1: 180000, tier2: 420000, tier3: null } // 3:00 and 7:00 completion times
 * ```
 */
export function detectSupportItemCompletion(
  _playerData: any,
  timelineEvents: Array<{ itemId: number; timestamp: number; type: string }>
): Record<SupportItemTier, number | null> {
  const completionTimes: Record<SupportItemTier, number | null> = {
    base: null,
    tier1: null,
    tier2: null,
    tier3: null
  };
  
  if (!timelineEvents?.length) {
    return completionTimes;
  }
  
  // Process timeline events to find support item purchases
  const purchaseEvents = timelineEvents.filter(event => event.type === 'ITEM_PURCHASED');
  
  for (const event of purchaseEvents) {
    const completion = getSupportItemCompletion(event.itemId);
    
    if (completion.isSupportItem && completion.tier) {
      // Only record the first completion of each tier
      if (completionTimes[completion.tier] === null) {
        completionTimes[completion.tier] = event.timestamp;
      }
    }
  }
  
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
export function riotParticipantIdToArrayIndex(riotParticipantId: number): number {
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
      riotId: arrayIndex !== -1 ? participantId : 0
    };
  } else {
    const riotId = arrayIndexToRiotParticipantId(participantId);
    return {
      valid: riotId !== 0,
      arrayIndex: riotId !== 0 ? participantId : -1,
      riotId
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
export function getSupportItemCompletionCached(itemId: number | null | undefined): SupportItemCompletion {
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
export function batchProcessSupportItems(
  events: Array<{ itemId: number; [key: string]: any }>
): Map<number, SupportItemCompletion> {
  const results = new Map<number, SupportItemCompletion>();
  
  for (const event of events) {
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
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value) && 
         value >= 0 && 
         value <= Number.MAX_SAFE_INTEGER;
}

/**
 * Type guard to check if a value is a valid support item tier
 * 
 * @param value - Value to check
 * @returns True if value is a valid SupportItemTier
 */
export function isSupportItemTier(value: unknown): value is SupportItemTier {
  return typeof value === 'string' && 
         ['base', 'tier1', 'tier2', 'tier3'].includes(value);
}

/**
 * Type guard to check if a value is a valid support item chain type
 * 
 * @param value - Value to check
 * @returns True if value is a valid SupportItemChainType
 */
export function isSupportItemChainType(value: unknown): value is SupportItemChainType {
  return typeof value === 'string' && 
         ['relic', 'steel', 'spectral_sickle', 'spectral_spellthief'].includes(value);
}