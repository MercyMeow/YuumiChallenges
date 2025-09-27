/**
 * Simplified Item Timeline Types
 * 
 * Clean, maintainable type definitions for League of Legends item timeline processing.
 * Reduced complexity while maintaining all essential functionality.
 */

// ==================== CORE EVENT TYPES ====================

export type ItemEventType = 'ITEM_PURCHASED' | 'ITEM_SOLD' | 'ITEM_DESTROYED' | 'ITEM_UNDO';

export type EvolutionStage = 'base' | 'tier1' | 'tier2' | 'tier3';

// ==================== RAW API DATA ====================

export interface RawTimelineEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly participantId?: number;
  readonly itemId?: number;
  readonly [key: string]: unknown;
}

export interface RawTimelineFrame {
  readonly timestamp: number;
  readonly events: readonly RawTimelineEvent[];
}

export interface RawTimelineData {
  readonly info: {
    readonly frameInterval: number;
    readonly frames: readonly RawTimelineFrame[];
  };
}

// ==================== PROCESSED DATA ====================

export interface ItemEvent {
  readonly type: ItemEventType;
  readonly timestamp: number;
  readonly timeFormatted: string;  // "MM:SS" format
  readonly itemId: number;
  readonly isEvolution: boolean;
  readonly evolutionStage?: EvolutionStage;
}

export interface PlayerTimeline {
  readonly participantId: number;  // 1-indexed (Riot API format)
  readonly events: readonly ItemEvent[];
  readonly stats: {
    readonly purchases: number;
    readonly sales: number;  
    readonly destructions: number;
    readonly evolutions: number;
  };
}

// ==================== SUPPORT ITEM EVOLUTIONS ====================

export interface SupportEvolution {
  readonly stage: EvolutionStage;
  readonly name: string;
}

export const SUPPORT_EVOLUTIONS: Record<number, SupportEvolution> = {
  // World Atlas Evolution Chain (Season 14+)
  3865: { stage: 'base', name: 'World Atlas' },
  3866: { stage: 'tier1', name: 'Runic Compass' },
  3867: { stage: 'tier2', name: 'Bounty of Worlds' },
  
  // Final Support Items (evolved from Bounty of Worlds)
  3869: { stage: 'tier3', name: 'Celestial Opposition' },
  3870: { stage: 'tier3', name: 'Dream Maker' },
  3871: { stage: 'tier3', name: "Zaz'Zak's Realmspike" },
  3876: { stage: 'tier3', name: 'Solstice Sleigh' },
  3877: { stage: 'tier3', name: 'Bloodsong' },
} as const;

// ==================== PROCESSING ====================

export interface ProcessingOptions {
  readonly participantId: number;  // 1-indexed
  readonly includeUndoEvents?: boolean;
}

export interface ProcessingResult {
  readonly success: boolean;
  readonly data?: PlayerTimeline;
  readonly error?: string;
}

// ==================== UTILITIES ====================

export function isSupportEvolution(itemId: number): boolean {
  return itemId in SUPPORT_EVOLUTIONS;
}

export function getEvolutionStage(itemId: number): EvolutionStage | undefined {
  return SUPPORT_EVOLUTIONS[itemId]?.stage;
}

export function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
