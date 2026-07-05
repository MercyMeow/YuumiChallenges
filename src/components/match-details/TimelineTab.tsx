/**
 * Timeline Tab Component
 * Displays match timeline with combat events and item progression
 * Extracted from match details page
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimpleItemTimeline } from '@/components/match-history/simple-item-timeline';
import { TimelineEventItem } from '@/components/match-history/timeline-event-item';
import { Loader2, Timer, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedMatchData, CRITICAL_TIMELINE_EVENT_TYPES } from './types';
import { RawTimelineData, PlayerTimeline } from '@/lib/types/item-timeline-new';
import { logger } from '@/lib/logger';
import { ExtendedMatchParticipant } from './types';

interface TimelineTabProps {
  activeTimelineView: 'combat' | 'items';
  setActiveTimelineView: (view: 'combat' | 'items') => void;
  timelineData: RawTimelineData | null;
  isProcessing: boolean;
  processedTimeline: PlayerTimeline | null;
  timelineError: string | null;
  selectedPlayerData: ExtendedMatchParticipant | null | undefined;
  matchData: ExtendedMatchData;
  formatMatchTime: (timestamp: number) => string;
}

export function TimelineTab({
  activeTimelineView,
  setActiveTimelineView,
  timelineData,
  isProcessing,
  processedTimeline,
  timelineError,
  selectedPlayerData,
  matchData,
  formatMatchTime,
}: TimelineTabProps) {
  return (
    <Card className="border border-white/10 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Timer className="h-5 w-5" />
            Match Timeline
          </CardTitle>
          {/* Segmented toggle */}
          <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                activeTimelineView === 'combat'
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              onClick={() => setActiveTimelineView('combat')}
            >
              Combat
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                activeTimelineView === 'items'
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              onClick={() => setActiveTimelineView('items')}
            >
              Items
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Combat View */}
        {activeTimelineView === 'combat' && (
          <>
            {!timelineData ? (
              <div className="py-12 text-center">
                <Timer className="mx-auto mb-4 h-12 w-12 text-white/40" />
                <p className="text-white/60">
                  Timeline data not available for this match
                </p>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="mr-3 h-8 w-8 animate-spin text-white/60" />
                <span className="text-white/60">
                  Processing timeline data...
                </span>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {timelineData.info.frames.map((frame, frameIndex) => {
                    const formattedTime = formatMatchTime(frame.timestamp);
                    const importantEvents = (frame.events ?? []).filter(
                      (event) =>
                        typeof event.type === 'string' &&
                        CRITICAL_TIMELINE_EVENT_TYPES.has(event.type)
                    );
                    if (importantEvents.length === 0) return null;
                    return (
                      <div
                        key={frameIndex}
                        className="ml-2 border-l-2 border-white/20 pl-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="-ml-[1.25rem] h-2 w-2 rounded-full bg-white"></div>
                          <Badge variant="outline" className="text-white/60">
                            {formattedTime}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {importantEvents.map((event, eventIndex) => {
                            try {
                              return (
                                <TimelineEventItem
                                  key={eventIndex}
                                  event={event}
                                  participants={matchData.info.participants}
                                  participantPuuids={
                                    matchData.metadata.participants
                                  }
                                />
                              );
                            } catch (err) {
                              logger.error(
                                '[TimelineTab] Combat event render failed',
                                err,
                                {
                                  frameIndex,
                                  eventIndex,
                                  eventPreview: {
                                    type: event.type,
                                    ts: event.timestamp,
                                  },
                                }
                              );
                              return (
                                <div
                                  key={`combat-fallback-${frameIndex}-${eventIndex}`}
                                  className="rounded border border-red-500/20 bg-red-900/10 p-2 text-xs text-red-300"
                                >
                                  Failed to render combat event #{eventIndex}
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </>
        )}

        {/* Items View */}
        {activeTimelineView === 'items' && (
          <>
            {!selectedPlayerData ? (
              <div className="py-12 text-center">
                <Coins className="mx-auto mb-4 h-12 w-12 text-white/40" />
                <p className="text-white/60">
                  Click on a player in the Overview tab to see their item
                  timeline
                </p>
              </div>
            ) : !timelineData ? (
              <div className="py-12 text-center">
                <Coins className="mx-auto mb-4 h-12 w-12 text-white/40" />
                <p className="text-white/60">
                  Item timeline requires detailed match timeline data
                </p>
              </div>
            ) : (
              <SimpleItemTimeline
                timeline={processedTimeline}
                isLoading={isProcessing}
                error={timelineError}
                className="w-full"
                maxHeight={600}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
