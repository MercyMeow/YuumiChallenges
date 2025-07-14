'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { 
  Flag, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
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

interface ReportsManagementProps {
  permissions: AdminPermissions;
}

interface Report {
  id: string;
  report_type: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  resolution?: string;
  resolved_at?: string;
  reporter: {
    username: string;
    avatar?: string;
  };
  reported_user: {
    username: string;
    avatar?: string;
  };
  assigned_moderator?: {
    username: string;
    avatar?: string;
  };
}

interface ReportStats {
  pending: number;
  resolved: number;
  dismissed: number;
}

export function ReportsManagement({ permissions }: ReportsManagementProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({ pending: 0, resolved: 0, dismissed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const reportTypes = [
    { value: 'harassment', label: 'Harassment' },
    { value: 'cheating', label: 'Cheating' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.reporter.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reported_user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.report_type === typeFilter);
    }

    setFilteredReports(filtered);
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!permissions.moderateContent) return;

    try {
      setIsResolving(true);
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          resolution: resolution || `Report ${status}`
        }),
      });

      if (response.ok) {
        setReports(reports.map(report =>
          report.id === reportId 
            ? { ...report, status, resolution: resolution || `Report ${status}`, resolved_at: new Date().toISOString() }
            : report
        ));
        setShowReportDialog(false);
        setSelectedReport(null);
        setResolution('');
      }
    } catch (error) {
      console.error('Failed to resolve report:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'dismissed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'harassment':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cheating':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'inappropriate_content':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'spam':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ReportCard = ({ report }: { report: Report }) => (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={`text-xs ${getTypeColor(report.report_type)}`}>
                {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                {report.status}
              </Badge>
            </div>
            <p className="text-sm text-white line-clamp-2 mb-2">{report.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Reporter: {report.reporter.username}</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Reported: {report.reported_user.username}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedReport(report);
                setShowReportDialog(true);
              }}
              className="h-8 w-8 p-0 hover:bg-blue-500/20"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Created: {formatDate(report.created_at)}</span>
          {report.resolved_at && (
            <span>Resolved: {formatDate(report.resolved_at)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Reports Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending</span>
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.pending}
              </div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Resolved</span>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.resolved}
              </div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Dismissed</span>
                <XCircle className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.dismissed}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-600 focus:border-red-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Skeleton className="h-5 w-16 bg-slate-700" />
                        <Skeleton className="h-5 w-12 bg-slate-700" />
                      </div>
                      <Skeleton className="h-4 w-full bg-slate-700" />
                      <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2 bg-slate-700" />
                  </CardContent>
                </Card>
              ))
            ) : filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-400 mb-2">No reports found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? "Try adjusting your filters"
                    : "No reports have been submitted yet"
                  }
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                Showing {filteredReports.length} of {reports.length} reports
              </div>
              <div className="flex items-center space-x-4">
                <span>Pending: {stats.pending}</span>
                <span>Resolved: {stats.resolved}</span>
                <span>Dismissed: {stats.dismissed}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review and manage this report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Reporter</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedReport.reporter.avatar} alt={selectedReport.reporter.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {selectedReport.reporter.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white">{selectedReport.reporter.username}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Reported User</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedReport.reported_user.avatar} alt={selectedReport.reported_user.username} />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs">
                        {selectedReport.reported_user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white">{selectedReport.reported_user.username}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Report Type</label>
                <div className="mt-1">
                  <Badge className={`${getTypeColor(selectedReport.report_type)}`}>
                    {reportTypes.find(t => t.value === selectedReport.report_type)?.label || selectedReport.report_type}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <p className="text-white mt-1">{selectedReport.description}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
              
              {selectedReport.status === 'pending' && permissions.moderateContent && (
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Resolution Notes</label>
                    <Textarea
                      placeholder="Add resolution notes..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="bg-slate-800/50 border-slate-600"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                      disabled={isResolving}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      onClick={() => handleResolveReport(selectedReport.id, 'dismissed')}
                      disabled={isResolving}
                      className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedReport.resolution && (
                <div className="pt-4 border-t border-slate-700">
                  <label className="text-sm text-gray-400">Resolution</label>
                  <p className="text-white mt-1">{selectedReport.resolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}