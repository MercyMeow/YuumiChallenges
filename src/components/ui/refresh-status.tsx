'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  className = ""
}: RefreshStatusIndicatorProps) {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!refreshStatus) return;

    const updateTimer = () => {
      if (showManualRefresh && !refreshStatus.can_manual_refresh && refreshStatus.next_manual_refresh) {
        const remaining = formatTimeRemaining(refreshStatus.next_manual_refresh);
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

  const canRefresh = showManualRefresh ? refreshStatus.can_manual_refresh : refreshStatus.can_refresh;
  const lastRefreshTime = showManualRefresh ? 
    refreshStatus.last_manual_refresh_at : 
    refreshStatus.last_refreshed_at;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Refresh Status Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={canRefresh ? 'default' : 'secondary'}
              className={`flex items-center space-x-1 ${
                canRefresh 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : canRefresh ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="text-xs">
                {isRefreshing ? 'Refreshing' : canRefresh ? 'Ready' : 'Cooldown'}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              {isRefreshing && <p>Refreshing account data...</p>}
              {!isRefreshing && canRefresh && <p>Account can be refreshed</p>}
              {!isRefreshing && !canRefresh && (
                <p>Refresh on cooldown{timeUntilRefresh ? `. Available in ${timeUntilRefresh}` : ''}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last Refresh Time */}
      {showLastRefresh && lastRefreshTime && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-white/60 flex items-center space-x-1">
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
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={!canRefresh || isRefreshing}
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing' : !canRefresh ? (timeUntilRefresh ? `Wait ${timeUntilRefresh}` : 'Cooldown') : 'Refresh'}
        </Button>
      )}
    </div>
  );
}

interface RefreshProgressProps {
  isRefreshing: boolean;
  progress?: number;
  message?: string;
}

export function RefreshProgress({ isRefreshing, progress, message }: RefreshProgressProps) {
  if (!isRefreshing) return null;

  return (
    <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
      <div className="flex-1">
        <p className="text-sm text-blue-400 font-medium">
          {message || 'Refreshing account data...'}
        </p>
        {progress !== undefined && (
          <div className="mt-1">
            <div className="w-full bg-blue-900/30 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="text-xs text-blue-300 mt-1">{Math.round(progress)}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}