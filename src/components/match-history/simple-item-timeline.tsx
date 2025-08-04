'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ItemSlot } from './item-slots';
import { useItem } from '@/hooks/use-item-data';
import {
  Clock,
  ShoppingCart,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  Package,
  AlertCircle,
  Trophy,
  Crown,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  isFinalSupportItemEvolution
} from '@/lib/utils/match-timeline-utils';
import { SUPPORT_EVOLUTIONS } from '@/lib/types/item-timeline-new';

// Component prop interfaces
interface ItemTimelineProps {
  timeline: PlayerTimeline | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  maxHeight?: number;
}

interface PlayerTimeline {
  readonly participantId: number;
  readonly events: readonly ItemEvent[];
  readonly stats: {
    readonly purchases: number;
    readonly sales: number;
    readonly destructions: number;
    readonly evolutions: number;
  };
}

interface ItemEvent {
  readonly type: 'ITEM_PURCHASED' | 'ITEM_SOLD' | 'ITEM_DESTROYED' | 'ITEM_UNDO';
  readonly timestamp: number;
  readonly timeFormatted: string;
  readonly itemId: number;
  readonly isEvolution: boolean;
  readonly evolutionStage?: 'base' | 'tier1' | 'tier2' | 'tier3';
}

interface SupportQuestCompletion {
  readonly tier: 'base' | 'tier1' | 'tier2' | 'tier3';
  readonly timestamp: number;
  readonly timeFormatted: string;
  readonly itemId: number;
  readonly itemName: string;
  readonly isQuestComplete: boolean;
}

interface GroupedEvents {
  readonly timestamp: number;
  readonly timeFormatted: string;
  readonly events: readonly ItemEvent[];
}

// Support Quest Detection
const detectSupportQuestCompletions = (events: readonly ItemEvent[]): SupportQuestCompletion[] => {
  const completions: SupportQuestCompletion[] = [];
  const seenTiers = new Set<string>();
  
  // Process events chronologically to find first completion of each tier
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  for (const event of sortedEvents) {
    if (event.type === 'ITEM_PURCHASED' && event.isEvolution && event.evolutionStage) {
      const tierKey = event.evolutionStage;
      
      if (!seenTiers.has(tierKey)) {
        seenTiers.add(tierKey);
        const evolution = SUPPORT_EVOLUTIONS[event.itemId];
        
        completions.push({
          tier: event.evolutionStage,
          timestamp: event.timestamp,
          timeFormatted: event.timeFormatted,
          itemId: event.itemId,
          itemName: evolution?.name || `Item ${event.itemId}`,
          isQuestComplete: event.evolutionStage === 'tier3'
        });
      }
    }
  }
  
  return completions.sort((a, b) => a.timestamp - b.timestamp);
};

// Enhanced evolution detection for destruction->purchase sequences
const detectEvolutionChains = (events: readonly ItemEvent[]): Map<number, ItemEvent[]> => {
  const evolutionChains = new Map<number, ItemEvent[]>();
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    
    // Look for destruction followed by purchase within 1 second (evolution pattern)
    if (
      currentEvent &&
      nextEvent &&
      currentEvent.type === 'ITEM_DESTROYED' &&
      nextEvent.type === 'ITEM_PURCHASED' &&
      nextEvent.timestamp - currentEvent.timestamp <= 1000 &&
      currentEvent.isEvolution &&
      nextEvent.isEvolution
    ) {
      // This is an evolution chain
      const chainKey = Math.floor(currentEvent.timestamp / 1000); // Group by second
      if (!evolutionChains.has(chainKey)) {
        evolutionChains.set(chainKey, []);
      }
      evolutionChains.get(chainKey)!.push(currentEvent, nextEvent);
    }
  }
  
  return evolutionChains;
};

