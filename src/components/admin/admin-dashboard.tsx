'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';

interface AdminPermissions {
  viewUsers: boolean;
  viewChallenges: boolean;
  viewReports: boolean;
  moderateContent: boolean;
  createChallenges: boolean;
  editChallenges: boolean;
  deleteChallenges: boolean;
  manageUsers: boolean;
  viewSystemStats: boolean;
  manageRoles: boolean;
  systemSettings: boolean;
}

interface AdminDashboardProps { // eslint-disable-line @typescript-eslint/no-unused-vars
  permissions: AdminPermissions;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  activeChallenges: number;
  completedChallenges: number;
  pendingReports: number;
  userGrowth: number;
  challengeGrowth: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'user_joined' | 'challenge_completed' | 'challenge_created';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    image?: string;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    pendingReports: 0,
    userGrowth: 0,
    challengeGrowth: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    urgent = false 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ElementType;
    color: string;
    urgent?: boolean;
  }) => (
    <Card className={`bg-gradient-to-br from-${color}-500/5 to-${color}-600/5 border-${color}-500/20 backdrop-blur-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${urgent ? 'text-red-400' : 'text-white'}`}>
              {isLoading ? '...' : value.toLocaleString()}
            </p>
            {change !== undefined && !isLoading && (
              <div className={`flex items-center space-x-1 mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">
                  {change >= 0 ? '+' : ''}{change}% from last week
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 bg-${color}-500/20 rounded-xl`}>
            <Icon className={`h-6 w-6 text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_joined':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'challenge_completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'challenge_created':
        return <Target className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Challenges"
          value={stats.activeChallenges}
          change={stats.challengeGrowth}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Completed Challenges"
          value={stats.completedChallenges}
          icon={CheckCircle}
          color="purple"
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          urgent={stats.pendingReports > 5}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Overview */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Active Users (7d)</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      {isLoading ? '...' : stats.activeUsers}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((stats.activeUsers / stats.totalUsers) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isLoading ? '...' : `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`} of total users
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Completion Rate</span>
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {isLoading ? '...' : `${stats.completionRate.toFixed(1)}%`}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Average challenge completion rate
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-slate-700" />
                        <Skeleton className="h-3 w-1/2 bg-slate-700" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-800/50 rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}