'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  User,
  Target,
  Shield,
  Settings,
  AlertTriangle
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

interface AuditLogProps { // eslint-disable-line @typescript-eslint/no-unused-vars
  permissions: AdminPermissions;
}

interface AuditLogEntry {
  id: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  details: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  ip_address?: string;
  created_at: string;
  admin: {
    username: string;
    avatar?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function AuditLog() {
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [availableAdmins, setAvailableAdmins] = useState<Array<{id: string, username: string}>>([]);

  const fetchAuditLog = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionTypeFilter !== 'all') {
        params.append('action_type', actionTypeFilter);
      }
      if (targetTypeFilter !== 'all') {
        params.append('target_type', targetTypeFilter);
      }
      if (adminFilter !== 'all') {
        params.append('admin_id', adminFilter);
      }

      const response = await fetch(`/api/admin/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditEntries(data.actions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, actionTypeFilter, targetTypeFilter, adminFilter]);

  const fetchAvailableAdmins = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const admins = data.users.filter((user: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          user.user_role === 'admin' || user.user_role === 'moderator'
        );
        setAvailableAdmins(admins.map((admin: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: admin.id,
          username: admin.name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const filterEntries = useCallback(() => {
    let filtered = auditEntries;

    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(entry.details).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  }, [auditEntries, searchQuery]);

  useEffect(() => {
    fetchAuditLog();
    fetchAvailableAdmins();
  }, [fetchAuditLog, pagination.page, actionTypeFilter, targetTypeFilter, adminFilter]);

  useEffect(() => {
    filterEntries();
  }, [filterEntries]);

  const actionTypes = [
    { value: 'user_role_changed', label: 'User Role Changed' },
    { value: 'challenge_created', label: 'Challenge Created' },
    { value: 'challenge_updated', label: 'Challenge Updated' },
    { value: 'challenge_deleted', label: 'Challenge Deleted' },
    { value: 'challenge_activated', label: 'Challenge Activated' },
    { value: 'challenge_deactivated', label: 'Challenge Deactivated' },
    { value: 'report_resolved', label: 'Report Resolved' },
    { value: 'user_banned', label: 'User Banned' },
    { value: 'settings_updated', label: 'Settings Updated' }
  ];

  const targetTypes = [
    { value: 'user', label: 'User' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'report', label: 'Report' },
    { value: 'system', label: 'System' }
  ];

  useEffect(() => {
    fetchAuditLog();
    fetchAvailableAdmins();
  }, [fetchAuditLog, pagination.page, actionTypeFilter, targetTypeFilter, adminFilter]);

  useEffect(() => {
    filterEntries();
  }, [filterEntries]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'user_role_changed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'challenge_created':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'challenge_updated':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'challenge_deleted':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'challenge_activated':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'challenge_deactivated':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'report_resolved':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'user_banned':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'settings_updated':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'challenge':
        return <Target className="h-4 w-4" />;
      case 'report':
        return <AlertTriangle className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDetails = (details: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!details || typeof details !== 'object') return '';
    
    const keys = Object.keys(details);
    if (keys.length === 0) return '';
    
    return keys.map(key => `${key}: ${JSON.stringify(details[key])}`).join(', ');
  };

  const AuditLogRow = ({ entry }: { entry: AuditLogEntry }) => (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.admin.avatar} alt={entry.admin.username} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
              {entry.admin.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-white">{entry.admin.username}</div>
            <div className="text-xs text-gray-400">{formatDate(entry.created_at)}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge className={`flex items-center space-x-1 ${getActionTypeColor(entry.action_type)}`}>
          <span className="text-xs">
            {actionTypes.find(t => t.value === entry.action_type)?.label || entry.action_type}
          </span>
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-2">
          {getTargetTypeIcon(entry.target_type)}
          <span className="text-sm text-gray-300 capitalize">{entry.target_type}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="max-w-xs">
          <p className="text-sm text-gray-300 truncate" title={formatDetails(entry.details)}>
            {formatDetails(entry.details)}
          </p>
        </div>
      </td>
      <td className="p-4">
        <div className="text-xs text-gray-400 font-mono">
          {entry.ip_address || 'N/A'}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAuditLog}
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
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search audit log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-600 focus:border-indigo-500"
              />
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Action Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Target" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {targetTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <SelectValue placeholder="Admin" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {availableAdmins.map(admin => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Admin</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Action</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Target</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">Details</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-300">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
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
                        <Skeleton className="h-6 w-24 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-16 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-48 bg-slate-700" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20 bg-slate-700" />
                      </td>
                    </tr>
                  ))
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map(entry => (
                    <AuditLogRow key={entry.id} entry={entry} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-lg mb-2">No audit entries found</p>
                      <p className="text-sm">
                        {searchQuery || actionTypeFilter !== 'all' || targetTypeFilter !== 'all' || adminFilter !== 'all'
                          ? "Try adjusting your filters"
                          : "No administrative actions have been logged yet"
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>
                Showing page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <span>•</span>
              <span>{pagination.total} total entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-400 px-4">
                {pagination.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore || isLoading}
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}