// Utility functions for event processing
const groupEventsByTime = (events: readonly ItemEvent[]): GroupedEvents[] => {
  const groups = new Map<number, ItemEvent[]>();
  
  events.forEach((event) => {
    const existingGroup = groups.get(event.timestamp);
    if (existingGroup) {
      existingGroup.push(event);
    } else {
      groups.set(event.timestamp, [event]);
    }
  });
  
  return Array.from(groups.entries()).map(([timestamp, groupEvents]) => ({
    timestamp,
    timeFormatted: groupEvents[0]?.timeFormatted || '', // All events in group have same time
    events: groupEvents,
  })).sort((a, b) => a.timestamp - b.timestamp);
};

const filterEvents = (events: readonly ItemEvent[], showDestroyed: boolean): readonly ItemEvent[] => {
  if (showDestroyed) return events;
  
  // Hide destroyed items but still show evolutions
  return events.filter(event => 
    event.type !== 'ITEM_DESTROYED' || event.isEvolution
  );
};

// Event type styling utilities
const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'ITEM_PURCHASED':
      return <ShoppingCart className="h-4 w-4 text-accessible-green" />;
    case 'ITEM_SOLD':
      return <X className="h-4 w-4 text-accessible-yellow" />;
    case 'ITEM_DESTROYED':
      return <Trash2 className="h-4 w-4 text-accessible-red" />;
    case 'ITEM_UNDO':
      return <ArrowRight className="h-4 w-4 rotate-180 text-muted-foreground" />;
    default:
      return <Package className="h-4 w-4 text-muted-foreground" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'ITEM_PURCHASED':
      return 'text-accessible-green';
    case 'ITEM_SOLD':
      return 'text-accessible-yellow';
    case 'ITEM_DESTROYED':
      return 'text-accessible-red';
    case 'ITEM_UNDO':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
};

const getEventBorderColor = (eventType: string, isEvolution: boolean) => {
  if (isEvolution) {
    return 'border-accessible-purple/30';
  }
  
  switch (eventType) {
    case 'ITEM_PURCHASED':
      return 'border-accessible-green/20';
    case 'ITEM_SOLD':
      return 'border-accessible-yellow/20';
    case 'ITEM_DESTROYED':
      return 'border-accessible-red/20';
    case 'ITEM_UNDO':
      return 'border-border/30';
    default:
      return 'border-border/20';
  }
};

const formatEventType = (eventType: string, isEvolutionChain: boolean = false) => {
  if (isEvolutionChain && eventType === 'ITEM_DESTROYED') {
    return 'Evolution';
  }
  
  switch (eventType) {
    case 'ITEM_PURCHASED':
      return 'Purchased';
    case 'ITEM_SOLD':
      return 'Sold';
    case 'ITEM_DESTROYED':
      return 'Destroyed';
    case 'ITEM_UNDO':
      return 'Undone';
    default:
      return eventType.replace(/_/g, ' ').toLowerCase();
  }
};

// Evolution stage styling
const getEvolutionStageColor = (stage?: string) => {
  switch (stage) {
    case 'base':
      return 'bg-accessible-blue/20 text-accessible-blue border-accessible-blue/30';
    case 'tier1':
      return 'bg-accessible-purple/20 text-accessible-purple border-accessible-purple/30';
    case 'tier2':
      return 'bg-accessible-yellow/20 text-accessible-yellow border-accessible-yellow/30';
    case 'tier3':
      return 'bg-accessible-red/20 text-accessible-red border-accessible-red/30';
    default:
      return 'bg-accessible-purple/20 text-accessible-purple border-accessible-purple/30';
  }
};

// Support Quest Completion Component
interface SupportQuestCompletionProps {
  completion: SupportQuestCompletion;
  className?: string;
}

