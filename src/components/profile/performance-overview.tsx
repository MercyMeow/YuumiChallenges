'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Trophy, Zap } from 'lucide-react';

interface PerformanceOverviewProps {
  stats: {
    totalGames: number;
    overallKDA: number;
    favoriteChampion: string;
    currentRank: string;
  };
  summoners: Array<{
    id: string;
    verified: boolean;
    ranked_info?: Array<{
      tier: string;
      rank_level: string;
      wins: number;
      losses: number;
      queue_type: string;
    }>;
  }>;
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500/5 to-cyan-500/5 border-blue-500/20',
    green: 'from-green-500/5 to-emerald-500/5 border-green-500/20',
    purple: 'from-purple-500/5 to-indigo-500/5 border-purple-500/20',
    orange: 'from-orange-500/5 to-red-500/5 border-orange-500/20',
  };

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>
            <Icon className={`h-5 w-5 ${iconColors[color]}`} />
          </div>
          {trend && (
            <div className="flex items-center">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm font-medium text-gray-300">{title}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceOverview({ stats, summoners }: PerformanceOverviewProps) {
  const verifiedSummoners = summoners.filter(s => s.verified);
  const rankedSummoners = verifiedSummoners.filter(s => s.ranked_info?.length);
  
  // Calculate overall win rate
  const totalWins = rankedSummoners.reduce((sum, summoner) => {
    return sum + (summoner.ranked_info?.reduce((wins, rank) => wins + rank.wins, 0) || 0);
  }, 0);
  
  const totalLosses = rankedSummoners.reduce((sum, summoner) => {
    return sum + (summoner.ranked_info?.reduce((losses, rank) => losses + rank.losses, 0) || 0);
  }, 0);
  
  const overallWinRate = totalWins + totalLosses > 0 ? 
    Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  // Get highest rank
  const allRanks = rankedSummoners.flatMap(s => s.ranked_info || []);
  const soloQueueRanks = allRanks.filter(r => r.queue_type === 'RANKED_SOLO_5x5');
  const highestRank = soloQueueRanks.sort((a, b) => {
    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const rankOrder = ['IV', 'III', 'II', 'I'];
    
    const tierA = tierOrder.indexOf(a.tier);
    const tierB = tierOrder.indexOf(b.tier);
    
    if (tierA !== tierB) return tierB - tierA;
    
    const rankA = rankOrder.indexOf(a.rank_level);
    const rankB = rankOrder.indexOf(b.rank_level);
    
    return rankB - rankA;
  })[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Games"
          value={stats.totalGames}
          description="All time played"
          icon={Target}
          color="blue"
        />
        
        <StatCard
          title="Overall KDA"
          value={stats.overallKDA}
          description="Kill/Death/Assist ratio"
          icon={Zap}
          color="purple"
          trend={stats.overallKDA > 2 ? 'up' : stats.overallKDA < 1.5 ? 'down' : 'neutral'}
        />
        
        <StatCard
          title="Win Rate"
          value={`${overallWinRate}%`}
          description="Ranked games this season"
          icon={Trophy}
          color="green"
          trend={overallWinRate > 60 ? 'up' : overallWinRate < 45 ? 'down' : 'neutral'}
        />
        
        <StatCard
          title="Peak Rank"
          value={highestRank ? `${highestRank.tier} ${highestRank.rank_level}` : 'Unranked'}
          description="Highest achieved rank"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Verified Accounts</span>
                <span className="text-sm font-medium text-white">
                  {verifiedSummoners.length} / {summoners.length}
                </span>
              </div>
              <Progress 
                value={(verifiedSummoners.length / Math.max(summoners.length, 1)) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Ranked Accounts</span>
                <span className="text-sm font-medium text-white">
                  {rankedSummoners.length} / {verifiedSummoners.length}
                </span>
              </div>
              <Progress 
                value={(rankedSummoners.length / Math.max(verifiedSummoners.length, 1)) * 100} 
                className="h-2"
              />
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {stats.favoriteChampion} Main
            </Badge>
            {highestRank && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {highestRank.tier} Player
              </Badge>
            )}
            {overallWinRate > 60 && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                High Win Rate
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}