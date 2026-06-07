'use client';

import { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge'; // Unused for now
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { formatRelativeTime, formatTimeRemaining } from '@/lib/utils/time';
import { RefreshStatus } from '@/lib/types';

interface RefreshStatusIndicatorProps {
  refreshStatus: RefreshStatus | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  showLastRefresh?: boolean;
  showManualRefresh?: boolean;
  className?: string;
}

export function RefreshStatusIndicator({
  refreshStatus,
  isRefreshing = false,
  onRefresh,
  showLastRefresh = true,
  showManualRefresh = true,
  className = '',
}: RefreshStatusIndicatorProps) {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!refreshStatus) return;

    const updateTimer = () => {
      if (
        showManualRefresh &&
        !refreshStatus.can_manual_refresh &&
        refreshStatus.next_manual_refresh
      ) {
        const remaining = formatTimeRemaining(
          refreshStatus.next_manual_refresh
        );
        setTimeUntilRefresh(remaining);
      } else {
        setTimeUntilRefresh('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [refreshStatus, showManualRefresh]);

  if (!refreshStatus) {
    return null;
  }

  const canRefresh = showManualRefresh
    ? refreshStatus.can_manual_refresh
    : refreshStatus.can_refresh;
  const lastRefreshTime = showManualRefresh
    ? refreshStatus.last_manual_refresh_at
    : refreshStatus.last_refreshed_at;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Last Refresh Time */}
      {showLastRefresh && lastRefreshTime && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center space-x-1 text-xs text-white/60">
                <Clock className="h-3 w-3" />
                <span>Updated {formatRelativeTime(lastRefreshTime)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Last refreshed: {new Date(lastRefreshTime).toLocaleString()}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Manual Refresh Button */}
      {showManualRefresh && onRefresh && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={!canRefresh || isRefreshing}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing
                  ? 'Refreshing'
                  : !canRefresh
                    ? timeUntilRefresh
                      ? `Wait ${timeUntilRefresh}`
                      : 'Cooldown'
                    : 'Refresh'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                {isRefreshing && <p>Refreshing account data...</p>}
                {!isRefreshing && canRefresh && (
                  <p>Click to refresh account data</p>
                )}
                {!isRefreshing && !canRefresh && (
                  <p>
                    Refresh on cooldown
                    {timeUntilRefresh
                      ? `. Available in ${timeUntilRefresh}`
                      : ''}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface RefreshProgressProps {
  isRefreshing: boolean;
  progress?: number;
  message?: string;
  stage?: 'summoner' | 'ranked' | 'matches' | 'cleanup';
}

export function RefreshProgress({
  isRefreshing,
  progress,
  message,
  stage,
}: RefreshProgressProps) {
  if (!isRefreshing) return null;

  const getStageMessage = () => {
    if (message) return message;

    switch (stage) {
      case 'summoner':
        return 'Updating summoner information...';
      case 'ranked':
        return 'Fetching ranked data...';
      case 'matches':
        return 'Processing match history...';
      case 'cleanup':
        return 'Cleaning up old data...';
      default:
        return 'Refreshing account data...';
    }
  };

  return (
    <div className="flex items-center space-x-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-400">{getStageMessage()}</p>
        {progress !== undefined && (
          <div className="mt-1">
            <div className="h-2 w-full rounded-full bg-blue-900/30">
              <div
                className="h-2 rounded-full bg-blue-400 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-blue-300">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface RefreshResultProps {
  result: {
    success: boolean;
    message: string;
    data?: {
      summoner_updated: boolean;
      ranked_updated: boolean;
      matches_added: number;
      matches_removed: number;
      errors: string[];
      warnings: string[];
      partial_success?: boolean;
    };
  } | null;
  onDismiss?: () => void;
}

export function RefreshResult({ result, onDismiss }: RefreshResultProps) {
  if (!result) return null;

  const { success, message, data } = result;
  const hasErrors = (data?.errors?.length ?? 0) > 0;
  const hasWarnings = (data?.warnings?.length ?? 0) > 0;
  const partialSuccess = data?.partial_success;

  const getStatusColor = () => {
    if (hasErrors || !success) return 'red';
    if (hasWarnings || partialSuccess) return 'yellow';
    return 'green';
  };

  const getStatusClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          container: 'p-4 bg-red-500/10 border border-red-500/20 rounded-lg',
          icon: 'h-5 w-5 text-red-400',
          text: 'font-medium text-red-400',
          button: 'text-red-400 hover:text-red-300 text-sm',
        };
      case 'yellow':
        return {
          container:
            'p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg',
          icon: 'h-5 w-5 text-yellow-400',
          text: 'font-medium text-yellow-400',
          button: 'text-yellow-400 hover:text-yellow-300 text-sm',
        };
      case 'green':
      default:
        return {
          container:
            'p-4 bg-green-500/10 border border-green-500/20 rounded-lg',
          icon: 'h-5 w-5 text-green-400',
          text: 'font-medium text-green-400',
          button: 'text-green-400 hover:text-green-300 text-sm',
        };
    }
  };

  const statusColor = getStatusColor();
  const statusClasses = getStatusClasses(statusColor);

  return (
    <div className={statusClasses.container}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {success ? (
            <CheckCircle className={statusClasses.icon} />
          ) : (
            <RefreshCw className={statusClasses.icon} />
          )}
          <div className="flex-1">
            <p className={statusClasses.text}>{message}</p>

            {data && (
              <div className="mt-2 space-y-1">
                {data.summoner_updated && (
                  <p className="text-xs text-white/70">
                    ✓ Summoner data updated
                  </p>
                )}
                {data.ranked_updated && (
                  <p className="text-xs text-white/70">
                    ✓ Ranked information updated
                  </p>
                )}
                {data.matches_added > 0 && (
                  <p className="text-xs text-white/70">
                    ✓ {data.matches_added} new matches added
                  </p>
                )}
                {data.matches_removed > 0 && (
                  <p className="text-xs text-white/70">
                    ✓ {data.matches_removed} old matches cleaned up
                  </p>
                )}

                {hasWarnings && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-yellow-400">
                      Warnings:
                    </p>
                    {data.warnings.map((warning, i) => (
                      <p key={i} className="text-xs text-yellow-300">
                        • {warning}
                      </p>
                    ))}
                  </div>
                )}

                {hasErrors && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-400">Errors:</p>
                    {data.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-300">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button onClick={onDismiss} className={statusClasses.button}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