const SupportQuestCompletionItem = ({ completion, className }: SupportQuestCompletionProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-4',
        'backdrop-blur-md bg-gradient-to-r border-2',
        completion.isQuestComplete 
          ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50 animate-pulse'
          : 'from-purple-500/20 to-blue-500/20 border-purple-500/40',
        'transition-all duration-300 hover:scale-[1.02]',
        className
      )}
    >
      {/* Quest icon */}
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50">
          {completion.isQuestComplete ? (
            <Crown className="h-5 w-5 text-yellow-400" />
          ) : (
            <Star className="h-5 w-5 text-purple-300" />
          )}
        </div>
      </div>

      {/* Quest content */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Item icon */}
        <ItemSlot itemId={completion.itemId} size="md" />

        {/* Quest details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {completion.isQuestComplete ? 'Support Quest Completed!' : `Support Quest ${completion.tier.toUpperCase()}`}
            </span>
            {completion.isQuestComplete && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                <Trophy className="mr-1 h-3 w-3" />
                QUEST COMPLETE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>{completion.itemName}</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                completion.tier === 'tier3' 
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              )}
            >
              {completion.tier.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex flex-shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {completion.timeFormatted}
        </div>
      </div>
    </div>
  );
};

// Individual event component
interface ItemEventItemProps {
  event: ItemEvent;
  isEvolutionChain?: boolean;
  className?: string | undefined;
}

const ItemEventItem = ({ event, isEvolutionChain = false, className }: ItemEventItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-4',
        'backdrop-blur-md bg-black/20 border',
        getEventBorderColor(event.type, event.isEvolution),
        'transition-all duration-200 hover:bg-black/30',
        event.isEvolution && 'animate-subtle-pulse',
        className
      )}
    >
      {/* Timeline connector dot */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-purple-500/20">
          {getEventIcon(event.type)}
        </div>
      </div>

      {/* Event content */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Item icon */}
        <ItemSlot itemId={event.itemId} size="md" />

        {/* Event details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium', getEventColor(event.type))}>
              {formatEventType(event.type, isEvolutionChain)}
            </span>
            {isEvolutionChain && event.type === 'ITEM_DESTROYED' && (
              <Zap className="h-4 w-4 text-purple-400" />
            )}
            <ItemNameDisplay itemId={event.itemId} />
            
            {/* Evolution badge */}
            {event.isEvolution && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  getEvolutionStageColor(event.evolutionStage),
                  isEvolutionChain && 'animate-pulse'
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {isEvolutionChain && event.type === 'ITEM_DESTROYED' 
                  ? 'Evolution Chain'
                  : `Evolution ${event.evolutionStage?.toUpperCase() || ''}`
                }
              </Badge>
            )}
            
            {/* Final Evolution indicator */}
            {event.type === 'ITEM_PURCHASED' && isFinalSupportItemEvolution(event.itemId) && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse">
                <Crown className="mr-1 h-3 w-3" />
                FINAL EVOLUTION
              </Badge>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex flex-shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {event.timeFormatted}
        </div>
      </div>
    </div>
  );
};

// Grouped events component
interface GroupedEventItemProps {
  group: GroupedEvents;
  evolutionChains?: Map<number, ItemEvent[]>;
  className?: string;
}

