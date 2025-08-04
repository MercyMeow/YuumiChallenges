/**
 * Item Timeline Types and Interfaces for League of Legends Match Details
 * 
 * This module provides comprehensive TypeScript interfaces and type definitions
 * for processing and displaying item purchase/sale/destruction events from
 * League of Legends match timeline data.
 */

// Raw timeline data structure from Riot API
export interface RawTimelineFrame {
  timestamp: number;
  events: RawTimelineEvent[];
  participantFrames: Record<string, {
    championStats: any;
    currentGold: number;
    totalGold: number;
    level: number;
    xp: number;
    minionsKilled: number;
    jungleMinionsKilled: number;
    damageStats: any;
    position?: { x: number; y: number };
  }>;
}

export interface RawTimelineEvent {
  type: string;
  timestamp: number;
  participantId?: number;
  itemId?: number;
  afterId?: number;  // Item ID after transformation/evolution
  beforeId?: number; // Item ID before transformation/evolution
  [key: string]: any; // Allow for other event properties
}

export interface RawTimelineData {
  metadata: any;
  info: {
    frameInterval: number;
    frames: RawTimelineFrame[];
  };
}

// Item event types
export type ItemEventType = 'ITEM_PURCHASED' | 'ITEM_SOLD' | 'ITEM_DESTROYED' | 'ITEM_UNDO';

// Processed item timeline event
export interface ItemTimelineEvent {
  type: ItemEventType;
  timestamp: number;
  timeFormatted: string; // MM:SS format
  participantId: number; // 1-indexed as per Riot API
  itemId: number;
  itemName?: string;
  isEvolution?: boolean; // Whether this is a support item evolution
  evolutionChain?: SupportItemEvolution; // Evolution details if applicable
}

// Support item evolution chains
export interface SupportItemEvolution {
  fromItemId: number;
  toItemId: number;
  stage: 'base' | 'tier1' | 'tier2' | 'tier3';
  chainName: string;
  evolutionType: 'world_atlas' | 'relic' | 'steel' | 'spectral_sickle' | 'spectral_spellthief';
}

// Support item evolution mapping - Current World Atlas System (Season 14+)
export const SUPPORT_ITEM_EVOLUTIONS: Record<number, SupportItemEvolution> = {
  // World Atlas Evolution Chain (Universal Support Starter)
  3865: { // World Atlas
    fromItemId: 0,
    toItemId: 3866,
    stage: 'base',
    chainName: 'World Atlas',
    evolutionType: 'world_atlas'
  },
  3866: { // Runic Compass
    fromItemId: 3865,
    toItemId: 3867,
    stage: 'tier1',
    chainName: 'Runic Compass',
    evolutionType: 'world_atlas'
  },
  3867: { // Bounty of Worlds
    fromItemId: 3866,
    toItemId: 0, // Can evolve to multiple final items
    stage: 'tier2',
    chainName: 'Bounty of Worlds',
    evolutionType: 'world_atlas'
  },
  
  // Final Support Item Evolutions from Bounty of Worlds
  3869: { // Celestial Opposition
    fromItemId: 3867,
    toItemId: 0,
    stage: 'tier3',
    chainName: 'Celestial Opposition',
    evolutionType: 'world_atlas'
  },
  3870: { // Dream Maker
    fromItemId: 3867,
    toItemId: 0,
    stage: 'tier3',
    chainName: 'Dream Maker',
    evolutionType: 'world_atlas'
  },
  3871: { // Zaz'Zak's Realmspike
    fromItemId: 3867,
    toItemId: 0,
    stage: 'tier3',
    chainName: "Zaz'Zak's Realmspike",
    evolutionType: 'world_atlas'
  },
  3876: { // Solstice Sleigh
    fromItemId: 3867,
    toItemId: 0,
    stage: 'tier3',
    chainName: 'Solstice Sleigh',
    evolutionType: 'world_atlas'
  },
  3877: { // Bloodsong
    fromItemId: 3867,
    toItemId: 0,
    stage: 'tier3',
    chainName: 'Bloodsong',
    evolutionType: 'world_atlas'
  }
};

// Processed timeline data for selected player
export interface PlayerItemTimeline {
  playerId: number; // 0-indexed participant array position
  participantId: number; // 1-indexed Riot API participant ID
  events: ItemTimelineEvent[];
  totalPurchases: number;
  totalSales: number;
  totalDestructions: number;
  supportItemEvolutions: ItemTimelineEvent[];
  firstItemTimestamp?: number;
  finalBuildTimestamp?: number;
}

// Timeline processing options
export interface TimelineProcessingOptions {
  selectedPlayerId: number; // 0-indexed participant position
  includeUndoEvents?: boolean;
  groupConsecutiveEvents?: boolean; // Group events at same timestamp
  detectEvolutions?: boolean;
  timeFormat?: 'MM:SS' | 'seconds' | 'milliseconds';
}

// Timeline processing result
export interface ProcessedItemTimeline {
  playerTimeline: PlayerItemTimeline;
  totalFrames: number;
  matchDuration: number;
  processingOptions: TimelineProcessingOptions;
  errors: TimelineProcessingError[];
}

// Error handling for timeline processing
export interface TimelineProcessingError {
  type: 'INVALID_PARTICIPANT_ID' | 'MISSING_ITEM_DATA' | 'INVALID_TIMESTAMP' | 'EVOLUTION_DETECTION_FAILED';
  message: string;
  eventIndex?: number;
  frameIndex?: number;
  itemId?: number;
  participantId?: number;
}

// Item timeline display configuration
export interface ItemTimelineDisplayConfig {
  showItemIcons: boolean;
  showItemNames: boolean;
  showTimestamps: boolean;
  showEvolutionChains: boolean;
  groupByTimeInterval: boolean; // Group events by minute intervals
  timeInterval: number; // Minutes for grouping
  maxEventsPerGroup: number;
  highlightEvolutions: boolean;
  compactView: boolean;
}

// Timeline event grouping
export interface TimelineEventGroup {
  timeInterval: string; // "5:00-6:00" format
  startTimestamp: number;
  endTimestamp: number;
  events: ItemTimelineEvent[];
  eventCount: number;
  hasEvolutions: boolean;
}