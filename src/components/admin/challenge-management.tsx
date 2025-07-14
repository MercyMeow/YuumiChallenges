'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Trophy, 
  BarChart3, 
  RefreshCw,
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

interface ChallengeManagementProps {
  permissions: AdminPermissions;
}

interface AdminChallengeView {
  id: string;
  title: string;
  description: string;
  type: string;
  criteria: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  reward_points: number;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  participants: number;
  completions: number;
  completion_rate: number;
}

interface ChallengeFormData {
  title: string;
  description: string;
  type: string;
  reward_points: number;
  active: boolean;
  featured: boolean;
  criteria: {
    target_value?: number;
    game_count?: number;
    queue_types?: string[];
  };
}

export function ChallengeManagement() {
  const [challenges, setChallenges] = useState<AdminChallengeView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<AdminChallengeView | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    type: 'kda',
    reward_points: 100,
    active: true,
    featured: false,
    criteria: {
      target_value: 2.0,
      game_count: 10,
      queue_types: ['RANKED_SOLO_5x5']
    }
  });

  const challengeTypes = [
    { value: 'kda', label: 'KDA Challenge' },
    { value: 'winstreak', label: 'Win Streak' },
    { value: 'champion_mastery', label: 'Champion Mastery' },
    { value: 'ranked_climb', label: 'Ranked Climb' },
    { value: 'games_played', label: 'Games Played' },
    { value: 'perfect_game', label: 'Perfect Game' },
  ];

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/challenges');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.createChallenges) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchChallenges();
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.editChallenges || !editingChallenge) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/challenges/${editingChallenge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchChallenges();
        setEditingChallenge(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (challengeId: string, active: boolean) => {
    if (!permissions.editChallenges) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (response.ok) {
        setChallenges(challenges.map(challenge =>
          challenge.id === challengeId ? { ...challenge, active } : challenge
        ));
      }
    } catch (error) {
      console.error('Failed to toggle challenge:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!permissions.deleteChallenges) return;
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChallenges(challenges.filter(challenge => challenge.id !== challengeId));
      }
    } catch (error) {
      console.error('Failed to delete challenge:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'kda',
      reward_points: 100,
      active: true,
      featured: false,
      criteria: {
        target_value: 2.0,
        game_count: 10,
        queue_types: ['RANKED_SOLO_5x5']
      }
    });
  };

  const startEdit = (challenge: AdminChallengeView) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      reward_points: challenge.reward_points,
      active: challenge.active,
      featured: challenge.featured,
      criteria: challenge.criteria
    });
  };

  const ChallengeCard = ({ challenge }: { challenge: AdminChallengeView }) => (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {challengeTypes.find(t => t.value === challenge.type)?.label || challenge.type}
              </Badge>
              <Badge variant={challenge.active ? 'default' : 'secondary'}>
                {challenge.active ? 'Active' : 'Inactive'}
              </Badge>
              {challenge.featured && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  Featured
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{challenge.description}</p>
          </div>
          <div className="flex items-center space-x-1">
            {permissions.editChallenges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(challenge)}
                className="h-8 w-8 p-0 hover:bg-blue-500/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {permissions.deleteChallenges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteChallenge(challenge.id)}
                className="h-8 w-8 p-0 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{challenge.participants}</div>
            <div className="text-xs text-gray-400">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{challenge.completions}</div>
            <div className="text-xs text-gray-400">Completions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{challenge.completion_rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-300">{challenge.reward_points} points</span>
          </div>
          {permissions.editChallenges && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Active</span>
              <Switch
                checked={challenge.active}
                onCheckedChange={(checked: boolean) => handleToggleActive(challenge.id, checked)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ChallengeForm = () => (
    <form onSubmit={editingChallenge ? handleUpdateChallenge : handleCreateChallenge} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Challenge Title</Label>
          <Input
            id="title"
            placeholder="Epic KDA Challenge"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className="bg-slate-800/50 border-slate-600"
          />
        </div>
        
        <div>
          <Label htmlFor="type">Challenge Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {challengeTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Achieve a KDA of 2.0 or higher in 10 consecutive games"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          className="bg-slate-800/50 border-slate-600"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reward_points">Reward Points</Label>
          <Input
            id="reward_points"
            type="number"
            min="1"
            max="1000"
            value={formData.reward_points}
            onChange={(e) => setFormData({...formData, reward_points: parseInt(e.target.value) || 0})}
            required
            className="bg-slate-800/50 border-slate-600"
          />
        </div>
        
        <div>
          <Label htmlFor="target_value">Target Value</Label>
          <Input
            id="target_value"
            type="number"
            step="0.1"
            min="0"
            value={formData.criteria.target_value || ''}
            onChange={(e) => setFormData({
              ...formData, 
              criteria: {
                ...formData.criteria,
                target_value: parseFloat(e.target.value) || 0
              }
            })}
            className="bg-slate-800/50 border-slate-600"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked: boolean) => setFormData({...formData, active: checked})}
          />
          <Label htmlFor="active">Active</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.featured}
            onCheckedChange={(checked: boolean) => setFormData({...formData, featured: checked})}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setShowCreateForm(false);
            setEditingChallenge(null);
            resetForm();
          }}
          className="bg-slate-800/50 border-slate-600"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
        >
          {isSubmitting ? 'Saving...' : editingChallenge ? 'Update Challenge' : 'Create Challenge'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Challenge Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchChallenges}
                disabled={isLoading}
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {permissions.createChallenges && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Challenge Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Challenges</span>
                <Target className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {challenges.length}
              </div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {challenges.filter(c => c.active).length}
              </div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Participants</span>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {challenges.reduce((sum, c) => sum + c.participants, 0)}
              </div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg. Completion</span>
                <BarChart3 className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {challenges.length > 0 
                  ? (challenges.reduce((sum, c) => sum + c.completion_rate, 0) / challenges.length).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Skeleton className="h-5 w-16 bg-slate-700" />
                        <Skeleton className="h-5 w-12 bg-slate-700" />
                      </div>
                      <Skeleton className="h-6 w-full bg-slate-700" />
                      <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1 bg-slate-700" />
                        <Skeleton className="h-3 w-full bg-slate-700" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1 bg-slate-700" />
                        <Skeleton className="h-3 w-full bg-slate-700" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1 bg-slate-700" />
                        <Skeleton className="h-3 w-full bg-slate-700" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-full bg-slate-700" />
                  </CardContent>
                </Card>
              ))
            ) : challenges.length > 0 ? (
              challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-400 mb-2">No challenges found</p>
                <p className="text-sm text-gray-500">
                  {permissions.createChallenges 
                    ? "Create your first challenge to get started"
                    : "No challenges have been created yet"
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Design a new challenge for the community
            </DialogDescription>
          </DialogHeader>
          <ChallengeForm />
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Dialog */}
      <Dialog open={!!editingChallenge} onOpenChange={() => setEditingChallenge(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>
              Modify the challenge settings
            </DialogDescription>
          </DialogHeader>
          <ChallengeForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}