const GroupedEventItem = ({ group, evolutionChains, className }: GroupedEventItemProps) => {
  if (group.events.length === 1 && group.events[0]) {
    // Check if this event is part of an evolution chain
    const firstEvent = group.events[0];
    if (!firstEvent) return null;

    const isEvolutionChain = evolutionChains ? 
      Array.from(evolutionChains.values()).some(chainEvents => 
        chainEvents.some(chainEvent => 
          chainEvent.timestamp === firstEvent.timestamp && 
          chainEvent.itemId === firstEvent.itemId
        )
      ) : false;
      
    // Single event - render normally
    return <ItemEventItem event={firstEvent} isEvolutionChain={isEvolutionChain} className={className} />;
  }

  // Multiple events at same time - render as a group
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        'backdrop-blur-md bg-black/20 border border-purple-500/20',
        'transition-all duration-200 hover:bg-black/30',
        className
      )}
    >
      {/* Group header with timestamp */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-purple-500/20">
          <Clock className="h-3 w-3 text-purple-300" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {group.timeFormatted} - {group.events.length} events
        </span>
      </div>

      {/* Individual events in the group */}
      <div className="space-y-2 ml-8">
        {group.events.map((event, index) => {
          // Check if this event is part of an evolution chain
          const isEvolutionChain = evolutionChains ? 
            Array.from(evolutionChains.values()).some(chainEvents => 
              chainEvents.some(chainEvent => 
                chainEvent.timestamp === event.timestamp && 
                chainEvent.itemId === event.itemId
              )
            ) : false;
            
          return (
            <div
              key={`${event.timestamp}-${event.itemId}-${index}`}
              className={cn(
                'flex items-center gap-3 rounded-md p-2 border',
                'bg-black/10 border-purple-500/10',
                isEvolutionChain && 'bg-purple-500/10 border-purple-500/20 animate-subtle-pulse'
              )}
            >
              {/* Event icon */}
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-purple-500/20">
                  {getEventIcon(event.type)}
                </div>
              </div>

              {/* Item icon */}
              <ItemSlot itemId={event.itemId} size="sm" />

              {/* Event details */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className={cn('text-sm font-medium', getEventColor(event.type))}>
                  {formatEventType(event.type, isEvolutionChain)}
                </span>
                {isEvolutionChain && event.type === 'ITEM_DESTROYED' && (
                  <Zap className="h-3 w-3 text-purple-400" />
                )}
                <ItemNameDisplay itemId={event.itemId} className="text-sm" />
                
                {/* Evolution badge */}
                {event.isEvolution && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      getEvolutionStageColor(event.evolutionStage),
                      isEvolutionChain && 'animate-pulse'
                    )}
                  >
                    <Sparkles className="mr-1 h-2 w-2" />
                    {isEvolutionChain && event.type === 'ITEM_DESTROYED' 
                      ? 'Evolution Chain'
                      : `Evolution ${event.evolutionStage?.toUpperCase() || ''}`
                    }
                  </Badge>
                )}
                
                {/* Final Evolution indicator */}
                {event.type === 'ITEM_PURCHASED' && isFinalSupportItemEvolution(event.itemId) && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    <Crown className="mr-1 h-2 w-2" />
                    FINAL
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Separate component for item name display to avoid hook duplication
interface ItemNameDisplayProps {
  itemId: number;
  className?: string;
}

const ItemNameDisplay = ({ itemId, className }: ItemNameDisplayProps) => {
  const { item, isLoading: itemLoading } = useItem(itemId);
  
  const getItemName = () => {
    if (itemLoading) return '...';
    if (item?.name) return item.name;
    return `Item ${itemId}`;
  };

  return (
    <span className={cn('text-white/90 font-medium', className)}>
      {getItemName()}
    </span>
  );
};

// Loading state component
const LoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg p-4 backdrop-blur-md bg-black/20 border border-purple-500/20"
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-600/50" />
          <div className="h-6 w-6 animate-pulse rounded bg-gray-600/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-600/50" />
          </div>
          <div className="h-3 w-12 animate-pulse rounded bg-gray-600/50" />
        </div>
      ))}
    </div>
  );
};

// Empty state component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-2 font-medium text-foreground">No Item Events</h3>
      <p className="text-sm text-muted-foreground">
        No item purchases, sales, or evolutions found in this match.
      </p>
    </div>
  );
};

// Error state component
const ErrorState = ({ error }: { error: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-accessible-red/50" />
      <h3 className="mb-2 font-medium text-foreground">Unable to Load Timeline</h3>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  );
};

// Stats header component
interface StatsHeaderProps {
  stats: PlayerTimeline['stats'];
  participantId: number;
}

const StatsHeader = ({ stats, participantId }: StatsHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <Badge className="bg-blue-500/20 text-accessible-blue border-accessible-blue/30">
        Player {participantId}
      </Badge>

      <div className="flex items-center gap-1">
        <ShoppingCart className="h-4 w-4 text-accessible-green" />
        <span className="text-accessible-green">{stats.purchases}</span>
        <span className="text-muted-foreground">purchases</span>
      </div>

      <div className="flex items-center gap-1">
        <X className="h-4 w-4 text-accessible-yellow" />
        <span className="text-accessible-yellow">{stats.sales}</span>
        <span className="text-muted-foreground">sales</span>
      </div>

      <div className="flex items-center gap-1">
        <Trash2 className="h-4 w-4 text-accessible-red" />
        <span className="text-accessible-red">{stats.destructions}</span>
        <span className="text-muted-foreground">destroyed</span>
      </div>

      {stats.evolutions > 0 && (
        <div className="flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-accessible-purple" />
          <span className="text-accessible-purple">{stats.evolutions}</span>
          <span className="text-muted-foreground">evolutions</span>
        </div>
      )}
    </div>
  );
};

