'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
 
  Shield, 
  User, 
  Edit,
  MoreHorizontal,
  Filter,
  RefreshCw
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

interface UserManagementProps {
  permissions: AdminPermissions;
}

interface AdminUserView {
  id: string;
  name: string;
  image?: string;
  discord_id: string;
  user_role: string;
  is_yuumi_member: boolean;
  last_activity?: string;
  total_challenges: number;
  completed_challenges: number;
  total_points: number;
  created_at: string;
}

export function UserManagement({ permissions }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.discord_id.includes(searchQuery)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.user_role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!permissions.manageRoles) return;

    try {
      setIsUpdatingRole(true);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRole,
          reason: 'Role updated via admin panel'
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, user_role: newRole } : user
        ));
        setShowRoleDialog(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const formatLastActivity = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const activity = new Date(dateString);
    const diff = now.getTime() - activity.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const UserRow = ({ user }: { user: AdminUserView }) => (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-xs text-gray-400">{user.discord_id}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-2">
          <RoleBadge role={user.user_role as 'owner' | 'admin' | 'member'} size="sm" />
          <Badge variant={user.is_yuumi_member ? 'default' : 'destructive'} className="text-xs">
            {user.is_yuumi_member ? '✅' : '❌'}
          </Badge>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-gray-300">
          {formatLastActivity(user.last_activity)}
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-gray-300">
          {user.completed_challenges} / {user.total_challenges}
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-gray-300">
          {user.total_points.toLocaleString()}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-2">
          {permissions.manageRoles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setShowRoleDialog(true);
              }}
              className="h-8 w-8 p-0 hover:bg-purple-500/20"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-500/20"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={isLoading}
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-600 focus:border-purple-500"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-gray-300">User</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Last Activity</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Challenges</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Points</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24 bg-slate-700" />
                            <Skeleton className="h-3 w-32 bg-slate-700" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-16 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-12 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-8 bg-slate-700" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <UserRow key={user.id} user={user} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center space-x-4">
                <span>Owners: {users.filter(u => u.user_role === 'owner').length}</span>
                <span>Admins: {users.filter(u => u.user_role === 'admin').length}</span>
                <span>Members: {users.filter(u => u.user_role === 'member').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.image} alt={selectedUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    Current role: <RoleBadge role={selectedUser.user_role as 'owner' | 'admin' | 'member'} size="sm" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleRoleChange(selectedUser.id, 'member')}
                  disabled={isUpdatingRole || selectedUser.user_role === 'member'}
                  className="flex-1 hover:bg-yellow-500/20 hover:border-yellow-500/50"
                >
                  <User className="h-4 w-4 mr-2" />
                  Member
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRoleChange(selectedUser.id, 'admin')}
                  disabled={isUpdatingRole || selectedUser.user_role === 'admin' || !permissions.manageRoles}
                  className="flex-1 hover:bg-red-500/20 hover:border-red-500/50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>
              {!permissions.manageRoles && (
                <p className="text-sm text-gray-400 text-center">
                  Only owners can assign admin roles
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}