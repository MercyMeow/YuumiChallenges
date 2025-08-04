# Match Timeline Utility Functions

This document provides comprehensive documentation for the TypeScript utility functions created for League of Legends match timeline processing, including time formatting and support item detection.

## Overview

The utility functions are split across two main files:
- `src/lib/utils/time.ts` - Basic time formatting functions
- `src/lib/utils/match-timeline-utils.ts` - Advanced timeline utilities

## Time Formatting Utilities

### Basic Functions (time.ts)

#### `formatMatchTime(milliseconds: number | null | undefined): string`

Converts milliseconds to MM:SS format for match timeline display.

**Examples:**
```typescript
formatMatchTime(65000)    // "1:05"
formatMatchTime(125000)   // "2:05"
formatMatchTime(-1000)    // "0:00"
formatMatchTime(null)     // "0:00"
```

#### `formatMatchTimeFromSeconds(seconds: number | null | undefined): string`

Converts seconds to MM:SS format for match timeline display.

**Examples:**
```typescript
formatMatchTimeFromSeconds(65)    // "1:05"
formatMatchTimeFromSeconds(125)   // "2:05"
```

### Advanced Functions (match-timeline-utils.ts)

#### `formatMillisecondsToTime(milliseconds, options?): string`

Enhanced version with comprehensive error handling and formatting options.

**Options:**
- `padMinutes`: Whether to pad minutes with leading zero
- `separator`: Custom separator between minutes and seconds
- `maxMinutes`: Maximum minutes before showing overflow
- `overflowText`: Text to show when exceeding maximum

**Examples:**
```typescript
formatMillisecondsToTime(65000)                           // "1:05"
formatMillisecondsToTime(65000, { padMinutes: true })     // "01:05"
formatMillisecondsToTime(65000, { separator: 'm ' })      // "1m 05"
formatMillisecondsToTime(99999999, { maxMinutes: 60 })    // "999:59+"
```

#### `formatSecondsToTime(seconds, options?): string`

Converts seconds to MM:SS format with formatting options.

#### `parseTimeToMilliseconds(timeString: string): number | null`

Parses MM:SS format back to milliseconds.

**Examples:**
```typescript
parseTimeToMilliseconds("1:05")     // 65000
parseTimeToMilliseconds("65:42")    // 3942000
parseTimeToMilliseconds("invalid")  // null
```

#### `getDurationBetween(startMs, endMs, options?): string`

Gets human-readable duration between two timestamps.

## Support Item Detection Utilities

### Core Functions

#### `isSupportItem(itemId: number | null | undefined): boolean`

Fast O(1) lookup to check if an item is a support item.

**Examples:**
```typescript
isSupportItem(3850)  // true (Relic Shield)
isSupportItem(1001)  // false (Boots)
isSupportItem(null)  // false
```

#### `getSupportItemCompletion(itemId): SupportItemCompletion`

Gets detailed support item completion information.

**Returns:**
```typescript
interface SupportItemCompletion {
  isSupportItem: boolean;
  tier: 'base' | 'tier1' | 'tier2' | 'tier3' | null;
  chainType: 'relic' | 'steel' | 'spectral_sickle' | 'spectral_spellthief' | null;
  isFinalEvolution: boolean;
  nextItemId: number;
  chainName: string | null;
  completionPercentage: number; // 0-100
}
```

**Examples:**
```typescript
getSupportItemCompletion(3850)
// { isSupportItem: true, tier: 'base', chainType: 'relic', 
//   isFinalEvolution: false, nextItemId: 3851, chainName: 'Relic Shield',
//   completionPercentage: 25 }

getSupportItemCompletion(3853)
// { isSupportItem: true, tier: 'tier2', chainType: 'relic',
//   isFinalEvolution: true, nextItemId: 0, chainName: 'Pauldrons of Whiterock',
//   completionPercentage: 75 }
```

#### `getNextEvolutionItemId(itemId): number`

Gets the next item ID in the evolution chain.

**Examples:**
```typescript
getNextEvolutionItemId(3850)  // 3851 (Relic Shield -> Spectral Sickle)
getNextEvolutionItemId(3853)  // 0 (Pauldrons is final)
getNextEvolutionItemId(1001)  // 0 (not a support item)
```

#### `isFinalSupportItemEvolution(itemId): boolean`

Checks if an item is the final evolution of a support item.

**Examples:**
```typescript
isFinalSupportItemEvolution(3853)  // true (Pauldrons of Whiterock)
isFinalSupportItemEvolution(3857)  // true (Bulwark of the Mountain)
isFinalSupportItemEvolution(3850)  // false (Relic Shield - base item)
```

#### `getSupportItemChain(itemId): number[]`

Gets all items in a support item evolution chain.

**Examples:**
```typescript
getSupportItemChain(3851)  // [3850, 3851, 3853] (Relic Shield chain)
getSupportItemChain(3857)  // [3854, 3855, 3857] (Steel Shoulderguards chain)
getSupportItemChain(1001)  // [] (not a support item)
```

### Timeline Analysis