// Main component
export function SimpleItemTimeline({
  timeline,
  isLoading = false,
  error = null,
  className,
  maxHeight = 600,
}: ItemTimelineProps) {
  const [showDestroyed, setShowDestroyed] = useState(false);
  
  // Calculate support quest completions and evolution chains
  const questAnalysis = useMemo(() => {
    if (!timeline?.events) {
      return { completions: [], evolutionChains: new Map(), hasQuestComplete: false };
    }
    
    const completions = detectSupportQuestCompletions(timeline.events);
    const evolutionChains = detectEvolutionChains(timeline.events);
    const hasQuestComplete = completions.some(c => c.isQuestComplete);
    
    return { completions, evolutionChains, hasQuestComplete };
  }, [timeline?.events]);
  // Handle loading state
  if (isLoading) {
    return (
      <Card
        className={cn(
          'border border-purple-500/20 backdrop-blur-md bg-black/20',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5" />
            Item Timeline
            <div className="ml-2 h-3 w-3 animate-spin rounded-full border border-purple-400/50 border-t-purple-400" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card
        className={cn(
          'border border-purple-500/20 backdrop-blur-md bg-black/20',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5" />
            Item Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState error={error} />
        </CardContent>
      </Card>
    );
  }

  // Handle empty or invalid timeline
  if (!timeline || !timeline.events || timeline.events.length === 0) {
    return (
      <Card
        className={cn(
          'border border-purple-500/20 backdrop-blur-md bg-black/20',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5" />
            Item Timeline
            {timeline && (
              <Badge className="ml-2 bg-blue-500/20 text-accessible-blue border-accessible-blue/30">
                Player {timeline.participantId}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  // Process events - filter and group
  const filteredEvents = filterEvents(timeline.events, showDestroyed);
  const groupedEvents = groupEventsByTime(filteredEvents);

  return (
    <Card
      className={cn(
        'border border-purple-500/20 backdrop-blur-md bg-black/20',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5" />
          Item Timeline
        </CardTitle>
        
        {/* Stats header */}
        <StatsHeader 
          stats={timeline.stats} 
          participantId={timeline.participantId} 
        />
        
        {/* Support Quest Summary */}
        {questAnalysis.completions.length > 0 && (
          <div className="mt-3 p-3 rounded-lg backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-medium text-purple-300">Support Quest Progress</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {questAnalysis.completions.map((completion, index) => (
                <Badge 
                  key={`quest-${completion.tier}-${index}`}
                  className={cn(
                    'text-xs',
                    completion.isQuestComplete
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  )}
                >
                  {completion.isQuestComplete ? (
                    <>
                      <Crown className="mr-1 h-3 w-3" />
                      Quest Complete at {completion.timeFormatted}
                    </>
                  ) : (
                    <>
                      <Star className="mr-1 h-3 w-3" />
                      {completion.tier.toUpperCase()} at {completion.timeFormatted}
                    </>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-destroyed"
              checked={showDestroyed}
              onCheckedChange={setShowDestroyed}
            />
            <Label
              htmlFor="show-destroyed"
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              Show destroyed items
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          <div className="space-y-3">
            {/* Support Quest Completions */}
            {questAnalysis.completions.map((completion, index) => (
              <SupportQuestCompletionItem
                key={`quest-completion-${completion.tier}-${index}`}
                completion={completion}
              />
            ))}
            
            {/* Regular timeline events */}
            {groupedEvents.map((group, index) => {
              return (
                <GroupedEventItem
                  key={`${group.timestamp}-${index}`}
                  group={group}
                  evolutionChains={questAnalysis.evolutionChains}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}