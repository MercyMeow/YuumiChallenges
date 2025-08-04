'use client';

import React, { useMemo, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ItemSlot } from '@/components/match-history/item-slots';
import { 
  Clock, 
  ShoppingCart, 
  X, 
  Trash2, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ItemTimelineEvent,
  PlayerItemTimeline,
  TimelineEventGroup,
  ItemTimelineDisplayConfig,
  SupportItemEvolution
} from '@/lib/types/item-timeline';
import {
  groupEventsByTimeInterval,
  createDefaultDisplayConfig
} from '@/lib/utils/item-timeline-processor';
import { usePerformanceMonitor } from '@/lib/hooks/use-performance-monitor';

interface ItemTimelineDisplayProps {
  playerTimeline: PlayerItemTimeline;
  config?: Partial<ItemTimelineDisplayConfig>;
  className?: string;
  maxHeight?: number;
}

interface ItemEventDisplayProps {
  event: ItemTimelineEvent;
  config: ItemTimelineDisplayConfig;
  className?: string;
}

/**
 * Individual item event display component
 */
const ItemEventDisplay = memo(function ItemEventDisplay({ event, config, className }: ItemEventDisplayProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ITEM_PURCHASED':
        return <ShoppingCart className="h-4 w-4 text-green-400" />;
      case 'ITEM_SOLD':
        return <X className="h-4 w-4 text-yellow-400" />;
      case 'ITEM_DESTROYED':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'ITEM_UNDO':
        return <ArrowRight className="h-4 w-4 text-gray-400 transform rotate-180" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'ITEM_PURCHASED':
        return 'text-green-400';
      case 'ITEM_SOLD':
        return 'text-yellow-400';
      case 'ITEM_DESTROYED':
        return 'text-red-400';
      case 'ITEM_UNDO':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatEventType = (eventType: string) => {
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

  const renderEvolutionBadge = (evolution: SupportItemEvolution) => {
    const stageColors = {
      'base': 'bg-blue-500/20 text-blue-400',
      'tier1': 'bg-purple-500/20 text-purple-400',
      'tier2': 'bg-yellow-500/20 text-yellow-400',
      'tier3': 'bg-red-500/20 text-red-400'
    };

    return (
      <div className="flex items-center gap-2 mt-1">
        <Sparkles className="h-3 w-3 text-purple-400" />
        <Badge className={`text-xs ${stageColors[evolution.stage]}`}>
          {evolution.chainName} ({evolution.stage.toUpperCase()})
        </Badge>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg",
      "bg-gradient-to-r from-black/5 to-black/10 border border-white/5",
      "hover:from-black/10 hover:to-black/15 transition-all duration-200",
      event.isEvolution && config.highlightEvolutions && "ring-1 ring-purple-500/30 bg-gradient-to-r from-purple-500/5 to-blue-500/5",
      className
    )}>
      {/* Event Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getEventIcon(event.type)}
      </div>

      {/* Event Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          {/* Event Description */}
          <div className="flex items-center gap-2 flex-1">
            {config.showItemIcons && (
              <ItemSlot itemId={event.itemId} size="sm" />
            )}
            
            <div className="flex flex-col">
              <span className={cn("font-medium", getEventColor(event.type))}>
                {formatEventType(event.type)}
                {config.showItemNames && event.itemName && (
                  <span className="text-white ml-1">
                    {event.itemName}
                  </span>
                )}
              </span>
              
              {/* Evolution Chain Display */}
              {event.isEvolution && event.evolutionChain && config.showEvolutionChains && (
                renderEvolutionBadge(event.evolutionChain)
              )}
            </div>
          </div>

          {/* Timestamp */}
          {config.showTimestamps && (
            <div className="flex items-center gap-1 text-xs text-white/60">
              <Clock className="h-3 w-3" />
              {event.timeFormatted}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.event.itemId === nextProps.event.itemId &&
    prevProps.event.timestamp === nextProps.event.timestamp &&
    prevProps.event.type === nextProps.event.type &&
    prevProps.event.isEvolution === nextProps.event.isEvolution &&
    prevProps.config.showItemIcons === nextProps.config.showItemIcons &&
    prevProps.config.showItemNames === nextProps.config.showItemNames &&
    prevProps.config.showTimestamps === nextProps.config.showTimestamps
  );
});

/**
 * Timeline event group display component
 */
function TimelineEventGroupDisplay({ 
  group, 
  config 
}: { 
  group: TimelineEventGroup; 
  config: ItemTimelineDisplayConfig;
}) {
  return (
    <div className="space-y-3">
      {/* Group Header */}
      <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">{group.timeInterval}</span>
          {group.hasEvolutions && (
            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Evolution
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-white/60">
          {group.eventCount} events
        </Badge>
      </div>

      {/* Group Events */}
      <div className="space-y-2 ml-4 border-l-2 border-white/10 pl-4">
        {group.events.slice(0, config.maxEventsPerGroup).map((event, index) => (
          <ItemEventDisplay 
            key={`${event.timestamp}-${event.itemId}-${index}`}
            event={event}
            config={config}
          />
        ))}
        
        {group.events.length > config.maxEventsPerGroup && (
          <div className="text-center py-2">
            <Badge variant="outline" className="text-white/60">
              +{group.events.length - config.maxEventsPerGroup} more events
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main item timeline display component
 */
export function ItemTimelineDisplay({ 
  playerTimeline, 
  config: partialConfig,
  className,
  maxHeight = 600 
}: ItemTimelineDisplayProps) {
  const config = useMemo(() => ({
    ...createDefaultDisplayConfig(),
    ...partialConfig
  }), [partialConfig]);

  // Performance monitoring
  const { 
    trackTimelineMetrics, 
    trackMemoryUsage
  } = usePerformanceMonitor('ItemTimelineDisplay');

  const processedEvents = useMemo(() => {
    if (config.groupByTimeInterval) {
      return groupEventsByTimeInterval(playerTimeline.events, config.timeInterval);
    }
    return null;
  }, [playerTimeline.events, config.groupByTimeInterval, config.timeInterval]);

  const timelineStats = useMemo(() => {
    const stats = {
      totalEvents: playerTimeline.events.length,
      purchases: playerTimeline.totalPurchases,
      sales: playerTimeline.totalSales,
      destructions: playerTimeline.totalDestructions,
      evolutions: playerTimeline.supportItemEvolutions.length,
      firstItemTime: playerTimeline.firstItemTimestamp ? 
        playerTimeline.events.find(e => e.timestamp === playerTimeline.firstItemTimestamp)?.timeFormatted : null,
      lastItemTime: playerTimeline.finalBuildTimestamp ?
        playerTimeline.events.find(e => e.timestamp === playerTimeline.finalBuildTimestamp)?.timeFormatted : null
    };
    
    // Track metrics for performance monitoring
    trackTimelineMetrics(stats.totalEvents);
    trackMemoryUsage(stats.totalEvents, JSON.stringify(playerTimeline).length);
    
    return stats;
  }, [playerTimeline, trackTimelineMetrics, trackMemoryUsage]);

  if (playerTimeline.events.length === 0) {
    return (
      <Card className={cn("bg-black/20 backdrop-blur-md border border-white/10", className)}>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No item events found for this player</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-black/20 backdrop-blur-md border border-white/10", className)}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5" />
          Item Timeline
          <Badge className="bg-blue-500/20 text-blue-400 ml-2">
            Player {playerTimeline.participantId}
          </Badge>
        </CardTitle>
        
        {/* Timeline Statistics */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4 text-green-400" />
            <span className="text-green-400">{timelineStats.purchases}</span>
            <span className="text-white/60">purchases</span>
          </div>
          
          <div className="flex items-center gap-1">
            <X className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400">{timelineStats.sales}</span>
            <span className="text-white/60">sales</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Trash2 className="h-4 w-4 text-red-400" />
            <span className="text-red-400">{timelineStats.destructions}</span>
            <span className="text-white/60">destroyed</span>
          </div>
          
          {timelineStats.evolutions > 0 && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-purple-400">{timelineStats.evolutions}</span>
              <span className="text-white/60">evolutions</span>
            </div>
          )}
          
          {timelineStats.firstItemTime && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-white/60">First item:</span>
              <span className="text-blue-400">{timelineStats.firstItemTime}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          {config.groupByTimeInterval && processedEvents ? (
            // Grouped display
            <div className="space-y-6">
              {processedEvents.map((group, index) => (
                <TimelineEventGroupDisplay 
                  key={`${group.startTimestamp}-${index}`}
                  group={group}
                  config={config}
                />
              ))}
            </div>
          ) : (
            // Sequential display
            <div className="space-y-3">
              {playerTimeline.events.map((event, index) => (
                <ItemEventDisplay 
                  key={`${event.timestamp}-${event.itemId}-${index}`}
                  event={event}
                  config={config}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Compact item timeline display for sidebar or small spaces
 */
export function CompactItemTimelineDisplay({ 
  playerTimeline, 
  className 
}: { 
  playerTimeline: PlayerItemTimeline; 
  className?: string;
}) {
  const config = createDefaultDisplayConfig();
  config.compactView = true;
  config.showItemNames = false;
  config.maxEventsPerGroup = 5;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Item Events</h4>
        <Badge variant="outline" className="text-xs">
          {playerTimeline.events.length} events
        </Badge>
      </div>
      
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {playerTimeline.events.slice(0, 10).map((event, index) => (
          <div key={`compact-${event.timestamp}-${index}`} className="flex items-center gap-2">
            <ItemSlot itemId={event.itemId} size="sm" />
            <span className="text-xs text-white/60">{event.timeFormatted}</span>
            {event.isEvolution && (
              <Sparkles className="h-3 w-3 text-purple-400" />
            )}
          </div>
        ))}
        
        {playerTimeline.events.length > 10 && (
          <div className="text-center pt-1">
            <span className="text-xs text-white/40">
              +{playerTimeline.events.length - 10} more...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}