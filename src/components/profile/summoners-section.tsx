'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { SummonerCard } from './summoner-card';
import { AddSummonerDialog } from './add-summoner-dialog';

interface SummonersSectionProps {
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
  } | null;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-blue-500/20 rounded-full">
          <Gamepad2 className="h-8 w-8 text-blue-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No League account linked</h3>
      <p className="text-gray-400 mb-6">
        Link your League of Legends account to start tracking your performance
      </p>
      <AddSummonerDialog onAdd={onAdd} />
    </div>
  );
}

export function SummonersSection({ summoner, onAdd, onRemove }: SummonersSectionProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-blue-400" />
              League Account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your linked League of Legends summoner account
            </CardDescription>
          </div>
          {!summoner && <AddSummonerDialog onAdd={onAdd} />}
        </div>
      </CardHeader>
      <CardContent>
        {!summoner ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <div className="flex items-center justify-between">
            <SummonerCard
              summoner={summoner}
              onRemove={onRemove}
            />
            <div className="ml-4">
              <AddSummonerDialog 
                onAdd={onAdd} 
                variant="change"
                disabled={!!summoner}
                buttonText="Change Account"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}