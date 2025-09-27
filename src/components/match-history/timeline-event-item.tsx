"use client";

import React, { memo } from 'react';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { Swords, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName: string;
  championName: string;
  championId: number;
  teamId: number;
}

interface TimelineEvent {
  type: string;
  killerId?: number;
  victimId?: number;
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  teamId?: number;
  timestamp: number;
}

interface TimelineEventItemProps {
  event: TimelineEvent;
  participants: Participant[];
  participantPuuids: string[];
  className?: string;
}

const TimelineEventItemComponent = memo(function TimelineEventItem({ 
  event, 
  participants, 
  participantPuuids,
  className 
}: TimelineEventItemProps) {
  const getParticipantByIndex = (index: number): Participant | null => {
    const puuid = participantPuuids[index - 1];
    return participants.find(p => p.puuid === puuid) || null;
  };

  const getDisplayName = (participant: Participant | null): string => {
    if (!participant) return 'Unknown';
    
    if (participant.riotIdGameName && participant.riotIdTagline) {
      return `${participant.riotIdGameName}#${participant.riotIdTagline}`;
    }
    
    return participant.riotIdGameName || participant.summonerName || 'Unknown';
  };

  const formatMonsterType = (monsterType?: string, monsterSubType?: string): string => {
    if (!monsterType) return 'Epic Monster';
    
    const formatted = monsterType.toLowerCase().replace(/_/g, ' ');
    
    // Special cases for better display
    switch (monsterType) {
      case 'DRAGON':
        return monsterSubType ? 
          `${monsterSubType.charAt(0) + monsterSubType.slice(1).toLowerCase()} Dragon` : 
          'Dragon';
      case 'BARON_NASHOR':
        return 'Baron Nashor';
      case 'RIFTHERALD':
        return 'Rift Herald';
      default:
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  };

  const formatBuildingType = (buildingType?: string): string => {
    if (!buildingType) return 'Structure';
    
    const formatted = buildingType.toLowerCase().replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const renderChampionKill = () => {
    const killer = event.killerId ? getParticipantByIndex(event.killerId) : null;
    const victim = event.victimId ? getParticipantByIndex(event.victimId) : null;

    return (
      <div className="flex items-center gap-3 text-sm">
        <Swords className="h-4 w-4 text-red-400 flex-shrink-0" />
        
        {/* Killer */}
        <div className="flex items-center gap-2">
          {killer && (
            <ChampionIcon 
              championId={killer.championName} 
              size="xs"
              className="border border-white/20 rounded-full"
            />
          )}
          <span className="text-white font-medium">
            {killer?.championName || 'Unknown'}
          </span>
          <span className="text-white/60 text-xs">
            ({getDisplayName(killer)})
          </span>
        </div>

        {/* Killed text */}
        <span className="text-red-400 font-medium">killed</span>

        {/* Victim */}
        <div className="flex items-center gap-2">
          {victim && (
            <ChampionIcon 
              championId={victim.championName} 
              size="xs"
              className="border border-white/20 rounded-full"
            />
          )}
          <span className="text-white font-medium">
            {victim?.championName || 'Unknown'}
          </span>
          <span className="text-white/60 text-xs">
            ({getDisplayName(victim)})
          </span>
        </div>
      </div>
    );
  };

  const renderEliteMonsterKill = () => {
    const killer = event.killerId ? getParticipantByIndex(event.killerId) : null;

    return (
      <div className="flex items-center gap-3 text-sm">
        <Trophy className="h-4 w-4 text-purple-400 flex-shrink-0" />
        
        {/* Killer */}
        <div className="flex items-center gap-2">
          {killer && (
            <ChampionIcon 
              championId={killer.championName} 
              size="xs"
              className="border border-white/20 rounded-full"
            />
          )}
          <span className="text-white font-medium">
            {killer?.championName || 'Unknown'}
          </span>
          <span className="text-white/60 text-xs">
            ({getDisplayName(killer)})
          </span>
        </div>

        {/* Killed text */}
        <span className="text-purple-400 font-medium">slayed</span>

        {/* Monster */}
        <span className="text-purple-300 font-medium">
          {formatMonsterType(event.monsterType, event.monsterSubType)}
        </span>
      </div>
    );
  };

  const renderBuildingKill = () => {
    const teamColor = event.teamId === 100 ? 'text-blue-400' : 'text-red-400';
    const teamName = event.teamId === 100 ? 'Blue' : 'Red';

    return (
      <div className="flex items-center gap-3 text-sm">
        <Target className="h-4 w-4 text-yellow-400 flex-shrink-0" />
        
        {/* Team indicator */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
          event.teamId === 100 ? 'bg-blue-500' : 'bg-red-500'
        }`} />
        
        <span className={`font-medium ${teamColor}`}>
          {teamName} team
        </span>
        
        <span className="text-yellow-400 font-medium">destroyed</span>
        
        <span className="text-yellow-300 font-medium">
          {formatBuildingType(event.buildingType)}
        </span>
      </div>
    );
  };

  const renderDragonSoulGiven = () => {
    const teamColor = event.teamId === 100 ? 'text-blue-400' : 'text-red-400';
    const teamName = event.teamId === 100 ? 'Blue' : 'Red';

    return (
      <div className="flex items-center gap-3 text-sm">
        <Trophy className="h-4 w-4 text-orange-400 flex-shrink-0" />
        
        {/* Team indicator */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
          event.teamId === 100 ? 'bg-blue-500' : 'bg-red-500'
        }`} />
        
        <span className={`font-medium ${teamColor}`}>
          {teamName} team
        </span>
        
        <span className="text-orange-400 font-medium">claimed</span>
        
        <span className="text-orange-300 font-medium">
          Dragon Soul
        </span>
      </div>
    );
  };

  const renderUnknownEvent = () => {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="h-4 w-4 rounded-full bg-white/20 flex-shrink-0" />
        <span className="text-white/60">
          {event.type.replace(/_/g, ' ').toLowerCase()}
        </span>
      </div>
    );
  };

  return (
    <div className={cn(
      "p-3 rounded-lg bg-gradient-to-r from-black/10 to-black/5 border border-white/10",
      "backdrop-blur-sm hover:bg-gradient-to-r hover:from-black/20 hover:to-black/10",
      "transition-all duration-200",
      className
    )}>
      {event.type === 'CHAMPION_KILL' && renderChampionKill()}
      {event.type === 'ELITE_MONSTER_KILL' && renderEliteMonsterKill()}
      {event.type === 'BUILDING_KILL' && renderBuildingKill()}
      {event.type === 'DRAGON_SOUL_GIVEN' && renderDragonSoulGiven()}
      {!['CHAMPION_KILL', 'ELITE_MONSTER_KILL', 'BUILDING_KILL', 'DRAGON_SOUL_GIVEN'].includes(event.type) && 
        renderUnknownEvent()
      }
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.event.type === nextProps.event.type &&
    prevProps.event.timestamp === nextProps.event.timestamp &&
    prevProps.event.killerId === nextProps.event.killerId &&
    prevProps.event.victimId === nextProps.event.victimId &&
    prevProps.event.monsterType === nextProps.event.monsterType &&
    prevProps.event.buildingType === nextProps.event.buildingType &&
    prevProps.event.teamId === nextProps.event.teamId &&
    prevProps.className === nextProps.className &&
    prevProps.participantPuuids.length === nextProps.participantPuuids.length &&
    prevProps.participants.length === nextProps.participants.length
  );
});

export { TimelineEventItemComponent as TimelineEventItem };
