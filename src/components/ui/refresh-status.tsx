'use client';

import { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge'; // Unused for now
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
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing' : !canRefresh ? (timeUntilRefresh ? `Wait ${timeUntilRefresh}` : 'Cooldown') : 'Refresh'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                {isRefreshing && <p>Refreshing account data...</p>}
                {!isRefreshing && canRefresh && <p>Click to refresh account data</p>}
                {!isRefreshing && !canRefresh && (
                  <p>Refresh on cooldown{timeUntilRefresh ? `. Available in ${timeUntilRefresh}` : ''}</p>
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

export function RefreshProgress({ isRefreshing, progress, message, stage }: RefreshProgressProps) {
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
    <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
      <div className="flex-1">
        <p className="text-sm text-blue-400 font-medium">
          {getStageMessage()}
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

  const statusColor = getStatusColor();

  return (
    <div className={`p-4 bg-${statusColor}-500/10 border border-${statusColor}-500/20 rounded-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {success ? (
            <CheckCircle className={`h-5 w-5 text-${statusColor}-400`} />
          ) : (
            <RefreshCw className={`h-5 w-5 text-${statusColor}-400`} />
          )}
          <div className="flex-1">
            <p className={`font-medium text-${statusColor}-400`}>{message}</p>
            
            {data && (
              <div className="mt-2 space-y-1">
                {data.summoner_updated && (
                  <p className="text-xs text-white/70">✓ Summoner data updated</p>
                )}
                {data.ranked_updated && (
                  <p className="text-xs text-white/70">✓ Ranked information updated</p>
                )}
                {data.matches_added > 0 && (
                  <p className="text-xs text-white/70">✓ {data.matches_added} new matches added</p>
                )}
                {data.matches_removed > 0 && (
                  <p className="text-xs text-white/70">✓ {data.matches_removed} old matches cleaned up</p>
                )}
                
                {hasWarnings && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-400 font-medium">Warnings:</p>
                    {data.warnings.map((warning, i) => (
                      <p key={i} className="text-xs text-yellow-300">• {warning}</p>
                    ))}
                  </div>
                )}
                
                {hasErrors && (
                  <div className="mt-2">
                    <p className="text-xs text-red-400 font-medium">Errors:</p>
                    {data.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-300">• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className={`text-${statusColor}-400 hover:text-${statusColor}-300 text-sm`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}