'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ItemSlot } from './item-slots';
import {
  Clock,
  ShoppingCart,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  Package,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Individual event component
interface ItemEventItemProps {
  event: ItemEvent;
  className?: string;
}

const ItemEventItem = ({ event, className }: ItemEventItemProps) => {
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
              {formatEventType(event.type)}
            </span>
            
            {/* Evolution badge */}
            {event.isEvolution && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  getEvolutionStageColor(event.evolutionStage)
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Evolution {event.evolutionStage?.toUpperCase() || ''}
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
      </CardHeader>

      <CardContent>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          <div className="space-y-3">
            {timeline.events.map((event, index) => (
              <ItemEventItem
                key={`${event.timestamp}-${event.itemId}-${index}`}
                event={event}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}