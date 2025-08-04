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
  evolutionType: 'relic' | 'steel' | 'spectral_sickle' | 'spectral_spellthief';
}

// Support item evolution mapping
export const SUPPORT_ITEM_EVOLUTIONS: Record<number, SupportItemEvolution> = {
  // Relic Shield Evolution Chain
  3850: { // Relic Shield
    fromItemId: 0,
    toItemId: 3851,
    stage: 'base',
    chainName: 'Relic Shield',
    evolutionType: 'relic'
  },
  3851: { // Relic Shield (Tier 1)
    fromItemId: 3850,
    toItemId: 3853,
    stage: 'tier1',
    chainName: 'Relic Shield',
    evolutionType: 'relic'
  },
  3853: { // Pauldrons of Whiterock
    fromItemId: 3851,
    toItemId: 0,
    stage: 'tier2',
    chainName: 'Pauldrons of Whiterock',
    evolutionType: 'relic'
  },
  
  // Steel Shoulderguards Evolution Chain  
  3854: { // Steel Shoulderguards
    fromItemId: 0,
    toItemId: 3855,
    stage: 'base',
    chainName: 'Steel Shoulderguards',
    evolutionType: 'steel'
  },
  3855: { // Runesteel Spaulders
    fromItemId: 3854,
    toItemId: 3857,
    stage: 'tier1',
    chainName: 'Runesteel Spaulders',
    evolutionType: 'steel'
  },
  3857: { // Bulwark of the Mountain
    fromItemId: 3855,
    toItemId: 0,
    stage: 'tier2',
    chainName: 'Bulwark of the Mountain',
    evolutionType: 'steel'
  },
  
  // Spectral Sickle Evolution Chain (ADC Support)
  3858: { // Spectral Sickle
    fromItemId: 0,
    toItemId: 3859,
    stage: 'base',
    chainName: 'Spectral Sickle',
    evolutionType: 'spectral_sickle'
  },
  3859: { // Spectral Sickle (Tier 1)
    fromItemId: 3858,
    toItemId: 3860,
    stage: 'tier1',
    chainName: 'Spectral Sickle',
    evolutionType: 'spectral_sickle'
  },
  3860: { // Pauldrons of Whiterock (ADC variant)
    fromItemId: 3859,
    toItemId: 0,
    stage: 'tier2',
    chainName: 'Pauldrons of Whiterock',
    evolutionType: 'spectral_sickle'
  },
  
  // Spectral Sickle Evolution Chain (AP Support)
  3862: { // Spectral Sickle (AP)
    fromItemId: 0,
    toItemId: 3863,
    stage: 'base',
    chainName: 'Spectral Sickle',
    evolutionType: 'spectral_spellthief'
  },
  3863: { // Spectral Sickle (AP Tier 1)
    fromItemId: 3862,
    toItemId: 3864,
    stage: 'tier1',
    chainName: 'Spectral Sickle',
    evolutionType: 'spectral_spellthief'  
  },
  3864: { // Bulwark of the Mountain (AP variant)
    fromItemId: 3863,
    toItemId: 0,
    stage: 'tier2',
    chainName: 'Bulwark of the Mountain',
    evolutionType: 'spectral_spellthief'
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