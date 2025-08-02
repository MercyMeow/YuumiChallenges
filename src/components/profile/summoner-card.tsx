'use client';

import { Button } from '@/components/ui/button';
import { Shield, X, CheckCircle } from 'lucide-react';

interface SummonerCardProps {
  summoner: {
    id: string;
    puuid: string;
    game_name: string;
    tag_line: string;
    region: string;
    level: number;
    profile_icon_id: number;
    ranked_info?: Array<{
      tier: string;
      rank_level: string;
      league_points: number;
      wins: number;
      losses: number;
      queue_type: string;
    }>;
  };
  onRemove: (id: string) => void;
}

function RankEmblem({ tier }: { tier: string }) {
  const emblemProps = {
    className: "w-8 h-8 flex-shrink-0",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  };

  switch (tier) {
    case 'IRON':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM4 8.5l8-3.5 8 3.5v7l-8 3.5L4 15.5v-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'BRONZE':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM4 8.5l8-3.5 8 3.5v7l-8 3.5L4 15.5v-7z" />
          <path d="M8 10h8v4H8z" />
        </svg>
      );
    case 'SILVER':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM4 8.5l8-3.5 8 3.5v7l-8 3.5L4 15.5v-7z" />
          <path d="M9 9h6v6H9z" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'GOLD':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <path d="M8 8h8v8H8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'PLATINUM':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <polygon points="12,6 16,10 12,14 8,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="10" r="1.5" />
        </svg>
      );
    case 'DIAMOND':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <polygon points="12,4 18,10 12,16 6,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="12,6 16,10 12,14 8,10" />
        </svg>
      );
    case 'MASTER':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <polygon points="12,3 19,9 12,15 5,9" />
          <circle cx="12" cy="9" r="2" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      );
    case 'GRANDMASTER':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <polygon points="12,3 19,9 12,15 5,9" />
          <path d="M8 7l4-2 4 2v6l-4 2-4-2V7z" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      );
    case 'CHALLENGER':
      return (
        <svg {...emblemProps}>
          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          <polygon points="12,2 22,8 12,14 2,8" />
          <circle cx="12" cy="8" r="3" fill="none" stroke="white" strokeWidth="1.5" />
          <path d="M10 6l2 4 2-4" stroke="white" strokeWidth="1" fill="none" />
        </svg>
      );
    default:
      return (
        <svg {...emblemProps}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

function RankBadge({ rank }: { rank?: { tier: string; rank_level: string; league_points: number; wins: number; losses: number; queue_type: string } | undefined }) {
  if (!rank) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-lg backdrop-blur-sm">
        <RankEmblem tier="UNRANKED" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-400">Unranked</span>
          <span className="text-xs text-gray-500">No rank</span>
        </div>
      </div>
    );
  }

  const tierStyles = {
    IRON: {
      gradient: 'from-amber-900/20 to-amber-800/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20'
    },
    BRONZE: {
      gradient: 'from-orange-800/20 to-orange-700/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20'
    },
    SILVER: {
      gradient: 'from-gray-400/20 to-gray-500/20',
      border: 'border-gray-400/30',
      text: 'text-gray-300',
      glow: 'shadow-gray-400/20'
    },
    GOLD: {
      gradient: 'from-yellow-500/20 to-yellow-600/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20'
    },
    PLATINUM: {
      gradient: 'from-cyan-500/20 to-cyan-600/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    DIAMOND: {
      gradient: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    MASTER: {
      gradient: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    GRANDMASTER: {
      gradient: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-red-500/20'
    },
    CHALLENGER: {
      gradient: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
      border: 'border-gradient-to-r border-indigo-500/30',
      text: 'text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text',
      glow: 'shadow-purple-500/30'
    }
  };

  const style = tierStyles[rank.tier as keyof typeof tierStyles] || tierStyles.IRON;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-br ${style.gradient} border ${style.border} rounded-lg backdrop-blur-sm ${style.glow} shadow-lg hover:scale-105 transition-transform duration-200`}>
      <div className={style.text}>
        <RankEmblem tier={rank.tier} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${style.text}`}>
            {rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()}
          </span>
          <span className={`text-sm font-semibold ${style.text}`}>
            {rank.rank_level}
          </span>
        </div>
        <span className="text-xs text-white/70">
          {rank.league_points} LP
        </span>
      </div>
    </div>
  );
}

export function SummonerCard({ summoner, onRemove }: SummonerCardProps) {
  const primaryRank = summoner.ranked_info?.find(r => r.queue_type === 'RANKED_SOLO_5x5');
  const flexRank = summoner.ranked_info?.find(r => r.queue_type === 'RANKED_FLEX_SR');
  const winRate = primaryRank ? 
    Math.round((primaryRank.wins / (primaryRank.wins + primaryRank.losses)) * 100) : 0;
  const flexWinRate = flexRank ? 
    Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 border border-purple-500/20 rounded-xl backdrop-blur-md shadow-xl p-6 hover:shadow-purple-500/10 transition-all duration-300">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 shadow-lg">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{summoner.game_name}</h3>
              <span className="text-lg font-bold text-purple-400">#{summoner.tag_line}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="px-2 py-1 bg-purple-500/20 rounded-md border border-purple-500/30 text-purple-300 font-medium">
                {summoner.region.toUpperCase()}
              </span>
              <span>•</span>
              <span>Level {summoner.level}</span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(summoner.puuid)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg p-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Rank Display Section */}
      <div className="space-y-3">
        {/* Solo/Duo Rank */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white/80">Solo/Duo Queue</h4>
            {primaryRank && (
              <div className="text-xs text-white/60">
                {primaryRank.wins}W {primaryRank.losses}L ({winRate}% WR)
              </div>
            )}
          </div>
          <RankBadge rank={primaryRank} />
        </div>

        {/* Flex Rank (if exists) */}
        {flexRank && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white/80">Flex Queue</h4>
              <div className="text-xs text-white/60">
                {flexRank.wins}W {flexRank.losses}L ({flexWinRate}% WR)
              </div>
            </div>
            <RankBadge rank={flexRank} />
          </div>
        )}

        {/* No Rank State */}
        {!primaryRank && !flexRank && (
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-2">Ranked Status</h4>
            <RankBadge />
          </div>
        )}
      </div>
    </div>
  );
}