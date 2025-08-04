'use client';

import React, { useMemo } from 'react';
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
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ItemTimelineEvent,
  PlayerItemTimeline,
  TimelineEventGroup,
  ItemTimelineDisplayConfig,
  SupportItemEvolution,
} from '@/lib/types/item-timeline';
import {
  groupEventsByTimeInterval,
  createDefaultDisplayConfig,
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
const ItemEventDisplay = ({
  event,
  config,
  className,
}: ItemEventDisplayProps) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ITEM_PURCHASED':
        return <ShoppingCart className="h-4 w-4 text-green-400" />;
      case 'ITEM_SOLD':
        return <X className="h-4 w-4 text-yellow-400" />;
      case 'ITEM_DESTROYED':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'ITEM_UNDO':
        return (
          <ArrowRight className="h-4 w-4 rotate-180 transform text-gray-400" />
        );
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
      base: 'bg-blue-500/20 text-blue-400',
      tier1: 'bg-purple-500/20 text-purple-400',
      tier2: 'bg-yellow-500/20 text-yellow-400',
      tier3: 'bg-red-500/20 text-red-400',
    };

    return (
      <div className="mt-1 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-purple-400" />
        <Badge className={`text-xs ${stageColors[evolution.stage]}`}>
          {evolution.chainName} ({evolution.stage.toUpperCase()})
        </Badge>
      </div>
    );
  };

  // Runtime guards to prevent invalid React element creation in dev
  if (process.env.NODE_ENV !== 'production') {
    if (
      !event ||
      typeof event !== 'object' ||
      typeof event.type !== 'string' ||
      typeof event.timestamp !== 'number' ||
      typeof event.itemId !== 'number'
    ) {
      console.error('[ItemEventDisplay] Invalid event prop provided:', {
        event,
        reason: 'Missing or invalid type/timestamp/itemId',
      });
      return (
        <div
          className={cn(
            'rounded-md border border-red-500/30 bg-red-900/10 p-2 text-xs text-red-300',
            className
          )}
        >
          Invalid item event encountered
        </div>
      );
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3',
        'border border-white/5 bg-gradient-to-r from-black/5 to-black/10',
        'transition-all duration-200 hover:from-black/10 hover:to-black/15',
        event.isEvolution &&
          config.highlightEvolutions &&
          'bg-gradient-to-r from-purple-500/5 to-blue-500/5 ring-1 ring-purple-500/30',
        className
      )}
    >
      {/* Event Icon */}
      <div className="mt-0.5 flex-shrink-0">{getEventIcon(event.type)}</div>

      {/* Event Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between">
          {/* Event Description */}
          <div className="flex flex-1 items-center gap-2">
            {config.showItemIcons &&
              typeof event.itemId === 'number' &&
              event.itemId >= 0 && <ItemSlot itemId={event.itemId} size="sm" />}

            <div className="flex flex-col">
              <span className={cn('font-medium', getEventColor(event.type))}>
                {formatEventType(event.type)}
                {config.showItemNames && event.itemName && (
                  <span className="ml-1 text-white">{event.itemName}</span>
                )}
              </span>

              {/* Evolution Chain Display */}
              {event.isEvolution &&
                event.evolutionChain &&
                config.showEvolutionChains &&
                renderEvolutionBadge(event.evolutionChain)}
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
};

/**
 * Timeline event group display component
 */