#### `detectSupportItemCompletion(playerData, timelineEvents): Record<SupportItemTier, number | null>`

Analyzes timeline events to detect support item completion times.

**Example:**
```typescript
const timelineEvents = [
  { itemId: 3850, timestamp: 60000, type: 'ITEM_PURCHASED' },   // 1:00 - Relic Shield
  { itemId: 3851, timestamp: 180000, type: 'ITEM_PURCHASED' },  // 3:00 - Tier 1 Evolution
  { itemId: 3853, timestamp: 420000, type: 'ITEM_PURCHASED' },  // 7:00 - Final Evolution
];

const completionTimes = detectSupportItemCompletion(null, timelineEvents);
// { base: 60000, tier1: 180000, tier2: 420000, tier3: null }
```

## Participant ID Utilities

### ID Conversion Functions

#### `riotParticipantIdToArrayIndex(riotParticipantId): number`

Converts 1-indexed Riot API participant ID to 0-indexed array position.

**Examples:**
```typescript
riotParticipantIdToArrayIndex(1)   // 0
riotParticipantIdToArrayIndex(10)  // 9
riotParticipantIdToArrayIndex(0)   // -1 (invalid)
```

#### `arrayIndexToRiotParticipantId(arrayIndex): number`

Converts 0-indexed array position to 1-indexed Riot API participant ID.

**Examples:**
```typescript
arrayIndexToRiotParticipantId(0)   // 1
arrayIndexToRiotParticipantId(9)   // 10
arrayIndexToRiotParticipantId(-1)  // 0 (invalid)
```

#### `validateParticipantMapping(participantId, isRiotId?): ValidationResult`

Validates and converts between participant ID systems.

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  arrayIndex: number;
  riotId: number;
}
```

## Support Item Evolution Chains

The utility functions support the following support item evolution chains:

### Relic Shield Chain
- **3850** (Relic Shield) → **3851** (Spectral Sickle) → **3853** (Pauldrons of Whiterock)

### Steel Shoulderguards Chain
- **3854** (Steel Shoulderguards) → **3855** (Runesteel Spaulders) → **3857** (Bulwark of the Mountain)

### Spectral Sickle Chain (ADC Support)
- **3858** (Spectral Sickle) → **3859** (Spectral Sickle) → **3860** (Pauldrons of Whiterock)

### Spectral Sickle Chain (AP Support)
- **3862** (Spectral Sickle) → **3863** (Spectral Sickle) → **3864** (Bulwark of the Mountain)

## Performance Considerations

### Optimizations Implemented

1. **Fast Lookups**: Support item detection uses O(1) Set lookups instead of array searches
2. **Memoization**: `getSupportItemCompletionCached()` provides cached results for repeated queries
3. **Batch Processing**: `batchProcessSupportItems()` efficiently processes multiple items
4. **Edge Case Handling**: All functions handle null/undefined/invalid inputs gracefully
5. **Type Safety**: Comprehensive TypeScript typing with type guards

### Memory Management

```typescript
// Clear cache when needed (testing or memory management)
clearSupportItemCache();

// Batch process for better performance
const completionMap = batchProcessSupportItems(timelineEvents);
```

## Type Guards and Validators

The utilities include type guards for runtime type checking:

```typescript
isValidTimestamp(value)        // Checks if value is a valid timestamp
isSupportItemTier(value)       // Checks if value is a valid SupportItemTier
isSupportItemChainType(value)  // Checks if value is a valid SupportItemChainType
```

## Integration Example

Here's how to use these utilities in a match details component:

```typescript
import { formatMatchTime } from '@/lib/utils/time';
import { 
  detectSupportItemCompletion,
  isSupportItem,
  getSupportItemCompletion 
} from '@/lib/utils/match-timeline-utils';

// Format timeline timestamps
const formattedTime = formatMatchTime(frame.timestamp);

// Detect support item completion
const supportCompletionTimes = detectSupportItemCompletion(
  selectedPlayerData, 
  playerTimeline.events
);

// Display completion times
Object.entries(supportCompletionTimes).forEach(([tier, timestamp]) => {
  if (timestamp !== null) {
    console.log(`${tier}: ${formatMatchTime(timestamp)}`);
  }
});

// Check if items are support items
const isSupport = isSupportItem(itemId);
const completion = getSupportItemCompletion(itemId);
```

## Error Handling

All utility functions include comprehensive error handling:

- **Null/Undefined Safety**: All functions handle null and undefined inputs gracefully
- **Type Validation**: Input types are validated with appropriate fallbacks
- **Boundary Checking**: Numeric inputs are checked for valid ranges
- **Overflow Protection**: Large numbers are handled with overflow indicators
- **Invalid Data**: Invalid data returns sensible defaults rather than throwing errors

## Testing

A test file is provided at `src/lib/utils/match-timeline-utils.test.ts` with comprehensive examples demonstrating all functionality.

To run the examples:
```typescript
import './match-timeline-utils.test.ts';
```

The test file demonstrates real-world usage scenarios and expected outputs for all utility functions.