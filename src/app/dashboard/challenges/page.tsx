'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Star, 
  Crown, 
  Trophy, 
  Activity, 
  Sparkles, 
  Search, 
  Filter,
  Plus,
  Minus,
  Clock,
  Users,
  CheckCircle,
  Flame,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  criteria: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  reward_points: number;
  participants?: number;
  difficulty?: string;
  featured?: boolean;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  max_progress: number;
  reward_points: number;
  completed: boolean;
  completed_at?: string;
  started_at: string;
  criteria?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface ChallengesData {
  active: UserChallenge[];
  available: Challenge[];
  completed: UserChallenge[];
  stats: {
    totalCompleted: number;
    totalPoints: number;
    activeCount: number;
  };
}

// Challenge types with their styling
const challengeThemes = {
  kda: {
    icon: Target,
    color: 'purple',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/20',
    hoverClass: 'hover:border-purple-400/30 hover:bg-purple-500/5',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  winstreak: {
    icon: Flame,
    color: 'yellow',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-500/20',
    hoverClass: 'hover:border-yellow-400/30 hover:bg-yellow-500/5',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  champion_mastery: {
    icon: Star,
    color: 'blue',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/20',
    hoverClass: 'hover:border-blue-400/30 hover:bg-blue-500/5',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  ranked_climb: {
    icon: Crown,
    color: 'amber',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/20',
    hoverClass: 'hover:border-amber-400/30 hover:bg-amber-500/5',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  games_played: {
    icon: Activity,
    color: 'green',
    bgClass: 'bg-green-500/20',
    borderClass: 'border-green-500/20',
    hoverClass: 'hover:border-green-400/30 hover:bg-green-500/5',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  perfect_game: {
    icon: Sparkles,
    color: 'indigo',
    bgClass: 'bg-indigo-500/20',
    borderClass: 'border-indigo-500/20',
    hoverClass: 'hover:border-indigo-400/30 hover:bg-indigo-500/5',
    textClass: 'text-indigo-400',
    badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  }
};

function ChallengesHeader({ data, searchQuery, setSearchQuery, selectedType, setSelectedType }: {
  data: ChallengesData | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
}) {
  const totalActive = data?.stats.activeCount || 0;
  const totalCompleted = data?.stats.totalCompleted || 0;
  const totalPoints = data?.stats.totalPoints || 0;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl"></div>
        <div className="relative p-6 rounded-2xl border border-purple-500/20 bg-black/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    My Challenges
                  </h1>
                  <p className="text-lg text-white/70">
                    Track your progress and earn rewards
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-white/70">{totalActive} Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/70">{totalCompleted} Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white/70">{totalPoints} Points Earned</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-4xl font-bold text-purple-400 mb-1">{totalActive}</div>
                <div className="text-sm text-white/70">Challenges in Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/30 border-purple-500/20 text-white placeholder:text-white/50"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-48 bg-black/30 border-purple-500/20 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="kda">KDA Challenges</SelectItem>
            <SelectItem value="winstreak">Win Streaks</SelectItem>
            <SelectItem value="champion_mastery">Champion Mastery</SelectItem>
            <SelectItem value="ranked_climb">Ranked Climb</SelectItem>
            <SelectItem value="games_played">Games Played</SelectItem>
            <SelectItem value="perfect_game">Perfect Games</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ActiveChallengeCard({ challenge, onLeave }: { 
  challenge: UserChallenge; 
  onLeave: (id: string) => void; 
}) {
  const theme = challengeThemes[challenge.type as keyof typeof challengeThemes] || challengeThemes.kda;
  const Icon = theme.icon;
  const progressPercentage = (challenge.progress / challenge.max_progress) * 100;

  return (
    <Card className={`p-4 bg-black/30 backdrop-blur-md border ${theme.borderClass} ${theme.hoverClass} transition-all duration-300`}>
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 ${theme.bgClass} rounded-lg`}>
            <Icon className={`h-4 w-4 ${theme.textClass}`} />
          </div>
          <span className="font-medium text-white">{challenge.title}</span>
        </div>
        <span className={`font-bold ${theme.textClass}`}>
          {challenge.progress}/{challenge.max_progress}
        </span>
      </div>
      <Progress value={progressPercentage} className="h-3 bg-black/50 mb-3" />
      <div className="flex items-center justify-between text-xs">
        <p className="text-white/70">{challenge.description}</p>
        <Badge className={theme.badgeClass}>
          {challenge.reward_points} pts
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs text-white/50">
          <Clock className="h-3 w-3" />
          <span>Started {new Date(challenge.started_at).toLocaleDateString()}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLeave(challenge.challenge_id)}
          className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
        >
          <Minus className="h-3 w-3 mr-1" />
          Leave
        </Button>
      </div>
    </Card>
  );
}

function AvailableChallengeCard({ challenge, onJoin }: { 
  challenge: Challenge; 
  onJoin: (id: string) => void; 
}) {
  const theme = challengeThemes[challenge.type as keyof typeof challengeThemes] || challengeThemes.kda;
  const Icon = theme.icon;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Extreme': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className={`p-4 bg-black/30 backdrop-blur-md border ${theme.borderClass} ${theme.hoverClass} transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${theme.bgClass} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-5 w-5 ${theme.textClass}`} />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
              {challenge.title}
            </h3>
            <p className="text-sm text-white/70 mt-1">{challenge.description}</p>
          </div>
        </div>
        {challenge.featured && (
          <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Badge className={getDifficultyColor(challenge.difficulty || 'Medium')}>
            {challenge.difficulty || 'Medium'}
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-white/50">
            <Users className="h-3 w-3" />
            <span>{challenge.participants || 0} participants</span>
          </div>
        </div>
        <Badge className={theme.badgeClass}>
          {challenge.reward_points} pts
        </Badge>
      </div>

      <Button
        onClick={() => onJoin(challenge.id)}
        className={`w-full ${theme.bgClass} ${theme.borderClass} ${theme.textClass} hover:bg-opacity-30 transition-all duration-300`}
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Join Challenge
      </Button>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: UserChallenge }) {
  const theme = challengeThemes[achievement.type as keyof typeof challengeThemes] || challengeThemes.kda;
  const Icon = theme.icon;

  return (
    <Card className={`p-4 bg-black/30 backdrop-blur-md border ${theme.borderClass} opacity-90`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${theme.bgClass} rounded-lg`}>
            <Icon className={`h-5 w-5 ${theme.textClass}`} />
          </div>
          <div>
            <h3 className="font-bold text-white">{achievement.title}</h3>
            <p className="text-sm text-white/70">{achievement.description}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
          <div className="text-xs text-white/50">
            {achievement.completed_at && new Date(achievement.completed_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ChallengesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [challengesData, setChallengesData] = useState<ChallengesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Fetch challenges data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChallenges();
    }
  }, [isAuthenticated, user]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/challenges');
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      
      const data = await response.json();
      setChallengesData(data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }

      // Refresh challenges data
      await fetchChallenges();
    } catch (err: unknown) {
      console.error('Error joining challenge:', err);
      setError((err as Error).message || 'Failed to join challenge. Please try again.');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/leave`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave challenge');
      }

      // Refresh challenges data
      await fetchChallenges();
    } catch (err: unknown) {
      console.error('Error leaving challenge:', err);
      setError((err as Error).message || 'Failed to leave challenge. Please try again.');
    }
  };

  // Filter challenges based on search and type
  const filterChallenges = (challenges: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return challenges.filter(challenge => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || challenge.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading challenges...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/5 backdrop-blur-md">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {error}
              <Button 
                variant="link" 
                onClick={() => {
                  setError(null);
                  fetchChallenges();
                }}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <ChallengesHeader 
          data={challengesData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-md border-purple-500/20">
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white">
              Active ({challengesData?.active.length || 0})
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white">
              Available ({challengesData?.available.length || 0})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white">
              Achievements ({challengesData?.completed.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Active Challenges</h2>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {challengesData?.active.length || 0} in progress
              </Badge>
            </div>
            
            {challengesData?.active && challengesData.active.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterChallenges(challengesData.active).map((challenge: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <ActiveChallengeCard 
                    key={challenge.id} 
                    challenge={challenge} 
                    onLeave={handleLeaveChallenge}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 bg-black/30 backdrop-blur-md border-purple-500/20 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Target className="h-12 w-12 text-purple-400/50" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">No Active Challenges</h3>
                    <p className="text-white/70">Join a challenge to start tracking your progress</p>
                  </div>
                  <Button 
                    onClick={() => router.push('/dashboard/profile')}
                    className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                  >
                    Link League Account First
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Available Challenges</h2>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {challengesData?.available.filter(c => c.featured).length || 0} featured
              </Badge>
            </div>
            
            {challengesData?.available && challengesData.available.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterChallenges(challengesData.available).map((challenge: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <AvailableChallengeCard 
                    key={challenge.id} 
                    challenge={challenge} 
                    onJoin={handleJoinChallenge}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 bg-black/30 backdrop-blur-md border-purple-500/20 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Target className="h-12 w-12 text-blue-400/50" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">No Available Challenges</h3>
                    <p className="text-white/70">All challenges are currently active or you&apos;ve joined them all!</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Achievements</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {challengesData?.stats.totalPoints || 0} points earned
              </Badge>
            </div>
            
            {challengesData?.completed && challengesData.completed.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterChallenges(challengesData.completed).map((achievement: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <Card className="p-8 bg-black/30 backdrop-blur-md border-purple-500/20 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Trophy className="h-12 w-12 text-yellow-400/50" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">No Achievements Yet</h3>
                    <p className="text-white/70">Complete challenges to unlock achievements</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}