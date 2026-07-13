'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { formatMatchTime } from '@/lib/utils/time';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Skeleton, PanelSkeleton } from '@/components/ui/skeleton';
import {
  MatchHeader,
  TeamObjectives,
  TeamSection,
  RunesTab,
  formatNumber,
  getKDAColor,
} from '@/components/match-details';
import { useMatchData } from '@/hooks/use-match-data';
import { usePlayerSelection } from '@/hooks/use-player-selection';
import { useTimelineData } from '@/hooks/use-timeline-data';

// Lazy load heavy components for better initial load performance
const TimelineTab = lazy(() =>
  import('@/components/match-details').then((mod) => ({
    default: mod.TimelineTab,
  }))
);
const DetailedStatsTab = lazy(() =>
  import('@/components/match-details').then((mod) => ({
    default: mod.DetailedStatsTab,
  }))
);
const ChallengesTab = lazy(() =>
  import('@/components/match-details').then((mod) => ({
    default: mod.ChallengesTab,
  }))
);
const YuumiChallengesTab = lazy(() =>
  import('@/components/match-details').then((mod) => ({
    default: mod.YuumiChallengesTab,
  }))
);

const MATCH_TAB_TRIGGER =
  'rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright';

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTimelineView, setActiveTimelineView] = useState<
    'combat' | 'items'
  >('combat');

  // Fetch and process match data
  const {
    data,
    loading,
    error,
    teamTotals,
    rawTimelineData,
    gameModeInfo,
    teams,
  } = useMatchData(matchId);

  // Manage player selection
  const {
    selectedPlayer,
    comparePlayer,
    setSelectedPlayer: setSelectedPlayerRaw,
    setComparePlayer: setComparePlayerRaw,
    selectedPlayerData,
    comparePlayerData,
  } = usePlayerSelection(data);

  // Memoize handlers to prevent child re-renders
  const setSelectedPlayer = useCallback(
    (index: number | null) => setSelectedPlayerRaw(index),
    [setSelectedPlayerRaw]
  );
  const setComparePlayer = useCallback(
    (index: number | null) => setComparePlayerRaw(index),
    [setComparePlayerRaw]
  );

  // Process timeline data
  const {
    processedTimeline,
    isProcessing,
    timelineError,
    supportItemCompletionTimes,
    compareSupportItemCompletionTimes,
  } = useTimelineData(rawTimelineData, selectedPlayer, comparePlayer);

  if (loading) {
    // Ghost of the loaded match page — back button, header plate, tab strip,
    // two team panels (five rows each), and the objectives grid — so nothing
    // shifts when the real data arrives.
    return (
      <div className="relative" role="status" aria-busy="true">
        <div className="relative mx-auto max-w-7xl py-8">
          <span className="sr-only">Loading match details</span>
          {/* Flavor caption kept from the old spinner — still charming */}
          <p className="mb-4 hex-title text-sm text-hx-gold/60">
            Consulting the archives…
          </p>

          <div className="mb-6">
            {/* Back button */}
            <Skeleton className="mb-4 h-9 w-24" />

            {/* Match header plate */}
            <PanelSkeleton className="hex-corners px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="min-w-0 space-y-3">
                  <Skeleton className="h-7 w-52" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </PanelSkeleton>
          </div>

          <div className="space-y-6">
            {/* Tab strip */}
            <div className="hex-card grid grid-cols-2 gap-1 rounded-sm p-1 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>

            {/* Overview: two team panels */}
            {Array.from({ length: 2 }, (_, teamIndex) => (
              <section key={teamIndex} className="hex-card relative rounded-sm">
                <header className="flex items-center justify-between gap-4 border-b border-hx-gold-dark/40 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-2.5 w-2.5 rotate-45" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3 w-44" />
                </header>
                <div className="space-y-2 p-3 sm:p-4">
                  {Array.from({ length: 5 }, (_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-sm border-l-2 border-l-hx-gold-dark/30 p-3 hex-card-inset"
                    >
                      {/* Identity */}
                      <div className="flex min-w-0 flex-1 basis-52 items-center gap-2.5">
                        <Skeleton className="h-10 w-10 rounded-sm" />
                        <Skeleton className="h-9 w-5" />
                        <div className="min-w-0 space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-2.5 w-24" />
                        </div>
                      </div>
                      {/* KDA + stat blocks */}
                      <Skeleton className="h-8 w-24" />
                      {Array.from({ length: 4 }, (_, statIndex) => (
                        <Skeleton key={statIndex} className="h-8 w-16" />
                      ))}
                      {/* Items + runes */}
                      <Skeleton className="h-10 w-28" />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Team objectives */}
            <section className="hex-card relative rounded-sm">
              <header className="flex items-center gap-2.5 border-b border-hx-gold-dark/40 px-4 py-3 sm:px-5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </header>
              <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
                {Array.from({ length: 2 }, (_, colIndex) => (
                  <div key={colIndex} className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 8 }, (_, tileIndex) => (
                        <Skeleton key={tileIndex} className="h-16 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="mx-auto py-16">
          <div className="hex-card mx-auto flex max-w-2xl items-center justify-center rounded-sm border-0 px-8 py-12">
            <AlertCircle className="mr-4 h-12 w-12 text-red-400" />
            <div>
              <h2 className="mb-2 hex-title text-xl text-hx-gold">
                Error Loading Match
              </h2>
              <p className="text-white/60">{error || 'No match data found'}</p>
              <Button
                onClick={() => window.history.back()}
                className="mt-4 rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const matchData = data.matchData;
  const { gameMode, gameModeColor } = gameModeInfo;
  const { blueTeam, redTeam, blueTeamData, redTeamData } = teams;

  return (
    <div className="relative">
      <div className="relative mx-auto max-w-7xl py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mb-4 rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Match Header */}
          <MatchHeader
            matchData={matchData}
            matchId={matchId}
            gameMode={gameMode}
            gameModeColor={gameModeColor}
            blueTeamData={blueTeamData}
            redTeamData={redTeamData}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="hex-card grid h-auto w-full grid-cols-2 rounded-sm p-1 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview" className={MATCH_TAB_TRIGGER}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className={MATCH_TAB_TRIGGER}>
              Detailed Stats
            </TabsTrigger>
            <TabsTrigger value="runes" className={MATCH_TAB_TRIGGER}>
              Runes
            </TabsTrigger>
            <TabsTrigger value="timeline" className={MATCH_TAB_TRIGGER}>
              Timeline
            </TabsTrigger>
            <TabsTrigger value="challenges" className={MATCH_TAB_TRIGGER}>
              Challenges
            </TabsTrigger>
            <TabsTrigger value="yuumi-challenges" className={MATCH_TAB_TRIGGER}>
              Yuumi Challenges
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <TeamSection
              teamName="Blue Team"
              teamColor="blue"
              participants={blueTeam}
              teamTotals={teamTotals.blue}
              matchData={matchData}
              selectedPlayer={selectedPlayer}
              comparePlayer={comparePlayer}
              setSelectedPlayer={setSelectedPlayer}
              setComparePlayer={setComparePlayer}
              getKDAColor={getKDAColor}
              formatNumber={formatNumber}
            />

            <TeamSection
              teamName="Red Team"
              teamColor="red"
              participants={redTeam}
              teamTotals={teamTotals.red}
              matchData={matchData}
              selectedPlayer={selectedPlayer}
              comparePlayer={comparePlayer}
              setSelectedPlayer={setSelectedPlayer}
              setComparePlayer={setComparePlayer}
              getKDAColor={getKDAColor}
              formatNumber={formatNumber}
            />

            <TeamObjectives
              blueTeamData={blueTeamData}
              redTeamData={redTeamData}
              supportItemCompletionTimes={supportItemCompletionTimes}
              formatMatchTime={formatMatchTime}
            />
          </TabsContent>

          {/* Detailed Stats Tab - Lazy Loaded */}
          <TabsContent value="details" className="space-y-6">
            <Suspense fallback={<LoadingFallback message="Loading stats..." />}>
              <DetailedStatsTab
                selectedPlayerData={selectedPlayerData}
                comparePlayerData={comparePlayerData}
                matchData={matchData}
                teamTotals={teamTotals}
                supportItemCompletionTimes={supportItemCompletionTimes}
                compareSupportItemCompletionTimes={
                  compareSupportItemCompletionTimes
                }
                formatNumber={formatNumber}
                formatMatchTime={formatMatchTime}
              />
            </Suspense>
          </TabsContent>

          {/* Runes Tab */}
          <TabsContent value="runes">
            <RunesTab selectedPlayerData={selectedPlayerData} />
          </TabsContent>

          {/* Timeline Tab - Lazy Loaded */}
          <TabsContent value="timeline">
            <Suspense
              fallback={<LoadingFallback message="Loading timeline..." />}
            >
              <TimelineTab
                activeTimelineView={activeTimelineView}
                setActiveTimelineView={setActiveTimelineView}
                timelineData={rawTimelineData}
                isProcessing={isProcessing}
                processedTimeline={processedTimeline}
                timelineError={timelineError}
                selectedPlayerData={selectedPlayerData}
                matchData={matchData}
                formatMatchTime={formatMatchTime}
              />
            </Suspense>
          </TabsContent>

          {/* Challenges Tab - Lazy Loaded */}
          <TabsContent value="challenges">
            <Suspense
              fallback={<LoadingFallback message="Loading challenges..." />}
            >
              <ChallengesTab selectedPlayerData={selectedPlayerData} />
            </Suspense>
          </TabsContent>

          {/* Yuumi Challenges Tab - Lazy Loaded */}
          <TabsContent value="yuumi-challenges">
            <Suspense
              fallback={
                <LoadingFallback message="Evaluating Yuumi challenges..." />
              }
            >
              <YuumiChallengesTab
                selectedPlayerData={selectedPlayerData}
                matchData={matchData}
                supportItemCompletionTimes={supportItemCompletionTimes}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
