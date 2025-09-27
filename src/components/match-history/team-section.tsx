'use client';

import { PlayersList } from './player-row';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DetailedMatchParticipant, DetailedMatchTeam, EnhancedMatchParticipant } from '@/lib/types';
import { Trophy, Target, Eye, Crown, Shield, Sword } from 'lucide-react';

interface TeamSectionProps {
  team: DetailedMatchTeam;
  participants: (DetailedMatchParticipant | EnhancedMatchParticipant)[];
  currentUserPuuid?: string;
  side: 'blue' | 'red';
  compact?: boolean;
  className?: string;
}

export function TeamSection({ 
  team, 
  participants, 
  currentUserPuuid,
  side,
  compact = false,
  className = ''
}: TeamSectionProps) {
  // Ensure participants is an array before filtering
  const safeParticipants = Array.isArray(participants) ? participants : [];
  const teamParticipants = safeParticipants.filter(p => p.teamId === team.teamId);
  const isWinning = team.win;
  
  const getTeamColor = (side: 'blue' | 'red', isWin: boolean) => {
    if (isWin) {
      return side === 'blue' 
        ? 'border-l-accessible-blue bg-accessible-blue/10' 
        : 'border-l-accessible-red bg-accessible-red/10';
    }
    return side === 'blue'
      ? 'border-l-accessible-blue/50 bg-accessible-blue/5'
      : 'border-l-accessible-red/50 bg-accessible-red/5';
  };

  const getHeaderColor = (side: 'blue' | 'red') => {
    return side === 'blue' ? 'text-accessible-blue' : 'text-accessible-red';
  };

  const getResultBadge = (isWin: boolean) => {
    return isWin ? (
      <Badge 
        className="bg-accessible-green/20 text-accessible-green border-accessible-green/30"
        aria-label="Team result: Victory"
      >
        <Trophy className="h-3 w-3 mr-1" aria-hidden="true" />
        Victory
      </Badge>
    ) : (
      <Badge 
        variant="destructive" 
        className="bg-accessible-red/20 text-accessible-red border-accessible-red/30"
        aria-label="Team result: Defeat"
      >
        Defeat
      </Badge>
    );
  };

  // Calculate team stats with proper type handling
  const teamStats = teamParticipants.reduce((acc, p) => ({
    kills: acc.kills + (p.kills || 0),
    deaths: acc.deaths + (p.deaths || 0),
    assists: acc.assists + (p.assists || 0),
    gold: acc.gold + (p.goldEarned || 0),
    cs: acc.cs + (p.totalMinionsKilled || 0),
    vision: acc.vision + (p.visionScore || 0),
  }), { kills: 0, deaths: 0, assists: 0, gold: 0, cs: 0, vision: 0 });

  if (compact) {
    return (
      <div className={`rounded-lg border-l-4 ${getTeamColor(side, isWinning)} backdrop-blur-md border border-white/10 ${className}`}>
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className={`font-semibold ${getHeaderColor(side)}`}>
              {side === 'blue' ? 'Blue Team' : 'Red Team'}
            </h3>
            {getResultBadge(isWinning)}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>{teamStats.kills}/{teamStats.deaths}/{teamStats.assists}</span>
            <span>{Math.round(teamStats.gold / 1000)}k gold</span>
          </div>
        </div>
        
        {/* Compact Players */}
        <div className="p-3">
          <PlayersList 
            participants={teamParticipants} 
            {...(currentUserPuuid ? { currentUserPuuid } : {})}
            compact={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-l-4 ${getTeamColor(side, isWinning)} backdrop-blur-md border border-white/10 ${className}`}>
      {/* Team Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-bold ${getHeaderColor(side)}`}>
              {side === 'blue' ? 'Blue Team' : 'Red Team'}
            </h3>
            {getResultBadge(isWinning)}
          </div>
        </div>

        {/* Team Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center" role="group" aria-label="Team statistics">
          <div className="p-2 bg-black/20 rounded">
            <div className="flex items-center justify-center gap-1 text-accessible-green text-sm font-semibold">
              <Sword className="h-3 w-3" aria-hidden="true" />
              {teamStats.kills}
            </div>
            <div className="text-xs text-white/60">Kills</div>
          </div>
          
          <div className="p-2 bg-black/20 rounded">
            <div className="flex items-center justify-center gap-1 text-accessible-red text-sm font-semibold">
              <Target className="h-3 w-3" aria-hidden="true" />
              {teamStats.deaths}
            </div>
            <div className="text-xs text-white/60">Deaths</div>
          </div>
          
          <div className="p-2 bg-black/20 rounded">
            <div className="flex items-center justify-center gap-1 text-accessible-blue text-sm font-semibold">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {teamStats.assists}
            </div>
            <div className="text-xs text-white/60">Assists</div>
          </div>
          
          <div className="p-2 bg-black/20 rounded">
            <div className="flex items-center justify-center gap-1 text-accessible-yellow text-sm font-semibold">
              <Crown className="h-3 w-3" aria-hidden="true" />
              {Math.round(teamStats.gold / 1000)}k
            </div>
            <div className="text-xs text-white/60">Gold</div>
          </div>
          
          <div className="p-2 bg-black/20 rounded">
            <div className="text-accessible-purple text-sm font-semibold">
              {teamStats.cs}
            </div>
            <div className="text-xs text-white/60">CS</div>
          </div>
          
          <div className="p-2 bg-black/20 rounded">
            <div className="flex items-center justify-center gap-1 text-accessible-pink text-sm font-semibold">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {teamStats.vision}
            </div>
            <div className="text-xs text-white/60">Vision</div>
          </div>
        </div>

        {/* Objectives (if available) */}
        {team.objectives && (
          <div className="mt-3 flex flex-wrap gap-2">
            {team.objectives.baron?.kills > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                    Baron {team.objectives.baron.kills}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baron kills: {team.objectives.baron.kills}</p>
                  {team.objectives.baron.first && <p>First Baron</p>}
                </TooltipContent>
              </Tooltip>
            )}
            
            {team.objectives.dragon?.kills > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                    Dragon {team.objectives.dragon.kills}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dragon kills: {team.objectives.dragon.kills}</p>
                  {team.objectives.dragon.first && <p>First Dragon</p>}
                </TooltipContent>
              </Tooltip>
            )}
            
            {team.objectives.tower?.kills > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                    Tower {team.objectives.tower.kills}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tower kills: {team.objectives.tower.kills}</p>
                  {team.objectives.tower.first && <p>First Tower</p>}
                </TooltipContent>
              </Tooltip>
            )}
            
            {team.objectives.inhibitor?.kills > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-red-400 border-red-500/30">
                    Inhibitor {team.objectives.inhibitor.kills}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Inhibitor kills: {team.objectives.inhibitor.kills}</p>
                  {team.objectives.inhibitor.first && <p>First Inhibitor</p>}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="p-4">
        <PlayersList 
          participants={teamParticipants} 
          {...(currentUserPuuid ? { currentUserPuuid } : {})}
          compact={false}
        />
      </div>
    </div>
  );
}

interface TeamsComparisonProps {
  blueTeam: DetailedMatchTeam;
  redTeam: DetailedMatchTeam;
  participants: (DetailedMatchParticipant | EnhancedMatchParticipant)[];
  currentUserPuuid?: string;
  compact?: boolean;
  layout?: 'side-by-side' | 'stacked';
  className?: string;
}

export function TeamsComparison({
  blueTeam,
  redTeam,
  participants,
  currentUserPuuid,
  compact = false,
  layout = 'side-by-side',
  className = ''
}: TeamsComparisonProps) {
  const isStacked = layout === 'stacked';
  const gridCols = isStacked ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2';
  const gap = isStacked ? 'gap-4' : 'gap-4 xl:gap-6';

  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      <TeamSection
        team={blueTeam}
        participants={participants}
        {...(currentUserPuuid ? { currentUserPuuid } : {})}
        side="blue"
        compact={compact}
      />
      <TeamSection
        team={redTeam}
        participants={participants}
        {...(currentUserPuuid ? { currentUserPuuid } : {})}
        side="red"
        compact={compact}
      />
    </div>
  );
}
