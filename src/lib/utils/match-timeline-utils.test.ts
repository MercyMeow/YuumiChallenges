/**
 * Test examples for match timeline utilities
 * This file demonstrates the functionality of the utility functions
 */

import {
  formatMillisecondsToTime,
  formatSecondsToTime,
  parseTimeToMilliseconds,
  getDurationBetween,
  isSupportItem,
  getSupportItemCompletion,
  getNextEvolutionItemId,
  isFinalSupportItemEvolution,
  getSupportItemChain,
  detectSupportItemCompletion,
  riotParticipantIdToArrayIndex,
  arrayIndexToRiotParticipantId,
  validateParticipantMapping
} from './match-timeline-utils';

// =============================================
// TIME FORMATTING EXAMPLES
// =============================================

console.log('=== TIME FORMATTING EXAMPLES ===');

// Convert milliseconds to MM:SS format
console.log('formatMillisecondsToTime(65000):', formatMillisecondsToTime(65000)); // "1:05"
console.log('formatMillisecondsToTime(125000):', formatMillisecondsToTime(125000)); // "2:05"
console.log('formatMillisecondsToTime(-1000):', formatMillisecondsToTime(-1000)); // "0:00"
console.log('formatMillisecondsToTime(null):', formatMillisecondsToTime(null)); // "0:00"
console.log('formatMillisecondsToTime(3665000):', formatMillisecondsToTime(3665000)); // "61:05"

// Convert seconds to MM:SS format
console.log('formatSecondsToTime(65):', formatSecondsToTime(65)); // "1:05"
console.log('formatSecondsToTime(125):', formatSecondsToTime(125)); // "2:05"
console.log('formatSecondsToTime(-10):', formatSecondsToTime(-10)); // "0:00"

// Parse MM:SS back to milliseconds
console.log('parseTimeToMilliseconds("1:05"):', parseTimeToMilliseconds("1:05")); // 65000
console.log('parseTimeToMilliseconds("65:42"):', parseTimeToMilliseconds("65:42")); // 3942000
console.log('parseTimeToMilliseconds("invalid"):', parseTimeToMilliseconds("invalid")); // null

// Duration between timestamps
console.log('getDurationBetween(0, 65000):', getDurationBetween(0, 65000)); // "1:05"

// =============================================
// SUPPORT ITEM DETECTION EXAMPLES
// =============================================

console.log('\n=== SUPPORT ITEM DETECTION EXAMPLES ===');

// Check if items are support items
console.log('isSupportItem(3850):', isSupportItem(3850)); // true (Relic Shield)
console.log('isSupportItem(1001):', isSupportItem(1001)); // false (Boots)
console.log('isSupportItem(null):', isSupportItem(null)); // false

// Get support item completion information
console.log('getSupportItemCompletion(3850):', getSupportItemCompletion(3850));
// { isSupportItem: true, tier: 'base', chainType: 'relic', isFinalEvolution: false, ... }

console.log('getSupportItemCompletion(3853):', getSupportItemCompletion(3853));
// { isSupportItem: true, tier: 'tier2', isFinalEvolution: true, ... }

console.log('getSupportItemCompletion(1001):', getSupportItemCompletion(1001));
// { isSupportItem: false, tier: null, ... }

// Get next evolution item ID
console.log('getNextEvolutionItemId(3850):', getNextEvolutionItemId(3850)); // 3851
console.log('getNextEvolutionItemId(3853):', getNextEvolutionItemId(3853)); // 0 (final)
console.log('getNextEvolutionItemId(1001):', getNextEvolutionItemId(1001)); // 0 (not support)

// Check if final evolution
console.log('isFinalSupportItemEvolution(3853):', isFinalSupportItemEvolution(3853)); // true
console.log('isFinalSupportItemEvolution(3857):', isFinalSupportItemEvolution(3857)); // true
console.log('isFinalSupportItemEvolution(3850):', isFinalSupportItemEvolution(3850)); // false

// Get evolution chain
console.log('getSupportItemChain(3851):', getSupportItemChain(3851)); // [3850, 3851, 3853]
console.log('getSupportItemChain(3857):', getSupportItemChain(3857)); // [3854, 3855, 3857]
console.log('getSupportItemChain(1001):', getSupportItemChain(1001)); // []

// =============================================
// PARTICIPANT ID MAPPING EXAMPLES
// =============================================

console.log('\n=== PARTICIPANT ID MAPPING EXAMPLES ===');

// Convert between ID systems
console.log('riotParticipantIdToArrayIndex(1):', riotParticipantIdToArrayIndex(1)); // 0
console.log('riotParticipantIdToArrayIndex(10):', riotParticipantIdToArrayIndex(10)); // 9
console.log('arrayIndexToRiotParticipantId(0):', arrayIndexToRiotParticipantId(0)); // 1
console.log('arrayIndexToRiotParticipantId(9):', arrayIndexToRiotParticipantId(9)); // 10

// Validate participant mapping
console.log('validateParticipantMapping(1, true):', validateParticipantMapping(1, true));
// { valid: true, arrayIndex: 0, riotId: 1 }
console.log('validateParticipantMapping(0, false):', validateParticipantMapping(0, false));
// { valid: true, arrayIndex: 0, riotId: 1 }

// =============================================
// SUPPORT ITEM COMPLETION DETECTION EXAMPLE
// =============================================

console.log('\n=== SUPPORT ITEM COMPLETION DETECTION EXAMPLE ===');

// Example timeline events for support item progression
const exampleTimelineEvents = [
  { itemId: 3850, timestamp: 60000, type: 'ITEM_PURCHASED' },   // 1:00 - Relic Shield
  { itemId: 3851, timestamp: 180000, type: 'ITEM_PURCHASED' },  // 3:00 - Tier 1 Evolution
  { itemId: 3853, timestamp: 420000, type: 'ITEM_PURCHASED' },  // 7:00 - Final Evolution
];

const completionTimes = detectSupportItemCompletion(null, exampleTimelineEvents);
console.log('Support item completion times:', completionTimes);
// { base: 60000, tier1: 180000, tier2: 420000, tier3: null }

console.log('Formatted completion times:');
Object.entries(completionTimes).forEach(([tier, timestamp]) => {
  if (timestamp !== null) {
    console.log(`  ${tier}: ${formatMillisecondsToTime(timestamp)}`);
  }
});
// base: 1:00
// tier1: 3:00
// tier2: 7:00

export {}; // Make this a module to avoid global scope issues