const TimelineEventGroupDisplay = ({
  group,
  config,
}: {
  group: TimelineEventGroup;
  config: ItemTimelineDisplayConfig;
}) => {
  return (
    <div className="space-y-3">
      {/* Group Header */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">{group.timeInterval}</span>
          {group.hasEvolutions && (
            <Badge className="bg-purple-500/20 text-xs text-purple-400">
              <Sparkles className="mr-1 h-3 w-3" />
              Evolution
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-white/60">
          {group.eventCount} events
        </Badge>
      </div>

      {/* Group Events */}
      <div className="ml-4 space-y-2 border-l-2 border-white/10 pl-4">
        {group.events
          ?.slice(0, config.maxEventsPerGroup)
          .map((event, index) => {
            if (
              !event ||
              typeof event.timestamp !== 'number' ||
              typeof event.itemId !== 'number'
            ) {
              console.warn('Invalid event data in group:', event);
              return null;
            }
            return (
              <ItemEventDisplay
                key={`${event.timestamp}-${event.itemId}-${index}`}
                event={event}
                config={config}
              />
            );
          })}

        {group.events.length > config.maxEventsPerGroup && (
          <div className="py-2 text-center">
            <Badge variant="outline" className="text-white/60">
              +{group.events.length - config.maxEventsPerGroup} more events
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main item timeline display component
 */
export function ItemTimelineDisplay({
  playerTimeline,
  config: partialConfig,
  className,
  maxHeight = 600,
}: ItemTimelineDisplayProps) {
  const config = useMemo(
    () => ({
      ...createDefaultDisplayConfig(),
      ...partialConfig,
    }),
    [partialConfig]
  );

  // Performance monitoring
  const { trackTimelineMetrics, trackMemoryUsage } = usePerformanceMonitor(
    'ItemTimelineDisplay'
  );

  const processedEvents = useMemo(() => {
    if (config.groupByTimeInterval && playerTimeline?.events) {
      return groupEventsByTimeInterval(
        playerTimeline.events,
        config.timeInterval
      );
    }
    return null;
  }, [playerTimeline?.events, config.groupByTimeInterval, config.timeInterval]);

  const timelineStats = useMemo(() => {
    const events = playerTimeline?.events || [];
    const stats = {
      totalEvents: events.length,
      purchases: playerTimeline?.totalPurchases || 0,
      sales: playerTimeline?.totalSales || 0,
      destructions: playerTimeline?.totalDestructions || 0,
      evolutions: playerTimeline?.supportItemEvolutions?.length || 0,
      firstItemTime: playerTimeline?.firstItemTimestamp
        ? events.find((e) => e?.timestamp === playerTimeline.firstItemTimestamp)
            ?.timeFormatted
        : null,
      lastItemTime: playerTimeline?.finalBuildTimestamp
        ? events.find(
            (e) => e?.timestamp === playerTimeline.finalBuildTimestamp
          )?.timeFormatted
        : null,
    };

    // Track metrics for performance monitoring
    trackTimelineMetrics(stats.totalEvents);
    trackMemoryUsage(
      stats.totalEvents,
      JSON.stringify(playerTimeline || {}).length
    );

    return stats;
  }, [playerTimeline, trackTimelineMetrics, trackMemoryUsage]);

  // Extra runtime diagnostics for Items view
  if (process.env.NODE_ENV !== 'production') {
    const safeEvents = Array.isArray(playerTimeline?.events)
      ? playerTimeline?.events
      : [];
    const invalid = safeEvents.find(
      (e) =>
        !e ||
        typeof e.timestamp !== 'number' ||
        typeof e.itemId !== 'number' ||
        typeof e.type !== 'string'
    );
    if (invalid) {
      console.error(
        '[ItemTimelineDisplay] Found invalid event entry:',
        invalid
      );
    }
  }

  if (
    !Array.isArray(playerTimeline?.events) ||
    playerTimeline.events.length === 0
  ) {
    return (
      <Card
        className={cn(
          'border border-white/10 bg-black/20 backdrop-blur-md',
          className
        )}
      >
        <CardContent className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-white/40" />
          <p className="text-white/60">No item events found for this player</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border border-white/10 bg-black/20 backdrop-blur-md',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Package className="h-5 w-5" />
          Item Timeline
          <Badge className="ml-2 bg-blue-500/20 text-blue-400">
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
              <span className="text-purple-400">
                {timelineStats.evolutions}
              </span>
              <span className="text-white/60">evolutions</span>
            </div>
          )}

          {timelineStats.firstItemTime && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-white/60">First item:</span>
              <span className="text-blue-400">
                {timelineStats.firstItemTime}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          {/* Dev-only diagnostics to catch invalid element types (React error #185) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="hidden" aria-hidden="true">
              <pre className="text-[10px] leading-3">
                {(() => {
                  const hasEvents =
                    !!playerTimeline?.events &&
                    playerTimeline.events.length > 0;
                  const sample = hasEvents
                    ? playerTimeline!.events![0]
                    : undefined;
                  return JSON.stringify(
                    {
                      hasEvents,
                      grouped: !!config.groupByTimeInterval,
                      processedGroups: processedEvents?.length ?? 0,
                      sampleEvent: sample
                        ? {
                            type: sample.type,
                            itemId: sample.itemId,
                            ts: sample.timestamp,
                          }
                        : null,
                    },
                    null,
                    0
                  );
                })()}
              </pre>
            </div>
          )}

          {config.groupByTimeInterval && Array.isArray(processedEvents) ? (
            // Grouped display
            <div className="space-y-6">
              {processedEvents.map((group, index) => {
                if (!group || !Array.isArray(group.events)) {
                  console.warn(
                    'Invalid group encountered in ItemTimelineDisplay:',
                    group
                  );
                  return null;
                }
                return (
                  <TimelineEventGroupDisplay
                    key={`${group.startTimestamp}-${index}`}
                    group={group}
                    config={config}
                  />
                );
              })}
            </div>
          ) : (
            // Sequential display
            <div className="space-y-3">
              {Array.isArray(playerTimeline.events) &&
                playerTimeline.events.map((event, index) => {
                  if (
                    !event ||
                    typeof event.timestamp !== 'number' ||
                    typeof event.itemId !== 'number' ||
                    typeof event.type !== 'string'
                  ) {
                    console.warn('Invalid event data:', event);
                    return null;
                  }

                  return (
                    <ItemEventDisplay
                      key={`${event.timestamp}-${event.itemId}-${index}`}
                      event={event}
                      config={config}
                    />
                  );
                })}
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
  className,
}: {
  playerTimeline: PlayerItemTimeline;
  className?: string;
}) {
  const config = createDefaultDisplayConfig();
  config.compactView = true;
  config.showItemNames = false;
  config.maxEventsPerGroup = 5;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Item Events</h4>
        <Badge variant="outline" className="text-xs">
          {playerTimeline.events.length} events
        </Badge>
      </div>

      <div className="max-h-48 space-y-1 overflow-y-auto">
        {playerTimeline.events?.slice(0, 10).map((event, index) => {
          if (
            !event ||
            typeof event.timestamp !== 'number' ||
            typeof event.itemId !== 'number'
          ) {
            return null;
          }
          return (
            <div
              key={`compact-${event.timestamp}-${index}`}
              className="flex items-center gap-2"
            >
              <ItemSlot itemId={event.itemId} size="sm" />
              <span className="text-xs text-white/60">
                {event.timeFormatted || 'N/A'}
              </span>
              {event.isEvolution && (
                <Sparkles className="h-3 w-3 text-purple-400" />
              )}
            </div>
          );
        })}

        {playerTimeline.events.length > 10 && (
          <div className="pt-1 text-center">
            <span className="text-xs text-white/40">
              +{playerTimeline.events.length - 10} more...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
