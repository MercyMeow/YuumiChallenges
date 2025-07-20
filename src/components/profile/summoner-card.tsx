'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, X, CheckCircle } from 'lucide-react';

interface SummonerCardProps {
  summoner: {
    id: string;
    puuid: string;
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

function RankBadge({ rank }: { rank?: { tier: string; rank_level: string; league_points: number } }) {
  if (!rank) {
    return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">Unranked</Badge>;
  }

  const tierColors = {
    IRON: 'bg-amber-900/20 text-amber-400',
    BRONZE: 'bg-yellow-800/20 text-yellow-400',
    SILVER: 'bg-gray-400/20 text-gray-300',
    GOLD: 'bg-yellow-500/20 text-yellow-400',
    PLATINUM: 'bg-cyan-500/20 text-cyan-400',
    DIAMOND: 'bg-blue-500/20 text-blue-400',
    MASTER: 'bg-purple-500/20 text-purple-400',
    GRANDMASTER: 'bg-red-500/20 text-red-400',
    CHALLENGER: 'bg-rainbow text-white',
  };

  const colorClass = tierColors[rank.tier as keyof typeof tierColors] || 'bg-gray-500/20 text-gray-400';

  return (
    <Badge className={`${colorClass} border-current/30`}>
      {rank.tier} {rank.rank_level} ({rank.league_points} LP)
    </Badge>
  );
}

export function SummonerCard({ summoner, onRemove }: SummonerCardProps) {
  const primaryRank = summoner.ranked_info?.find(r => r.queue_type === 'RANKED_SOLO_5x5');
  const winRate = primaryRank ? 
    Math.round((primaryRank.wins / (primaryRank.wins + primaryRank.losses)) * 100) : 0;

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Shield className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{summoner.tag_line}</h3>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-sm text-gray-400">
            {summoner.region.toUpperCase()} • Level {summoner.level}
            {primaryRank && (
              <span className="ml-2">
                • {primaryRank.wins}W {primaryRank.losses}L ({winRate}%)
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <RankBadge rank={primaryRank} />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(summoner.id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}