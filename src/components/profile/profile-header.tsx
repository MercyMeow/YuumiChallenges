'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Shield, User } from 'lucide-react';

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    image?: string;
    user_role: string;
    is_yuumi_member: boolean;
  };
  stats: {
    totalGames: number;
    overallKDA: number;
    favoriteChampion: string;
    currentRank: string;
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-purple-500/30 ring-2 ring-purple-500/20">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400">Discord Member</p>
              <div className="flex items-center gap-2 mt-2">
                {user.is_yuumi_member && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Yuumi Main
                  </Badge>
                )}
                <Badge className={`border ${getRoleColor(user.user_role)}`}>
                  {getRoleIcon(user.user_role)}
                  <span className="ml-1 capitalize">{user.user_role}</span>
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ml-auto">
            <StatCard label="Total Games" value={stats.totalGames} />
            <StatCard label="Overall KDA" value={stats.overallKDA} />
            <StatCard label="Favorite Champion" value={stats.favoriteChampion} />
            <StatCard label="Current Rank" value={stats.currentRank} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}