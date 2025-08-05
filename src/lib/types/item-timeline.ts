/**
 * Simplified Item Timeline Types for League of Legends Match Details
 * 
 * Clean, maintainable TypeScript interfaces with minimal complexity
 * and focus on type safety and ease of use.
 */

// Raw data from Riot API - minimal required structure
export interface RawTimelineData {
  metadata?: any;
  info: {
    frameInterval?: number;
    frames: {
      timestamp: number;
      events: RawTimelineEvent[];
    }[];
  };
}

export interface RawTimelineEvent {
  type: string;
  timestamp: number;
  participantId: number;
  itemId: number;
}

// Clean event types
export type ItemEventType = 'ITEM_PURCHASED' | 'ITEM_SOLD' | 'ITEM_DESTROYED' | 'ITEM_UNDO';

// Processed item event - simplified structure
export interface ItemEvent {
  readonly type: ItemEventType;
  readonly timestamp: number;
  readonly timeFormatted: string;
  readonly itemId: number;
  readonly isEvolution: boolean;
  readonly evolutionStage?: 'base' | 'tier1' | 'tier2' | 'tier3' | undefined;
}

// Legacy compatibility types
export interface ItemTimelineEvent extends ItemEvent {
  readonly participantId: number;
  readonly itemName?: string;
  readonly evolutionChain?: {
    readonly stage: 'base' | 'tier1' | 'tier2' | 'tier3';
    readonly chainName: string;
  };
}

export interface PlayerItemTimeline {
  readonly playerId: number;
  readonly participantId: number;
  readonly events: ItemTimelineEvent[];
  readonly totalPurchases: number;
  readonly totalSales: number;
  readonly totalDestructions: number;
  readonly supportItemEvolutions: ItemTimelineEvent[];
  readonly firstItemTimestamp?: number;
  readonly finalBuildTimestamp?: number;
}

export interface TimelineEventGroup {
  readonly timeInterval: string;
  readonly startTimestamp: number;
  readonly endTimestamp: number;
  readonly events: ItemTimelineEvent[];
  readonly eventCount: number;
  readonly hasEvolutions: boolean;
}

export interface ItemTimelineDisplayConfig {
  readonly showItemIcons: boolean;
  readonly showItemNames: boolean;
  readonly showTimestamps: boolean;
  readonly showEvolutionChains: boolean;
  readonly groupByTimeInterval: boolean;
  readonly timeInterval: number;
  readonly maxEventsPerGroup: number;
  readonly highlightEvolutions: boolean;
  readonly compactView: boolean;
}

export interface SupportItemEvolution {
  readonly stage: 'base' | 'tier1' | 'tier2' | 'tier3';
  readonly chainName: string;
  readonly fromItemId: number;
  readonly toItemId: number;
  readonly evolutionType: string;
}

// Support item evolution data - simplified mapping
export interface SupportEvolution {
  readonly stage: 'base' | 'tier1' | 'tier2' | 'tier3';
  readonly name: string;
}

// Support item evolution mapping - Current World Atlas System
export const SUPPORT_EVOLUTIONS: Record<number, SupportEvolution> = {
  3865: { stage: 'base', name: 'World Atlas' },
  3866: { stage: 'tier1', name: 'Runic Compass' },
  3867: { stage: 'tier2', name: 'Bounty of Worlds' },
  3869: { stage: 'tier3', name: 'Celestial Opposition' },
  3870: { stage: 'tier3', name: 'Dream Maker' },
  3871: { stage: 'tier3', name: "Zaz'Zak's Realmspike" },
  3876: { stage: 'tier3', name: 'Solstice Sleigh' },
  3877: { stage: 'tier3', name: 'Bloodsong' },
} as const;

// Legacy compatibility exports - moved before function to avoid hoisting issues
export const SUPPORT_ITEM_EVOLUTIONS = (() => {
  const legacy: Record<number, SupportItemEvolution> = {};
  
  for (const [itemIdStr, evolution] of Object.entries(SUPPORT_EVOLUTIONS)) {
    const itemId = parseInt(itemIdStr, 10);
    legacy[itemId] = {
      stage: evolution.stage,
      chainName: evolution.name,
      fromItemId: 0, // Simplified - not tracking full chain
      toItemId: 0,   // Simplified - not tracking full chain  
      evolutionType: 'world_atlas',
    };
  }
  
  return legacy;
})();

// Player timeline result - simplified structure
export interface PlayerTimeline {
  readonly participantId: number;
  readonly events: ItemEvent[];
  readonly stats: {
    readonly purchases: number;
    readonly sales: number;
    readonly evolutions: number;
  };
}

// Processing options - minimal configuration
export interface ProcessingOptions {
  readonly participantId: number; // 1-indexed Riot API participant ID
  readonly includeUndoEvents?: boolean | undefined;
}

// Processing result with simple error handling
export interface ProcessingResult {
  readonly success: boolean;
  readonly data?: PlayerTimeline;
  readonly error?: string;
}