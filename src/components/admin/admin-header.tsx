'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User, Activity } from 'lucide-react';

interface AdminHeaderProps {
  user: {
    id: string;
    name: string;
    image?: string | undefined;
    user_role: string;
    discord_id: string;
    is_yuumi_member: boolean;
  };
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  activeChallenges: number;
  completedChallenges: number;
  pendingReports: number;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    pendingReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Administrator';
      default:
        return 'Member';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/5 border-red-500/20 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`flex items-center space-x-1 ${getRoleColor(user.user_role)}`}>
                  {getRoleIcon(user.user_role)}
                  <span>{getRoleDisplayName(user.user_role)}</span>
                </Badge>
                <span className="text-sm text-gray-400">
                  Welcome back, {user.name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {isLoading ? '...' : stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Users</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {isLoading ? '...' : stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Active Users</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {isLoading ? '...' : stats.activeChallenges.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Active Challenges</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${stats.pendingReports > 0 ? 'text-red-400' : 'text-white'}`}>
                {isLoading ? '...' : stats.pendingReports.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Pending Reports</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}