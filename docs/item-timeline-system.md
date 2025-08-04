# Item Timeline System Documentation

## Overview

The Item Timeline System provides comprehensive tracking and display of item purchase, sale, and destruction events for individual players in League of Legends matches. It includes support item evolution detection, time formatting, and rich UI components for visualization.

## Architecture

### Core Components

1. **Type Definitions** (`src/lib/types/item-timeline.ts`)
   - Comprehensive TypeScript interfaces for timeline data structures
   - Support item evolution mapping and detection
   - Error handling and configuration types

2. **Data Processing** (`src/lib/utils/item-timeline-processor.ts`)
   - Event filtering and transformation functions
   - Support item evolution detection algorithms
   - Time formatting utilities
   - Error handling and validation

3. **UI Components** (`src/components/match-history/item-timeline-display.tsx`)
   - Main item timeline display component
   - Compact timeline display for small spaces
   - Event grouping and visualization
   - Evolution highlighting and badges

## Key Features

### 1. Item Event Tracking

The system tracks four types of item events:
- `ITEM_PURCHASED` - Item bought from shop
- `ITEM_SOLD` - Item sold back to shop
- `ITEM_DESTROYED` - Item consumed or destroyed (e.g., trinkets)
- `ITEM_UNDO` - Purchase/sale undone

### 2. Support Item Evolution Detection

Automatically detects support item evolution chains:

#### Relic Shield Chain
- 3850 (Relic Shield) → 3851 (Relic Shield Tier 1) → 3853 (Pauldrons of Whiterock)

#### Steel Shoulderguards Chain
- 3854 (Steel Shoulderguards) → 3855 (Runesteel Spaulders) → 3857 (Bulwark of the Mountain)

#### Spectral Sickle Chains
- **ADC Variant**: 3858 → 3859 → 3860 (Pauldrons of Whiterock)
- **AP Variant**: 3862 → 3863 → 3864 (Bulwark of the Mountain)

### 3. Time Formatting

Supports multiple time formats:
- `MM:SS` - Human readable format (default)
- `seconds` - Total seconds since game start
- `milliseconds` - Raw timestamp from API

### 4. Error Handling

Comprehensive error handling for:
- Invalid participant IDs
- Missing item data
- Invalid timestamps
- Evolution detection failures

## Usage

### Basic Implementation

```typescript
import { 
  processPlayerItemTimeline, 
  createDefaultProcessingOptions 
} from '@/lib/utils/item-timeline-processor';
import { ItemTimelineDisplay } from '@/components/match-history/item-timeline-display';
import { RawTimelineData } from '@/lib/types/item-timeline';

// Process timeline data for selected player
const processingOptions = createDefaultProcessingOptions(selectedPlayerId);
const processed = processPlayerItemTimeline(timelineData, processingOptions);

// Render timeline display
<ItemTimelineDisplay 
  playerTimeline={processed.playerTimeline}
  config={{
    showItemIcons: true,
    showItemNames: true,
    showTimestamps: true,
    showEvolutionChains: true,
    highlightEvolutions: true
  }}
/>
```

### Advanced Configuration

```typescript
// Custom processing options
const options: TimelineProcessingOptions = {
  selectedPlayerId: 0, // 0-indexed participant position
  includeUndoEvents: false,
  groupConsecutiveEvents: true,
  detectEvolutions: true,
  timeFormat: 'MM:SS'
};

// Custom display configuration
const displayConfig: ItemTimelineDisplayConfig = {
  showItemIcons: true,
  showItemNames: true,
  showTimestamps: true,
  showEvolutionChains: true,
  groupByTimeInterval: true,
  timeInterval: 2, // Group by 2-minute intervals
  maxEventsPerGroup: 10,
  highlightEvolutions: true,
  compactView: false
};
```

### Compact Display

For sidebars or constrained spaces:

```typescript
import { CompactItemTimelineDisplay } from '@/components/match-history/item-timeline-display';

<CompactItemTimelineDisplay 
  playerTimeline={processed.playerTimeline}
  className="w-full"
/>
```

## Data Flow

1. **Raw Timeline Data** - From Riot API match timeline endpoint
2. **Event Filtering** - Extract item-related events for selected player
3. **Event Transformation** - Convert to structured format with time formatting
4. **Evolution Detection** - Identify support item evolution sequences
5. **Event Grouping** - Optional grouping by time intervals or consecutive events
6. **UI Rendering** - Display with rich visual components

## Timeline Processing Pipeline

```
Raw Timeline Data
        ↓
Filter Item Events (ITEM_PURCHASED, ITEM_SOLD, etc.)
        ↓
Filter for Selected Participant
        ↓
Transform Events (time formatting, validation)
        ↓
Detect Support Item Evolutions
        ↓
Group Consecutive Events (optional)
        ↓
Sort by Timestamp
        ↓
Generate Statistics
        ↓
Return Processed Timeline
```

## Support Item Evolution Logic

The system detects evolutions by:

1. **Base Item Purchase** - Initial support item (e.g., 3850 Relic Shield)
2. **Evolution Tracking** - Monitor for subsequent tier purchases
3. **Chain Validation** - Verify prerequisite items were owned
4. **Stage Classification** - Categorize as base/tier1/tier2/tier3

Evolution detection considers:
- Previous item ownership
- Sale events that would break chains
- Multiple evolution paths for similar items

## Error Handling

The system provides detailed error reporting:

```typescript
interface TimelineProcessingError {
  type: 'INVALID_PARTICIPANT_ID' | 'MISSING_ITEM_DATA' | 'INVALID_TIMESTAMP' | 'EVOLUTION_DETECTION_FAILED';
  message: string;
  eventIndex?: number;
  frameIndex?: number;
  itemId?: number;
  participantId?: number;
}
```

Errors are collected during processing and can be displayed to users for debugging.

## Performance Considerations

- **Memoization** - Processing results are memoized based on timeline data and selected player
- **Lazy Processing** - Only processes data when player is selected
- **Event Filtering** - Early filtering reduces processing overhead
- **Virtual Scrolling** - For large timelines with many events

## Integration with Match Details

The system integrates seamlessly with the existing match details page:

1. **Player Selection** - Timeline updates when player is selected
2. **Tab Navigation** - Dedicated "Item Timeline" tab
3. **Error Display** - Processing warnings shown to users
4. **Responsive Design** - Works on mobile and desktop

## Future Enhancements

Potential improvements:

1. **Item Set Detection** - Identify common item build patterns
2. **Build Path Analysis** - Show optimal vs actual build paths
3. **Gold Efficiency Tracking** - Calculate gold efficiency over time
4. **Comparison Mode** - Compare item timelines between players
5. **Export Functionality** - Export timeline data as JSON/CSV
6. **Animation** - Animated timeline progression
7. **Item Recommendations** - Suggest items based on game state

## API Integration

The system works with standard Riot API timeline data:

```json
{
  "info": {
    "frames": [
      {
        "timestamp": 60000,
        "events": [
          {
            "type": "ITEM_PURCHASED",
            "timestamp": 45000,
            "participantId": 1,
            "itemId": 1001
          }
        ]
      }
    ]
  }
}
```

No additional API calls required - all processing is client-side.

## Testing

The system includes comprehensive error handling and validation:

- **Type Safety** - Full TypeScript coverage
- **Input Validation** - Validates API data structure
- **Edge Cases** - Handles missing data gracefully
- **Error Recovery** - Continues processing despite individual event failures

## Accessibility

The UI components include:

- **Semantic HTML** - Proper structure for screen readers
- **Color Contrast** - High contrast for evolution highlights
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Labels** - Descriptive labels for all elements